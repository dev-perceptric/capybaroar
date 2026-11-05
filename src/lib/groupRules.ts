// Channel groups and Select all, kept pure so tests check them without Supabase.

export type GroupChannel = { id: string; brand_id: string | null; status: string };
export type ChannelGroup = { id: string; name: string; brand_id: string | null; channel_ids: string[] };

export const MAX_GROUP_NAME = 60;

/** A group's name, trimmed. Throws a message people can act on. */
export function groupName(v: unknown): string {
  const name = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  if (!name) throw new Error("Name the group");
  if (name.length > MAX_GROUP_NAME) throw new Error(`Keep the name under ${MAX_GROUP_NAME} characters`);
  return name;
}

/** The brand a set of channels belongs to. Throws when they span brands or one isn't in the workspace. */
export function groupBrand(ids: string[], channels: GroupChannel[]): string | null {
  if (!ids.length) throw new Error("Pick at least one channel");
  const byId = new Map(channels.map((c) => [c.id, c]));
  const missing = ids.find((id) => !byId.has(id));
  if (missing) throw new Error("A channel in this group was removed");
  const brands = new Set(ids.map((id) => byId.get(id)!.brand_id ?? null));
  if (brands.size > 1) throw new Error("A group's channels must be from one brand");
  return [...brands][0];
}

/** The channels a group picks now: the ones still connected, in the group's order. */
export const groupChannels = (g: ChannelGroup, channels: GroupChannel[]) => {
  const have = new Set(channels.map((c) => c.id));
  return g.channel_ids.filter((id) => have.has(id));
};

/**
 * What Select all picks: every working channel of the brand already being posted to. With nothing picked yet it
 * picks them all when they share one brand; across brands it waits for a first pick (null).
 */
export function selectAll(channels: GroupChannel[], picked: string[]): string[] | null {
  const live = channels.filter((c) => c.status !== "reconnect");
  const first = channels.find((c) => c.id === picked[0]);
  const brands = new Set(live.map((c) => c.brand_id ?? null));
  const brand = first ? (first.brand_id ?? null) : brands.size === 1 ? [...brands][0] : undefined;
  if (brand === undefined) return null;
  return live.filter((c) => (c.brand_id ?? null) === brand).map((c) => c.id);
}

/** Whether these picks are exactly this group (order doesn't matter). */
export const isGroup = (g: ChannelGroup, picked: string[], channels: GroupChannel[]) => {
  const want = groupChannels(g, channels);
  return want.length > 0 && want.length === picked.length && want.every((id) => picked.includes(id));
};
