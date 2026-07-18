import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";

const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "PageSnap";
  } catch {
    return "PageSnap";
  }
});

export const Route = createFileRoute("/")({
  loader: () => getBusinessName(),
  component: Home,
});

function Home() {
  const businessName = Route.useLoaderData();

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 to-white px-6 pb-24 pt-20 sm:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-6 inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700">
            {businessName} — Screenshots as a Service
          </span>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
            Screenshots
            <br />
            <span className="text-indigo-600">as a Service</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600">
            Capture perfect webpage screenshots via a simple API. One POST
            request, instant results. No browser needed on your end — we handle
            rendering, scaling, and delivery.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/signup"
              className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-500 hover:shadow-xl"
            >
              Get Your Free API Key
            </Link>
            <Link
              to="/docs"
              className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:shadow"
            >
              Read the Docs &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-gray-900">
            Built for developers
          </h2>
          <p className="mb-16 text-center text-lg text-gray-600">
            Simple, fast, and priced to scale with your project.
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            <FeatureCard
              icon={<LightningIcon />}
              title="Lightning Fast"
              description="Screenshots delivered in seconds. Our optimized rendering pipeline captures pages with minimal latency."
            />
            <FeatureCard
              icon={<CreditCardIcon />}
              title="Pay As You Go"
              description="Start with a generous free tier. Upgrade only when your usage grows. No contracts, no surprises."
            />
            <FeatureCard
              icon={<CodeIcon />}
              title="Simple API"
              description="One endpoint, clean docs, and code examples in every major language. Integrate in minutes."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-gray-900">
            How it works
          </h2>
          <p className="mb-16 text-center text-lg text-gray-600">
            Three steps from zero to screenshots.
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Get an API Key",
                desc: "Sign up in seconds. No credit card required for the free tier — just pick a name and go.",
              },
              {
                step: "2",
                title: "POST a URL",
                desc: "Send a URL to our API endpoint with optional parameters like viewport size or format.",
              },
              {
                step: "3",
                title: "Receive a Screenshot",
                desc: "Get back a PNG or PDF of the rendered page. Fast, high-quality, every time.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900">
            Ready to get started?
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            First 100 screenshots are on us. No credit card required.
          </p>
          <Link
            to="/signup"
            className="inline-block rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-500"
          >
            Get Your Free API Key &rarr;
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="leading-relaxed text-gray-600">{description}</p>
    </div>
  );
}

function LightningIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
