"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getBrandCtx, homeBrand } from "@/lib/brands";
import type { BulkResult } from "@/lib/importer";

// Bulk upload on the calendar: a CSV file or a stack of pictures and videos. Saving goes through savePost.

const fail = (e: unknown) => {
  unstable_rethrow(e);
  return { error: e instanceof Error ? e.message : String(e) };
};

const writer = async () => {
  const b = await getBrandCtx();
  if (b.role === "client") throw new Error("Clients can only approve or reject posts");
  return { b, actor: { role: b.role, brandIds: b.brandIds, brandId: homeBrand(b) } };
};

/** The workspace time zone, which CSV dates are read in. */
export async function bulkZone(): Promise<string> {
  const { b } = await writer();
  return b.timezone;
}

/** Before scheduling `n` posts at once: an error when the plan can't hold them. */
export async function bulkCheck(n: number): Promise<{ error?: string }> {
  const { checkRoom } = await import("@/lib/importer");
  try {
    const { b } = await writer();
    await checkRoom(b.workspaceId, n);
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function bulkCsv(csv: string, lines: number[], mode: "draft" | "schedule"): Promise<{ error?: string; results?: BulkResult[] }> {
  const { saveCsvRows } = await import("@/lib/importer");
  try {
    const { b, actor } = await writer();
    const results = await saveCsvRows(b.workspaceId, b.userId, actor, b.scope, csv, lines, mode === "schedule" ? "schedule" : "draft");
    revalidatePath("/media");
    return { results };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkTimes(n: number, how: "queue" | "daily", time: string): Promise<{ error?: string; times?: string[] }> {
  const { spreadTimes } = await import("@/lib/importer");
  try {
    const { b } = await writer();
    return { times: await spreadTimes(b.workspaceId, n, how === "daily" ? "daily" : "queue", time) };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkMedia(items: { key: string; mediaId: string; text: string; at: string }[], channelIds: string[], mode: "draft" | "schedule"): Promise<{ error?: string; results?: BulkResult[] }> {
  const { saveMediaPosts } = await import("@/lib/importer");
  try {
    const { b, actor } = await writer();
    return { results: await saveMediaPosts(b.workspaceId, b.userId, actor, items, channelIds, mode === "schedule" ? "schedule" : "draft") };
  } catch (e) {
    return fail(e);
  }
}

export async function bulkCaption(mediaId: string, notes: string, network: string | null): Promise<{ error?: string; text?: string }> {
  const { caption } = await import("@/lib/composer");
  try {
    const { b } = await writer();
    return { text: await caption({ workspaceId: b.workspaceId, userId: b.userId, brandId: homeBrand(b) }, mediaId, notes, (network as never) ?? null) };
  } catch (e) {
    return fail(e);
  }
}
