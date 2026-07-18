import { authenticate, jsonResponse, jsonError } from "../../../auth";
import { createCheckoutSession } from "../../../billing/stripe";

// POST /api/billing/upgrade — Start a Stripe checkout session
export async function POST(req: Request): Promise<Response> {
  const auth = await authenticate(req);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const tier = body.tier;
  if (!tier || typeof tier !== "string" || !["pro", "scale"].includes(tier)) {
    return jsonError('tier must be "pro" or "scale"', 400);
  }

  try {
    const result = await createCheckoutSession(auth.id, tier);
    return jsonResponse({
      checkout_url: result.url,
      session_id: result.sessionId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(message, 500);
  }
}
