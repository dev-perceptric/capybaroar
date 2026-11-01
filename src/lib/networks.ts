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
  | "discord"
  | "gbp";

/** A setting the composer shows for one network. Values are stored as strings in post_targets.settings. */
export type NetworkField = {
  key: string;
  label: string;
  kind: "text" | "textarea" | "select" | "tags" | "cover";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  /** Default value when the person leaves it alone. */
  initial?: string;
  /** Show only when another setting has this value (a Reel cover only for Reels). */
  when?: { key: string; value: string };
};

export type Network = {
  id: NetworkId;
  name: string;
  /** Characters allowed in one post. */
  limit: number;
  /** Needs a picture or video to post. */
  needsMedia?: boolean;
  fields?: NetworkField[];
};

const FIRST_COMMENT: NetworkField = { key: "first_comment", label: "First comment", kind: "textarea", placeholder: "Posted as a comment right after" };

export const NETWORKS: Network[] = [
  { id: "linkedin", name: "LinkedIn", limit: 3000, fields: [FIRST_COMMENT] },
  { id: "linkedin-page", name: "LinkedIn Page", limit: 3000, fields: [FIRST_COMMENT] },
  {
    id: "facebook",
    name: "Facebook",
    limit: 63206,
    fields: [
      { key: "format", label: "Format", kind: "select", initial: "post", options: [{ value: "post", label: "Post" }, { value: "reel", label: "Reel" }] },
      FIRST_COMMENT,
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    limit: 2200,
    needsMedia: true,
    fields: [
      { key: "format", label: "Format", kind: "select", initial: "post", options: [{ value: "post", label: "Post" }, { value: "reel", label: "Reel" }, { value: "story", label: "Story" }] },
      { key: "cover", label: "Reel cover", kind: "cover", when: { key: "format", value: "reel" } },
      FIRST_COMMENT,
    ],
  },
  { id: "threads", name: "Threads", limit: 500 },
  {
    id: "tiktok",
    name: "TikTok",
    limit: 2200,
    needsMedia: true,
    fields: [
      {
        key: "privacy",
        label: "Who can watch",
        kind: "select",
        required: true,
        options: [
          { value: "PUBLIC_TO_EVERYONE", label: "Everyone" },
          { value: "MUTUAL_FOLLOW_FRIENDS", label: "Friends" },
          { value: "FOLLOWER_OF_CREATOR", label: "Followers" },
          { value: "SELF_ONLY", label: "Only me" },
        ],
      },
      { key: "comments", label: "Comments", kind: "select", initial: "on", options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }] },
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    limit: 5000,
    needsMedia: true,
    fields: [
      { key: "title", label: "Title", kind: "text", required: true, placeholder: "Up to 100 characters" },
      { key: "tags", label: "Tags", kind: "tags", placeholder: "launch, product" },
      { key: "privacy", label: "Visibility", kind: "select", initial: "public", options: [{ value: "public", label: "Public" }, { value: "unlisted", label: "Unlisted" }, { value: "private", label: "Private" }] },
      { key: "for_kids", label: "Made for kids", kind: "select", initial: "no", options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
      { key: "cover", label: "Thumbnail", kind: "cover" },
    ],
  },
  { id: "x", name: "X", limit: 280 },
  {
    id: "pinterest",
    name: "Pinterest",
    limit: 500,
    needsMedia: true,
    fields: [
      { key: "board", label: "Board", kind: "text", required: true, placeholder: "Board name" },
      { key: "title", label: "Title", kind: "text", placeholder: "Up to 100 characters" },
      { key: "link", label: "Link", kind: "text", placeholder: "https://" },
    ],
  },
  {
    id: "reddit",
    name: "Reddit",
    limit: 40000,
    fields: [
      { key: "subreddit", label: "Subreddit", kind: "text", required: true, placeholder: "r/yoursubreddit" },
      { key: "title", label: "Title", kind: "text", required: true, placeholder: "Up to 300 characters" },
    ],
  },
  { id: "bluesky", name: "Bluesky", limit: 300 },
  {
    id: "mastodon",
    name: "Mastodon",
    limit: 500,
    fields: [
      { key: "visibility", label: "Visibility", kind: "select", initial: "public", options: [{ value: "public", label: "Public" }, { value: "unlisted", label: "Quiet public" }, { value: "private", label: "Followers" }] },
      { key: "spoiler", label: "Content warning", kind: "text" },
    ],
  },
  { id: "telegram", name: "Telegram", limit: 4096 },
  { id: "discord", name: "Discord", limit: 2000 },
  { id: "gbp", name: "Google Business", limit: 1500 },
];

export const networkOf = (id: NetworkId) => NETWORKS.find((n) => n.id === id)!;
