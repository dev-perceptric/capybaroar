import { Settings } from "lucide-react";
import { Page } from "@/components/ui";
import { SettingsView } from "@/components/SettingsView";
import type { BillingInfo } from "@/components/BillingSection";
import { getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { PLANS, billingReady, effectivePlan, getBilling, postsThisMonth, trialDaysLeft, type PlanId } from "@/lib/billing";

export default async function SettingsPage() {
  const ctx = await getCtx();
  const db = adminClient();
  const [{ data }, ws, posts, channels, members, me] = await Promise.all([
    db.from("workspaces").select("queue").eq("id", ctx.workspaceId).single(),
    getBilling(ctx.workspaceId),
    postsThisMonth(ctx.workspaceId),
    db.from("channels").select("id", { count: "exact", head: true }).eq("workspace_id", ctx.workspaceId),
    db.from("members").select("user_id", { count: "exact", head: true }).eq("workspace_id", ctx.workspaceId),
    db.from("members").select("role").eq("workspace_id", ctx.workspaceId).eq("user_id", ctx.userId).single(),
  ]);
  const billing: BillingInfo = {
    plan: ws.plan,
    effective: effectivePlan(ws),
    status: ws.plan_status,
    trialDays: trialDaysLeft(ws),
    periodEnd: ws.current_period_end,
    paying: ws.plan !== "free" && !!ws.stripe_subscription_id,
    ready: billingReady(),
    canManage: !!me.data && me.data.role !== "editor",
    plans: (Object.keys(PLANS) as PlanId[]).map((id) => ({ id, ...PLANS[id] })),
    usage: { channels: channels.count ?? 0, posts, members: members.count ?? 0 },
  };
  return (
    <Page icon={<Settings />} title="Settings">
      <SettingsView name={ctx.workspaceName} timezone={ctx.timezone} queue={(data?.queue ?? []) as { day: number; time: string }[]} billing={billing} />
    </Page>
  );
}
