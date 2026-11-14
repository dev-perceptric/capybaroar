"use server";

import { unstable_rethrow } from "next/navigation";
import { canManage, getCtx } from "@/lib/session";
import { listAudit, type AuditItem } from "@/lib/auditLog";
import { cleanFilter } from "@/lib/auditLogRules";

/** One page of the workspace's audit log, for owners and admins. `cursor` comes from the page before. */
export async function loadAudit(filter: unknown, cursor: string | null = null): Promise<{ error?: string; rows?: AuditItem[]; next?: string | null }> {
  try {
    const ctx = await getCtx();
    if (!canManage(ctx.role)) return { error: "Only owners and admins can see the audit log" };
    return await listAudit(ctx.workspaceId, cleanFilter(filter), typeof cursor === "string" ? cursor : null);
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
