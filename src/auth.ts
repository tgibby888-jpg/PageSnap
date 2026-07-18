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

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonError(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}
