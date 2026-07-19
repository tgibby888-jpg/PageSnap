import { findApiKeyByHash, updateApiKeyLastUsed } from "./db/index";

/**
 * Authenticate a request via Bearer token.
 * Returns the API key record on success, or a Response on failure.
 * The caller should check if the result is a Response (error) or an ApiKey.
 */
export async function authenticate(
  req: Request
): Promise<{ id: number; name: string; tier: string; is_active: number } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonError("Missing or invalid Authorization header. Use: Bearer <api_key>", 401);
  }

  const apiKey = authHeader.slice("Bearer ".length).trim();
  if (!/^[0-9a-fA-F]{8,}$/.test(apiKey)) {
    return jsonError("API key must be a hex string (at least 8 characters)", 401);
  }

  // Hash the key with SHA-256 before lookup
  const keyHash = Bun.SHA256.hash(apiKey, "hex") as string;

  const keyRecord = findApiKeyByHash(keyHash);
  if (!keyRecord) {
    return jsonError("Invalid API key", 401);
  }

  updateApiKeyLastUsed(keyRecord.id);

  return {
    id: keyRecord.id,
    name: keyRecord.name,
    tier: keyRecord.tier,
    is_active: keyRecord.is_active,
  };
}

/**
 * Unified auth: first checks for RapidAPI proxy secret header, then falls
 * through to Bearer-token auth. Returns an API key record on success or a
 * 401 Response on failure.
 *
 * RapidAPI proxy: when the request carries X-RapidAPI-Proxy-Secret matching
 * RAPIDAPI_PROXY_SECRET, auth is bypassed and usage is attributed to the
 * bootstrap API key. This lets RapidAPI subscribers call our API without
 * having their own PageSnap API key.
 */
export async function authenticateRequest(
  req: Request
): Promise<{ id: number; name: string; tier: string; is_active: number } | Response> {
  const proxySecret = req.headers.get("X-RapidAPI-Proxy-Secret");
  const expectedSecret = process.env.RAPIDAPI_PROXY_SECRET;

  // ── RapidAPI proxy auth ──────────────────────────────────
  if (proxySecret && expectedSecret && proxySecret === expectedSecret) {
    // Proxy-authenticated — attribute usage to the bootstrap key.
    const bootstrapRaw = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
    const bootstrapHash = Bun.SHA256.hash(bootstrapRaw, "hex") as string;
    const keyRecord = findApiKeyByHash(bootstrapHash);
    if (keyRecord) {
      updateApiKeyLastUsed(keyRecord.id);
      return {
        id: keyRecord.id,
        name: "rapidapi-proxy",
        tier: keyRecord.tier,
        is_active: keyRecord.is_active,
      };
    }
    // Bootstrap key not seeded yet — return a synthetic record so
    // proxy traffic still works (usage won't be logged against a real
    // key but requests won't be rejected).
    return {
      id: 0,
      name: "rapidapi-proxy",
      tier: "enterprise",
      is_active: 1,
    };
  }

  // ── Bad proxy secret → 401 ───────────────────────────────
  if (proxySecret && !expectedSecret) {
    return jsonError("RapidAPI proxy secret not configured on server", 401);
  }
  if (proxySecret && expectedSecret && proxySecret !== expectedSecret) {
    return jsonError("Invalid RapidAPI proxy secret", 401);
  }

  // ── Fall through to Bearer token auth ─────────────────────
  return authenticate(req);
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonError(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}
