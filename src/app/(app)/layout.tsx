import { Sidebar } from "@/components/Sidebar";
import { getCtx } from "@/lib/session";
import { openCount } from "@/lib/inbox";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  const inbox = await openCount(ctx.workspaceId);
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-shell md:flex-row">
      <Sidebar name={ctx.name} email={ctx.email} workspace={ctx.workspaceName} inbox={inbox} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-panel">{children}</main>
    </div>
  );
}
