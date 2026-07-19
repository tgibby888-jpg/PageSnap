import { authenticateRequest, jsonResponse, jsonError } from "../../auth";
import { createApiKey, listApiKeys, revokeApiKey, getApiKeyById } from "../../db/index";

function maskHash(hash: string): string {
  if (hash.length <= 8) return hash + "****";
  return hash.slice(0, 8) + "****";
}

// GET /api/keys — List all API keys (masked)
export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (auth instanceof Response) return auth;

  const keys = listApiKeys() as Array<{
    id: number;
    key_hash: string;
    name: string;
    tier: string;
    created_at: string;
    last_used_at: string | null;
    is_active: number;
  }>;

  const masked = keys.map((k) => ({
    id: k.id,
    key_hash: maskHash(k.key_hash),
    name: k.name,
    tier: k.tier,
    created_at: k.created_at,
    last_used_at: k.last_used_at,
    is_active: k.is_active === 1,
  }));

  return jsonResponse({ keys: masked });
}

// POST /api/keys — Create a new API key
export async function POST(req: Request): Promise<Response> {
  // Require auth — bootstrap: seed a key directly in DB for the first one
  const auth = await authenticateRequest(req);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { name } = body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return jsonError("name is required and must be a non-empty string", 400);
  }

  // Parse optional tier
  let tier = "free";
  if (body.tier && typeof body.tier === "string") {
    if (!["free", "pro", "scale", "enterprise"].includes(body.tier)) {
      return jsonError("tier must be one of: free, pro, scale, enterprise", 400);
    }
    tier = body.tier;
  }

  // Generate a 32-char random hex key
  const rawKey = Array.from(
    { length: 32 },
    () => Math.floor(Math.random() * 16).toString(16)
  ).join("");

  // Store SHA-256 hash
  const keyHash = Bun.SHA256.hash(rawKey, "hex") as string;
  createApiKey(keyHash, name.trim(), tier);

  return jsonResponse(
    {
      key: rawKey,
      name: name.trim(),
      tier,
      message: "Store this key securely — it will not be shown again.",
    },
    201
  );
}

// DELETE /api/keys?id=<id> — Revoke an API key
export async function DELETE(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const idParam = url.searchParams.get("id");
  if (!idParam) {
    return jsonError("Query parameter 'id' is required", 400);
  }

  const id = parseInt(idParam, 10);
  if (isNaN(id) || id <= 0) {
    return jsonError("id must be a positive integer", 400);
  }

  const keyRecord = getApiKeyById(id);
  if (!keyRecord) {
    return jsonError("API key not found", 404);
  }

  // Prevent revoking your own key
  if (keyRecord.id === auth.id) {
    return jsonError("Cannot revoke your own API key", 400);
  }

  revokeApiKey(id);

  return jsonResponse({
    id,
    revoked: true,
    message: "API key has been revoked.",
  });
}
