import { Sidebar } from "@/components/Sidebar";
import { getBrandCtx } from "@/lib/brands";
import { openCount } from "@/lib/inbox";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getBrandCtx();
  const inbox = ctx.role === "client" ? 0 : await openCount(ctx.workspaceId, ctx.scope);
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-shell md:flex-row md:gap-2 md:p-2">
      <Sidebar
        name={ctx.name}
        email={ctx.email}
        workspace={ctx.workspaceName}
        inbox={inbox}
        switcher={{ role: ctx.role, brands: ctx.brands, brand: ctx.brand?.id ?? null, workspaces: ctx.workspaces, workspaceId: ctx.workspaceId }}
      />
      {/* Keyed by brand and workspace, so a switch starts every page fresh instead of keeping the last brand's lists. */}
      <main key={`${ctx.workspaceId}:${ctx.brand?.id ?? "all"}`} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-panel md:rounded-lg md:border md:border-frame md:shadow-card">{children}</main>
    </div>
  );
}
