// The channels Capybaroar can post to. Limits come from each network's own API docs.
export type NetworkId =
  | "linkedin"
  | "linkedin-page"
  | "facebook"
  | "instagram"
  | "threads"
  | "tiktok"
  | "youtube"
  | "x"
  | "pinterest"
  | "reddit"
  | "bluesky"
  | "mastodon"
  | "telegram"
  | "discord";

export type Network = {
  id: NetworkId;
  name: string;
  /** Characters allowed in one post. */
  limit: number;
  /** Needs a picture or video to post. */
  needsMedia?: boolean;
};

export const NETWORKS: Network[] = [
  { id: "linkedin", name: "LinkedIn", limit: 3000 },
  { id: "linkedin-page", name: "LinkedIn Page", limit: 3000 },
  { id: "facebook", name: "Facebook", limit: 63206 },
  { id: "instagram", name: "Instagram", limit: 2200, needsMedia: true },
  { id: "threads", name: "Threads", limit: 500 },
  { id: "tiktok", name: "TikTok", limit: 2200, needsMedia: true },
  { id: "youtube", name: "YouTube", limit: 5000, needsMedia: true },
  { id: "x", name: "X", limit: 280 },
  { id: "pinterest", name: "Pinterest", limit: 500, needsMedia: true },
  { id: "reddit", name: "Reddit", limit: 40000 },
  { id: "bluesky", name: "Bluesky", limit: 300 },
  { id: "mastodon", name: "Mastodon", limit: 500 },
  { id: "telegram", name: "Telegram", limit: 4096 },
  { id: "discord", name: "Discord", limit: 2000 },
];

export const networkOf = (id: NetworkId) => NETWORKS.find((n) => n.id === id)!;
