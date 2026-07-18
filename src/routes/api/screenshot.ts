import { authenticate, jsonResponse } from "../../auth";
import { logUsage, getUsageForApiKey, getSubscriptionByApiKey } from "../../db/index";
import { enqueueScreenshot } from "../../screenshot/queue";

const TIER_LIMITS: Record<string, number | null> = {
  free: 100,
  pro: 1000,
  scale: 10000,
  enterprise: null,
};

export async function POST(req: Request): Promise<Response> {
  // ── Auth (shared, SHA-256 based) ──────────────────────
  const auth = await authenticate(req);
  if (auth instanceof Response) return auth;

  // ── Determine effective tier ──────────────────────────
  let tier = auth.tier;
  const sub = getSubscriptionByApiKey(auth.id);
  if (sub && sub.status === "active") {
    tier = sub.tier;
  }

  // ── Tier enforcement ──────────────────────────────────
  const tierLimit = TIER_LIMITS[tier] ?? null;
  if (tierLimit !== null) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);
    const monthly = getUsageForApiKey(auth.id, monthStart) as {
      count: number;
      total_credits: number;
    };
    const usedThisMonth = monthly?.count ?? 0;
    if (usedThisMonth >= tierLimit) {
      return jsonResponse(
        {
          error: "Usage limit exceeded. Upgrade at https://pagesnap.com/pricing",
          tier,
          tier_limit: tierLimit,
          used_this_month: usedThisMonth,
        },
        429
      );
    }
  }

  // ── Parse body ────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { url, format, width, height, fullPage } = body;

  // Validate URL
  if (!url || typeof url !== "string") {
    return jsonResponse({ error: "url is required and must be a string" }, 400);
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return jsonResponse({ error: `Invalid URL: ${url}` }, 400);
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return jsonResponse({ error: "URL must use http or https protocol" }, 400);
  }

  // Validate format
  if (format !== undefined && format !== "png" && format !== "pdf") {
    return jsonResponse({ error: "format must be 'png' or 'pdf'" }, 400);
  }

  // Validate numeric params
  if (width !== undefined && (typeof width !== "number" || width < 1)) {
    return jsonResponse({ error: "width must be a positive number" }, 400);
  }
  if (height !== undefined && (typeof height !== "number" || height < 1)) {
    return jsonResponse({ error: "height must be a positive number" }, 400);
  }
  if (fullPage !== undefined && typeof fullPage !== "boolean") {
    return jsonResponse({ error: "fullPage must be a boolean" }, 400);
  }

  // ── Capture screenshot ────────────────────────────────
  try {
    const result = await enqueueScreenshot({
      url,
      format: (format as "png" | "pdf") || "png",
      width: typeof width === "number" ? width : undefined,
      height: typeof height === "number" ? height : undefined,
      fullPage: typeof fullPage === "boolean" ? fullPage : undefined,
    });

    // Log usage
    logUsage(auth.id, "screenshot", 1);

    return new Response(result.buffer, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Length": String(result.buffer.length),
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return jsonResponse({ error: err.message }, 500);
  }
}
