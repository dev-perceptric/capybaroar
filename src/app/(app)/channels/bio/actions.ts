"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { writerCtx } from "@/lib/session";
import { mayUseBrand } from "@/lib/brands";
import { adminClient } from "@/lib/supabase/server";
import { deleteBioPage, getBioPage, saveBioPage, type BioInput } from "@/lib/bio";

const fail = (e: unknown) => {
  unstable_rethrow(e);
  return { error: e instanceof Error ? e.message : String(e) };
};

async function brandCtx(brandId: string) {
  const ctx = await writerCtx();
  const { data } = await adminClient().from("brands").select("id").eq("id", brandId).eq("workspace_id", ctx.workspaceId).maybeSingle();
  if (!data || !mayUseBrand(ctx, brandId)) throw new Error("Brand not found");
  return ctx;
}

export async function saveBio(brandId: string, input: BioInput): Promise<{ error?: string }> {
  try {
    const ctx = await brandCtx(brandId);
    const before = await getBioPage(ctx.workspaceId, brandId);
    const page = await saveBioPage(ctx.workspaceId, brandId, input);
    // The public page is kept for a minute; make it fresh now, at the old address too.
    revalidatePath(`/b/${page.slug}`);
    if (before && before.slug !== page.slug) revalidatePath(`/b/${before.slug}`);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/channels/bio");
  return {};
}

export async function removeBio(brandId: string): Promise<{ error?: string }> {
  try {
    const ctx = await brandCtx(brandId);
    const before = await getBioPage(ctx.workspaceId, brandId);
    await deleteBioPage(ctx.workspaceId, brandId);
    if (before) revalidatePath(`/b/${before.slug}`);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/channels/bio");
  return {};
}
