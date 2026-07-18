import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  component: Docs,
});

const LIVE_URL = "https://cd7d1c456024a2f3d4a3b2b5efc6c2fa.ctonew.app";

function Docs() {
  return (
    <main className="flex-1 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
          API Documentation
        </h1>
        <p className="mb-16 text-lg text-gray-600">
          Everything you need to integrate PageSnap into your application.
        </p>

        <div className="space-y-16">
          {/* Quick Start */}
          <Section id="quickstart" title="Quick Start">
            <p className="mb-6">
              Get your first screenshot in under a minute.
            </p>
            <Step title="1. Get an API key" className="mb-4">
              <p className="mb-3">
                Sign up at{" "}
                <a href="/signup" className="text-indigo-600 hover:underline">
                  /signup
                </a>{" "}
                to get your free API key. No credit card required.
              </p>
            </Step>
            <Step title="2. Make your first request" className="mb-4">
              <p className="mb-4">
                Send a POST request to the screenshot endpoint with your API
                key and the URL you want to capture.
              </p>
              <CodeBlock
                language="bash"
                code={`curl -X POST ${LIVE_URL}/api/screenshot \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}' \\
  -o screenshot.png`}
              />
            </Step>
            <Step title="3. Receive your screenshot">
              <p className="mb-4">
                The response is the raw image data. Save it to a file or pipe it
                directly into your application.
              </p>
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <strong>Success!</strong> Your screenshot is ready. Use it in
                your app, store it, or process it further.
              </div>
            </Step>
          </Section>

          {/* Authentication */}
          <Section id="auth" title="Authentication">
            <p className="mb-4">
              All API requests require authentication via a Bearer token in the{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-gray-800">
                Authorization
              </code>{" "}
              header.
            </p>
            <CodeBlock
              language="bash"
              code={`Authorization: Bearer YOUR_API_KEY`}
            />
            <p className="mt-4">
              Your API key is shown once at signup. Store it securely — it
              cannot be retrieved later. If you lose it, create a new key.
            </p>
          </Section>

          {/* API Reference */}
          <Section id="reference" title="API Reference">
            <Endpoint
              method="POST"
              path="/api/screenshot"
              description="Capture a screenshot of a webpage."
            />

            <h4 className="mb-3 mt-8 text-lg font-semibold text-gray-900">
              Request Body
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 pr-4 font-semibold text-gray-900">
                      Parameter
                    </th>
                    <th className="pb-3 pr-4 font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="pb-3 pr-4 font-semibold text-gray-900">
                      Required
                    </th>
                    <th className="pb-3 font-semibold text-gray-900">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-mono text-gray-900">url</td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4">Yes</td>
                    <td className="py-3">The URL to screenshot</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-mono text-gray-900">
                      format
                    </td>
                    <td className="py-3 pr-4">string</td>
                    <td className="py-3 pr-4">No</td>
                    <td className="py-3">
                      <code className="rounded bg-gray-100 px-1 font-mono text-xs">
                        png
                      </code>{" "}
                      (default) or{" "}
                      <code className="rounded bg-gray-100 px-1 font-mono text-xs">
                        pdf
                      </code>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-mono text-gray-900">
                      viewport
                    </td>
                    <td className="py-3 pr-4">object</td>
                    <td className="py-3 pr-4">No</td>
                    <td className="py-3">
                      <code className="rounded bg-gray-100 px-1 font-mono text-xs">
                        {"{ width: 1280, height: 800 }"}
                      </code>{" "}
                      (default)
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-mono text-gray-900">
                      fullPage
                    </td>
                    <td className="py-3 pr-4">boolean</td>
                    <td className="py-3 pr-4">No</td>
                    <td className="py-3">
                      Capture full scrollable page (default: true)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="mb-3 mt-8 text-lg font-semibold text-gray-900">
              Response
            </h4>
            <p className="mb-4">
              Returns the raw image data with the appropriate{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-gray-800">
                Content-Type
              </code>{" "}
              header:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-sm text-gray-600">
              <li>
                <strong>200</strong> — Screenshot captured successfully. Body is
                the image (PNG or PDF).
              </li>
              <li>
                <strong>400</strong> — Bad request. Check the{" "}
                <code className="rounded bg-gray-100 px-1 font-mono text-xs">
                  error
                </code>{" "}
                field in the JSON response.
              </li>
              <li>
                <strong>401</strong> — Invalid or missing API key.
              </li>
              <li>
                <strong>429</strong> — Rate limit exceeded for your tier.
              </li>
              <li>
                <strong>500</strong> — Server error. Try again later.
              </li>
            </ul>

            <h4 className="mb-3 mt-8 text-lg font-semibold text-gray-900">
              Code Examples
            </h4>

            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-500">
                  JavaScript
                </p>
                <CodeBlock
                  language="javascript"
                  code={`const response = await fetch("${LIVE_URL}/api/screenshot", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://example.com",
    format: "png",
    viewport: { width: 1280, height: 800 },
    fullPage: true,
  }),
});

const buffer = await response.arrayBuffer();
await Bun.write("screenshot.png", buffer);`}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-500">
                  Python
                </p>
                <CodeBlock
                  language="python"
                  code={`import requests

response = requests.post(
    "${LIVE_URL}/api/screenshot",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json",
    },
    json={
        "url": "https://example.com",
        "format": "png",
        "viewport": {"width": 1280, "height": 800},
        "fullPage": True,
    },
)

with open("screenshot.png", "wb") as f:
    f.write(response.content)`}
                />
              </div>
            </div>
          </Section>

          {/* Rate Limits */}
          <Section id="ratelimits" title="Rate Limits">
            <p className="mb-4">
              Rate limits are enforced per API key based on your tier:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 pr-4 font-semibold text-gray-900">
                      Tier
                    </th>
                    <th className="pb-3 pr-4 font-semibold text-gray-900">
                      Screenshots / Month
                    </th>
                    <th className="pb-3 font-semibold text-gray-900">
                      Overage
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {[
                    { tier: "Free", limit: "100", overage: "Hard limit" },
                    { tier: "Pro", limit: "1,000", overage: "Hard limit" },
                    { tier: "Scale", limit: "10,000", overage: "Hard limit" },
                    { tier: "Enterprise", limit: "Custom", overage: "Negotiable" },
                  ].map((r) => (
                    <tr key={r.tier} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {r.tier}
                      </td>
                      <td className="py-3 pr-4">{r.limit}</td>
                      <td className="py-3">{r.overage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Other Endpoints */}
          <Section id="other-endpoints" title="Other Endpoints">
            <Endpoint
              method="GET"
              path="/api/usage"
              description="Check your current usage and remaining quota."
            />
            <Endpoint
              method="GET"
              path="/api/billing"
              description="View your billing status and subscription details."
            />
            <Endpoint
              method="GET"
              path="/api/health"
              description="Health check endpoint (no auth required)."
            />
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id}>
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Step({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="pl-0">{children}</div>
    </div>
  );
}

function Endpoint({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  const methodColor =
    method === "GET"
      ? "bg-green-100 text-green-700"
      : method === "POST"
        ? "bg-indigo-100 text-indigo-700"
        : "bg-gray-100 text-gray-700";

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <span
        className={`rounded-md px-2 py-0.5 text-xs font-semibold font-mono ${methodColor}`}
      >
        {method}
      </span>
      <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-mono text-gray-900">
        {path}
      </code>
      <span className="text-sm text-gray-600">{description}</span>
    </div>
  );
}

function CodeBlock({
  code,
  language: _lang,
}: {
  code: string;
  language: string;
}) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-900 p-5 text-sm leading-relaxed text-gray-100">
      <code>{code}</code>
    </pre>
  );
}
