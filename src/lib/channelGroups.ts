import "server-only";
import { adminClient } from "./supabase/server";
import { listChannels } from "./channels";
import { mayUseBrand } from "./brands";
import { groupBrand, groupName, type ChannelGroup } from "./groupRules";

// Saved channel groups (024_channel_groups.sql). Rules in groupRules.ts.

const COLUMNS = "id, name, brand_id, channel_ids";

/** The workspace's groups this person may use (their brands only), oldest first. */
export async function listGroups(workspaceId: string, brandIds: string[] | null): Promise<ChannelGroup[]> {
  const { data, error } = await adminClient().from("channel_groups").select(COLUMNS).eq("workspace_id", workspaceId).order("created_at");
  if (error) throw new Error(error.message);
  return ((data ?? []) as ChannelGroup[]).filter((g) => mayUseBrand({ brandIds }, g.brand_id));
}

export async function createGroup(workspaceId: string, userId: string, brandIds: string[] | null, name: unknown, channelIds: string[]): Promise<ChannelGroup> {
  const n = groupName(name);
  const ids = [...new Set(channelIds)].slice(0, 60);
  const brand = groupBrand(ids, await listChannels(workspaceId));
  if (!mayUseBrand({ brandIds }, brand)) throw new Error("You can't use this brand's channels");
  const { data, error } = await adminClient().from("channel_groups").insert({ workspace_id: workspaceId, brand_id: brand, name: n, channel_ids: ids, created_by: userId }).select(COLUMNS).single();
  if (error) throw new Error(error.message);
  return data as ChannelGroup;
}

export async function deleteGroup(workspaceId: string, brandIds: string[] | null, id: string) {
  const db = adminClient();
  const { data } = await db.from("channel_groups").select("brand_id").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (!data) return;
  if (!mayUseBrand({ brandIds }, data.brand_id as string | null)) throw new Error("You can't change this brand's groups");
  const { error } = await db.from("channel_groups").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}
