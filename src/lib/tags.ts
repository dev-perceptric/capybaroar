import "server-only";
import { adminClient } from "./supabase/server";
import { cleanTagIds, cleanTagName, cleanTagTone, nextTagTone, type Tag } from "./tagRules";

// Tags (044_tags_repeat.sql). Rules in tagRules.ts. Tags are the whole workspace's.

const COLS = "id, name, tone, created_at";

export async function listTags(workspaceId: string): Promise<Tag[]> {
  const { data, error } = await adminClient().from("tags").select(COLS).eq("workspace_id", workspaceId).order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Tag[];
}

export async function createTag(workspaceId: string, userId: string, a: { name: unknown; tone?: unknown }): Promise<Tag> {
  const name = cleanTagName(a.name);
  const db = adminClient();
  const { data: all } = await db.from("tags").select("name, tone").eq("workspace_id", workspaceId);
  if ((all ?? []).some((t) => (t.name as string).toLowerCase() === name.toLowerCase())) throw new Error(`There is already a tag called ${name}`);
  const tone = a.tone ? cleanTagTone(a.tone) : nextTagTone((all ?? []).map((t) => t.tone as string));
  const { data, error } = await db.from("tags").insert({ workspace_id: workspaceId, name, tone, created_by: userId }).select(COLS).single();
  if (error) throw new Error(error.message);
  return data as Tag;
}

export async function updateTag(workspaceId: string, id: string, a: { name?: unknown; tone?: unknown }) {
  const patch: Record<string, string> = {};
  if (a.name !== undefined) patch.name = cleanTagName(a.name);
  if (a.tone !== undefined) patch.tone = cleanTagTone(a.tone);
  const { error } = await adminClient().from("tags").update(patch).eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.code === "23505" ? "There is already a tag with that name" : error.message);
}

/** Deletes the tag and takes it off its posts. */
export async function deleteTag(workspaceId: string, id: string) {
  const { error } = await adminClient().rpc("delete_tag", { ws: workspaceId, tag: id });
  if (error) throw new Error(error.message);
}

/** A post's tags, checked to be this workspace's. */
export async function assertTags(workspaceId: string, ids: string[]): Promise<string[]> {
  const clean = cleanTagIds(ids);
  if (!clean.length) return clean;
  const { data } = await adminClient().from("tags").select("id").eq("workspace_id", workspaceId).in("id", clean);
  if ((data ?? []).length !== clean.length) throw new Error("A tag on this post was deleted");
  return clean;
}
