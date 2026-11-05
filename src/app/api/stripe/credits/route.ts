import { NextResponse, type NextRequest } from "next/server";
import { canManage, getCtx } from "@/lib/session";
import { appUrl } from "@/lib/channels";
import { effectivePlan, getBilling, stripe } from "@/lib/billing";
import { packOf } from "@/lib/creditRules";

// Buy a credit pack (paid plans only): one Checkout payment. The webhook adds the credits when it's paid, and the
// card is kept for automatic top-ups.
export async function POST(request: NextRequest) {
  const s = stripe();
  if (!s) return NextResponse.json({ error: "Billing isn't set up" }, { status: 503 });
  const ctx = await getCtx();
  if (!canManage(ctx.role)) return NextResponse.json({ error: "Only owners and admins can buy credits" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { credits?: number };
  const pack = packOf(body.credits);
  if (!pack) return NextResponse.json({ error: "Pick a pack" }, { status: 400 });
  try {
    const ws = await getBilling(ctx.workspaceId);
    if (ws.plan === "free" || effectivePlan(ws) === "free" || !ws.stripe_customer_id) return NextResponse.json({ error: "Credit packs come with paid plans" }, { status: 400 });
    const back = `${appUrl()}/settings?tab=billing`;
    const meta = { workspace_id: ctx.workspaceId, kind: "credits", credits: String(pack.credits) };
    const session = await s.checkout.sessions.create({
      mode: "payment",
      customer: ws.stripe_customer_id,
      client_reference_id: ctx.workspaceId,
      line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: pack.price * 100, product_data: { name: `${pack.credits.toLocaleString("en-US")} credits` } } }],
      payment_intent_data: { setup_future_usage: "off_session", metadata: meta },
      metadata: meta,
      success_url: `${back}&credits=1`,
      cancel_url: back,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe credits", e);
    return NextResponse.json({ error: "Couldn't start checkout" }, { status: 502 });
  }
}
