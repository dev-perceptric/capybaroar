import { NextResponse } from "next/server";
import { canManage, getCtx } from "@/lib/session";
import { appUrl } from "@/lib/channels";
import { getBilling, stripe } from "@/lib/billing";

// Open Stripe's Billing Portal: change plan, cards, invoices, cancel.
export async function POST() {
  const s = stripe();
  if (!s) return NextResponse.json({ error: "Billing isn't set up" }, { status: 503 });
  const ctx = await getCtx();
  if (!canManage(ctx.role)) return NextResponse.json({ error: "Only owners and admins can manage billing" }, { status: 403 });
  const ws = await getBilling(ctx.workspaceId);
  if (!ws.stripe_customer_id) return NextResponse.json({ error: "No billing account yet" }, { status: 400 });
  try {
    const session = await s.billingPortal.sessions.create({ customer: ws.stripe_customer_id, return_url: `${appUrl()}/settings?tab=billing` });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe portal", e);
    return NextResponse.json({ error: "Couldn't open billing" }, { status: 502 });
  }
}
