// What the API and the MCP server return, and the one set of actions both run (Ops). The REST routes and the MCP
// tools are two doors to the same actions, so they can't drift apart.
import type { Mode, PostFields } from "./input";

export type ApiBrand = { id: string; name: string; needs_approval: boolean };

/** A network setting a post can carry. kind "cover" takes a media id; "tags" takes words split by commas. */
export type ApiSetting = { key: string; label: string; kind: "text" | "textarea" | "select" | "tags" | "cover"; required: boolean; options?: string[]; only_when?: { key: string; value: string } };

export type ApiChannel = {
  id: string;
  network: string;
  network_name: string;
  name: string;
  username: string | null;
  status: "active" | "reconnect";
  brand_id: string | null;
  character_limit: number;
  needs_media: boolean;
  settings: ApiSetting[];
};

export type ApiPost = {
  id: string;
  status: "draft" | "review" | "scheduled" | "publishing" | "published" | "partial" | "failed";
  text: string;
  publish_at: string | null;
  brand_id: string | null;
  media_ids: string[];
  channels: { channel_id: string; status: string; text: string | null; settings: Record<string, string>; url: string | null; error: string | null }[];
};

export type ApiMedia = { id: string; name: string; mime: string; size: number; alt: string | null; created_at: string; preview_url: string | null };

export type ApiAnalytics = {
  days: number;
  since: string;
  current: { posts: number; reach: number; engagements: number; engagement_rate: number | null; posts_with_results: number };
  previous: { posts: number; reach: number; engagements: number; engagement_rate: number | null; posts_with_results: number };
  best_times: { weekday: string; hour: number }[];
  formats: { format: string; posts: number; average_engagements: number | null }[];
  top_posts: { id: string; channel_id: string; published_at: string; text: string; url: string | null; engagements: number; engagement_rate: number | null }[];
};

export interface Ops {
  brands(): Promise<ApiBrand[]>;
  channels(brandId: string | null): Promise<ApiChannel[]>;
  posts(from: Date, to: Date, brandId: string | null): Promise<ApiPost[]>;
  post(id: string): Promise<ApiPost>;
  create(fields: PostFields & { channelIds: string[]; mode: Mode }): Promise<ApiPost>;
  update(id: string, fields: PostFields): Promise<ApiPost>;
  remove(id: string): Promise<void>;
  media(): Promise<ApiMedia[]>;
  nextSlot(): Promise<string>;
  analytics(days: 7 | 30 | 90, channelId: string | null): Promise<ApiAnalytics>;
}

/** Who a key belongs to, as the actions see it. */
export type ApiCtx = {
  keyId: string;
  workspaceId: string;
  workspaceName: string;
  timezone: string;
  userId: string;
  role: "owner" | "admin" | "editor";
  /** The brands the key's person may use, or null for every brand. */
  brandIds: string[] | null;
};
