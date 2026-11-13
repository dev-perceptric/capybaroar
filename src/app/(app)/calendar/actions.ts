"use server";

import { unstable_rethrow } from "next/navigation";
import { canApprove, getCtx, writerCtx } from "@/lib/session";
import { getBrandCtx, homeBrand } from "@/lib/brands";
import { approvePost, assertPostAccess, deletePost, duplicatePost, listComments, postResults, postsBetween, rejectPost, reschedulePost, savePost, type PostStatus, type SaveInput } from "@/lib/posts";
import { listMedia, setAlt } from "@/lib/media";
import type { ChannelResult, PlanItem } from "@/lib/unpublisher";

const fail = (e: unknown) => {
  unstable_rethrow(e); // a signed-out visitor still goes to sign in
  return { error: e instanceof Error ? e.message : String(e) };
};

/** The person saving, for approval and brand checks. */
const actor = async () => {
  const b = await getBrandCtx();
  if (b.role === "client") throw new Error("Clients can only approve or reject posts");
  return { ctx: b, actor: { role: b.role, brandIds: b.brandIds, brandId: homeBrand(b) } };
};

export async function loadPosts(from: string, to: string) {
  const b = await getBrandCtx();
  return postsBetween(b.workspaceId, new Date(from), new Date(to), b.scope);
}

export async function save(input: SaveInput): Promise<{ error?: string; id?: string; publishAt?: string | null; status?: PostStatus }> {
  try {
    const { ctx, actor: a } = await actor();
    return await savePost(ctx.workspaceId, ctx.userId, input, a);
  } catch (e) {
    return fail(e);
  }
}

export async function move(id: string, publishAt: string): Promise<{ error?: string }> {
  try {
    const ctx = await writerCtx();
    await assertPostAccess(ctx.workspaceId, id, ctx.brandIds);
    await reschedulePost(ctx.workspaceId, id, new Date(publishAt));
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function duplicate(id: string): Promise<{ error?: string; id?: string }> {
  try {
    const { ctx, actor: a } = await actor();
    await assertPostAccess(ctx.workspaceId, id, ctx.brandIds);
    return await duplicatePost(ctx.workspaceId, ctx.userId, id, a);
  } catch (e) {
    return fail(e);
  }
}

export async function remove(id: string): Promise<{ error?: string }> {
  try {
    const ctx = await writerCtx();
    await assertPostAccess(ctx.workspaceId, id, ctx.brandIds);
    await deletePost(ctx.workspaceId, id);
    return {};
  } catch (e) {
    return fail(e);
  }
}

/** The channels a published post went out on, for the delete dialog. */
export async function deletePlan(id: string): Promise<{ error?: string; items?: PlanItem[] }> {
  const { unpublishPlan } = await import("@/lib/unpublish");
  try {
    const ctx = await writerCtx();
    return { items: await unpublishPlan(ctx.workspaceId, id, ctx) };
  } catch (e) {
    return fail(e);
  }
}

/** Delete a published post on these channels. The post stays, as deleted once every channel is. */
export async function deleteEverywhere(id: string, channelIds: string[]): Promise<{ error?: string; results?: ChannelResult[]; postDeleted?: boolean }> {
  const { unpublishPost } = await import("@/lib/unpublish");
  try {
    const ctx = await writerCtx();
    return await unpublishPost(ctx.workspaceId, id, channelIds, ctx);
  } catch (e) {
    return fail(e);
  }
}

export async function editLive(id: string, changes: import("@/lib/editor").EditChange[]): Promise<{ error?: string; results?: import("@/lib/editor").EditResult[] }> {
  const { editPost } = await import("@/lib/edit");
  try {
    const ctx = await writerCtx();
    return { results: await editPost(ctx.workspaceId, id, changes, ctx) };
  } catch (e) {
    return fail(e);
  }
}

export async function loadResults(postId: string) {
  const ctx = await getCtx();
  await assertPostAccess(ctx.workspaceId, postId, ctx.brandIds);
  return postResults(ctx.workspaceId, postId);
}

export async function loadComments(postId: string) {
  const ctx = await getCtx();
  await assertPostAccess(ctx.workspaceId, postId, ctx.brandIds);
  return listComments(ctx.workspaceId, postId);
}

export async function approve(postId: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  if (!canApprove(ctx.role)) return { error: "Only owners, admins and clients can approve" };
  try {
    await approvePost(ctx.workspaceId, postId, { userId: ctx.userId, name: ctx.name, brandIds: ctx.brandIds });
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function reject(postId: string, comment: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  if (!canApprove(ctx.role)) return { error: "Only owners, admins and clients can reject" };
  try {
    await rejectPost(ctx.workspaceId, postId, { userId: ctx.userId, name: ctx.name, brandIds: ctx.brandIds }, comment);
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function loadMedia() {
  const ctx = await getCtx();
  return listMedia(ctx.workspaceId);
}

export async function saveAlt(id: string, alt: string): Promise<{ error?: string }> {
  try {
    const ctx = await writerCtx();
    await setAlt(ctx.workspaceId, id, alt);
    return {};
  } catch (e) {
    return fail(e);
  }
}

/** What the composer needs when it opens, in one trip: the browser sends server actions one at a time. Each part is
 * null when it failed. */
export async function composerData() {
  const ctx = await getCtx();
  const { suggestedTimes } = await import("@/lib/analytics");
  const { listCampaigns } = await import("@/lib/campaigns");
  const [best, media, campaigns] = await Promise.allSettled([suggestedTimes(ctx.workspaceId, ctx.timezone), listMedia(ctx.workspaceId), listCampaigns(ctx.workspaceId, ctx.brandIds)]);
  const { aiReady } = await import("@/lib/generations");
  // Without enough results of its own, the workspace sees each network's popular hours across Capybaroar.
  const own = best.status === "fulfilled" ? best.value : [];
  const popular = own.length ? {} : await import("@/lib/analytics").then((a) => a.popularTimes(ctx.timezone)).catch(() => ({}));
  const { brandKits } = await import("@/lib/brands");
  const kits = await brandKits(ctx.workspaceId)
    .then((all) => Object.fromEntries(Object.entries(all).filter(([id]) => !ctx.brandIds || ctx.brandIds.includes(id))))
    .catch(() => ({}));
  return { best: best.status === "fulfilled" ? best.value : null, popular, kits, media: media.status === "fulfilled" ? media.value : null, campaigns: campaigns.status === "fulfilled" ? campaigns.value : [], ai: aiReady() };
}

/** The workspace's 3 best slots, from its own results (empty until there's enough data). */
export async function bestSlots() {
  const ctx = await getCtx();
  const { suggestedTimes } = await import("@/lib/analytics");
  return suggestedTimes(ctx.workspaceId, ctx.timezone);
}

export async function aiRewrite(text: string, how: string, network: string | null, brandId?: string | null, instruction?: string): Promise<{ error?: string; text?: string }> {
  const { rewrite } = await import("@/lib/composer");
  try {
    const ctx = await writerCtx();
    const b = await getBrandCtx();
    const { getBrandKit, mayUseBrand } = await import("@/lib/brands");
    // The post's brand when the composer knows it, so its kit applies and its credits are used.
    const brand = brandId && mayUseBrand(b, brandId) ? brandId : homeBrand(b);
    const kit = await getBrandKit(ctx.workspaceId, brand);
    return { text: await rewrite({ workspaceId: ctx.workspaceId, userId: ctx.userId, brandId: brand }, text, how as never, (network as never) ?? null, kit, instruction) };
  } catch (e) {
    return fail(e);
  }
}

export async function loadSnippets() {
  const ctx = await getCtx();
  const { listSnippets } = await import("@/lib/composer");
  return listSnippets(ctx.workspaceId);
}

export async function newSnippet(name: string, body: string): Promise<{ error?: string; snippet?: { id: string; name: string; body: string } }> {
  const { addSnippet } = await import("@/lib/composer");
  try {
    const ctx = await writerCtx();
    return { snippet: await addSnippet(ctx.workspaceId, name, body) };
  } catch (e) {
    return fail(e);
  }
}

export async function removeSnippet(id: string): Promise<{ error?: string }> {
  const { deleteSnippet } = await import("@/lib/composer");
  try {
    const ctx = await writerCtx();
    await deleteSnippet(ctx.workspaceId, id);
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function shortLink(url: string): Promise<{ error?: string; url?: string }> {
  const { shorten } = await import("@/lib/composer");
  try {
    const ctx = await writerCtx();
    return { url: await shorten(ctx.workspaceId, url) };
  } catch (e) {
    return fail(e);
  }
}

export async function trim(id: string, start: number, end: number): Promise<{ error?: string; id?: string }> {
  const { trimVideo } = await import("@/lib/composer");
  try {
    const ctx = await writerCtx();
    return { id: await trimVideo(ctx.workspaceId, ctx.userId, id, start, end) };
  } catch (e) {
    return fail(e);
  }
}

/** Saved channel groups for the composer. */
export async function channelGroups() {
  const ctx = await getCtx();
  const { listGroups } = await import("@/lib/channelGroups");
  return listGroups(ctx.workspaceId, ctx.brandIds);
}

export async function saveChannelGroup(name: string, channelIds: string[]): Promise<{ error?: string; group?: import("@/lib/groupRules").ChannelGroup }> {
  try {
    const ctx = await writerCtx();
    const { createGroup } = await import("@/lib/channelGroups");
    return { group: await createGroup(ctx.workspaceId, ctx.userId, ctx.brandIds, name, channelIds) };
  } catch (e) {
    return fail(e);
  }
}

export async function removeChannelGroup(id: string): Promise<{ error?: string }> {
  try {
    const ctx = await writerCtx();
    const { deleteGroup } = await import("@/lib/channelGroups");
    await deleteGroup(ctx.workspaceId, ctx.brandIds, id);
    return {};
  } catch (e) {
    return fail(e);
  }
}

// Campaigns (campaigns.ts): listed with their counts, made from the composer, renamed and deleted from the calendar.

export async function loadCampaigns() {
  const b = await getBrandCtx();
  const { listCampaigns, campaignCounts } = await import("@/lib/campaigns");
  const campaigns = await listCampaigns(b.workspaceId, b.brandIds);
  const counts = await campaignCounts(b.workspaceId, campaigns.map((c) => c.id)).catch(() => ({}) as Record<string, never>);
  return campaigns.map((c) => ({ ...c, counts: counts[c.id] ?? { scheduled: 0, published: 0, failed: 0, drafts: 0, engagements: 0 } }));
}

export async function newCampaign(name: string): Promise<{ error?: string; campaign?: import("@/lib/campaignRules").Campaign }> {
  try {
    const { ctx } = await actor();
    const { createCampaign } = await import("@/lib/campaigns");
    // People who work on some brands make campaigns for their home brand; everyone else's are workspace-wide.
    return { campaign: await createCampaign(ctx.workspaceId, ctx.userId, { name, brandId: ctx.brandIds ? homeBrand(ctx) : null }) };
  } catch (e) {
    return fail(e);
  }
}

export async function renameCampaign(id: string, name: string, tone?: string): Promise<{ error?: string }> {
  try {
    const { ctx } = await actor();
    const { listCampaigns, updateCampaign } = await import("@/lib/campaigns");
    if (!(await listCampaigns(ctx.workspaceId, ctx.brandIds)).some((c) => c.id === id)) throw new Error("Campaign not found");
    await updateCampaign(ctx.workspaceId, id, { name, ...(tone ? { tone } : {}) });
    return {};
  } catch (e) {
    return fail(e);
  }
}

export async function removeCampaign(id: string): Promise<{ error?: string }> {
  try {
    const { ctx } = await actor();
    const { listCampaigns, deleteCampaign } = await import("@/lib/campaigns");
    if (!(await listCampaigns(ctx.workspaceId, ctx.brandIds)).some((c) => c.id === id)) throw new Error("Campaign not found");
    await deleteCampaign(ctx.workspaceId, id);
    return {};
  } catch (e) {
    return fail(e);
  }
}

// AI formats (composer.ts writes, slides.ts draws): a thread, an X poll, a LinkedIn carousel PDF or a TikTok slideshow.
export async function aiFormat(
  kind: "thread" | "poll" | "carousel" | "slideshow",
  text: string,
  network: string | null,
  brandId: string | null,
): Promise<{ error?: string; thread?: string[]; poll?: { question: string; options: string[] }; mediaIds?: string[] }> {
  try {
    const ctx = await writerCtx();
    const b = await getBrandCtx();
    const { getBrandKit, mayUseBrand } = await import("@/lib/brands");
    const brand = brandId && mayUseBrand(b, brandId) ? brandId : homeBrand(b);
    const kit = await getBrandKit(ctx.workspaceId, brand);
    const sp = { workspaceId: ctx.workspaceId, userId: ctx.userId, brandId: brand };
    const c = await import("@/lib/composer");
    if (kind === "thread") return { thread: await c.writeThread(sp, text, (network ?? "x") as never, kit) };
    if (kind === "poll") return { poll: await c.writePoll(sp, text, kit) };
    const slides = await c.writeSlides(sp, text, kind, kit);
    const { adminClient } = await import("@/lib/supabase/server");
    const { data: row } = brand ? await adminClient().from("brands").select("name, color").eq("id", brand).maybeSingle() : { data: null };
    const { ACCENTS, CAROUSEL, SLIDESHOW } = await import("@/lib/formatRules");
    const { slidesJpeg, slidesPdf } = await import("@/lib/slides");
    const { saveMadeFile } = await import("@/lib/media");
    const look = { ...(kind === "carousel" ? CAROUSEL : SLIDESHOW), brand: (row?.name as string | undefined) ?? "", accent: ACCENTS[(row?.color as string | undefined) ?? "gray"] ?? ACCENTS.gray };
    const name = (slides[0].title || "Slides").replace(/[^\w ]+/g, "").trim().slice(0, 60) || "Slides";
    if (kind === "carousel") return { mediaIds: [await saveMadeFile(ctx.workspaceId, ctx.userId, await slidesPdf(slides, look), `${name}.pdf`, "application/pdf")] };
    const jpegs = await slidesJpeg(slides, look);
    const ids: string[] = [];
    for (const [i, j] of jpegs.entries()) ids.push(await saveMadeFile(ctx.workspaceId, ctx.userId, j, `${name} ${i + 1}.jpg`, "image/jpeg"));
    return { mediaIds: ids };
  } catch (e) {
    return fail(e);
  }
}
