import { authenticate, jsonResponse } from "../../auth";
import { getSubscriptionByApiKey, getUsageForApiKey } from "../../db/index";
import { TIER_LIMITS } from "../../billing/stripe";

// GET /api/billing — Return billing/subscription status
export async function GET(req: Request): Promise<Response> {
  const auth = await authenticate(req);
  if (auth instanceof Response) return auth;

  // Determine effective tier
  let tier = auth.tier;
  const sub = getSubscriptionByApiKey(auth.id);
  const hasActiveSub = sub && sub.status === "active";
  if (hasActiveSub) {
    tier = sub!.tier;
  }

  // Current month usage
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  const monthly = getUsageForApiKey(auth.id, monthStart) as {
    count: number;
    total_credits: number;
  };
  const lifetime = getUsageForApiKey(auth.id) as {
    count: number;
    total_credits: number;
  };

  const tierLimit = TIER_LIMITS[tier] ?? null;
  const usedThisMonth = monthly?.count ?? 0;
  const remaining =
    tierLimit !== null ? Math.max(0, tierLimit - usedThisMonth) : null;

  return jsonResponse({
    api_key_id: auth.id,
    tier,
    subscription: hasActiveSub
      ? {
          id: sub!.id,
          status: sub!.status,
          stripe_customer_id: sub!.stripe_customer_id,
          stripe_subscription_id: sub!.stripe_subscription_id,
          created_at: sub!.created_at,
        }
      : null,
    tier_limit: tierLimit,
    screenshots_this_month: usedThisMonth,
    remaining,
    lifetime_screenshots: lifetime?.count ?? 0,
  });
}
