// Tags, the pure half: names, colors and the list on a post. No Supabase, so tests run it as it is.
import { CAMPAIGN_TONES, type CampaignTone } from "./campaignRules";

export const TAG_TONES = CAMPAIGN_TONES;
export type TagTone = CampaignTone;
export const MAX_TAG_NAME = 40;
/** Tags one post can carry. */
export const MAX_POST_TAGS = 10;

export type Tag = { id: string; name: string; tone: TagTone; created_at: string };

/** A tag name as saved: spaces tidied, 1 to 40 characters. Throws a message people can act on. */
export function cleanTagName(name: unknown): string {
  const n = typeof name === "string" ? name.replace(/\s+/g, " ").trim() : "";
  if (!n) throw new Error("Name the tag");
  if ([...n].length > MAX_TAG_NAME) throw new Error(`Tag names are up to ${MAX_TAG_NAME} characters`);
  return n;
}

export const cleanTagTone = (tone: unknown): TagTone => ((TAG_TONES as readonly string[]).includes(tone as string) ? (tone as TagTone) : "sky");

/** The next color for a new tag, starting away from campaigns' first colors. */
export const nextTagTone = (taken: string[]): TagTone => {
  const order = [...TAG_TONES.slice(5), ...TAG_TONES.slice(0, 5)];
  return order.find((t) => !taken.includes(t)) ?? order[taken.length % order.length];
};

/** A post's tag ids: no repeats, at most MAX_POST_TAGS. Throws when there are too many. */
export function cleanTagIds(ids: string[]): string[] {
  const out = [...new Set(ids)];
  if (out.length > MAX_POST_TAGS) throw new Error(`A post can have up to ${MAX_POST_TAGS} tags`);
  return out;
}
