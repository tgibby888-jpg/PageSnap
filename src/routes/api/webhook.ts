import { handleWebhook } from "../../billing/stripe";

// POST /api/webhook — Stripe webhook receiver
export async function POST(req: Request): Promise<Response> {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Missing stripe-signature header" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let payload: string;
  try {
    payload = await req.text();
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to read request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await handleWebhook(payload, signature);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
