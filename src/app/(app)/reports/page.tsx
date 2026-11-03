import Link from "next/link";
import { FileText } from "lucide-react";
import { Page } from "@/components/ui";
import { ToolIntro } from "@/components/ToolIntro";
import { ReportsView } from "@/components/ReportsView";
import { canManage, teamCtx } from "@/lib/session";
import { getBrandCtx } from "@/lib/brands";
import { PLANS, effectivePlan, getBilling } from "@/lib/billing";
import { listReports } from "@/lib/reports";
import { listMedia } from "@/lib/media";

export default async function ReportsPage() {
  await teamCtx();
  const ctx = await getBrandCtx();
  const plan = PLANS[effectivePlan(await getBilling(ctx.workspaceId))];
  if (!plan.reports)
    return (
      <Page icon={<FileText />} title="Reports">
        <ToolIntro
          drawing="dashboards"
          title="Reports for your clients"
          lead="Each brand's results as a link and a PDF, emailed every week or month. Reports come with Pro and Agency."
          action={
            canManage(ctx.role) ? (
              <Link href="/settings?tab=billing" className="inline-flex h-8 items-center rounded-md bg-brand px-3 text-[13px] font-medium text-white shadow-primary hover:bg-brand-hover">
                Upgrade
              </Link>
            ) : undefined
          }
        />
      </Page>
    );
  const [reports, media] = await Promise.all([listReports(ctx.workspaceId, ctx.scope), plan.whiteLabel ? listMedia(ctx.workspaceId) : []]);
  return (
    <ReportsView
      reports={reports}
      brands={ctx.brands}
      brand={ctx.brand?.id ?? null}
      allBrands={ctx.scope === null}
      whiteLabel={plan.whiteLabel}
      images={media.filter((m) => m.mime.startsWith("image/") && m.thumb).map((m) => ({ id: m.id, name: m.name, thumb: m.thumb! }))}
    />
  );
}
