import { Database } from "bun:sqlite";
import { SCHEMA } from "./schema";

const DB_PATH = "./data/pagesnap.db";

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { create: true });
    db.exec("PRAGMA journal_mode=WAL");
    db.exec("PRAGMA foreign_keys=ON");
    db.exec(SCHEMA);
  }
  return db;
}

// ── API Keys ──────────────────────────────────────────────

export function createApiKey(keyHash: string, name: string, tier = "free") {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO api_keys (key_hash, name, tier) VALUES (?, ?, ?)"
  );
  return stmt.run(keyHash, name, tier);
}

export function findApiKeyByHash(keyHash: string) {
  const db = getDb();
  return db
    .query("SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1")
    .get(keyHash) as ApiKey | null;
}

export function updateApiKeyLastUsed(id: number) {
  const db = getDb();
  db.prepare("UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?").run(id);
}

export function listApiKeys() {
  const db = getDb();
  return db.query("SELECT id, key_hash, name, tier, created_at, last_used_at, is_active FROM api_keys").all();
}

export function revokeApiKey(id: number) {
  const db = getDb();
  return db.prepare("UPDATE api_keys SET is_active = 0 WHERE id = ?").run(id);
}

export function getApiKeyById(id: number) {
  const db = getDb();
  return db.query("SELECT * FROM api_keys WHERE id = ?").get(id) as ApiKey | null;
}

// ── Usage Logs ────────────────────────────────────────────

export function logUsage(apiKeyId: number, endpoint: string, credits = 1) {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO usage_logs (api_key_id, endpoint, credits_used) VALUES (?, ?, ?)"
  );
  return stmt.run(apiKeyId, endpoint, credits);
}

export function getUsageForApiKey(apiKeyId: number, since?: string) {
  const db = getDb();
  if (since) {
    return db
      .query("SELECT COUNT(*) as count, COALESCE(SUM(credits_used), 0) as total_credits FROM usage_logs WHERE api_key_id = ? AND timestamp >= ?")
      .get(apiKeyId, since) as { count: number; total_credits: number };
  }
  return db
    .query("SELECT COUNT(*) as count, COALESCE(SUM(credits_used), 0) as total_credits FROM usage_logs WHERE api_key_id = ?")
    .get(apiKeyId) as { count: number; total_credits: number };
}

// ── Subscriptions ─────────────────────────────────────────

export function createSubscription(
  apiKeyId: number,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  tier: string,
  status = "active"
) {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO subscriptions (api_key_id, stripe_customer_id, stripe_subscription_id, tier, status) VALUES (?, ?, ?, ?, ?)"
  );
  return stmt.run(apiKeyId, stripeCustomerId, stripeSubscriptionId, tier, status);
}

export function getSubscriptionByApiKey(apiKeyId: number) {
  const db = getDb();
  return db
    .query("SELECT * FROM subscriptions WHERE api_key_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(apiKeyId) as Subscription | null;
}

export function updateSubscriptionStatus(subscriptionId: number, status: string) {
  const db = getDb();
  db.prepare("UPDATE subscriptions SET status = ? WHERE id = ?").run(status, subscriptionId);
}

// ── Types ─────────────────────────────────────────────────

export interface ApiKey {
  id: number;
  key_hash: string;
  name: string;
  tier: string;
  created_at: string;
  last_used_at: string | null;
  is_active: number;
}

export interface Subscription {
  id: number;
  api_key_id: number;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  tier: string;
  status: string;
  created_at: string;
}
