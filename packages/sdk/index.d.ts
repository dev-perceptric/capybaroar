export class CapybaroarError extends Error {
  status: number;
  code: string;
}

export type Mode = "draft" | "schedule" | "now" | "queue";
export type ThreadPart = { text: string; media_ids?: string[] };
export type PostFields = {
  channel_ids?: string[];
  text?: string;
  mode?: Mode;
  /** ISO 8601 with an offset, or "best" for the next of the workspace's best times. */
  publish_at?: string | null;
  media_ids?: string[];
  channel_text?: Record<string, string>;
  settings?: Record<string, Record<string, string>>;
  thread?: (ThreadPart | string)[];
  campaign_id?: string | null;
};
export type Post = {
  id: string;
  status: "draft" | "review" | "scheduled" | "publishing" | "published" | "partial" | "failed" | "deleted";
  text: string;
  publish_at: string | null;
  brand_id: string | null;
  media_ids: string[];
  thread: { text: string; media_ids: string[] }[];
  campaign_id: string | null;
  channels: { channel_id: string; status: string; text: string | null; settings: Record<string, string>; url: string | null; error: string | null; deleted_at: string | null; thread_urls: (string | null)[] }[];
};
export type Channel = { id: string; network: string; network_name: string; name: string; username: string | null; status: string; brand_id: string | null; character_limit: number; needs_media: boolean; thread: boolean; settings: unknown[] };

export class Capybaroar {
  constructor(opts?: { apiKey?: string; accessToken?: string; baseUrl?: string; fetch?: typeof fetch; retries?: number });
  request<T = unknown>(method: string, path: string, opts?: { query?: Record<string, unknown>; body?: unknown }): Promise<T>;
  brands(): Promise<{ id: string; name: string; needs_approval: boolean }[]>;
  channels(brandId?: string): Promise<Channel[]>;
  channelGroups(): Promise<{ id: string; name: string; brand_id: string | null; channel_ids: string[] }[]>;
  campaigns(): Promise<{ id: string; name: string; color: string; brand_id: string | null; scheduled: number; published: number; failed: number; drafts: number; engagements: number }[]>;
  posts(opts?: { from?: string; to?: string; brandId?: string }): Promise<Post[]>;
  post(id: string): Promise<Post>;
  createPost(fields: PostFields & { channel_ids: string[] }): Promise<Post>;
  updatePost(id: string, fields: PostFields): Promise<Post>;
  deletePost(id: string, opts?: { everywhere?: boolean; channelIds?: string[] }): Promise<unknown>;
  nextQueueSlot(): Promise<string>;
  media(): Promise<{ id: string; name: string; mime: string; size: number }[]>;
  uploadFromUrl(url: string, alt?: string): Promise<{ id: string }>;
  analytics(opts?: { days?: 7 | 30 | 90; channelId?: string }): Promise<unknown>;
  credits(): Promise<unknown>;
  webhooks(): Promise<unknown[]>;
}
export default Capybaroar;
