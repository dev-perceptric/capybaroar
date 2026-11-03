// The events a webhook can ask for. Its own file, with no server code, so Settings can list them in the browser.
export const EVENTS = ["post.published", "post.failed", "post.in_review", "post.approved", "post.rejected", "channel.reconnect"] as const;
export type HookEvent = (typeof EVENTS)[number];
export const isEvent = (v: unknown): v is HookEvent => typeof v === "string" && (EVENTS as readonly string[]).includes(v);
