import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";

// Server function to create an API key directly (bypasses auth for signup)
const createSignupKey = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { name: string; tier: string };
    const name = (d.name || "").trim();
    const tier = (d.tier || "free").trim();

    if (!name || name.length < 1) {
      throw new Error("Name is required");
    }
    const validTiers = ["free", "pro", "scale"];
    if (!validTiers.includes(tier)) {
      throw new Error("Invalid tier. Choose free, pro, or scale.");
    }
    return { name, tier };
  })
  .handler(async ({ data }) => {
    const { createApiKey } = await import("../db/index");

    // Generate a 32-char random hex key
    const rawKey = Array.from(
      { length: 32 },
      () => Math.floor(Math.random() * 16).toString(16),
    ).join("");

    // Store SHA-256 hash
    const keyHash = Bun.SHA256.hash(rawKey, "hex") as string;
    createApiKey(keyHash, data.name, data.tier);

    return {
      key: rawKey,
      name: data.name,
      tier: data.tier,
    };
  });

export const Route = createFileRoute("/signup")({
  component: Signup,
});

const LIVE_URL = "https://cd7d1c456024a2f3d4a3b2b5efc6c2fa.ctonew.app";

function Signup() {
  const [name, setName] = useState("");
  const [tier, setTier] = useState("free");
  const [result, setResult] = useState<{
    key: string;
    name: string;
    tier: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await createSignupKey({ data: { name, tier } });
      setResult(res);
      // Persist the key so pricing/dashboard can find it
      if (typeof window !== "undefined") {
        localStorage.setItem("pagesnap_api_key", res.key);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (result) {
    return (
      <main className="flex-1 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
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
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900">
            Your API key is ready!
          </h1>
          <p className="mb-8 text-gray-600">
            Store this key securely —{" "}
            <strong>it will not be shown again.</strong>
          </p>

          {/* Key display */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              Your API Key
            </p>
            <code className="break-all text-lg font-mono font-semibold text-gray-900">
              {result.key}
            </code>
          </div>

          <button
            onClick={handleCopy}
            className="mb-12 rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-sm"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>

          {/* Curl example */}
          <div className="rounded-xl border border-gray-200 bg-gray-900 p-5 text-left">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
              Try it now
            </p>
            <pre className="overflow-x-auto text-sm leading-relaxed text-gray-100">
              <code>{`curl -X POST ${LIVE_URL}/api/screenshot \\
  -H "Authorization: Bearer ${result.key}" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}' \\
  -o screenshot.png`}</code>
            </pre>
          </div>

          <p className="mt-8">
            <a
              href="/docs"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Read the full API docs &rarr;
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-20">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900">
            Get your API key
          </h1>
          <p className="text-gray-600">
            Free to start. No credit card required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Name your key
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My App"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              A label to identify this key (e.g. "Production", "Testing")
            </p>
          </div>

          <div>
            <label
              htmlFor="tier"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Select tier
            </label>
            <select
              id="tier"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="free">Free — 100 screenshots/month</option>
              <option value="pro">Pro — 1,000 screenshots/month ($9/mo)</option>
              <option value="scale">
                Scale — 10,000 screenshots/month ($49/mo)
              </option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Free API Key"}
          </button>

          <p className="text-center text-xs text-gray-500">
            By signing up you agree to our fair use policy. We'll never share
            your email.
          </p>
        </form>
      </div>
    </main>
  );
}
