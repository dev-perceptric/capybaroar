// Campaigns, the pure half: names, colors and the counts shown for each campaign. No Supabase, so tests run it as it is.
import type { Tone } from "@/components/ui";

export const CAMPAIGN_TONES = ["violet", "green", "amber", "red", "turquoise", "sky", "pink", "yellow"] as const satisfies readonly Tone[];
export type CampaignTone = (typeof CAMPAIGN_TONES)[number];
export const MAX_CAMPAIGN_NAME = 60;

export type Campaign = { id: string; name: string; tone: CampaignTone; brand_id: string | null; created_at: string };

/** A campaign name as saved: spaces tidied, 1 to 60 characters. Throws a message people can act on. */
export function cleanName(name: unknown): string {
  const n = typeof name === "string" ? name.replace(/\s+/g, " ").trim() : "";
  if (!n) throw new Error("Name the campaign");
  if ([...n].length > MAX_CAMPAIGN_NAME) throw new Error(`Campaign names are up to ${MAX_CAMPAIGN_NAME} characters`);
  return n;
}

export const cleanTone = (tone: unknown): CampaignTone => ((CAMPAIGN_TONES as readonly string[]).includes(tone as string) ? (tone as CampaignTone) : "violet");

/** The next color for a new campaign, so campaigns side by side look different. */
export const nextTone = (taken: string[]): CampaignTone => CAMPAIGN_TONES.find((t) => !taken.includes(t)) ?? CAMPAIGN_TONES[taken.length % CAMPAIGN_TONES.length];

/** A campaign can hold a post when it belongs to the whole workspace or to the post's brand. */
export const fitsBrand = (campaignBrand: string | null, postBrand: string | null) => !campaignBrand || campaignBrand === postBrand;

export type CampaignCounts = { scheduled: number; published: number; failed: number; drafts: number; engagements: number };

/** Counts per campaign from its posts' statuses and their channels' engagements. */
export function countCampaigns(posts: { campaign_id: string | null; status: string; engagement: number }[]): Map<string, CampaignCounts> {
  const out = new Map<string, CampaignCounts>();
  for (const p of posts) {
    if (!p.campaign_id) continue;
    const c = out.get(p.campaign_id) ?? { scheduled: 0, published: 0, failed: 0, drafts: 0, engagements: 0 };
    if (p.status === "scheduled" || p.status === "publishing" || p.status === "review") c.scheduled++;
    else if (p.status === "published" || p.status === "partial") c.published++;
    else if (p.status === "failed") c.failed++;
    else if (p.status === "draft") c.drafts++;
    c.engagements += p.engagement;
    out.set(p.campaign_id, c);
  }
  return out;
}
