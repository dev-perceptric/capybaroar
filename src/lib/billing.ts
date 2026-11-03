import "server-only";
import Stripe from "stripe";
import { adminClient } from "./supabase/server";

export type PlanId = "free" | "pro" | "agency";

/** Every plan's price and limits. Change the numbers here. null means unlimited. */
/** members counts the team (owners, admins, editors); clients who only approve don't take a seat. */
export const PLANS: Record<PlanId, { name: string; price: number; members: number; brands: number | null; channels: number; postsPerMonth: number | null; agent: boolean }> = {
  free: { name: "Free", price: 0, members: 1, brands: 1, channels: 3, postsPerMonth: 30, agent: false },
  pro: { name: "Pro", price: 19, members: 3, brands: 3, channels: 15, postsPerMonth: null, agent: true },
  agency: { name: "Agency", price: 59, members: 10, brands: null, channels: 60, postsPerMonth: null, agent: true },
};

export const TRIAL_DAYS = 14;

export type Billing = { plan: PlanId; plan_status: string | null; stripe_customer_id: string | null; stripe_subscription_id: string | null; trial_ends_at: string | null; current_period_end: string | null };

const COLUMNS = "plan, plan_status, stripe_customer_id, stripe_subscription_id, trial_ends_at, current_period_end";

export async function getBilling(workspaceId: string): Promise<Billing> {
  const { data, error } = await adminClient().from("workspaces").select(COLUMNS).eq("id", workspaceId).single();
  if (error) throw new Error(error.message);
  return data as Billing;
}

export const onTrial = (ws: Pick<Billing, "plan" | "trial_ends_at">) => ws.plan === "free" && !!ws.trial_ends_at && new Date(ws.trial_ends_at).getTime() > Date.now();

export const trialDaysLeft = (ws: Pick<Billing, "plan" | "trial_ends_at">) => (onTrial(ws) ? Math.ceil((new Date(ws.trial_ends_at!).getTime() - Date.now()) / 86400000) : 0);

/** The plan whose limits apply: a running trial counts as Pro. */
export function effectivePlan(ws: Pick<Billing, "plan" | "trial_ends_at">): PlanId {
  if (ws.plan !== "free") return ws.plan;
  return onTrial(ws) ? "pro" : "free";
}

const limitsOf = async (workspaceId: string) => PLANS[effectivePlan(await getBilling(workspaceId))];

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

export async function assertCanUseAgent(workspaceId: string) {
  if (!(await limitsOf(workspaceId)).agent) throw new Error("Your plan doesn't include the agent. Upgrade to use it.");
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

export const priceFor = (plan: PlanId) => (plan === "pro" ? process.env.STRIPE_PRICE_PRO : plan === "agency" ? process.env.STRIPE_PRICE_AGENCY : undefined) || null;

export function planForPrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return "agency";
  return null;
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
