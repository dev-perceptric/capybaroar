import type { NextRequest } from "next/server";
import { canManage, getCtx } from "@/lib/session";
import { auditCsvFor } from "@/lib/auditLog";
import { cleanFilter } from "@/lib/auditLogRules";
import { record, userActor } from "@/lib/auditActor";

export const dynamic = "force-dynamic";

/** The audit log as a CSV file, for the filter in the query (group, person, period), up to 10,000 events. */
export async function GET(request: NextRequest) {
  const ctx = await getCtx();
  if (!canManage(ctx.role)) return new Response("Only owners and admins can see the audit log", { status: 403 });
  const q = request.nextUrl.searchParams;
  const filter = cleanFilter({ group: q.get("group"), actorId: q.get("person"), period: q.get("period") });
  let out: { csv: string; rows: number };
  try {
    out = await auditCsvFor(ctx.workspaceId, filter);
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Couldn't make the file. Try again.", { status: 503 });
  }
  await record({ workspaceId: ctx.workspaceId, action: "data.exported", target: { type: "audit_log", label: "Audit log" }, meta: { rows: out.rows, group: filter.group, period: filter.period } }, userActor(ctx));
  return new Response(out.csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
}
