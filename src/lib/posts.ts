import "server-only";
import { adminClient } from "./supabase/server";
import { cancelPostJobs, enqueue } from "./jobs";
import { mediaInfo } from "./media";
import { listChannels } from "./channels";
import { providerOf } from "./providers";
import { isPdfMime, networkOf, type NetworkId, type ThreadPart } from "./networks";
import { cleanThread, partProblem, partSettings, storedThread, threadOf, type StoredPart } from "./thread";
import { nextQueueSlot, type Slot } from "./queue";
import { assertCanSchedule } from "./billing";
import { mayUseBrand } from "./brands";
import { sendReviewMail } from "./alerts";
import { sendsToReview } from "./publisher";
import { emit } from "./webhooks";
import type { Role } from "./session";

/** "deleted": deleted on every channel it went out on (Delete everywhere). Kept for Analytics, off the calendar. */
export type PostStatus = "draft" | "review" | "scheduled" | "publishing" | "published" | "partial" | "failed" | "deleted";
export type TargetRow = {
  id: string;
  channel_id: string;
  status: "pending" | "publishing" | "published" | "failed";
  text: string | null;
  settings: Record<string, string>;
  url: string | null;
  error: string | null;
  note: string | null;
  /** When it was deleted on the network (the status stays "published"). */
  deleted_at: string | null;
  /** A thread's parts after the first that went out on this channel, in order. */
  parts: { id: string; url: string | null }[];
};
/** `thread`: the parts after the first, as stored. */
export type PostRow = { id: string; text: string; media_ids: string[]; thread: StoredPart[]; status: PostStatus; publish_at: string | null; brand_id: string | null; post_targets: TargetRow[] };

const COLS = "id, text, media_ids, thread, status, publish_at, brand_id, post_targets(id, channel_id, status, text, settings, url, error, note, deleted_at, parts)";

/** Posts in a time range; `scope` keeps only these brands' (null: every post). Posts deleted everywhere are left out. */
export async function postsBetween(workspaceId: string, from: Date, to: Date, scope: string[] | null = null): Promise<PostRow[]> {
  if (scope && !scope.length) return [];
  let q = adminClient().from("posts").select(COLS).eq("workspace_id", workspaceId).neq("status", "deleted").gte("publish_at", from.toISOString()).lt("publish_at", to.toISOString());
  if (scope) q = q.in("brand_id", scope);
  const { data, error } = await q.order("publish_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as PostRow[];
}

/** Posts around now, for the calendar's opening week. The grid is drawn in the viewer's time zone, which the server
 * doesn't know, so this covers any zone's current week: it starts at most 7 days back and ends at most 7 days ahead. */
export async function postsAroundNow(workspaceId: string, scope: string[] | null = null) {
  const now = Date.now();
  const from = new Date(now - 8 * 86400000);
  const to = new Date(now + 8 * 86400000);
  return { from: from.toISOString(), to: to.toISOString(), posts: await postsBetween(workspaceId, from, to, scope) };
}

/** One channel's part of a post: its own text (null = the shared text) and the network's settings. */
export type TargetInput = { channelId: string; text: string | null; settings: Record<string, string> };

export type SaveInput = {
  id?: string;
  text: string;
  mediaIds: string[];
  targets: TargetInput[];
  publishAt: string | null;
  /** draft: keep; schedule: at publishAt; now: right away; queue: the next free saved time slot. */
  mode: "draft" | "schedule" | "now" | "queue";
  /** A thread's parts after the first. Networks without threads post the first only. */
  thread?: ThreadPart[];
};

const EDITABLE: PostStatus[] = ["draft", "review", "scheduled", "failed"];

/** Who is saving, when it's a person: their role decides approval, their brands what they may touch. */
export type Actor = { role: Role; brandIds: string[] | null; brandId: string | null };

/** The person behind work done later on their behalf (a feed, an evergreen post), as an actor. Null once they left. */
export async function memberActor(workspaceId: string, userId: string | null, brandId: string | null): Promise<Actor | null> {
  if (!userId) return null;
  const { data } = await adminClient().from("members").select("role, brand_ids").eq("workspace_id", workspaceId).eq("user_id", userId).maybeSingle();
  if (!data || data.role === "client") return null;
  const role = data.role as Role;
  return { role, brandIds: role === "owner" || role === "admin" ? null : ((data.brand_ids as string[] | null) ?? null), brandId };
}

/** Everything that would stop this post going out, checked per channel before anything is saved. */
async function validate(workspaceId: string, input: SaveInput, publishAt: Date, channels: Awaited<ReturnType<typeof listChannels>>) {
  const byId = new Map(channels.map((c) => [c.id, c]));
  if (!input.targets.length) throw new Error("Pick at least one channel");
  if (publishAt.getTime() < Date.now() - 60000) throw new Error("Pick a time in the future");
  const thread = input.thread ?? [];
  const coverIds = input.targets.map((t) => t.settings.cover).filter(Boolean);
  const all = await mediaInfo(workspaceId, [...new Set([...input.mediaIds, ...coverIds, ...thread.flatMap((p) => p.mediaIds)])]);
  const media = input.mediaIds.map((id) => all.find((m) => m.id === id)).filter((m) => m !== undefined);
  if (media.length !== input.mediaIds.length) throw new Error("A file in this post was deleted");
  const partMedia = thread.map((p) => p.mediaIds.map((id) => all.find((m) => m.id === id)).filter((m) => m !== undefined));
  if (partMedia.some((m, i) => m.length !== thread[i].mediaIds.length)) throw new Error("A file in this thread was deleted");
  if ([...media, ...partMedia.flat()].some((m) => m.mime.startsWith("audio/"))) throw new Error("Audio can't go on a post on its own. Use a picture or a video.");
  for (const t of input.targets) {
    const c = byId.get(t.channelId);
    if (!c) throw new Error("A channel in this post was removed");
    if (c.status === "reconnect") throw new Error(`Reconnect ${c.name} first`);
    const n = networkOf(c.network as NetworkId);
    if (!n.documents && [...media, ...partMedia.flat()].some((m) => isPdfMime(m.mime))) throw new Error(`${c.name}: PDFs can only go to LinkedIn`);
    const text = (t.text ?? input.text).trim();
    if (!text && !media.length) throw new Error(`${c.name}: write something or add media`);
    if ([...text].length > n.limit) throw new Error(`${c.name}: ${n.name} posts are up to ${n.limit.toLocaleString("en-US")} characters`);
    for (const f of n.fields ?? []) if (f.required && !t.settings[f.key]?.trim()) throw new Error(`${c.name}: ${f.label} is required`);
    const cover = t.settings.cover ? (all.find((m) => m.id === t.settings.cover) ?? null) : null;
    const reason = providerOf(c.network)?.check?.({ text, media, settings: t.settings, cover });
    if (reason) throw new Error(`${c.name}: ${reason}`);
    if (!n.thread) continue;
    for (const [i, part] of thread.entries()) {
      const why = partProblem(part, i + 2, n.limit, n.name) ?? providerOf(c.network)?.check?.({ text: part.text, media: partMedia[i], settings: partSettings(t.settings) });
      if (why) throw new Error(`${c.name}: ${why.startsWith("Post ") ? why : `post ${i + 2} of the thread: ${why}`}`);
    }
  }
}

/** The next free slot of the workspace's queue. Throws when it has no slots or none is free in 8 weeks. */
export async function queueTime(workspaceId: string): Promise<Date> {
  const db = adminClient();
  const { data: ws } = await db.from("workspaces").select("queue, timezone").eq("id", workspaceId).single();
  const slots = (ws?.queue ?? []) as Slot[];
  if (!slots.length) throw new Error("Add time slots to your queue in Settings first");
  const { data: taken } = await db.from("posts").select("publish_at").eq("workspace_id", workspaceId).in("status", ["scheduled", "publishing"]).gte("publish_at", new Date().toISOString());
  const at = nextQueueSlot(slots, ws!.timezone as string, new Set((taken ?? []).map((p) => new Date(p.publish_at as string).getTime())));
  if (!at) throw new Error("No free slot in the next 8 weeks");
  return at;
}

/**
 * Save a draft or send a post out. Sending checks every channel first and queues one job per channel. A post belongs
 * to its channels' brand. With an `actor`, an editor's post to a brand that needs approval goes to review instead,
 * with no jobs, and the approvers are emailed.
 */
export async function savePost(workspaceId: string, userId: string, input: SaveInput, actor?: Actor): Promise<{ id: string; publishAt: string | null; status: PostStatus }> {
  const sending = input.mode !== "draft";
  input = { ...input, thread: cleanThread(input.thread) };
  const db = adminClient();
  type Cur = { status: PostStatus; brand_id: string | null };
  let cur: Cur | null = null;
  if (input.id) {
    const { data } = await db.from("posts").select("status, brand_id").eq("id", input.id).eq("workspace_id", workspaceId).maybeSingle();
    if (!data || (actor && !mayUseBrand(actor, data.brand_id as string | null))) throw new Error("Post not found");
    cur = data as Cur;
    if (!EDITABLE.includes(cur.status)) throw new Error("This post already went out");
  }
  const channels = await listChannels(workspaceId);
  const brands = [...new Set(input.targets.map((t) => channels.find((c) => c.id === t.channelId)?.brand_id ?? null))];
  if (brands.length > 1) throw new Error("Pick channels from one brand");
  const brandId = input.targets.length ? brands[0] : (cur?.brand_id ?? actor?.brandId ?? null);
  if (actor && !mayUseBrand(actor, brandId)) throw new Error("You can't post to this brand");
  if (sending) await assertCanSchedule(workspaceId, input.id);
  // Sending checks this in validate; a draft checks it here.
  if (!sending && input.mediaIds.length && (await mediaInfo(workspaceId, input.mediaIds)).some((m) => m.mime.startsWith("audio/"))) throw new Error("Audio can't go on a post on its own. Use a picture or a video.");
  const { data: brand } = brandId ? await db.from("brands").select("name, needs_approval").eq("id", brandId).maybeSingle() : { data: null };
  const review = sending && sendsToReview(actor?.role, !!brand?.needs_approval);
  const status: PostStatus = !sending ? "draft" : review ? "review" : "scheduled";
  const at = input.mode === "now" ? new Date() : input.mode === "queue" ? await queueTime(workspaceId) : input.publishAt ? new Date(input.publishAt) : null;
  if (sending) {
    if (!at) throw new Error("Pick a time");
    await validate(workspaceId, input, input.mode === "now" ? new Date(Date.now() + 60000) : at, channels);
  }
  const row = { workspace_id: workspaceId, brand_id: brandId, text: input.text.trim(), media_ids: input.mediaIds, thread: storedThread(input.thread ?? []), status, publish_at: at?.toISOString() ?? null, updated_at: new Date().toISOString(), ...(review ? { submitted_by: userId } : {}) };
  let id = input.id;
  if (id) {
    await cancelPostJobs(id);
    const { error } = await db.from("posts").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    await db.from("post_targets").delete().eq("post_id", id).neq("status", "published");
  } else {
    const { data, error } = await db.from("posts").insert({ ...row, created_by: userId }).select("id").single();
    if (error) throw new Error(error.message);
    id = data.id as string;
  }
  if (input.targets.length) {
    const { data: targets, error } = await db
      .from("post_targets")
      .upsert(
        input.targets.map((t) => ({ post_id: id, workspace_id: workspaceId, channel_id: t.channelId, status: "pending", text: t.text?.trim() ? t.text : null, settings: t.settings })),
        { onConflict: "post_id,channel_id", ignoreDuplicates: true },
      )
      .select("id");
    if (error) throw new Error(error.message);
    if (status === "scheduled") for (const t of targets ?? []) await enqueue("publish", { postId: id, targetId: t.id }, at!);
  }
  if (review && cur?.status !== "review") {
    await sendReviewMail("submitted", { workspaceId, brandId, brandName: (brand?.name as string | undefined) ?? "brand", text: row.text, authorId: userId });
    await emit(workspaceId, "post.in_review", { post_id: id, brand_id: brandId, publish_at: row.publish_at, text: row.text });
  }
  return { id: id!, publishAt: at?.toISOString() ?? null, status };
}

/** One post of this workspace, or null when there is none. */
export async function getPost(workspaceId: string, id: string): Promise<PostRow | null> {
  const { data, error } = await adminClient().from("posts").select(COLS).eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PostRow | null) ?? null;
}

/** Throws unless this person may see the post's brand. */
export async function assertPostAccess(workspaceId: string, id: string, brandIds: string[] | null) {
  if (!brandIds) return;
  const { data } = await adminClient().from("posts").select("brand_id").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (!data || !mayUseBrand({ brandIds }, data.brand_id as string | null)) throw new Error("Post not found");
}

/** Move a draft or scheduled post to a new time (drag on the calendar). */
export async function reschedulePost(workspaceId: string, id: string, publishAt: Date) {
  const db = adminClient();
  const { data: cur } = await db.from("posts").select("status").eq("id", id).eq("workspace_id", workspaceId).single();
  if (!cur || !EDITABLE.includes(cur.status as PostStatus)) throw new Error("This post can't move");
  if (cur.status !== "draft" && publishAt.getTime() < Date.now()) throw new Error("Pick a time in the future");
  await cancelPostJobs(id);
  // Drafts and posts in review keep waiting; the rest are scheduled at the new time.
  const status = cur.status === "draft" || cur.status === "review" ? cur.status : "scheduled";
  const { error } = await db.from("posts").update({ publish_at: publishAt.toISOString(), status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  if (status === "scheduled") {
    await db.from("post_targets").update({ status: "pending", error: null }).eq("post_id", id).eq("status", "failed");
    const { data: targets } = await db.from("post_targets").select("id").eq("post_id", id).eq("status", "pending");
    for (const t of targets ?? []) await enqueue("publish", { postId: id, targetId: t.id }, publishAt);
  }
}

/** Copy a post as a draft a day later, or (`queue`) into the queue's next free slot. */
export async function duplicatePost(workspaceId: string, userId: string, id: string, actor?: Actor, mode: "draft" | "queue" = "draft"): Promise<{ id: string; status: PostStatus }> {
  const db = adminClient();
  const { data: p } = await db.from("posts").select(COLS).eq("id", id).eq("workspace_id", workspaceId).single();
  if (!p) throw new Error("Post not found");
  const src = p as PostRow;
  const base = src.publish_at ? new Date(src.publish_at) : new Date();
  const at = new Date(Math.max(base.getTime(), Date.now()) + 86400000);
  return savePost(workspaceId, userId, {
    text: src.text,
    mediaIds: src.media_ids,
    thread: threadOf(src.thread),
    targets: src.post_targets.map((t) => ({ channelId: t.channel_id, text: t.text, settings: t.settings ?? {} })),
    publishAt: at.toISOString(),
    mode,
  }, actor);
}

export async function deletePost(workspaceId: string, id: string) {
  await cancelPostJobs(id);
  const { error } = await adminClient().from("posts").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

/** A post's status follows its channels: all out, some out, or all failed. A post deleted everywhere stays deleted. */
export async function settlePost(postId: string) {
  const db = adminClient();
  const { data } = await db.from("post_targets").select("status").eq("post_id", postId);
  const s = (data ?? []).map((t) => t.status as string);
  if (!s.length || s.some((x) => x === "pending" || x === "publishing")) return;
  const status = s.every((x) => x === "published") ? "published" : s.some((x) => x === "published") ? "partial" : "failed";
  await db.from("posts").update({ status, updated_at: new Date().toISOString() }).eq("id", postId).neq("status", "deleted");
}

// Approvals

export type Comment = { id: number; author_name: string; kind: "comment" | "approved" | "rejected"; body: string; created_at: string };

export async function listComments(workspaceId: string, postId: string): Promise<Comment[]> {
  const { data, error } = await adminClient().from("post_comments").select("id, author_name, kind, body, created_at").eq("workspace_id", workspaceId).eq("post_id", postId).order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Comment[];
}

/** A brand's posts waiting for approval, soonest first. */
export async function postsInReview(workspaceId: string, brandId: string): Promise<PostRow[]> {
  const { data, error } = await adminClient().from("posts").select(COLS).eq("workspace_id", workspaceId).eq("brand_id", brandId).eq("status", "review").order("publish_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as PostRow[];
}

type Reviewer = { userId: string | null; name: string; brandIds: string[] | null };

async function reviewPost(workspaceId: string, id: string, by: Reviewer) {
  const db = adminClient();
  const { data } = await db.from("posts").select(`${COLS}, created_by, submitted_by`).eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  const p = data as (PostRow & { created_by: string | null; submitted_by: string | null }) | null;
  if (!p || !mayUseBrand(by, p.brand_id)) throw new Error("Post not found");
  if (p.status !== "review") throw new Error("This post isn't waiting for approval");
  const { data: brand } = p.brand_id ? await db.from("brands").select("name").eq("id", p.brand_id).maybeSingle() : { data: null };
  return { p, brandName: (brand?.name as string | undefined) ?? "brand" };
}

/** Approve a post in review: it's scheduled exactly as savePost schedules it (now, when its time has passed). */
export async function approvePost(workspaceId: string, id: string, by: Reviewer) {
  const { p, brandName } = await reviewPost(workspaceId, id, by);
  const at = p.publish_at ? new Date(p.publish_at) : null;
  const late = !at || at.getTime() < Date.now() + 60000;
  await savePost(workspaceId, by.userId ?? p.created_by ?? "", {
    id: p.id,
    text: p.text,
    mediaIds: p.media_ids,
    thread: threadOf(p.thread),
    targets: p.post_targets.map((t) => ({ channelId: t.channel_id, text: t.text, settings: t.settings ?? {} })),
    publishAt: p.publish_at,
    mode: late ? "now" : "schedule",
  });
  await adminClient().from("post_comments").insert({ post_id: p.id, workspace_id: workspaceId, author: by.userId, author_name: by.name, kind: "approved", body: "" });
  await sendReviewMail("approved", { workspaceId, brandId: p.brand_id, brandName, text: p.text, authorId: p.submitted_by ?? p.created_by });
  await emit(workspaceId, "post.approved", { post_id: p.id, brand_id: p.brand_id, approved_by: by.name });
}

/** Send a post in review back to draft, with what should change. */
export async function rejectPost(workspaceId: string, id: string, by: Reviewer, comment: string) {
  const body = comment.trim().slice(0, 2000);
  if (!body) throw new Error("Write what should change");
  const { p, brandName } = await reviewPost(workspaceId, id, by);
  const db = adminClient();
  await cancelPostJobs(p.id);
  const { error } = await db.from("posts").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", p.id).eq("status", "review");
  if (error) throw new Error(error.message);
  const { error: e2 } = await db.from("post_comments").insert({ post_id: p.id, workspace_id: workspaceId, author: by.userId, author_name: by.name, kind: "rejected", body });
  if (e2) throw new Error(e2.message);
  await sendReviewMail("rejected", { workspaceId, brandId: p.brand_id, brandName, text: p.text, authorId: p.submitted_by ?? p.created_by, comment: body });
  await emit(workspaceId, "post.rejected", { post_id: p.id, brand_id: p.brand_id, rejected_by: by.name, comment: body });
}
