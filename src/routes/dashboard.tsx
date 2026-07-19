import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

// Server function to look up an API key and return usage + billing info
const lookupKey = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { key: string };
    if (!d.key || typeof d.key !== "string" || d.key.length < 8) {
      throw new Error("A valid API key is required");
    }
    return { key: d.key };
  })
  .handler(async ({ data }) => {
    const {
      findApiKeyByHash,
      getUsageForApiKey,
      getSubscriptionByApiKey,
    } = await import("../db/index");
    const { TIER_LIMITS } = await import("../billing/stripe");

    // Hash the key for lookup
    const keyHash = Bun.SHA256.hash(data.key, "hex") as string;
    const keyRecord = findApiKeyByHash(keyHash);
    if (!keyRecord) {
      throw new Error("Invalid API key. Double-check and try again.");
    }

    // Effective tier: subscription tier overrides the key's tier
    const sub = getSubscriptionByApiKey(keyRecord.id);
    const effectiveTier =
      sub && sub.status === "active" ? sub.tier : keyRecord.tier;

    // Monthly usage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);

    const monthly = getUsageForApiKey(keyRecord.id, monthStart) as {
      count: number;
      total_credits: number;
    };
    const lifetime = getUsageForApiKey(keyRecord.id) as {
      count: number;
      total_credits: number;
    };

    const tierLimit = TIER_LIMITS[effectiveTier] ?? null;
    const screenshotsThisMonth = monthly?.count ?? 0;
    const remaining =
      tierLimit !== null
        ? Math.max(0, tierLimit - screenshotsThisMonth)
        : null;

    return {
      name: keyRecord.name,
      tier: effectiveTier,
      created_at: keyRecord.created_at,
      subscription: sub
        ? {
            status: sub.status,
            tier: sub.tier,
            created_at: sub.created_at,
          }
        : null,
      tier_limit: tierLimit,
      screenshots_this_month: screenshotsThisMonth,
      remaining,
      lifetime_screenshots: lifetime?.count ?? 0,
    };
  });

type DashboardData = Awaited<ReturnType<typeof lookupKey>>;

function Dashboard() {
  // URL params (from Stripe success redirect) — detected client-side
  const [showSuccess, setShowSuccess] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkedLocal, setCheckedLocal] = useState(false);

  // On mount, detect checkout success param and load key from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for Stripe success redirect
    const p = new URLSearchParams(window.location.search);
    if (p.get("checkout") === "success") {
      setShowSuccess(true);
    }

    // Try to load key from localStorage
    const stored = localStorage.getItem("pagesnap_api_key");
    if (stored) {
      setApiKey(stored);
      lookupAndLoad(stored);
    }
    setCheckedLocal(true);
  }, []);

  async function lookupAndLoad(key: string) {
    setError("");
    setLoading(true);
    try {
      const result = await lookupKey({ data: { key } });
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    // Store the key for future visits
    if (typeof window !== "undefined") {
      localStorage.setItem("pagesnap_api_key", apiKey.trim());
    }
    await lookupAndLoad(apiKey.trim());
  }

  function handleClearKey() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pagesnap_api_key");
    }
    setApiKey("");
    setData(null);
    setError("");
  }

  return (
    <main className="flex-1 px-6 py-20">
      <div className="mx-auto max-w-2xl">
        {/* Success banner from Stripe redirect */}
        {showSuccess && (
          <div className="mb-10 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
              Thank you for subscribing to PageSnap{data ? ` ${capitalize(data.tier)}` : ""}!
            </h1>
            <p className="text-gray-600">
              Your subscription is being processed. Enter your API key below to
              view your updated plan details.
            </p>
          </div>
        )}

        {/* Heading when no success banner */}
        {!showSuccess && (
          <div className="mb-10 text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600">
              View your API usage, tier, and subscription status.
            </p>
          </div>
        )}

        {/* API Key form */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label
                htmlFor="apikey"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                API Key
              </label>
              <input
                id="apikey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key here"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              {checkedLocal && !apiKey && !data && (
                <p className="mt-1.5 text-xs text-gray-500">
                  Don't have a key?{" "}
                  <Link to="/signup" className="text-indigo-600 hover:underline">
                    Sign up here
                  </Link>
                </p>
              )}
            </div>
            <div className="flex gap-2 self-end">
              <button
                type="submit"
                disabled={loading || !apiKey.trim()}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Loading..." : "View"}
              </button>
              {data && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-500 transition-all hover:text-gray-700 hover:shadow-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Usage / subscription display */}
        {data && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current Plan
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {capitalize(data.tier)}
                </p>
                {data.subscription && (
                  <p className="mt-1 text-sm text-gray-500">
                    Subscription:{" "}
                    <span
                      className={`font-medium ${
                        data.subscription.status === "active"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {data.subscription.status}
                    </span>
                  </p>
                )}
                {!data.subscription && data.tier === "free" && (
                  <p className="mt-1 text-sm text-gray-500">
                    <Link
                      to="/pricing"
                      className="text-indigo-600 hover:underline"
                    >
                      Upgrade to Pro or Scale &rarr;
                    </Link>
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Monthly Usage
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.screenshots_this_month}
                  {data.tier_limit !== null && (
                    <span className="text-lg font-normal text-gray-400">
                      {" "}
                      / {data.tier_limit}
                    </span>
                  )}
                </p>
                {data.remaining !== null && (
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          data.remaining === 0
                            ? "bg-red-500"
                            : data.remaining < data.tier_limit! * 0.2
                              ? "bg-yellow-500"
                              : "bg-indigo-600"
                        }`}
                        style={{
                          width: `${
                            data.tier_limit! > 0
                              ? Math.min(
                                  100,
                                  (data.screenshots_this_month /
                                    data.tier_limit!) *
                                    100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      {data.remaining} screenshots remaining this month
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Lifetime Screenshots
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.lifetime_screenshots.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Key Created
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDate(data.created_at)}
                </p>
                <p className="mt-1 text-xs text-gray-500">{data.name}</p>
              </div>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/docs"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 hover:shadow-sm"
              >
                API Docs &rarr;
              </Link>
              <Link
                to="/pricing"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 hover:shadow-sm"
              >
                Pricing &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && !data && (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        )}
      </div>
    </main>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
