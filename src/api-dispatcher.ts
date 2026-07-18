// API route dispatcher — dynamically imports route handlers from
// src/routes/api/ at runtime (Bun supports TS imports natively).
// Each route file exports named HTTP method handlers: GET, POST, PUT, DELETE.

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type HandlerFn = (req: Request) => Response | Promise<Response>;

// Map of path → method → handler, lazily populated
const routeCache = new Map<string, Record<string, HandlerFn>>();

async function loadRoute(
  path: string
): Promise<Record<string, HandlerFn> | null> {
  if (routeCache.has(path)) return routeCache.get(path)!;

  try {
    // Import the route module — Bun resolves .ts files directly
    const mod = await import(`./routes/api/${path}.ts`);
    const handlers: Record<string, HandlerFn> = {};
    for (const method of ["GET", "POST", "PUT", "DELETE", "PATCH"]) {
      if (typeof mod[method] === "function") {
        handlers[method] = mod[method];
      }
    }
    routeCache.set(path, handlers);
    return handlers;
  } catch (e) {
    // Route not found — cache null so we don't retry
    routeCache.set(path, {});
    return null;
  }
}

export async function handleApiRequest(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const apiPath = url.pathname.replace(/^\/api\//, "");

  if (!apiPath || apiPath === "") {
    return null; // /api with no path — not handled
  }

  const handlers = await loadRoute(apiPath);
  if (!handlers) return null;

  const method = req.method.toUpperCase() as HttpMethod;
  const handler = handlers[method];
  if (!handler) {
    return new Response(
      JSON.stringify({ error: "Method not allowed", method: req.method }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return handler(req);
}
