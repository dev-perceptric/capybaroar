import "server-only";
import { adminClient } from "./supabase/server";
import { cleanName, cleanTone, countCampaigns, fitsBrand, nextTone, type Campaign, type CampaignCounts } from "./campaignRules";

// Campaigns (028_campaigns.sql). Rules in campaignRules.ts.

const COLS = "id, name, tone, brand_id, created_at";

/** The workspace's campaigns this person may see: the whole workspace's, and their brands' (null: every brand). */
export async function listCampaigns(workspaceId: string, brandIds: string[] | null): Promise<Campaign[]> {
  let q = adminClient().from("campaigns").select(COLS).eq("workspace_id", workspaceId);
  if (brandIds) q = brandIds.length ? q.or(`brand_id.is.null,brand_id.in.(${brandIds.join(",")})`) : q.is("brand_id", null);
  const { data, error } = await q.order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Campaign[];
}

export async function createCampaign(workspaceId: string, userId: string, a: { name: unknown; tone?: unknown; brandId?: string | null }): Promise<Campaign> {
  const name = cleanName(a.name);
  const db = adminClient();
  const { data: all } = await db.from("campaigns").select("name, tone").eq("workspace_id", workspaceId);
  if ((all ?? []).some((c) => (c.name as string).toLowerCase() === name.toLowerCase())) throw new Error(`There is already a campaign called ${name}`);
  const tone = a.tone ? cleanTone(a.tone) : nextTone((all ?? []).map((c) => c.tone as string));
  const { data, error } = await db.from("campaigns").insert({ workspace_id: workspaceId, name, tone, brand_id: a.brandId ?? null, created_by: userId }).select(COLS).single();
  if (error) throw new Error(error.message);
  return data as Campaign;
}

export async function updateCampaign(workspaceId: string, id: string, a: { name?: unknown; tone?: unknown }) {
  const patch: Record<string, string> = {};
  if (a.name !== undefined) patch.name = cleanName(a.name);
  if (a.tone !== undefined) patch.tone = cleanTone(a.tone);
  const { error } = await adminClient().from("campaigns").update(patch).eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

/** Deletes the campaign. Its posts stay, without a campaign. */
export async function deleteCampaign(workspaceId: string, id: string) {
  const { error } = await adminClient().from("campaigns").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

/** Throws unless the campaign is this workspace's and may hold a post of this brand. */
export async function assertCampaign(workspaceId: string, id: string, brandId: string | null) {
  const { data } = await adminClient().from("campaigns").select("brand_id").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (!data) throw new Error("That campaign was deleted");
  if (!fitsBrand(data.brand_id as string | null, brandId)) throw new Error("That campaign belongs to another brand");
}

/** Each campaign's posts by status and the engagements of what went out. */
export async function campaignCounts(workspaceId: string, ids: string[]): Promise<Record<string, CampaignCounts>> {
  if (!ids.length) return {};
  const { data, error } = await adminClient().from("posts").select("campaign_id, status, post_targets(post_metrics(engagement))").eq("workspace_id", workspaceId).in("campaign_id", ids);
  if (error) throw new Error(error.message);
  type Row = { campaign_id: string | null; status: string; post_targets: { post_metrics: { engagement: number | null } | { engagement: number | null }[] | null }[] };
  const rows = ((data ?? []) as unknown as Row[]).map((p) => ({
    campaign_id: p.campaign_id,
    status: p.status,
    engagement: p.post_targets.reduce((s, t) => s + [t.post_metrics ?? []].flat().reduce((a, m) => a + (m.engagement ?? 0), 0), 0),
  }));
  return Object.fromEntries(countCampaigns(rows));
}
