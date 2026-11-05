"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { writerCtx } from "@/lib/session";
import { mayUseBrand } from "@/lib/brands";
import { adminClient } from "@/lib/supabase/server";
import { bioStats, createBioPage, deleteBioPage, saveBioPage, slugTaken, type BioDraft, type BioNumbers, type BioPage } from "@/lib/bio";
import { buildBioDraft, type BuildAnswer } from "@/lib/bioBuild";

const fail = (e: unknown) => {
  unstable_rethrow(e);
  return { error: e instanceof Error ? e.message : String(e) };
};

/** The writer's context, when this brand is in their workspace and theirs to use. */
async function brandCtx(brandId: string) {
  const ctx = await writerCtx();
  const { data } = await adminClient().from("brands").select("id, name").eq("id", brandId).eq("workspace_id", ctx.workspaceId).maybeSingle();
  if (!data || !mayUseBrand(ctx, brandId)) throw new Error("Brand not found");
  return { ctx, brand: { id: data.id as string, name: data.name as string } };
}

export async function createBio(brandId: string): Promise<{ error?: string; page?: BioPage }> {
  try {
    const { ctx, brand } = await brandCtx(brandId);
    const page = await createBioPage(ctx.workspaceId, brand);
    revalidatePath("/bio");
    return { page };
  } catch (e) {
    return fail(e);
  }
}

export async function saveBio(brandId: string, draft: BioDraft): Promise<{ error?: string; page?: BioPage }> {
  try {
    const { ctx } = await brandCtx(brandId);
    const page = await saveBioPage(ctx.workspaceId, brandId, draft);
    revalidatePath("/bio");
    return { page };
  } catch (e) {
    return fail(e);
  }
}

export async function removeBio(brandId: string): Promise<{ error?: string }> {
  try {
    const { ctx } = await brandCtx(brandId);
    await deleteBioPage(ctx.workspaceId, brandId);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/bio");
  return {};
}

/** Why an address can't be used for this brand's page, or null when it's free. */
export async function checkSlug(brandId: string, slug: string): Promise<{ error?: string; problem?: string | null }> {
  try {
    const { ctx } = await brandCtx(brandId);
    return { problem: await slugTaken(ctx.workspaceId, brandId, String(slug).trim().toLowerCase()) };
  } catch (e) {
    return fail(e);
  }
}

export async function loadBioStats(brandId: string, days: number): Promise<{ error?: string; stats?: BioNumbers }> {
  try {
    const { ctx } = await brandCtx(brandId);
    return { stats: await bioStats(ctx.workspaceId, brandId, [7, 30, 90].includes(days) ? days : 30) };
  } catch (e) {
    return fail(e);
  }
}

/** A page draft from Claude (Build with AI). Nothing is saved: the editor shows it to keep or discard. */
export async function buildBio(brandId: string, input: { about: string; website: string; include: string[] }): Promise<{ error?: string; draft?: BuildAnswer }> {
  try {
    const { ctx, brand } = await brandCtx(brandId);
    return { draft: await buildBioDraft(ctx.workspaceId, ctx.userId, brand, input) };
  } catch (e) {
    return fail(e);
  }
}
