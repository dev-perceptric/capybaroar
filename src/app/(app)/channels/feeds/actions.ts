"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { writerCtx } from "@/lib/session";
import { mayUseBrand } from "@/lib/brands";
import { addFeed, deleteFeed, updateFeed } from "@/lib/feeds";

type Input = { url: string; channelIds: string[]; template: string; mode: "draft" | "queue" };

const fail = (e: unknown) => {
  unstable_rethrow(e);
  return { error: e instanceof Error ? e.message : String(e) };
};

export async function createFeed(brandId: string, input: Input): Promise<{ error?: string }> {
  try {
    const ctx = await writerCtx();
    if (!mayUseBrand(ctx, brandId)) return { error: "You can't post to this brand" };
    await addFeed(ctx.workspaceId, ctx.userId, brandId, input);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/channels/feeds");
  revalidatePath("/calendar");
  return {};
}

export async function editFeed(id: string, patch: Partial<Input> & { active?: boolean }): Promise<{ error?: string }> {
  try {
    const ctx = await writerCtx();
    await updateFeed(ctx.workspaceId, id, ctx.brandIds, patch);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/channels/feeds");
  return {};
}

export async function removeFeed(id: string): Promise<{ error?: string }> {
  try {
    const ctx = await writerCtx();
    await deleteFeed(ctx.workspaceId, id, ctx.brandIds);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/channels/feeds");
  return {};
}
