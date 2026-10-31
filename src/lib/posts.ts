import "server-only";
import { adminClient } from "./supabase/server";
import { cancelPostJobs, enqueue } from "./jobs";
import { mediaInfo } from "./media";
import { listChannels } from "./channels";
import { providerOf } from "./providers";
import { networkOf, type NetworkId } from "./networks";

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "partial" | "failed";
export type TargetRow = { id: string; channel_id: string; status: "pending" | "publishing" | "published" | "failed"; url: string | null; error: string | null };
export type PostRow = { id: string; text: string; media_ids: string[]; status: PostStatus; publish_at: string | null; post_targets: TargetRow[] };

export async function postsBetween(workspaceId: string, from: Date, to: Date): Promise<PostRow[]> {
  const { data, error } = await adminClient()
    .from("posts")
    .select("id, text, media_ids, status, publish_at, post_targets(id, channel_id, status, url, error)")
    .eq("workspace_id", workspaceId)
    .gte("publish_at", from.toISOString())
    .lt("publish_at", to.toISOString())
    .order("publish_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as PostRow[];
}

export type SaveInput = { id?: string; text: string; channelIds: string[]; mediaIds: string[]; publishAt: string | null; mode: "draft" | "schedule" };

/** Save a draft or schedule a post. Scheduling checks every channel first and queues one job per channel. */
export async function savePost(workspaceId: string, userId: string, input: SaveInput): Promise<{ id: string }> {
  const text = input.text.trim();
  const channels = (await listChannels(workspaceId)).filter((c) => input.channelIds.includes(c.id));
  if (input.mode === "schedule") {
    if (!channels.length) throw new Error("Pick at least one channel");
    if (!text && !input.mediaIds.length) throw new Error("Write something or add media");
    if (!input.publishAt) throw new Error("Pick a time");
    if (new Date(input.publishAt).getTime() < Date.now() - 60000) throw new Error("Pick a time in the future");
    const media = await mediaInfo(workspaceId, input.mediaIds);
    for (const c of channels) {
      const n = networkOf(c.network as NetworkId);
      if (text.length > n.limit) throw new Error(`${n.name} posts are up to ${n.limit.toLocaleString("en-US")} characters`);
      const reason = providerOf(c.network)?.check?.({ text, media });
      if (reason) throw new Error(`${c.name}: ${reason}`);
      if (c.status === "reconnect") throw new Error(`Reconnect ${c.name} first`);
    }
  }
  const db = adminClient();
  const row = { workspace_id: workspaceId, text, media_ids: input.mediaIds, status: input.mode === "schedule" ? "scheduled" : "draft", publish_at: input.publishAt, updated_at: new Date().toISOString() };
  let id = input.id;
  if (id) {
    const { data: cur } = await db.from("posts").select("status").eq("id", id).eq("workspace_id", workspaceId).single();
    if (!cur) throw new Error("Post not found");
    if (cur.status !== "draft" && cur.status !== "scheduled" && cur.status !== "failed") throw new Error("This post already went out");
    await cancelPostJobs(id);
    const { error } = await db.from("posts").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    await db.from("post_targets").delete().eq("post_id", id).neq("status", "published");
  } else {
    const { data, error } = await db.from("posts").insert({ ...row, created_by: userId }).select("id").single();
    if (error) throw new Error(error.message);
    id = data.id as string;
  }
  if (channels.length) {
    const { data: targets, error } = await db
      .from("post_targets")
      .upsert(channels.map((c) => ({ post_id: id, workspace_id: workspaceId, channel_id: c.id, status: "pending" })), { onConflict: "post_id,channel_id", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(error.message);
    if (input.mode === "schedule") for (const t of targets ?? []) await enqueue("publish", { postId: id, targetId: t.id }, new Date(input.publishAt!));
  }
  return { id: id! };
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
