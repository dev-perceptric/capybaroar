"use server";

import { revalidatePath } from "next/cache";
import { brandForReview } from "@/lib/brands";
import { approvePost, rejectPost } from "@/lib/posts";

/** Approve or reject a post from a brand's review link (no sign-in; the link is the key). */
export async function decide(token: string, postId: string, ok: boolean, comment = ""): Promise<{ error?: string }> {
  const brand = await brandForReview(token);
  if (!brand) return { error: "This review link was turned off" };
  const by = { userId: null, name: "Review link", brandIds: [brand.id] };
  try {
    if (ok) await approvePost(brand.workspaceId, postId, by);
    else await rejectPost(brand.workspaceId, postId, by, comment);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath(`/review/${token}`);
  return {};
}
