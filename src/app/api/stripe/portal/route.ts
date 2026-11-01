import { NextResponse } from "next/server";
import { getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/channels";
import { getBilling, stripe } from "@/lib/billing";

// Open Stripe's Billing Portal: change plan, cards, invoices, cancel.
export async function POST() {
  const s = stripe();
  if (!s) return NextResponse.json({ error: "Billing isn't set up" }, { status: 503 });
  const ctx = await getCtx();
  const { data: me } = await adminClient().from("members").select("role").eq("workspace_id", ctx.workspaceId).eq("user_id", ctx.userId).single();
  if (!me || me.role === "editor") return NextResponse.json({ error: "Only owners and admins can manage billing" }, { status: 403 });
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
