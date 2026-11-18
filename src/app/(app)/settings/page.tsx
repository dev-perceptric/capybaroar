import { Settings } from "lucide-react";
import { Page } from "@/components/ui";
import { SettingsView, type SettingsData } from "@/components/SettingsView";
import type { BillingInfo } from "@/components/BillingSection";
import type { BrandsInfo, MembersInfo } from "@/components/TeamSettings";
import type { ApiInfo } from "@/components/ApiSettings";
import { canManage, getCtx, type Ctx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { PLANS, billingReady, effectivePlan, getBilling, postsThisMonth, seatsUsed, trialDaysLeft, type PlanId } from "@/lib/billing";
import { brandUse, creditsOf, usageOf } from "@/lib/credits";
import { PACKS } from "@/lib/creditRules";
import { modelOf } from "@/lib/genRules";
import { emailsOf, mailReady } from "@/lib/alerts";
import { getBrandCtx, reviewLinks } from "@/lib/brands";
import { listInvites, listMembers } from "@/lib/team";
import { listApiKeys } from "@/lib/api/keys";
import { listConnectedApps } from "@/lib/oauth/store";
import { listWebhooks } from "@/lib/webhooks";
import { appUrl } from "@/lib/channels";
import { lastExports } from "@/lib/exports";
import { openTab, type SettingsTab } from "./tabs";

// Settings reads only the open tab's data (`?tab=`). Picking another tab changes the address, so this runs again for
// that one; the actions' revalidatePath("/settings") reads the open tab again.
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const [ctx, { tab: raw }] = await Promise.all([getCtx(), searchParams]);
  // Members who don't run the workspace see only their own account.
  const manager = canManage(ctx.role);
  const data = await load(ctx, openTab(raw, manager));
  return (
    <Page icon={<Settings />} title="Settings">
      <SettingsView name={ctx.workspaceName} timezone={ctx.timezone} data={data} owner={ctx.role === "owner"} email={ctx.email} accountOnly={!manager} />
    </Page>
  );
}

const noExports = { account: null, workspace: null };

async function load(ctx: Ctx, tab: SettingsTab): Promise<SettingsData> {
  switch (tab) {
    case "general":
      // Only owners see Export workspace here.
      return { tab, exports: ctx.role === "owner" ? await lastExports(ctx.userId, ctx.workspaceId, true).catch(() => noExports) : noExports };
    case "account":
      return { tab, exports: await lastExports(ctx.userId, ctx.workspaceId, false).catch(() => noExports) };
    case "queue": {
      const { data } = await adminClient().from("workspaces").select("queue").eq("id", ctx.workspaceId).single();
      return { tab, queue: (data?.queue ?? []) as { day: number; time: string }[] };
    }
    case "brands":
      return { tab, team: await brandsTab(ctx) };
    case "members":
      return { tab, team: await membersTab(ctx) };
    case "audit": {
      const members = await listMembers(ctx.workspaceId);
      return { tab, people: members.map((m) => ({ userId: m.userId, name: m.name, email: m.email })) };
    }
    case "api":
      return { tab, api: await apiTab(ctx) };
    case "billing":
      return { tab, billing: await billingTab(ctx) };
  }
}

/** Each brand with its channels and review link, and its credit use and limit when the plan has brand limits. */
async function brandsTab(ctx: Ctx): Promise<BrandsInfo> {
  const db = adminClient();
  const [ws, brands, links, counts, credits] = await Promise.all([
    getBilling(ctx.workspaceId),
    // The layout already read the brands (owners and admins see all of them): reused, not read again.
    getBrandCtx().then((b) => b.brands),
    reviewLinks(ctx.workspaceId),
    db.from("channels").select("brand_id").eq("workspace_id", ctx.workspaceId),
    // Until migration 025 is in, the Brands table shows without credits.
    creditsOf(ctx.workspaceId).catch(() => null),
  ]);
  const [used, limits] =
    PLANS[effectivePlan(ws)].brandLimits && credits
      ? await Promise.all([brandUse(ctx.workspaceId).catch(() => ({}) as Record<string, number>), db.from("brands").select("id, credit_limit").eq("workspace_id", ctx.workspaceId)])
      : [null, null];
  const perBrand = new Map<string, number>();
  for (const c of counts.data ?? []) if (c.brand_id) perBrand.set(c.brand_id as string, (perBrand.get(c.brand_id as string) ?? 0) + 1);
  // Agency's credit limit for each brand, shown in the Brands table.
  const creditLimits = !!(used && limits);
  const limitOf = (id: string) => ((limits?.data ?? []).find((l) => l.id === id)?.credit_limit as number | null | undefined) ?? null;
  return {
    brands: brands.map((b) => ({ ...b, channels: perBrand.get(b.id) ?? 0, reviewLink: links[b.id] ?? null, ...(creditLimits ? { creditsUsed: used?.[b.id] ?? 0, creditLimit: limitOf(b.id) } : {}) })),
    creditLimits,
  };
}

async function membersTab(ctx: Ctx): Promise<MembersInfo> {
  const [brands, members, invites] = await Promise.all([getBrandCtx().then((b) => b.brands), listMembers(ctx.workspaceId), listInvites(ctx.workspaceId)]);
  return { me: ctx.userId, mail: mailReady(), brands, members, invites };
}

/** Null until migration 009 is in. */
async function apiTab(ctx: Ctx): Promise<ApiInfo | null> {
  const [keys, apps, hooks] = await Promise.all([
    listApiKeys(ctx.workspaceId).catch(() => null),
    listConnectedApps(ctx.workspaceId).catch(() => []),
    // Until migration 020 is in, the API section shows without webhooks.
    listWebhooks(ctx.workspaceId).catch(() => null),
  ]);
  return keys ? { base: appUrl(), docs: "https://capybaroar.com/api", keys, apps, hooks } : null;
}

async function billingTab(ctx: Ctx): Promise<BillingInfo> {
  const db = adminClient();
  const [ws, posts, channels, seats, brands, credits, history, { data: topUp }] = await Promise.all([
    getBilling(ctx.workspaceId),
    postsThisMonth(ctx.workspaceId),
    db.from("channels").select("id", { count: "exact", head: true }).eq("workspace_id", ctx.workspaceId),
    seatsUsed(ctx.workspaceId, false),
    getBrandCtx().then((b) => b.brands),
    // Until migration 025 is in, Billing shows without credits.
    creditsOf(ctx.workspaceId).catch(() => null),
    usageOf(ctx.workspaceId, 50).catch(() => []),
    db.from("workspaces").select("auto_topup_pack, auto_topup_max").eq("id", ctx.workspaceId).maybeSingle(),
  ]);
  // Who made each credit entry: only the people in the history are looked up, not every member.
  const people = [...new Set(history.map((h) => h.userId).filter((x): x is string => !!x))];
  const names = Object.fromEntries(await Promise.all(people.map(async (id) => [id, (await emailsOf([id]).catch(() => []))[0] ?? null] as const)));
  return {
    plan: ws.plan,
    effective: effectivePlan(ws),
    status: ws.plan_status,
    interval: ws.billing_interval,
    trialDays: trialDaysLeft(ws),
    periodEnd: ws.current_period_end,
    paying: ws.plan !== "free" && !!ws.stripe_subscription_id,
    ready: billingReady(),
    canManage: true,
    plans: (Object.keys(PLANS) as PlanId[]).map((id) => ({ id, ...PLANS[id] })),
    usage: { channels: channels.count ?? 0, posts, members: seats, brands: brands.length },
    credits: credits ? { planTotal: credits.planTotal, planLeft: credits.planLeft, bought: credits.bought, left: credits.left, refillAt: credits.refillAt } : null,
    packs: PACKS.map((p) => ({ credits: p.credits, price: p.price })),
    autoTopUp: { pack: (topUp?.auto_topup_pack as number | null | undefined) ?? null, max: (topUp?.auto_topup_max as number | undefined) ?? 2 },
    history: history.map((h) => ({ key: h.key, at: h.at, what: h.what, model: h.model ? (modelOf(h.model)?.name ?? h.model) : null, person: h.userId ? (names[h.userId] ?? null) : null, credits: h.credits })),
  };
}
