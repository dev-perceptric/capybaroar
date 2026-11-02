import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { Page } from "@/components/ui";
import { SettingsView } from "@/components/SettingsView";
import type { BillingInfo } from "@/components/BillingSection";
import { canManage, getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { PLANS, billingReady, effectivePlan, getBilling, postsThisMonth, seatsUsed, trialDaysLeft, type PlanId } from "@/lib/billing";
import { listBrands, reviewLinks } from "@/lib/brands";
import { listInvites, listMembers } from "@/lib/team";
import { mailReady } from "@/lib/alerts";

export default async function SettingsPage() {
  const ctx = await getCtx();
  if (!canManage(ctx.role)) redirect("/calendar");
  const db = adminClient();
  const [{ data }, ws, posts, channels, seats, brands, links, members, invites, counts] = await Promise.all([
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
  ]);
  const perBrand = new Map<string, number>();
  for (const c of counts.data ?? []) if (c.brand_id) perBrand.set(c.brand_id as string, (perBrand.get(c.brand_id as string) ?? 0) + 1);
  const billing: BillingInfo = {
    plan: ws.plan,
    effective: effectivePlan(ws),
    status: ws.plan_status,
    trialDays: trialDaysLeft(ws),
    periodEnd: ws.current_period_end,
    paying: ws.plan !== "free" && !!ws.stripe_subscription_id,
    ready: billingReady(),
    canManage: true,
    plans: (Object.keys(PLANS) as PlanId[]).map((id) => ({ id, ...PLANS[id] })),
    usage: { channels: channels.count ?? 0, posts, members: seats, brands: brands.length },
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
      />
    </Page>
  );
}
