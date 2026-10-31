import { Sidebar } from "@/components/Sidebar";
import { getCtx } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-shell md:flex-row">
      <Sidebar name={ctx.name} email={ctx.email} workspace={ctx.workspaceName} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-panel">{children}</main>
    </div>
  );
}
