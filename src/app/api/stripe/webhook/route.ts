import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { applySubscription, stripe } from "@/lib/billing";

// Stripe events. After a valid signature this always answers 200: a failure is logged, never thrown, so billing
// state is never left half-applied by retries piling up. Each event re-reads the subscription from Stripe, so
// replays and out-of-order deliveries end at the same, current state.
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
  try {
    if (event.type === "checkout.session.completed") {
      const cs = event.data.object;
      const subId = typeof cs.subscription === "string" ? cs.subscription : cs.subscription?.id;
      if (cs.mode === "subscription" && subId) await applySubscription(await s.subscriptions.retrieve(subId), cs.client_reference_id);
    } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      // Deleted subscriptions can't always be fetched fresh; the event's copy is final.
      const fresh = event.type === "customer.subscription.deleted" ? sub : await s.subscriptions.retrieve(sub.id).catch(() => sub);
      await applySubscription(fresh);
    }
  } catch (e) {
    console.error("stripe webhook", event.type, event.id, e);
  }
  return NextResponse.json({ received: true });
}
