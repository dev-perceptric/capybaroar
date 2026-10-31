import { Settings } from "lucide-react";
import { Page } from "@/components/ui";
import { SettingsView } from "@/components/SettingsView";
import { getCtx } from "@/lib/session";

export default async function SettingsPage() {
  const ctx = await getCtx();
  return (
    <Page icon={<Settings />} title="Settings">
      <SettingsView name={ctx.workspaceName} timezone={ctx.timezone} />
    </Page>
  );
}
