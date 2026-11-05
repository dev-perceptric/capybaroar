import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { Page } from "@/components/ui";
import { SettingsView } from "@/components/SettingsView";
import type { BillingInfo } from "@/components/BillingSection";
import { canManage, getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { PLANS, billingReady, effectivePlan, getBilling, postsThisMonth, seatsUsed, trialDaysLeft, type PlanId } from "@/lib/billing";
import { brandUse, creditsOf, usageOf } from "@/lib/credits";
import { PACKS } from "@/lib/creditRules";
import { modelOf } from "@/lib/genRules";
import { emailsOf } from "@/lib/alerts";
import { listBrands, reviewLinks } from "@/lib/brands";
import { listInvites, listMembers } from "@/lib/team";
import { mailReady } from "@/lib/alerts";
import { listApiKeys } from "@/lib/api/keys";
import { listWebhooks } from "@/lib/webhooks";
import { appUrl } from "@/lib/channels";

export default async function SettingsPage() {
  const ctx = await getCtx();
  if (!canManage(ctx.role)) redirect("/calendar");
  const db = adminClient();
  const [{ data }, ws, posts, channels, seats, brands, links, members, invites, counts, keys, hooks, credits, history, { data: topUp }] = await Promise.all([
    db.from("workspaces").select("queue").eq("id", ctx.workspaceId).single(),
    getBilling(ctx.workspaceId),
    postsThisMonth(ctx.workspaceId),
    db.from("channels").select("id", { count: "exact", head: true }).eq("workspace_id", ctx.workspaceId),
    seatsUsed(ctx.workspaceId, false),
    listBrands(ctx.workspaceId),
    reviewLinks(ctx.workspaceId),
    listMembers(ctx.workspaceId),
    listInvites(ctx.workspaceId),
    db.from("channels").select("brand_id").eq("workspace_id", ctx.workspaceId),
    // Until migration 009 is in, Settings shows without the API section.
    listApiKeys(ctx.workspaceId).catch(() => null),
    // Until migration 020 is in, the API section shows without webhooks.
    listWebhooks(ctx.workspaceId).catch(() => null),
    // Until migration 025 is in, Billing shows without credits.
    creditsOf(ctx.workspaceId).catch(() => null),
    usageOf(ctx.workspaceId, 50).catch(() => []),
    db.from("workspaces").select("auto_topup_pack, auto_topup_max").eq("id", ctx.workspaceId).maybeSingle(),
  ]);
  const plan = PLANS[effectivePlan(ws)];
  const [used, limits] = plan.brandLimits && credits
    ? await Promise.all([brandUse(ctx.workspaceId).catch(() => ({}) as Record<string, number>), db.from("brands").select("id, credit_limit").eq("workspace_id", ctx.workspaceId)])
    : [null, null];
  const people = [...new Set(history.map((h) => h.userId).filter((x): x is string => !!x))];
  const names = Object.fromEntries(await Promise.all(people.map(async (id) => [id, (await emailsOf([id]).catch(() => []))[0] ?? null] as const)));
  const perBrand = new Map<string, number>();
  for (const c of counts.data ?? []) if (c.brand_id) perBrand.set(c.brand_id as string, (perBrand.get(c.brand_id as string) ?? 0) + 1);
  const billing: BillingInfo = {
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
    brandLimits:
      used && limits
        ? brands.map((b) => ({ id: b.id, name: b.name, used: used[b.id] ?? 0, limit: ((limits.data ?? []).find((l) => l.id === b.id)?.credit_limit as number | null | undefined) ?? null }))
        : null,
    history: history.map((h) => ({ key: h.key, at: h.at, what: h.what, model: h.model ? (modelOf(h.model)?.name ?? h.model) : null, person: h.userId ? (names[h.userId] ?? null) : null, credits: h.credits })),
  };
  return (
    <Page icon={<Settings />} title="Settings">
      <SettingsView
        name={ctx.workspaceName}
        timezone={ctx.timezone}
        queue={(data?.queue ?? []) as { day: number; time: string }[]}
        billing={billing}
        team={{
          me: ctx.userId,
          mail: mailReady(),
          brands: brands.map((b) => ({ ...b, channels: perBrand.get(b.id) ?? 0, reviewLink: links[b.id] ?? null })),
          members,
          invites,
        }}
        api={keys ? { base: appUrl(), docs: "https://capybaroar.com/api", keys, hooks } : undefined}
      />
    </Page>
  );
}
