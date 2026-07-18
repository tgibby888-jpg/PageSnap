import Stripe from "stripe";
import {
  createSubscription,
  getSubscriptionByApiKey,
  updateSubscriptionStatus,
  getDb,
  getApiKeyById,
} from "../db/index";

// ── Tier → Price mapping ────────────────────────────────
// In production, these are real Stripe Price IDs.
// For now, use placeholder IDs — the checkout session will fail
// gracefully if STRIPE_SECRET_KEY is unset.
const TIER_PRICES: Record<string, string | null> = {
  pro: process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_monthly",
  scale: process.env.STRIPE_SCALE_PRICE_ID ?? "price_scale_monthly",
  enterprise: null, // custom pricing, not self-serve
};

const TIER_LIMITS: Record<string, number | null> = {
  free: 100,
  pro: 1000,
  scale: 10000,
  enterprise: null,
};

export { TIER_LIMITS };

const SITE_URL =
  process.env.PUBLIC_SITE_URL ??
  "https://cd7d1c456024a2f3d4a3b2b5efc6c2fa.ctonew.app";

// ── Stripe client ────────────────────────────────────────
let stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (stripe) return stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === "sk_placeholder") {
    console.warn(
      "[stripe] STRIPE_SECRET_KEY not set — billing is running in stub mode"
    );
    return null;
  }

  stripe = new Stripe(key, {
    apiVersion: "2025-06-30.acacia" as any,
  });
  return stripe;
}

// ── Checkout Session ─────────────────────────────────────

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

export async function createCheckoutSession(
  apiKeyId: number,
  tier: string
): Promise<CheckoutResult> {
  if (!["pro", "scale"].includes(tier)) {
    throw new Error(`Cannot self-upgrade to tier: ${tier}`);
  }

  const priceId = TIER_PRICES[tier];
  if (!priceId) {
    throw new Error(`No price configured for tier: ${tier}`);
  }

  const s = getStripe();
  if (!s) {
    // Stub mode — return a fake checkout URL for testing
    const fakeSessionId = `cs_stub_${Date.now()}`;
    console.warn(
      `[stripe] STUB: createCheckoutSession(apiKeyId=${apiKeyId}, tier=${tier}) → ${fakeSessionId}`
    );
    return {
      url: `${SITE_URL}/pricing?stub_session=${fakeSessionId}`,
      sessionId: fakeSessionId,
    };
  }

  const keyRecord = getApiKeyById(apiKeyId);
  if (!keyRecord) {
    throw new Error("API key not found");
  }

  // Create or retrieve Stripe customer
  let customerId: string;
  const existingSub = getSubscriptionByApiKey(apiKeyId);
  if (existingSub?.stripe_customer_id) {
    customerId = existingSub.stripe_customer_id;
  } else {
    const customer = await s.customers.create({
      metadata: { api_key_id: String(apiKeyId), name: keyRecord.name },
    });
    customerId = customer.id;
  }

  const session = await s.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/dashboard?checkout=success&session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/pricing?checkout=canceled`,
    customer: customerId,
    metadata: {
      api_key_id: String(apiKeyId),
      tier,
    },
  });

  return {
    url: session.url ?? `${SITE_URL}/pricing`,
    sessionId: session.id,
  };
}

// ── Webhook Handling ─────────────────────────────────────

export async function handleWebhook(
  payload: string,
  signature: string
): Promise<{ received: boolean }> {
  const s = getStripe();
  if (!s) {
    // Stub mode — accept any webhook for testing
    console.warn("[stripe] STUB: webhook received but STRIPE_SECRET_KEY not set");
    try {
      const event = JSON.parse(payload);
      console.warn(`[stripe] STUB event type: ${event.type}`);
      await processWebhookEvent(event);
    } catch {
      console.warn("[stripe] STUB: couldn't parse webhook payload");
    }
    return { received: true };
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid webhook signature: ${message}`);
  }

  await processWebhookEvent(event);
  return { received: true };
}

async function processWebhookEvent(event: any): Promise<void> {
  const db = getDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const apiKeyId = parseInt(session.metadata?.api_key_id ?? "0", 10);
      const tier = session.metadata?.tier ?? "pro";
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!apiKeyId || !customerId || !subscriptionId) {
        console.warn(
          "[stripe] checkout.session.completed missing metadata",
          session
        );
        return;
      }

      console.log(
        `[stripe] Creating subscription: apiKeyId=${apiKeyId}, tier=${tier}, customer=${customerId}, sub=${subscriptionId}`
      );

      // Upsert: if subscription exists, update; otherwise create
      const existing = getSubscriptionByApiKey(apiKeyId);
      if (existing) {
        db.prepare(
          "UPDATE subscriptions SET stripe_customer_id = ?, stripe_subscription_id = ?, tier = ?, status = 'active' WHERE api_key_id = ?"
        ).run(customerId, subscriptionId, tier, apiKeyId);
        db.prepare("UPDATE api_keys SET tier = ? WHERE id = ?").run(
          tier,
          apiKeyId
        );
      } else {
        createSubscription(apiKeyId, customerId, subscriptionId, tier, "active");
        db.prepare("UPDATE api_keys SET tier = ? WHERE id = ?").run(
          tier,
          apiKeyId
        );
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const customerId = sub.customer as string;
      const subscriptionId = sub.id;
      const status = sub.status ?? "active";

      const existing = db
        .query("SELECT * FROM subscriptions WHERE stripe_subscription_id = ?")
        .get(subscriptionId) as any;

      if (existing) {
        // Map Stripe price to tier
        const priceId = sub.items?.data?.[0]?.price?.id;
        let tier = existing.tier;
        if (priceId === TIER_PRICES["pro"]) tier = "pro";
        else if (priceId === TIER_PRICES["scale"]) tier = "scale";

        updateSubscriptionStatus(existing.id, status);
        db.prepare(
          "UPDATE subscriptions SET tier = ? WHERE id = ?"
        ).run(tier, existing.id);
        db.prepare("UPDATE api_keys SET tier = ? WHERE id = ?").run(
          tier,
          existing.api_key_id
        );

        console.log(
          `[stripe] Subscription updated: id=${existing.id}, tier=${tier}, status=${status}`
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const subscriptionId = sub.id;

      const existing = db
        .query("SELECT * FROM subscriptions WHERE stripe_subscription_id = ?")
        .get(subscriptionId) as any;

      if (existing) {
        updateSubscriptionStatus(existing.id, "canceled");
        db.prepare("UPDATE api_keys SET tier = 'free' WHERE id = ?").run(
          existing.api_key_id
        );
        console.log(
          `[stripe] Subscription canceled: id=${existing.id}, apiKeyId=${existing.api_key_id}`
        );
      }
      break;
    }

    default:
      console.log(`[stripe] Unhandled event type: ${event.type}`);
  }
}
