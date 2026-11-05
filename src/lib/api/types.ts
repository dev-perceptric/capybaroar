// What the API and the MCP server return, and the one set of actions both run (Ops). The REST routes and the MCP
// tools are two doors to the same actions, so they can't drift apart.
import type { Mode, PostFields } from "./input";
import type { GenRequest } from "../genRules";

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
  /** "deleted": deleted on every channel it went out on (delete_post with everywhere). */
  status: "draft" | "review" | "scheduled" | "publishing" | "published" | "partial" | "failed" | "deleted";
  text: string;
  publish_at: string | null;
  brand_id: string | null;
  media_ids: string[];
  channels: { channel_id: string; status: string; text: string | null; settings: Record<string, string>; url: string | null; error: string | null; deleted_at: string | null }[];
};

/** What deleting everywhere did on each channel. manual: the network can't delete from here; delete it at url. */
export type ApiUnpublish = {
  deleted: boolean;
  channels: { channel_id: string; name: string; network: string; result: "deleted" | "failed" | "manual" | "skipped"; error: string | null; note: string | null; url: string | null }[];
};

export type ApiWebhook = { id: string; url: string; events: string[]; enabled: boolean; failures: number; last_status: number | null; last_error: string | null; last_delivered_at: string | null; created_at: string };

export type ApiMedia = { id: string; name: string; mime: string; size: number; alt: string | null; created_at: string; preview_url: string | null };

/** An AI picture, video or audio file. status: queued and running are still being made; media is set once it's done. credits: what it costs; reason: why Capy picked the model. */
export type ApiGeneration = { id: string; kind: "image" | "video" | "audio"; model: string; prompt: string; status: "queued" | "running" | "done" | "failed"; error: string | null; media: ApiMedia | null; credits: number; reason: string | null; created_at: string };

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
  /** Delete a published post on its channels (null: every channel it went out on). The record stays. */
  unpublish(id: string, channelIds: string[] | null): Promise<ApiUnpublish>;
  media(): Promise<ApiMedia[]>;
  nextSlot(): Promise<string>;
  analytics(days: 7 | 30 | 90, channelId: string | null): Promise<ApiAnalytics>;
  /** Download a picture or video from a public link into the media library. */
  uploadFromLink(url: URL, alt: string | null): Promise<ApiMedia>;
  /** Start an AI picture or video. It lands in the media library when it's done (get_generation). */
  generate(r: GenRequest): Promise<ApiGeneration>;
  generation(id: string): Promise<ApiGeneration>;
  webhooks(): Promise<ApiWebhook[]>;
  createWebhook(url: URL, events: string[]): Promise<{ webhook: ApiWebhook; secret: string }>;
  setWebhook(id: string, enabled: boolean): Promise<ApiWebhook>;
  deleteWebhook(id: string): Promise<void>;
  testWebhook(id: string): Promise<void>;
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
