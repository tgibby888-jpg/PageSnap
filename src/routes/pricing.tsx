import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";

export const Route = createFileRoute("/pricing")({
  component: Pricing,
});

// Combined server function: creates an API key AND starts a Stripe checkout
// session in one call — used when a user clicks Pro/Scale without an existing key.
const createKeyAndCheckout = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { tier: string };
    if (!d.tier || !["pro", "scale"].includes(d.tier)) {
      throw new Error('tier must be "pro" or "scale"');
    }
    return { tier: d.tier as "pro" | "scale" };
  })
  .handler(async ({ data }) => {
    const { createApiKey } = await import("../db/index");
    const { createCheckoutSession } = await import("../billing/stripe");

    // Generate a 32-char random hex key
    const rawKey = Array.from(
      { length: 32 },
      () => Math.floor(Math.random() * 16).toString(16),
    ).join("");

    // Store SHA-256 hash
    const keyHash = Bun.SHA256.hash(rawKey, "hex") as string;
    const result = createApiKey(keyHash, "Pricing Signup", "free");
    const apiKeyId = Number(result.lastInsertRowid);

    const checkout = await createCheckoutSession(apiKeyId, data.tier);

    return {
      key: rawKey,
      checkout_url: checkout.url,
      session_id: checkout.sessionId,
    };
  });

const tiers = [
  {
    name: "Free",
    screenshots: "100",
    price: "$0",
    period: "forever",
    cta: "Get Started",
    tierId: "free" as const,
    featured: false,
    features: [
      "100 screenshots / month",
      "PNG output",
      "Full-page capture",
      "Custom viewport",
      "Community support",
    ],
  },
  {
    name: "Pro",
    screenshots: "1,000",
    price: "$9",
    period: "per month",
    cta: "Get Started",
    tierId: "pro" as const,
    featured: true,
    features: [
      "1,000 screenshots / month",
      "PNG + PDF output",
      "Full-page capture",
      "Custom viewport",
      "Priority rendering",
      "Email support",
    ],
  },
  {
    name: "Scale",
    screenshots: "10,000",
    price: "$49",
    period: "per month",
    cta: "Get Started",
    tierId: "scale" as const,
    featured: false,
    features: [
      "10,000 screenshots / month",
      "PNG + PDF output",
      "Full-page capture",
      "Custom viewport",
      "Priority rendering",
      "Email support",
      "Slack support",
    ],
  },
  {
    name: "Enterprise",
    screenshots: "Custom",
    price: "Custom",
    period: "pricing",
    cta: "Contact Us",
    tierId: "enterprise" as const,
    featured: false,
    href: "mailto:sales@pagesnap.dev",
    features: [
      "Unlimited screenshots",
      "PNG + PDF output",
      "Full-page capture",
      "Custom viewport",
      "Priority rendering",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
];

function Pricing() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleProScaleClick(tier: "pro" | "scale") {
    setError("");
    setLoadingTier(tier);

    try {
      // Check if user already has an API key from a previous signup
      const existingKey =
        typeof window !== "undefined"
          ? localStorage.getItem("pagesnap_api_key")
          : null;

      let checkoutUrl: string;

      if (existingKey) {
        // Use existing key to call the upgrade endpoint directly
        const res = await fetch("/api/billing/upgrade", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${existingKey}`,
          },
          body: JSON.stringify({ tier }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Upgrade failed" }));
          throw new Error(err.error ?? "Upgrade failed");
        }

        const body = await res.json();
        checkoutUrl = body.checkout_url;
      } else {
        // No existing key — create one and start checkout in one server call
        const result = await createKeyAndCheckout({ data: { tier } });
        // Store the new key for the dashboard
        if (typeof window !== "undefined") {
          localStorage.setItem("pagesnap_api_key", result.key);
        }
        checkoutUrl = result.checkout_url;
      }

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setLoadingTier(null);
    }
  }

  return (
    <main className="flex-1 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-600">
            Start free, scale when you're ready. No hidden fees.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            <Link to="/signup" className="text-indigo-600 hover:underline">
              Sign up for a free API key
            </Link>{" "}
            first, then upgrade here. Your key is stored in your browser for easy
            upgrading.
          </p>
        </div>

        {error && (
          <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                tier.featured
                  ? "border-indigo-600 shadow-xl shadow-indigo-100 ring-2 ring-indigo-600"
                  : "border-gray-200 shadow-sm"
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <div className="mb-6">
                <h3 className="mb-1 text-xl font-semibold text-gray-900">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {tier.price}
                  </span>
                  <span className="text-sm text-gray-500">{tier.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {tier.screenshots} screenshots
                </p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>

              {tier.tierId === "free" ? (
                <Link
                  to="/signup"
                  className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all bg-gray-50 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 hover:shadow`}
                >
                  {tier.cta}
                </Link>
              ) : tier.tierId === "enterprise" ? (
                <a
                  href="mailto:sales@pagesnap.dev"
                  className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all bg-gray-50 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 hover:shadow`}
                >
                  {tier.cta}
                </a>
              ) : (
                <button
                  onClick={() => handleProScaleClick(tier.tierId)}
                  disabled={loadingTier !== null}
                  className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all ${
                    tier.featured
                      ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-200"
                      : "bg-gray-50 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 hover:shadow"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {loadingTier === tier.tierId
                    ? "Redirecting..."
                    : tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-indigo-600"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
