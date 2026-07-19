import { authenticateRequest, jsonResponse } from "../../auth";
import { getUsageForApiKey, getSubscriptionByApiKey } from "../../db/index";

const TIER_LIMITS: Record<string, number | null> = {
  free: 100,
  pro: 1000,
  scale: 10000,
  enterprise: null,
};

// GET /api/usage — Return usage stats for the authenticated API key
export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (auth instanceof Response) return auth;

  // Determine effective tier: subscription tier overrides api_key tier
  let tier = auth.tier;
  const sub = getSubscriptionByApiKey(auth.id);
  if (sub && sub.status === "active") {
    tier = sub.tier;
  }

  // First day of current month for monthly usage
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);

  // Get lifetime usage
  const lifetime = getUsageForApiKey(auth.id) as { count: number; total_credits: number };
  // Get this month's usage
  const monthly = getUsageForApiKey(auth.id, monthStart) as { count: number; total_credits: number };

  const tierLimit = TIER_LIMITS[tier] ?? null;
  const screenshotsThisMonth = monthly?.count ?? 0;
  const remaining = tierLimit !== null ? Math.max(0, tierLimit - screenshotsThisMonth) : null;

  return jsonResponse({
    api_key_id: auth.id,
    tier,
    tier_limit: tierLimit,
    total_screenshots: lifetime?.count ?? 0,
    screenshots_this_month: screenshotsThisMonth,
    remaining,
  });
}
