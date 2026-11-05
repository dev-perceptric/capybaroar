import "server-only";
import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { adminClient } from "./supabase/server";
import { NO_AI, PLANS, effectivePlan, getBilling, monthStart, onTrial, stripe, type Billing, type PlanId } from "./billing";
import { ApiError } from "./api/input";
import { emailsOf, sendEmail } from "./alerts";
import { appUrl } from "./channels";
import { LOT_MONTHS, STALE_HOLD_MINUTES, alertLevel, grantKey, grantOwed, packOf, periodFor, refusalOf, refusalText, topUpDue, usageRows, type Entry, type PeriodInfo, type UsageRow } from "./creditRules";

// Credits, the server side: the ledger's SQL functions (025_credits.sql) with the plan's period worked out here.
// Every AI action holds its price before it starts and settles when it ends (charge what it used, or nothing when
// it failed). Ledger calls are safe to repeat (each action has its own key), so hiccups are tried again. The rules
// are in creditRules.ts.

/** Who an action is for: the workspace pays, the person and the brand show in the usage list and brand limits. */
export type Spender = { workspaceId: string; userId: string | null; brandId: string | null };
/** What an action is: tool is the kind (image, video, audio, agent, rewrite, caption, reply, bio). */
export type Spend = { tool: string; model?: string | null; postId?: string | null; note?: string | null };

export type Credits = { plan: PlanId; ai: boolean; period: string; planTotal: number; planLeft: number; bought: number; left: number; refillAt: string | null };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A ledger call, tried again on hiccups with growing waits (every call is safe to repeat). Refusals come back as
 *  ApiError 402 at once. */
async function ledger<T>(fn: string, args: Record<string, unknown>, need = 0): Promise<T> {
  for (let i = 0; ; i++) {
    let message: string;
    try {
      const { data, error } = await adminClient().rpc(fn, args);
      if (!error) return data as T;
      const refused = refusalOf(error);
      if (refused) throw new ApiError(402, refused.code, refusalText(refused, need));
      message = error.message;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      message = e instanceof Error ? e.message : String(e);
    }
    if (i >= 3) throw new Error(`Credits: ${message}`);
    await sleep(300 * 3 ** i);
  }
}

const now = () => new Date();

/** The period a workspace's plan credits are in, from its billing row. */
export function periodOfBilling(ws: Billing, at = now()): PeriodInfo & { plan: PlanId } {
  const plan = effectivePlan(ws);
  const info = periodFor({ credits: PLANS[plan].aiCredits, trial: onTrial(ws), anchor: ws.credit_anchor ?? ws.current_period_end ?? ws.created_at }, at);
  return { ...info, plan };
}

// Grants already made this run, so most spends skip the check (a grant is safe to repeat anyway).
const granted = new Set<string>();

/** Makes sure this period's plan credits are in the ledger. Returns the period. */
async function ensurePlanCredits(workspaceId: string, ws: Billing) {
  const info = periodOfBilling(ws);
  const memo = `${workspaceId}:${info.period}:${info.total}`;
  if (info.total > 0 && !granted.has(memo)) {
    const { data, error } = await adminClient().from("credit_entries").select("amount").eq("workspace_id", workspaceId).eq("bucket", "plan").eq("kind", "grant").eq("period", info.period);
    if (error) throw new Error(`Credits: ${error.message}`);
    const owed = grantOwed(info.total, (data ?? []).reduce((s, r) => s + Number(r.amount), 0));
    if (owed > 0) await ledger("credit_grant", { ws: workspaceId, p_key: grantKey(info.period, info.total), p_bucket: "plan", p_period: info.period, p_amount: owed, p_expires: null, p_note: `${PLANS[info.plan].name} credits` });
    granted.add(memo);
  }
  return info;
}

/** The workspace's credits now. */
export async function creditsOf(workspaceId: string): Promise<Credits> {
  const ws = await getBilling(workspaceId);
  const info = await ensurePlanCredits(workspaceId, ws);
  const rows = await ledger<{ plan: number; bought: number }[]>("credit_left", { ws: workspaceId, p_period: info.period });
  const planLeft = Number(rows?.[0]?.plan ?? 0);
  const ai = PLANS[info.plan].ai;
  // Bought credits wait, unused, while the plan has no AI (they still end on their date).
  const bought = ai ? Number(rows?.[0]?.bought ?? 0) : 0;
  return { plan: info.plan, ai, period: info.period, planTotal: info.total, planLeft, bought, left: planLeft + bought, refillAt: info.refillAt };
}

/** Holds credits for an action that's starting. Without `partial` it holds all of `amount` or throws ApiError 402
 *  (out_of_credits, brand_limit, or upgrade_required on a plan without AI); with it, it holds what there is. Returns
 *  the credits held. Holding again with the same key and seq returns the first hold. */
export async function hold(sp: Spender, key: string, amount: number, spend: Spend, opts: { partial?: boolean; seq?: number } = {}): Promise<number> {
  const ws = await getBilling(sp.workspaceId);
  if (!PLANS[effectivePlan(ws)].ai) throw new ApiError(402, "upgrade_required", NO_AI);
  const info = await ensurePlanCredits(sp.workspaceId, ws);
  const got = await ledger<number>(
    "credit_take",
    {
      ws: sp.workspaceId,
      p_key: key,
      p_kind: "hold",
      p_seq: opts.seq ?? 0,
      p_amount: Math.max(0, Math.ceil(amount)),
      p_period: info.period,
      p_partial: !!opts.partial,
      p_brand: sp.brandId,
      p_user: sp.userId,
      p_tool: spend.tool,
      p_model: spend.model ?? null,
      p_post: spend.postId ?? null,
      p_note: spend.note ?? null,
    },
    amount,
  );
  return Number(got ?? 0);
}

/** Ends an action: gives its holds back and charges `amount` (0 when it failed). Returns the credits charged. Safe
 *  to repeat. Never throws for alerts or top-ups that follow. */
export async function settle(workspaceId: string, key: string, amount: number, postId: string | null = null): Promise<number> {
  const ws = await getBilling(workspaceId);
  const info = periodOfBilling(ws);
  const charged = Number((await ledger<number>("credit_settle", { ws: workspaceId, p_key: key, p_amount: Math.max(0, Math.ceil(amount)), p_period: info.period, p_post: postId })) ?? 0);
  if (charged > 0) void afterSpend(workspaceId).catch((e) => console.error("credits after spend:", e instanceof Error ? e.message : e));
  return charged;
}

/** Runs an action with a fixed price: holds it, runs, charges it when the action works and nothing when it throws. */
export async function withCredits<T>(sp: Spender, spend: Spend, amount: number, run: () => Promise<T>): Promise<T> {
  const key = `${spend.tool}:${randomUUID()}`;
  await hold(sp, key, amount, spend);
  let out: T;
  try {
    out = await run();
  } catch (e) {
    await settle(sp.workspaceId, key, 0).catch((x) => console.error("credits release:", x instanceof Error ? x.message : x));
    throw e;
  }
  // A hiccup here leaves the hold for the hourly sweep, which gives it back: the person isn't charged twice.
  await settle(sp.workspaceId, key, amount).catch((x) => console.error("credits settle:", x instanceof Error ? x.message : x));
  return out;
}

/** Adds bought credits (a pack) once per key. They last LOT_MONTHS. */
export async function grantBought(workspaceId: string, key: string, credits: number, note: string) {
  const ends = new Date();
  ends.setUTCMonth(ends.getUTCMonth() + LOT_MONTHS);
  return ledger<boolean>("credit_grant", { ws: workspaceId, p_key: key, p_bucket: "bought", p_period: null, p_amount: credits, p_expires: ends.toISOString(), p_note: note });
}

// After a spend: alerts and automatic top-ups

async function alertOnce(workspaceId: string, kind: "credits" | "topup_failed", ref: string, mail: { subject: string; title: string; body: string; button: string; href: string }) {
  const db = adminClient();
  const { error: dup } = await db.from("alerts").insert({ workspace_id: workspaceId, kind, ref });
  if (dup) return;
  const { data: members } = await db.from("members").select("user_id").eq("workspace_id", workspaceId).in("role", ["owner", "admin"]);
  const to = await emailsOf((members ?? []).map((m) => m.user_id as string));
  await sendEmail(to, mail.subject, mail);
}

/** Emails at 80% and 100% of a period's plan credits, and asks for an automatic top-up when one is due. */
async function afterSpend(workspaceId: string) {
  const c = await creditsOf(workspaceId);
  const level = alertLevel(c.planTotal, c.planLeft);
  if (level) {
    const href = `${appUrl()}/settings?tab=billing`;
    await alertOnce(workspaceId, "credits", `${workspaceId}:${c.period}:${level}`, {
      subject: level === 100 ? "Your plan's credits are used" : "80% of your plan's credits are used",
      title: level === 100 ? "Your plan's credits are used" : "80% of your plan's credits are used",
      body: level === 100 ? (c.bought ? `Bought credits are in use now: ${c.bought.toLocaleString("en-US")} left.` : "AI waits until your credits refill or you buy more.") : `${c.planLeft.toLocaleString("en-US")} of ${c.planTotal.toLocaleString("en-US")} credits are left this month.`,
      button: "Buy credits",
      href,
    });
  }
  const { data: ws } = await adminClient().from("workspaces").select("auto_topup_pack, auto_topup_max").eq("id", workspaceId).single();
  if (!ws?.auto_topup_pack) return;
  if (!topUpDue({ pack: ws.auto_topup_pack as number, max: ws.auto_topup_max as number, left: c.left, boughtThisMonth: await autoThisMonth(workspaceId) })) return;
  await adminClient().from("workspaces").update({ topup_wanted_at: new Date().toISOString() }).eq("id", workspaceId).is("topup_wanted_at", null);
}

async function autoThisMonth(workspaceId: string) {
  const { count, error } = await adminClient().from("credit_entries").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("kind", "grant").like("key", "auto:%").gte("created_at", monthStart().toISOString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** The runner's loop: buys the pack for each workspace that asked for an automatic top-up. One server claims each
 *  request (compare and set), and Stripe's idempotency key (the month and the pack's number in it) means a retry
 *  never charges the card twice. */
export async function runAutoTopUps() {
  const s = stripe();
  if (!s) return;
  const db = adminClient();
  const { data } = await db.from("workspaces").select("id, topup_wanted_at").not("topup_wanted_at", "is", null).limit(10);
  for (const row of data ?? []) {
    const { data: claimed } = await db.from("workspaces").update({ topup_wanted_at: null }).eq("id", row.id).eq("topup_wanted_at", row.topup_wanted_at).select("id");
    if (!claimed?.length) continue;
    await autoTopUp(s, row.id as string).catch((e) => console.error("auto top-up:", row.id, e instanceof Error ? e.message : e));
  }
}

async function autoTopUp(s: Stripe, workspaceId: string) {
  const { data: ws } = await adminClient().from("workspaces").select("plan, stripe_customer_id, stripe_subscription_id, auto_topup_pack, auto_topup_max").eq("id", workspaceId).single();
  const pack = packOf(ws?.auto_topup_pack);
  if (!ws || !pack || ws.plan === "free" || !ws.stripe_customer_id) return;
  const [c, bought] = await Promise.all([creditsOf(workspaceId), autoThisMonth(workspaceId)]);
  if (!topUpDue({ pack: pack.credits, max: ws.auto_topup_max as number, left: c.left, boughtThisMonth: bought })) return;
  const customer = (await s.customers.retrieve(ws.stripe_customer_id as string)) as Stripe.Customer;
  let pm = customer.invoice_settings?.default_payment_method ?? null;
  if (!pm && ws.stripe_subscription_id) pm = (await s.subscriptions.retrieve(ws.stripe_subscription_id as string)).default_payment_method ?? null;
  const failed = (why: string) =>
    alertOnce(workspaceId, "topup_failed", `${workspaceId}:${new Date().toISOString().slice(0, 10)}`, {
      subject: "An automatic top-up didn't go through",
      title: "An automatic top-up didn't go through",
      body: why,
      button: "Open billing",
      href: `${appUrl()}/settings?tab=billing`,
    });
  if (!pm) return failed("There's no card on file. Add one in Manage billing, or buy credits yourself.");
  const month = new Date().toISOString().slice(0, 7);
  try {
    const pi = await s.paymentIntents.create(
      {
        amount: pack.price * 100,
        currency: "usd",
        customer: ws.stripe_customer_id as string,
        payment_method: typeof pm === "string" ? pm : pm.id,
        off_session: true,
        confirm: true,
        description: `${pack.credits.toLocaleString("en-US")} Capybaroar credits`,
        metadata: { workspace_id: workspaceId, kind: "auto_credits", credits: String(pack.credits) },
      },
      { idempotencyKey: `auto:${workspaceId}:${month}:${bought + 1}` },
    );
    // The webhook (payment_intent.succeeded) grants it too; the key makes it once.
    if (pi.status === "succeeded") await grantBought(workspaceId, `auto:${pi.id}`, pack.credits, "Automatic top-up");
  } catch (e) {
    await failed(e instanceof Error ? e.message : "The card was declined.");
  }
}

// The hourly sweep

/** Holds a stopped server left behind: a picture, video or audio request settles by how it ended; anything else is
 *  given back. */
export async function sweepHolds() {
  const stale = await ledger<{ workspace_id: string; key: string }[]>("credit_stale_holds", { age: `${STALE_HOLD_MINUTES} minutes`, n: 200 });
  for (const h of stale ?? []) {
    try {
      if (h.key.startsWith("gen:")) {
        const { data: g } = await adminClient().from("generations").select("status, credits, post_id").eq("id", h.key.slice(4)).maybeSingle();
        if (g && (g.status === "queued" || g.status === "running")) continue;
        await settle(h.workspace_id, h.key, g?.status === "done" ? Number(g.credits) : 0, (g?.post_id as string | null) ?? null);
      } else await settle(h.workspace_id, h.key, 0);
    } catch (e) {
      console.error("credits sweep:", h.key, e instanceof Error ? e.message : e);
    }
  }
}

// Settings

/** The usage list: one row per action and grant, newest first. */
export async function usageOf(workspaceId: string, max = 300): Promise<UsageRow[]> {
  const { data, error } = await adminClient()
    .from("credit_entries")
    .select("key, kind, bucket, amount, tool, model, note, brand_id, user_id, post_id, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(Math.min(5000, max * 6));
  if (error) throw new Error(error.message);
  return usageRows((data ?? []) as Entry[]).slice(0, max);
}

/** What each brand used this period, for Agency's brand limits. */
export async function brandUse(workspaceId: string): Promise<Record<string, number>> {
  const c = await creditsOf(workspaceId);
  const rows = await ledger<{ brand_id: string; used: number }[]>("credit_brand_used", { ws: workspaceId, p_period: c.period });
  return Object.fromEntries((rows ?? []).map((r) => [r.brand_id, Number(r.used)]));
}

export async function setBrandLimit(workspaceId: string, brandId: string, limit: number | null) {
  if (!PLANS[effectivePlan(await getBilling(workspaceId))].brandLimits) throw new Error("Brand limits come with Agency");
  if (limit != null && (!Number.isInteger(limit) || limit < 0 || limit > 10_000_000)) throw new Error("Enter a whole number of credits");
  const { error } = await adminClient().from("brands").update({ credit_limit: limit }).eq("id", brandId).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

export async function setAutoTopUp(workspaceId: string, pack: number | null, max: number) {
  if (pack != null && !packOf(pack)) throw new Error("Pick a pack");
  if (!Number.isInteger(max) || max < 1 || max > 10) throw new Error("Pick 1 to 10 a month");
  if (pack != null && effectivePlan(await getBilling(workspaceId)) === "free") throw new Error("Automatic top-ups come with paid plans");
  const { error } = await adminClient().from("workspaces").update({ auto_topup_pack: pack, auto_topup_max: max }).eq("id", workspaceId);
  if (error) throw new Error(error.message);
}

/** The brand a person's AI counts against: the one their key or role is limited to, when there's exactly one. */
export const brandOfScope = (brandIds: string[] | null | undefined) => (brandIds?.length === 1 ? brandIds[0] : null);
