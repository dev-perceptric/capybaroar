"use server";

import { unstable_rethrow } from "next/navigation";
import { writerCtx } from "@/lib/session";
import { assertPostAccess } from "@/lib/posts";
import { getEvergreen, setEvergreen, type Evergreen } from "@/lib/repost";

// Evergreen on a published post: it goes out again as a copy in the queue every few weeks.

export async function loadEvergreen(postId: string): Promise<Evergreen | null> {
  const ctx = await writerCtx();
  await assertPostAccess(ctx.workspaceId, postId, ctx.brandIds);
  return getEvergreen(ctx.workspaceId, postId);
}

export async function changeEvergreen(postId: string, weeks: number | null): Promise<{ error?: string; evergreen?: Evergreen | null }> {
  try {
    const ctx = await writerCtx();
    await assertPostAccess(ctx.workspaceId, postId, ctx.brandIds);
    return { evergreen: await setEvergreen(ctx.workspaceId, ctx.userId, postId, weeks) };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
