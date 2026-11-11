// Brand kit, the pure half: what a brand kit may hold, the instructions every AI writer gets from it, and the checks
// the composer runs on a post. No Supabase, so tests run it as it is, and the browser can use it too.

export type BrandKit = { voice: string; avoid: string[]; hashtags: string[] };
export const EMPTY_KIT: BrandKit = { voice: "", avoid: [], hashtags: [] };
export const MAX_VOICE = 1500;
export const MAX_ITEMS = 30;

/** Words or tags from text people type: split on commas and new lines, tidied, without repeats. */
export const listOf = (v: unknown): string[] =>
  [...new Set((Array.isArray(v) ? v.join(",") : typeof v === "string" ? v : "").split(/[,\n]/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean))];

/** A brand kit as saved. Throws a message people can act on. */
export function cleanKit(input: { voice?: unknown; avoid?: unknown; hashtags?: unknown }): BrandKit {
  const voice = typeof input.voice === "string" ? input.voice.trim() : "";
  if (voice.length > MAX_VOICE) throw new Error(`The voice is up to ${MAX_VOICE.toLocaleString("en-US")} characters`);
  const avoid = listOf(input.avoid);
  const hashtags = listOf(input.hashtags).map((h) => `#${h.replace(/^#+/, "").replace(/\s+/g, "")}`).filter((h) => h.length > 1);
  if (avoid.length > MAX_ITEMS || hashtags.length > MAX_ITEMS) throw new Error(`Up to ${MAX_ITEMS} words and ${MAX_ITEMS} hashtags`);
  if (avoid.some((w) => w.length > 40) || hashtags.some((h) => h.length > 60)) throw new Error("Each word or hashtag is up to 40 characters");
  return { voice, avoid, hashtags: [...new Set(hashtags)] };
}

export const isEmptyKit = (k: BrandKit | null | undefined) => !k || (!k.voice && !k.avoid.length && !k.hashtags.length);

/** The lines an AI writer gets for this brand, or "" when the kit is empty. */
export function kitPrompt(kit: BrandKit | null | undefined, brandName?: string): string {
  if (!kit || isEmptyKit(kit)) return "";
  const who = brandName ? `${brandName}'s` : "The brand's";
  return [
    `${who} brand kit:`,
    kit.voice ? `- Voice: ${kit.voice}` : "",
    kit.avoid.length ? `- Never use these words or phrases: ${kit.avoid.join(", ")}.` : "",
    kit.hashtags.length ? `- Posts always end with these hashtags: ${kit.hashtags.join(" ")}. Add any that are missing, within the character limit.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The words to avoid that this text uses, whole words only and whatever the case. */
export function avoidedIn(text: string, avoid: string[]): string[] {
  return avoid.filter((w) => new RegExp(`(^|[^\\p{L}\\p{N}])${escape(w)}(?=$|[^\\p{L}\\p{N}])`, "iu").test(text));
}

/** The brand's hashtags this text doesn't carry yet. */
export function missingHashtags(text: string, hashtags: string[]): string[] {
  const has = new Set((text.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((h) => h.toLowerCase()));
  return hashtags.filter((h) => !has.has(h.toLowerCase()));
}
