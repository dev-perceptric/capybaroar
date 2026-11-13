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
  | "gbp"
  | "wordpress";

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
  /** What the Inbox can do on this network. Missing when it has no Inbox. `hideOnce`: a hidden item can't be shown again. */
  inbox?: { like?: boolean; hide?: boolean; hideOnce?: boolean };
  /** Posts a thread: parts after the first go out as replies to the part before. */
  thread?: boolean;
  /** Takes a PDF as a post of its own (LinkedIn's document post, shown as a carousel). */
  documents?: boolean;
  /**
   * A post that went out can be changed on the network (its provider has `edit`). `text`: the text can change;
   * `settings`: the setting keys that can change too (YouTube's title and tags). Missing: it can't be edited.
   */
  edit?: { text: boolean; settings: string[] };
};

export const isPdfMime = (mime: string) => mime === "application/pdf";

/** A thread's parts after the first: each its own text and files. */
export type ThreadPart = { text: string; mediaIds: string[] };
/** Parts after the first that one post may have (25 in all). */
export const THREAD_MAX = 24;

const FIRST_COMMENT: NetworkField = { key: "first_comment", label: "First comment", kind: "textarea", placeholder: "Posted as a comment right after" };
const RESHARE: NetworkField = { key: "reshare", label: "Resharing", kind: "select", initial: "on", options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }] };
const DOC_TITLE: NetworkField = { key: "doc_title", label: "PDF title", kind: "text", placeholder: "Shown on a PDF post. The file name if empty." };

export const NETWORKS: Network[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    limit: 3000,
    documents: true,
    fields: [
      FIRST_COMMENT,
      { key: "visibility", label: "Who can see it", kind: "select", initial: "PUBLIC", options: [{ value: "PUBLIC", label: "Anyone" }, { value: "CONNECTIONS", label: "Connections only" }, { value: "LOGGED_IN", label: "LinkedIn members" }] },
      RESHARE,
      DOC_TITLE,
    ],
    edit: { text: true, settings: [] },
  },
  { id: "linkedin-page", name: "LinkedIn Page", limit: 3000, documents: true, fields: [FIRST_COMMENT, RESHARE, DOC_TITLE], inbox: { like: true }, edit: { text: true, settings: [] } },
  {
    id: "facebook",
    name: "Facebook",
    limit: 63206,
    fields: [
      { key: "format", label: "Format", kind: "select", initial: "post", options: [{ value: "post", label: "Post" }, { value: "reel", label: "Reel" }, { value: "story", label: "Story" }] },
      FIRST_COMMENT,
    ],
    inbox: { like: true, hide: true },
    edit: { text: true, settings: [] },
  },
  {
    id: "instagram",
    name: "Instagram",
    limit: 2200,
    needsMedia: true,
    fields: [
      { key: "format", label: "Format", kind: "select", initial: "post", options: [{ value: "post", label: "Post" }, { value: "reel", label: "Reel" }, { value: "story", label: "Story" }] },
      { key: "trial", label: "Trial Reel", kind: "select", initial: "off", when: { key: "format", value: "reel" }, options: [{ value: "off", label: "Off" }, { value: "manual", label: "On, share with followers yourself" }, { value: "auto", label: "On, share when it does well" }] },
      { key: "cover", label: "Reel cover", kind: "cover", when: { key: "format", value: "reel" } },
      FIRST_COMMENT,
    ],
    inbox: { hide: true },
  },
  { id: "threads", name: "Threads", limit: 500, inbox: { hide: true }, thread: true },
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
      // TikTok's content sharing rules: comments, Duet and Stitch start off and the person turns them on.
      { key: "comments", label: "Allow comments", kind: "select", initial: "off", options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }] },
      { key: "duet", label: "Allow Duet", kind: "select", initial: "off", options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }] },
      { key: "stitch", label: "Allow Stitch", kind: "select", initial: "off", options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }] },
      { key: "title", label: "Photo title", kind: "text", placeholder: "For photo posts, up to 90 characters" },
      {
        key: "brand",
        label: "Promotional content",
        kind: "select",
        initial: "off",
        options: [
          { value: "off", label: "No" },
          { value: "own", label: "Your brand" },
          { value: "branded", label: "Branded content" },
        ],
      },
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
      {
        key: "category",
        label: "Category",
        kind: "select",
        initial: "22",
        options: [
          { value: "1", label: "Film and animation" },
          { value: "2", label: "Cars and vehicles" },
          { value: "10", label: "Music" },
          { value: "15", label: "Pets and animals" },
          { value: "17", label: "Sports" },
          { value: "19", label: "Travel and events" },
          { value: "20", label: "Gaming" },
          { value: "22", label: "People and blogs" },
          { value: "23", label: "Comedy" },
          { value: "24", label: "Entertainment" },
          { value: "25", label: "News and politics" },
          { value: "26", label: "How-to and style" },
          { value: "27", label: "Education" },
          { value: "28", label: "Science and technology" },
          { value: "29", label: "Nonprofits and activism" },
        ],
      },
      { key: "notify", label: "Notify subscribers", kind: "select", initial: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { key: "synthetic", label: "Altered or synthetic content", kind: "select", initial: "no", options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
    ],
    inbox: { hide: true, hideOnce: true },
    edit: { text: true, settings: ["title", "tags", "category", "privacy", "for_kids", "synthetic"] },
  },
  {
    id: "x",
    name: "X",
    limit: 280,
    inbox: { like: true, hide: true },
    thread: true,
    fields: [
      {
        key: "reply_settings",
        label: "Who can reply",
        kind: "select",
        initial: "everyone",
        options: [
          { value: "everyone", label: "Everyone" },
          { value: "following", label: "People you follow" },
          { value: "mentionedUsers", label: "Only people you mention" },
          { value: "verified", label: "Verified accounts" },
        ],
      },
      { key: "poll", label: "Poll", kind: "textarea", placeholder: "2 to 4 options, one per line" },
      {
        key: "poll_length",
        label: "Poll length",
        kind: "select",
        initial: "1440",
        options: [
          { value: "60", label: "1 hour" },
          { value: "360", label: "6 hours" },
          { value: "1440", label: "1 day" },
          { value: "4320", label: "3 days" },
          { value: "10080", label: "7 days" },
        ],
      },
      { key: "made_with_ai", label: "Made with AI", kind: "select", initial: "no", options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
      { key: "paid_partnership", label: "Paid partnership", kind: "select", initial: "no", options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
    ],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    limit: 500,
    needsMedia: true,
    fields: [
      { key: "board", label: "Board", kind: "text", required: true, placeholder: "Board name" },
      { key: "section", label: "Board section", kind: "text", placeholder: "Section name, if any" },
      { key: "title", label: "Title", kind: "text", placeholder: "Up to 100 characters" },
      { key: "link", label: "Link", kind: "text", placeholder: "https://" },
    ],
    edit: { text: true, settings: ["title", "link"] },
  },
  {
    id: "reddit",
    name: "Reddit",
    limit: 40000,
    fields: [
      { key: "subreddit", label: "Subreddit", kind: "text", required: true, placeholder: "r/yoursubreddit" },
      { key: "title", label: "Title", kind: "text", required: true, placeholder: "Up to 300 characters" },
    ],
    edit: { text: true, settings: [] },
  },
  { id: "bluesky", name: "Bluesky", limit: 300, inbox: { like: true }, thread: true },
  {
    id: "mastodon",
    name: "Mastodon",
    limit: 500,
    fields: [
      { key: "visibility", label: "Visibility", kind: "select", initial: "public", options: [{ value: "public", label: "Public" }, { value: "unlisted", label: "Quiet public" }, { value: "private", label: "Followers" }] },
      { key: "spoiler", label: "Content warning", kind: "text" },
    ],
    inbox: { like: true },
    thread: true,
    edit: { text: true, settings: ["spoiler"] },
  },
  { id: "telegram", name: "Telegram", limit: 4096, edit: { text: true, settings: [] } },
  { id: "discord", name: "Discord", limit: 2000, edit: { text: true, settings: [] } },
  { id: "gbp", name: "Google Business", limit: 1500, edit: { text: true, settings: [] } },
  {
    id: "wordpress",
    name: "WordPress",
    limit: 100000,
    fields: [
      { key: "title", label: "Title", kind: "text", required: true, placeholder: "The post's title" },
      { key: "status", label: "Status", kind: "select", initial: "publish", options: [{ value: "publish", label: "Publish" }, { value: "draft", label: "Draft" }, { value: "pending", label: "Pending review" }] },
      { key: "categories", label: "Categories", kind: "tags", placeholder: "News, Recipes" },
      { key: "tags", label: "Tags", kind: "tags", placeholder: "bread, baking" },
      { key: "excerpt", label: "Excerpt", kind: "textarea", placeholder: "A short summary" },
    ],
    edit: { text: true, settings: ["title", "status", "categories", "tags", "excerpt"] },
  },
];

export const networkOf = (id: NetworkId) => NETWORKS.find((n) => n.id === id)!;
export const takesThread = (id: string) => NETWORKS.some((n) => n.id === id && n.thread);

/** Networks switched off for now: hidden from Channels and Welcome, and they can't be connected. Remove an id to bring it back. */
export const PAUSED: NetworkId[] = ["reddit", "gbp"];
export const isPaused = (id: string) => (PAUSED as string[]).includes(id);
/** The networks people can connect. */
export const OFFERED = NETWORKS.filter((n) => !isPaused(n.id));
