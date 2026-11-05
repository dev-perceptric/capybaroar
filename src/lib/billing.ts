import "server-only";
import Stripe from "stripe";
import { adminClient } from "./supabase/server";
import { NO_AI } from "./creditRules";

export type PlanId = "free" | "creator" | "pro" | "agency";
export type Interval = "month" | "year";

/** Every plan's price and limits. Change the numbers here. null means unlimited. */
/** members counts the team (owners, admins, editors); clients who only approve don't take a seat. */
/** yearly: the price for a year (two months free). ai: the agent, AI writing and AI media; Free has none. */
/** aiCredits: credits each month, refilled on the billing date (creditRules.ts has the price list). */
/** approvals: brands can ask for approval and clients can be invited. brandLimits: a credit limit for each brand. */
/** reports: saved reports with share links and scheduled emails; whiteLabel: the agency's logo and color on them. */
/** bioBadgeOff: link-in-bio pages may turn off "Made with Capybaroar" (on Free it always shows). */
export type Plan = { name: string; price: number; yearly: number; members: number; brands: number | null; channels: number; postsPerMonth: number | null; ai: boolean; aiCredits: number; approvals: boolean; brandLimits: boolean; reports: boolean; whiteLabel: boolean; bioBadgeOff: boolean };
export const PLANS: Record<PlanId, Plan> = {
  free: { name: "Free", price: 0, yearly: 0, members: 1, brands: 1, channels: 3, postsPerMonth: 30, ai: false, aiCredits: 0, approvals: false, brandLimits: false, reports: false, whiteLabel: false, bioBadgeOff: false },
  creator: { name: "Creator", price: 29, yearly: 290, members: 1, brands: 1, channels: 8, postsPerMonth: null, ai: true, aiCredits: 1000, approvals: false, brandLimits: false, reports: false, whiteLabel: false, bioBadgeOff: true },
  pro: { name: "Pro", price: 49, yearly: 490, members: 5, brands: 5, channels: 30, postsPerMonth: null, ai: true, aiCredits: 2500, approvals: true, brandLimits: false, reports: true, whiteLabel: false, bioBadgeOff: true },
  agency: { name: "Agency", price: 149, yearly: 1490, members: 15, brands: null, channels: 100, postsPerMonth: null, ai: true, aiCredits: 8000, approvals: true, brandLimits: true, reports: true, whiteLabel: true, bioBadgeOff: true },
};
export const PAID: PlanId[] = ["creator", "pro", "agency"];
export const isPlan = (v: unknown): v is PlanId => typeof v === "string" && v in PLANS;

export const TRIAL_DAYS = 14;

export type Billing = { plan: PlanId; plan_status: string | null; stripe_customer_id: string | null; stripe_subscription_id: string | null; trial_ends_at: string | null; current_period_end: string | null; billing_interval: Interval | null; credit_anchor: string | null; created_at: string };

const COLUMNS = "plan, plan_status, stripe_customer_id, stripe_subscription_id, trial_ends_at, current_period_end, billing_interval, credit_anchor, created_at";

// The columns from before 025, so the app keeps working in the minutes between a deploy and its migration.
const OLD_COLUMNS = "plan, plan_status, stripe_customer_id, stripe_subscription_id, trial_ends_at, current_period_end, created_at";

export async function getBilling(workspaceId: string): Promise<Billing> {
  const db = adminClient();
  const { data, error } = await db.from("workspaces").select(COLUMNS).eq("id", workspaceId).single();
  if (!error) return data as unknown as Billing;
  if (error.code !== "42703") throw new Error(error.message);
  const old = await db.from("workspaces").select(OLD_COLUMNS).eq("id", workspaceId).single();
  if (old.error) throw new Error(old.error.message);
  return { ...(old.data as unknown as Billing), billing_interval: null, credit_anchor: null };
}

export const onTrial = (ws: Pick<Billing, "plan" | "trial_ends_at">) => ws.plan === "free" && !!ws.trial_ends_at && new Date(ws.trial_ends_at).getTime() > Date.now();

export const trialDaysLeft = (ws: Pick<Billing, "plan" | "trial_ends_at">) => (onTrial(ws) ? Math.ceil((new Date(ws.trial_ends_at!).getTime() - Date.now()) / 86400000) : 0);

/** The plan whose limits apply: a running trial counts as Pro. */
export function effectivePlan(ws: Pick<Billing, "plan" | "trial_ends_at">): PlanId {
  if (ws.plan !== "free") return ws.plan;
  return onTrial(ws) ? "pro" : "free";
}

export const limitsOf = async (workspaceId: string) => PLANS[effectivePlan(await getBilling(workspaceId))];

/** Throws when connecting these accounts would pass the plan's channel limit. `adding` counts only new accounts. */
export async function assertCanAddChannel(workspaceId: string, adding: number) {
  if (adding <= 0) return;
  const limits = await limitsOf(workspaceId);
  const { count, error } = await adminClient().from("channels").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  if ((count ?? 0) + adding > limits.channels) throw new Error(`Your plan allows ${limits.channels} channels. Upgrade to add more.`);
}

/** Throws when one more brand would pass the plan's brand limit. */
export async function assertCanAddBrand(workspaceId: string) {
  const limits = await limitsOf(workspaceId);
  if (limits.brands == null) return;
  const { count, error } = await adminClient().from("brands").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  if ((count ?? 0) >= limits.brands) throw new Error(`Your plan allows ${limits.brands} ${limits.brands === 1 ? "brand" : "brands"}. Upgrade to add more.`);
}

/** Team seats in use: members who aren't clients, plus open invites for team roles. */
export async function seatsUsed(workspaceId: string, withInvites = true) {
  const db = adminClient();
  const [m, i] = await Promise.all([
    db.from("members").select("user_id", { count: "exact", head: true }).eq("workspace_id", workspaceId).neq("role", "client"),
    withInvites
      ? db.from("invites").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).neq("role", "client").is("accepted_at", null).gt("expires_at", new Date().toISOString())
      : Promise.resolve({ count: 0, error: null }),
  ]);
  if (m.error) throw new Error(m.error.message);
  if (i.error) throw new Error(i.error.message);
  return (m.count ?? 0) + (i.count ?? 0);
}

/** Throws when one more team member would pass the plan's member limit. Clients don't count. */
export async function assertCanAddMember(workspaceId: string, role: string, withInvites = true) {
  if (role === "client") return;
  const limits = await limitsOf(workspaceId);
  if ((await seatsUsed(workspaceId, withInvites)) >= limits.members) throw new Error(`Your plan allows ${limits.members} ${limits.members === 1 ? "member" : "members"}. Upgrade to add more.`);
}

export const monthStart = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));

/** Posts scheduled or published this calendar month (UTC), leaving out the one being edited. */
export async function postsThisMonth(workspaceId: string, exceptId?: string) {
  const start = monthStart();
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  let q = adminClient().from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).neq("status", "draft").gte("publish_at", start.toISOString()).lt("publish_at", end.toISOString());
  if (exceptId) q = q.neq("id", exceptId);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Throws when the plan's monthly post limit is used up. */
export async function assertCanSchedule(workspaceId: string, editingId?: string) {
  const limits = await limitsOf(workspaceId);
  if (limits.postsPerMonth == null) return;
  if ((await postsThisMonth(workspaceId, editingId)) >= limits.postsPerMonth) throw new Error(`Your plan allows ${limits.postsPerMonth} scheduled posts a month. Upgrade to schedule more.`);
}

/** Throws when scheduling `n` more posts this month would pass the plan's limit (bulk upload checks before it starts). */
export async function assertCanScheduleMany(workspaceId: string, n: number) {
  const limits = await limitsOf(workspaceId);
  if (limits.postsPerMonth == null || n <= 0) return;
  const left = Math.max(0, limits.postsPerMonth - (await postsThisMonth(workspaceId)));
  if (n > left) throw new Error(`Your plan allows ${limits.postsPerMonth} scheduled posts a month and ${left} are left. Upgrade to schedule more, or save these as drafts.`);
}

export { NO_AI };

export async function assertCanUseAi(workspaceId: string) {
  if (!(await limitsOf(workspaceId)).ai) throw new Error(NO_AI);
}

export async function assertCanUseApprovals(workspaceId: string) {
  if (!(await limitsOf(workspaceId)).approvals) throw new Error("Approvals come with Pro and Agency. Upgrade to use them.");
}

export async function assertCanUseReports(workspaceId: string) {
  if (!(await limitsOf(workspaceId)).reports) throw new Error("Your plan doesn't include reports. Upgrade to use them.");
}

// Stripe

let client: Stripe | null = null;

/** The Stripe client, or null when billing isn't set up (no STRIPE_SECRET_KEY). */
export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export const billingReady = () => !!process.env.STRIPE_SECRET_KEY;

const PRICE_ENV: Record<Exclude<PlanId, "free">, Record<Interval, string>> = {
  creator: { month: "STRIPE_PRICE_CREATOR", year: "STRIPE_PRICE_CREATOR_YEARLY" },
  pro: { month: "STRIPE_PRICE_PRO", year: "STRIPE_PRICE_PRO_YEARLY" },
  agency: { month: "STRIPE_PRICE_AGENCY", year: "STRIPE_PRICE_AGENCY_YEARLY" },
};

/** The Stripe price for a plan, or null when it isn't set up. */
export const priceFor = (plan: PlanId, interval: Interval = "month") => (plan === "free" ? null : process.env[PRICE_ENV[plan][interval]] || null);

/** Older prices that still count as a plan, so people who subscribed before a price change keep it:
 *  STRIPE_LEGACY_PRICES="price_abc:pro,price_def:agency". */
function legacyPrices(): Map<string, PlanId> {
  const m = new Map<string, PlanId>();
  for (const pair of (process.env.STRIPE_LEGACY_PRICES ?? "").split(",")) {
    const [id, plan] = pair.split(":").map((x) => x.trim());
    if (id && isPlan(plan) && plan !== "free") m.set(id, plan);
  }
  return m;
}

export function planForPrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  for (const plan of PAID) for (const interval of ["month", "year"] as Interval[]) if (priceId === priceFor(plan, interval)) return plan;
  return legacyPrices().get(priceId) ?? null;
}

const LIVE = ["active", "trialing", "past_due"];

/** Write a subscription's current state onto its workspace. Safe to run any number of times. */
export async function applySubscription(sub: Stripe.Subscription, workspaceHint?: string | null) {
  const db = adminClient();
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  let workspaceId = workspaceHint || (sub.metadata?.workspace_id as string | undefined) || null;
  if (!workspaceId) {
    const { data } = await db.from("workspaces").select("id").eq("stripe_customer_id", customer).maybeSingle();
    workspaceId = (data?.id as string | undefined) ?? null;
  }
  if (!workspaceId) {
    console.error("stripe: no workspace for subscription", sub.id);
    return;
  }
  const item = sub.items.data[0];
  const plan = planForPrice(item?.price.id);
  const live = LIVE.includes(sub.status) && plan;
  const end = item?.current_period_end;
  const interval: Interval = item?.price.recurring?.interval === "year" ? "year" : "month";
  // Credits refill monthly from the day the subscription's billing started (creditRules.ts periodOf).
  const anchor = sub.billing_cycle_anchor ? new Date(sub.billing_cycle_anchor * 1000).toISOString() : null;
  // A different, newer subscription on the workspace wins over an old one ending.
  const { data: cur } = await db.from("workspaces").select("stripe_subscription_id").eq("id", workspaceId).single();
  if (!live && cur?.stripe_subscription_id && cur.stripe_subscription_id !== sub.id) return;
  const { error } = await db
    .from("workspaces")
    .update({
      plan: live ? plan : "free",
      plan_status: sub.status,
      stripe_customer_id: customer,
      stripe_subscription_id: live ? sub.id : null,
      current_period_end: live && end ? new Date(end * 1000).toISOString() : null,
      billing_interval: live ? interval : null,
      credit_anchor: live ? anchor : null,
    })
    .eq("id", workspaceId);
  if (error) console.error("stripe: workspace update failed", workspaceId, error.message);
}

/** How many of these accounts aren't connected yet (reconnecting doesn't count against the limit). */
export async function newChannelCount(workspaceId: string, network: string, accountIds: string[]) {
  if (!accountIds.length) return 0;
  const { data, error } = await adminClient().from("channels").select("account_id").eq("workspace_id", workspaceId).eq("network", network).in("account_id", accountIds);
  if (error) throw new Error(error.message);
  const have = new Set((data ?? []).map((r) => r.account_id as string));
  return new Set(accountIds.filter((id) => !have.has(id))).size;
}
