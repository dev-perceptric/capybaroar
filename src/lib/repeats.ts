import "server-only";
import { adminClient } from "./supabase/server";
import { duplicatePost, memberActor } from "./posts";
import { isRepeat, nextRepeat } from "./repeat";

// Repeating posts (044_tags_repeat.sql; times in repeat.ts). When a repeating post is done going out, its next copy is
// scheduled and takes the repeat over, so the newest copy always holds it.
// - Taking the repeat off the post is the claim: however many workers settle it at once, one makes the copy.
// - The copy is made as the person who wrote the post, so approvals, limits and brands apply. If it can't be
//   scheduled (the month's posts used up), it's saved as a draft that still repeats, for someone to place.
// - It stops when that person left the workspace, or someone turns the repeat off.

const DONE = ["published", "partial", "failed"];

export async function repeatAfter(postId: string) {
  const db = adminClient();
  const { data: p } = await db.from("posts").select("id, workspace_id, status, repeat, publish_at, created_by, brand_id").eq("id", postId).maybeSingle();
  if (!p || !isRepeat(p.repeat) || !DONE.includes(p.status as string) || !p.publish_at) return;
  const { data: won } = await db.from("posts").update({ repeat: null }).eq("id", postId).eq("repeat", p.repeat).select("id").maybeSingle();
  if (!won) return;
  const workspaceId = p.workspace_id as string;
  const userId = (p.created_by as string | null) ?? null;
  const actor = userId ? await memberActor(workspaceId, userId, (p.brand_id as string | null) ?? null) : null;
  if (!actor || !userId) return;
  const { data: ws } = await db.from("workspaces").select("timezone").eq("id", workspaceId).single();
  const at = nextRepeat(new Date(p.publish_at as string), p.repeat, (ws?.timezone as string | undefined) ?? "UTC");
  try {
    await duplicatePost(workspaceId, userId, postId, actor, "schedule", { at, repeat: p.repeat });
  } catch {
    await duplicatePost(workspaceId, userId, postId, actor, "draft", { at, repeat: p.repeat });
  }
}
