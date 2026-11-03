// Checks for what callers of the API and the MCP server send, before anything reaches the database. Pure, so tests
// cover every rule. A bad value throws ApiError with a message the caller can act on.

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const bad = (message: string) => new ApiError(400, "invalid_request", message);

export type Mode = "draft" | "schedule" | "now" | "queue";
export const MODES: Mode[] = ["draft", "schedule", "now", "queue"];

/** A post as the API takes it. Every field is optional on an update. */
export type PostFields = {
  text?: string;
  channelIds?: string[];
  mediaIds?: string[];
  publishAt?: string | null;
  mode?: Mode;
  /** Own text for some channels, by channel id. */
  channelText?: Record<string, string>;
  /** Network settings by channel id: { first_comment: "..." }. */
  settings?: Record<string, Record<string, string>>;
};

export const MAX_TEXT = 70000;
export const MAX_CHANNELS = 30;
export const MAX_MEDIA = 20;
export const MAX_BATCH = 25;
export const MAX_RANGE_DAYS = 92;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// A full time with its offset, so "9 AM" can't mean different things on different servers.
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/;

export const isId = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

export function id(v: unknown, what = "id"): string {
  if (!isId(v)) throw bad(`${what} must be an id from this API`);
  return v.toLowerCase();
}

export function time(v: unknown, what: string): string {
  if (typeof v !== "string" || !ISO.test(v) || Number.isNaN(Date.parse(v))) throw bad(`${what} must be an ISO 8601 time with an offset, like 2026-11-05T09:00:00-05:00`);
  return new Date(v).toISOString();
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function ids(v: unknown, what: string, max: number): string[] {
  if (!Array.isArray(v)) throw bad(`${what} must be a list of ids`);
  if (v.length > max) throw bad(`${what} can have up to ${max} ids`);
  return [...new Set(v.map((x) => id(x, what)))];
}

function textMap(v: unknown, what: string): Record<string, string> {
  if (!isObject(v)) throw bad(`${what} must be an object of channel id to text`);
  const out: Record<string, string> = {};
  for (const [k, t] of Object.entries(v)) {
    if (typeof t !== "string") throw bad(`${what}: the text for ${k} must be a string`);
    if (t.length > MAX_TEXT) throw bad(`${what}: the text for ${k} is too long`);
    out[id(k, `${what} key`)] = t;
  }
  return out;
}

function settingsMap(v: unknown): Record<string, Record<string, string>> {
  if (!isObject(v)) throw bad("settings must be an object of channel id to settings");
  const out: Record<string, Record<string, string>> = {};
  for (const [k, s] of Object.entries(v)) {
    if (!isObject(s)) throw bad(`settings for ${k} must be an object`);
    const one: Record<string, string> = {};
    for (const [key, val] of Object.entries(s)) {
      if (!/^[a-z_]{1,40}$/.test(key)) throw bad(`settings for ${k}: unknown setting "${key}"`);
      if (typeof val !== "string") throw bad(`settings for ${k}: ${key} must be a string`);
      if (val.length > 5000) throw bad(`settings for ${k}: ${key} is too long`);
      one[key] = val;
    }
    out[id(k, "settings key")] = one;
  }
  return out;
}

/** A post to create (`partial` false) or the fields to change on one (`partial` true). */
export function postFields(body: unknown, partial: boolean): PostFields {
  if (!isObject(body)) throw bad("Send a JSON object");
  const known = new Set(["text", "channel_ids", "media_ids", "publish_at", "mode", "channel_text", "settings"]);
  for (const k of Object.keys(body)) if (!known.has(k) && !(partial && k === "id")) throw bad(`Unknown field "${k}"`);
  const out: PostFields = {};
  if (body.text !== undefined) {
    if (typeof body.text !== "string") throw bad("text must be a string");
    if (body.text.length > MAX_TEXT) throw bad("text is too long");
    out.text = body.text;
  }
  if (body.channel_ids !== undefined) {
    out.channelIds = ids(body.channel_ids, "channel_ids", MAX_CHANNELS);
    if (!out.channelIds.length) throw bad("Pick at least one channel");
  }
  if (body.media_ids !== undefined) out.mediaIds = ids(body.media_ids, "media_ids", MAX_MEDIA);
  if (body.mode !== undefined) {
    if (!MODES.includes(body.mode as Mode)) throw bad(`mode must be one of ${MODES.join(", ")}`);
    out.mode = body.mode as Mode;
  }
  if (body.publish_at !== undefined) out.publishAt = body.publish_at === null ? null : time(body.publish_at, "publish_at");
  if (body.channel_text !== undefined) out.channelText = textMap(body.channel_text, "channel_text");
  if (body.settings !== undefined) out.settings = settingsMap(body.settings);
  if (!partial) {
    if (!out.channelIds) throw bad("channel_ids is required");
    out.mode ??= "draft";
    if ((out.mode === "draft" || out.mode === "schedule") && !out.publishAt) throw bad(`publish_at is required when mode is ${out.mode}`);
  } else if (!Object.keys(out).length) throw bad("Send at least one field to change");
  const picked = out.channelIds ? new Set(out.channelIds) : null;
  if (picked) {
    for (const k of Object.keys(out.channelText ?? {})) if (!picked.has(k)) throw bad(`channel_text has a channel that isn't in channel_ids: ${k}`);
    for (const k of Object.keys(out.settings ?? {})) if (!picked.has(k)) throw bad(`settings has a channel that isn't in channel_ids: ${k}`);
  }
  return out;
}

/** A time range for listing posts: both ends given, in order, at most 92 days apart. */
export function range(fromV: unknown, toV: unknown, now = new Date()): { from: Date; to: Date } {
  const from = fromV == null || fromV === "" ? now : new Date(time(fromV, "from"));
  const to = toV == null || toV === "" ? new Date(from.getTime() + 30 * 86400000) : new Date(time(toV, "to"));
  if (to.getTime() <= from.getTime()) throw bad("to must be after from");
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * 86400000) throw bad(`A range can be up to ${MAX_RANGE_DAYS} days`);
  return { from, to };
}

export function days(v: unknown): 7 | 30 | 90 {
  if (v == null || v === "") return 30;
  const n = Number(v);
  if (n !== 7 && n !== 30 && n !== 90) throw bad("days must be 7, 30 or 90");
  return n;
}

export const optionalId = (v: unknown, what: string) => (v == null || v === "" ? null : id(v, what));
