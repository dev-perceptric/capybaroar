import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { applySubscription, stripe } from "@/lib/billing";
import { grantBought } from "@/lib/credits";
import { packOf } from "@/lib/creditRules";

// Stripe events. After a valid signature this answers 200 even when a plan change fails (it's logged), so billing
// state is never left half-applied by retries piling up. Bought credits are the exception: if adding them fails, it
// answers 500 so Stripe sends the event again. Each event re-reads the subscription from Stripe, so
// replays and out-of-order deliveries end at the same, current state. Credit packs are granted once per payment
// (the ledger's key), so a replayed event never adds them twice.
export async function POST(request: NextRequest) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return NextResponse.json({ error: "Billing isn't set up" }, { status: 503 });
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = await s.webhooks.constructEventAsync(raw, request.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  let retry = false;
  const grant = (ws: string, key: string, credits: number, note: string) =>
    grantBought(ws, key, credits, note).catch((e) => {
      retry = true;
      console.error("stripe webhook credits", event.id, e);
    });
  try {
    if (event.type === "checkout.session.completed") {
      const cs = event.data.object;
      const subId = typeof cs.subscription === "string" ? cs.subscription : cs.subscription?.id;
      if (cs.mode === "subscription" && subId) await applySubscription(await s.subscriptions.retrieve(subId), cs.client_reference_id);
      const pack = packOf(Number(cs.metadata?.credits));
      if (cs.mode === "payment" && cs.metadata?.kind === "credits" && cs.payment_status === "paid" && pack && cs.metadata.workspace_id) {
        await grant(cs.metadata.workspace_id, `topup:${cs.id}`, pack.credits, `${pack.credits.toLocaleString("en-US")} credits`);
      }
    } else if (event.type === "payment_intent.succeeded") {
      // Automatic top-ups (credits.ts) are charged off-session; this grants them if the charge's own answer was lost.
      const pi = event.data.object;
      const pack = packOf(Number(pi.metadata?.credits));
      if (pi.metadata?.kind === "auto_credits" && pack && pi.metadata.workspace_id) await grant(pi.metadata.workspace_id, `auto:${pi.id}`, pack.credits, "Automatic top-up");
    } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      // Deleted subscriptions can't always be fetched fresh; the event's copy is final.
      const fresh = event.type === "customer.subscription.deleted" ? sub : await s.subscriptions.retrieve(sub.id).catch(() => sub);
      await applySubscription(fresh);
    }
  } catch (e) {
    console.error("stripe webhook", event.type, event.id, e);
  }
  return retry ? NextResponse.json({ error: "Try again" }, { status: 500 }) : NextResponse.json({ received: true });
}
