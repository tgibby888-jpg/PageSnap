import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  Link,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PageSnap — Screenshots as a Service" },
      { name: "description", content: "Capture perfect webpage screenshots via a simple API. One POST request, instant results." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-lg text-gray-600">Page not found</p>
      <Link
        to="/"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Go home
      </Link>
    </div>
  ),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Nav />
      <Outlet />
      <Footer />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-dvh flex-col bg-white text-gray-900 antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Nav() {
  const linkClass =
    "text-sm font-medium text-gray-600 transition-colors hover:text-gray-900";
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            P
          </span>
          PageSnap
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/pricing" className={linkClass}>
            Pricing
          </Link>
          <Link to="/docs" className={linkClass}>
            Docs
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Get Free API Key
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-gray-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">
            P
          </span>
          PageSnap
        </div>
        <div className="flex gap-6 text-sm text-gray-500">
          <Link to="/docs" className="hover:text-gray-700">
            Docs
          </Link>
          <Link to="/pricing" className="hover:text-gray-700">
            Pricing
          </Link>
          <span className="hover:text-gray-700 cursor-pointer">
            API Reference
          </span>
        </div>
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} PageSnap. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
