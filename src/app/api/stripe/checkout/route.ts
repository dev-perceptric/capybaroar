import { NextResponse, type NextRequest } from "next/server";
import { canManage, getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/channels";
import { getBilling, priceFor, stripe, type PlanId } from "@/lib/billing";

// Start a subscription: make the Stripe customer once, then send the owner to Checkout.
export async function POST(request: NextRequest) {
  const s = stripe();
  if (!s) return NextResponse.json({ error: "Billing isn't set up" }, { status: 503 });
  const ctx = await getCtx();
  const db = adminClient();
  if (!canManage(ctx.role)) return NextResponse.json({ error: "Only owners and admins can change the plan" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { plan?: string };
  const plan = body.plan as PlanId;
  const price = plan === "pro" || plan === "agency" ? priceFor(plan) : null;
  if (!price) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  try {
    const ws = await getBilling(ctx.workspaceId);
    let customer = ws.stripe_customer_id;
    if (!customer) {
      const c = await s.customers.create({ email: ctx.email, name: ctx.workspaceName, metadata: { workspace_id: ctx.workspaceId } });
      customer = c.id;
      const { error } = await db.from("workspaces").update({ stripe_customer_id: customer }).eq("id", ctx.workspaceId);
      if (error) throw new Error(error.message);
    }
    const back = `${appUrl()}/settings?tab=billing`;
    const session = await s.checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: ctx.workspaceId,
      line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { workspace_id: ctx.workspaceId } },
      allow_promotion_codes: true,
      success_url: `${back}&done=1`,
      cancel_url: back,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe checkout", e);
    return NextResponse.json({ error: "Couldn't start checkout" }, { status: 502 });
  }
}
