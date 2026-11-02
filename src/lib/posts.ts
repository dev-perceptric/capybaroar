import "server-only";
import { adminClient } from "./supabase/server";
import { cancelPostJobs, enqueue } from "./jobs";
import { mediaInfo } from "./media";
import { listChannels } from "./channels";
import { providerOf } from "./providers";
import { networkOf, type NetworkId } from "./networks";
import { nextQueueSlot, type Slot } from "./queue";
import { assertCanSchedule } from "./billing";

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "partial" | "failed";
export type TargetRow = {
  id: string;
  channel_id: string;
  status: "pending" | "publishing" | "published" | "failed";
  text: string | null;
  settings: Record<string, string>;
  url: string | null;
  error: string | null;
  note: string | null;
};
export type PostRow = { id: string; text: string; media_ids: string[]; status: PostStatus; publish_at: string | null; post_targets: TargetRow[] };

const COLS = "id, text, media_ids, status, publish_at, post_targets(id, channel_id, status, text, settings, url, error, note)";

export async function postsBetween(workspaceId: string, from: Date, to: Date): Promise<PostRow[]> {
  const { data, error } = await adminClient().from("posts").select(COLS).eq("workspace_id", workspaceId).gte("publish_at", from.toISOString()).lt("publish_at", to.toISOString()).order("publish_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as PostRow[];
}

/** Posts around now, for the calendar's opening week. The grid is drawn in the viewer's time zone, which the server
 * doesn't know, so this covers any zone's current week: it starts at most 7 days back and ends at most 7 days ahead. */
export async function postsAroundNow(workspaceId: string) {
  const now = Date.now();
  const from = new Date(now - 8 * 86400000);
  const to = new Date(now + 8 * 86400000);
  return { from: from.toISOString(), to: to.toISOString(), posts: await postsBetween(workspaceId, from, to) };
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
};

const EDITABLE: PostStatus[] = ["draft", "scheduled", "failed"];

/** Everything that would stop this post going out, checked per channel before anything is saved. */
async function validate(workspaceId: string, input: SaveInput, publishAt: Date) {
  const coverIds = input.targets.map((t) => t.settings.cover).filter(Boolean);
  const [channels, all] = await Promise.all([listChannels(workspaceId), mediaInfo(workspaceId, [...new Set([...input.mediaIds, ...coverIds])])]);
  const byId = new Map(channels.map((c) => [c.id, c]));
  if (!input.targets.length) throw new Error("Pick at least one channel");
  if (publishAt.getTime() < Date.now() - 60000) throw new Error("Pick a time in the future");
  const media = input.mediaIds.map((id) => all.find((m) => m.id === id)).filter((m) => m !== undefined);
  if (media.length !== input.mediaIds.length) throw new Error("A file in this post was deleted");
  for (const t of input.targets) {
    const c = byId.get(t.channelId);
    if (!c) throw new Error("A channel in this post was removed");
    if (c.status === "reconnect") throw new Error(`Reconnect ${c.name} first`);
    const n = networkOf(c.network as NetworkId);
    const text = (t.text ?? input.text).trim();
    if (!text && !media.length) throw new Error(`${c.name}: write something or add media`);
    if ([...text].length > n.limit) throw new Error(`${c.name}: ${n.name} posts are up to ${n.limit.toLocaleString("en-US")} characters`);
    for (const f of n.fields ?? []) if (f.required && !t.settings[f.key]?.trim()) throw new Error(`${c.name}: ${f.label} is required`);
    const cover = t.settings.cover ? (all.find((m) => m.id === t.settings.cover) ?? null) : null;
    const reason = providerOf(c.network)?.check?.({ text, media, settings: t.settings, cover });
    if (reason) throw new Error(`${c.name}: ${reason}`);
  }
}

async function queueTime(workspaceId: string): Promise<Date> {
  const db = adminClient();
  const { data: ws } = await db.from("workspaces").select("queue, timezone").eq("id", workspaceId).single();
  const slots = (ws?.queue ?? []) as Slot[];
  if (!slots.length) throw new Error("Add time slots to your queue in Settings first");
  const { data: taken } = await db.from("posts").select("publish_at").eq("workspace_id", workspaceId).in("status", ["scheduled", "publishing"]).gte("publish_at", new Date().toISOString());
  const at = nextQueueSlot(slots, ws!.timezone as string, new Set((taken ?? []).map((p) => new Date(p.publish_at as string).getTime())));
  if (!at) throw new Error("No free slot in the next 8 weeks");
  return at;
}

/** Save a draft or send a post out. Sending checks every channel first and queues one job per channel. */
export async function savePost(workspaceId: string, userId: string, input: SaveInput): Promise<{ id: string; publishAt: string | null }> {
  const sending = input.mode !== "draft";
  if (sending) await assertCanSchedule(workspaceId, input.id);
  const at = input.mode === "now" ? new Date() : input.mode === "queue" ? await queueTime(workspaceId) : input.publishAt ? new Date(input.publishAt) : null;
  if (sending) {
    if (!at) throw new Error("Pick a time");
    await validate(workspaceId, input, input.mode === "now" ? new Date(Date.now() + 60000) : at);
  }
  const db = adminClient();
  const row = { workspace_id: workspaceId, text: input.text.trim(), media_ids: input.mediaIds, status: sending ? "scheduled" : "draft", publish_at: at?.toISOString() ?? null, updated_at: new Date().toISOString() };
  let id = input.id;
  if (id) {
    const { data: cur } = await db.from("posts").select("status").eq("id", id).eq("workspace_id", workspaceId).single();
    if (!cur) throw new Error("Post not found");
    if (!EDITABLE.includes(cur.status as PostStatus)) throw new Error("This post already went out");
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
    if (sending) for (const t of targets ?? []) await enqueue("publish", { postId: id, targetId: t.id }, at!);
  }
  return { id: id!, publishAt: at?.toISOString() ?? null };
}

/** Move a draft or scheduled post to a new time (drag on the calendar). */
export async function reschedulePost(workspaceId: string, id: string, publishAt: Date) {
  const db = adminClient();
  const { data: cur } = await db.from("posts").select("status").eq("id", id).eq("workspace_id", workspaceId).single();
  if (!cur || !EDITABLE.includes(cur.status as PostStatus)) throw new Error("This post can't move");
  if (cur.status !== "draft" && publishAt.getTime() < Date.now()) throw new Error("Pick a time in the future");
  await cancelPostJobs(id);
  const status = cur.status === "draft" ? "draft" : "scheduled";
  const { error } = await db.from("posts").update({ publish_at: publishAt.toISOString(), status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  if (status === "scheduled") {
    await db.from("post_targets").update({ status: "pending", error: null }).eq("post_id", id).eq("status", "failed");
    const { data: targets } = await db.from("post_targets").select("id").eq("post_id", id).eq("status", "pending");
    for (const t of targets ?? []) await enqueue("publish", { postId: id, targetId: t.id }, publishAt);
  }
}

/** Copy a post as a draft, a day later. */
export async function duplicatePost(workspaceId: string, userId: string, id: string): Promise<{ id: string }> {
  const db = adminClient();
  const { data: p } = await db.from("posts").select(COLS).eq("id", id).eq("workspace_id", workspaceId).single();
  if (!p) throw new Error("Post not found");
  const src = p as PostRow;
  const base = src.publish_at ? new Date(src.publish_at) : new Date();
  const at = new Date(Math.max(base.getTime(), Date.now()) + 86400000);
  return savePost(workspaceId, userId, {
    text: src.text,
    mediaIds: src.media_ids,
    targets: src.post_targets.map((t) => ({ channelId: t.channel_id, text: t.text, settings: t.settings ?? {} })),
    publishAt: at.toISOString(),
    mode: "draft",
  });
}

export async function deletePost(workspaceId: string, id: string) {
  await cancelPostJobs(id);
  const { error } = await adminClient().from("posts").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

/** A post's status follows its channels: all out, some out, or all failed. */
export async function settlePost(postId: string) {
  const db = adminClient();
  const { data } = await db.from("post_targets").select("status").eq("post_id", postId);
  const s = (data ?? []).map((t) => t.status as string);
  if (!s.length || s.some((x) => x === "pending" || x === "publishing")) return;
  const status = s.every((x) => x === "published") ? "published" : s.some((x) => x === "published") ? "partial" : "failed";
  await db.from("posts").update({ status, updated_at: new Date().toISOString() }).eq("id", postId);
}
