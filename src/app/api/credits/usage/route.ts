import { canManage, getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { emailsOf } from "@/lib/alerts";
import { usageOf } from "@/lib/credits";
import { usageCsv } from "@/lib/creditRules";

export const dynamic = "force-dynamic";

/** The credit usage list as a CSV file (owners and admins). */
export async function GET() {
  const ctx = await getCtx();
  if (!canManage(ctx.role)) return new Response("Only owners and admins can see usage", { status: 403 });
  const rows = await usageOf(ctx.workspaceId, 5000);
  const db = adminClient();
  const { data: brands } = await db.from("brands").select("id, name").eq("workspace_id", ctx.workspaceId);
  const people = [...new Set(rows.map((r) => r.userId).filter((x): x is string => !!x))];
  const emails = await Promise.all(people.map(async (id) => [id, (await emailsOf([id]))[0] ?? ""] as const));
  const csv = usageCsv(rows, { users: Object.fromEntries(emails), brands: Object.fromEntries((brands ?? []).map((b) => [b.id as string, b.name as string])) });
  return new Response(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="credits-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
}
