import "server-only";
import { adminClient } from "./supabase/server";
import { duplicatePost, memberActor } from "./posts";
import { EVERGREEN_WEEKS, runEvergreen, WEEK_MS, type EvergreenRow, type EvergreenStore } from "./evergreen";

// Evergreen: a published post that goes out again every few weeks, as a copy in the queue (src/lib/evergreen.ts has
// the rules). The copy is made by duplicatePost as the person who turned it on, so approvals and limits apply.

export type Evergreen = { everyWeeks: number; nextAt: string; lastAt: string | null; error: string | null };

const REPOSTABLE = ["published", "partial"];

export async function getEvergreen(workspaceId: string, postId: string): Promise<Evergreen | null> {
  const { data } = await adminClient().from("evergreen").select("every_weeks, next_at, last_at, error").eq("post_id", postId).eq("workspace_id", workspaceId).maybeSingle();
  return data ? { everyWeeks: data.every_weeks as number, nextAt: data.next_at as string, lastAt: (data.last_at as string | null) ?? null, error: (data.error as string | null) ?? null } : null;
}

/** Turn evergreen on (every `weeks` weeks, the first copy a period from now) or off (null). */
export async function setEvergreen(workspaceId: string, userId: string, postId: string, weeks: number | null): Promise<Evergreen | null> {
  const db = adminClient();
  if (weeks == null) {
    const { error } = await db.from("evergreen").delete().eq("post_id", postId).eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return null;
  }
  if (!(EVERGREEN_WEEKS as readonly number[]).includes(weeks)) throw new Error("Pick how often");
  const { data: p } = await db.from("posts").select("status").eq("id", postId).eq("workspace_id", workspaceId).maybeSingle();
  if (!p) throw new Error("Post not found");
  if (!REPOSTABLE.includes(p.status as string)) throw new Error("Only published posts can be evergreen");
  const nextAt = new Date(Date.now() + weeks * WEEK_MS).toISOString();
  const { error } = await db.from("evergreen").upsert({ post_id: postId, workspace_id: workspaceId, every_weeks: weeks, next_at: nextAt, created_by: userId, error: null });
  if (error) throw new Error(error.message);
  return getEvergreen(workspaceId, postId);
}

export const evergreenStore: EvergreenStore = {
  async due(now, n) {
    const { data, error } = await adminClient().from("evergreen").select("post_id, workspace_id, every_weeks, next_at, created_by").lte("next_at", now.toISOString()).order("next_at").limit(n);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ postId: r.post_id as string, workspaceId: r.workspace_id as string, everyWeeks: r.every_weeks as number, nextAt: r.next_at as string, createdBy: (r.created_by as string | null) ?? null }));
  },
  async claim(postId, from, to) {
    const { data } = await adminClient().from("evergreen").update({ next_at: to }).eq("post_id", postId).eq("next_at", from).select("post_id").maybeSingle();
    return !!data;
  },
  async repost(row: EvergreenRow) {
    const db = adminClient();
    const { data: p } = await db.from("posts").select("brand_id, status").eq("id", row.postId).maybeSingle();
    // A post deleted on the networks stops repeating.
    if (!p || p.status === "deleted") {
      await db.from("evergreen").delete().eq("post_id", row.postId);
      throw new Error("The post was deleted, so it no longer repeats");
    }
    const actor = await memberActor(row.workspaceId, row.createdBy, (p?.brand_id as string | null) ?? null);
    if (!actor || !row.createdBy) throw new Error("The person who turned this on left the workspace");
    try {
      return (await duplicatePost(row.workspaceId, row.createdBy, row.postId, actor, "queue")).id;
    } catch (e) {
      // No free slot or the month's posts used up: a draft keeps the copy for someone to place.
      await duplicatePost(row.workspaceId, row.createdBy, row.postId, actor, "draft");
      throw new Error(`Saved as a draft: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
  async done(postId, copyId, error, at) {
    await adminClient()
      .from("evergreen")
      .update({ last_at: at.toISOString(), error, ...(copyId ? { last_post_id: copyId } : {}) })
      .eq("post_id", postId);
  },
};

export const runEvergreenDue = () => runEvergreen(evergreenStore);
