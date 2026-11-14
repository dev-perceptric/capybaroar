"use server";

import { unstable_rethrow } from "next/navigation";
import { getCtx } from "@/lib/session";
import { lastExports, startExport } from "@/lib/exports";
import { ExportRefused, type ExportView } from "@/lib/exportRules";

export type Exports = { account: ExportView | null; workspace: ExportView | null };

const fail = (e: unknown) => {
  unstable_rethrow(e);
  if (e instanceof ExportRefused) return { error: e.message };
  console.error("export:", e instanceof Error ? e.message : e);
  return { error: "Couldn't reach the export. Try again." };
};

/** "Download my data" (anyone) or "Export workspace" (owners). A job builds it and emails the link. */
export async function requestExport(kind: "account" | "workspace"): Promise<{ error?: string; exports?: Exports }> {
  try {
    const ctx = await getCtx();
    if (kind !== "account" && kind !== "workspace") return { error: "Unknown export" };
    if (kind === "workspace" && ctx.role !== "owner") return { error: "Only owners can export the workspace" };
    await startExport(ctx.userId, kind, kind === "workspace" ? ctx.workspaceId : null);
    return { exports: await lastExports(ctx.userId, ctx.workspaceId, ctx.role === "owner") };
  } catch (e) {
    return fail(e);
  }
}

/** The status lines, while an export is being made. */
export async function exportStatus(): Promise<{ error?: string; exports?: Exports }> {
  try {
    const ctx = await getCtx();
    return { exports: await lastExports(ctx.userId, ctx.workspaceId, ctx.role === "owner") };
  } catch (e) {
    return fail(e);
  }
}
