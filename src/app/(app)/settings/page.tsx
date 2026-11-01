import { Settings } from "lucide-react";
import { Page } from "@/components/ui";
import { SettingsView } from "@/components/SettingsView";
import { getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const ctx = await getCtx();
  const { data } = await adminClient().from("workspaces").select("queue").eq("id", ctx.workspaceId).single();
  return (
    <Page icon={<Settings />} title="Settings">
      <SettingsView name={ctx.workspaceName} timezone={ctx.timezone} queue={(data?.queue ?? []) as { day: number; time: string }[]} />
    </Page>
  );
}
