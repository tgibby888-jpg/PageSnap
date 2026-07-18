import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  component: Pricing,
});

const tiers = [
  {
    name: "Free",
    screenshots: "100",
    price: "$0",
    period: "forever",
    cta: "Get Started",
    href: "/signup",
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
    href: "/signup",
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
    href: "/signup",
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
    href: "mailto:sales@pagesnap.dev",
    featured: false,
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
        </div>

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

              <Link
                to={tier.href}
                className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all ${
                  tier.featured
                    ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-200"
                    : "bg-gray-50 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 hover:shadow"
                }`}
              >
                {tier.cta}
              </Link>
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
