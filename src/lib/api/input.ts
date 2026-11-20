// Checks for what callers of the API and the MCP server send, before anything reaches the database. Pure, so tests
// cover every rule. A bad value throws ApiError with a message the caller can act on.
import { isIP } from "node:net";
import { isPublicAddress } from "./net";
import { genRequest, type GenRequest } from "../genRules";

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
  /** A thread's posts after the first, each with its text and files. */
  thread?: { text: string; mediaIds: string[] }[];
  /** The campaign, or null to take the post out of its campaign. */
  campaignId?: string | null;
};

export const MAX_TEXT = 70000;
export const MAX_CHANNELS = 30;
export const MAX_MEDIA = 20;
export const MAX_BATCH = 25;
export const MAX_RANGE_DAYS = 92;
export const MAX_THREAD = 24;

function threadParts(v: unknown): { text: string; mediaIds: string[] }[] {
  if (!Array.isArray(v)) throw bad("thread must be a list of { text, media_ids }");
  if (v.length > MAX_THREAD) throw bad(`thread can have up to ${MAX_THREAD} posts after the first`);
  return v.map((p, i) => {
    const what = `thread[${i}]`;
    if (typeof p === "string") {
      if (p.length > MAX_TEXT) throw bad(`${what} is too long`);
      return { text: p, mediaIds: [] };
    }
    if (!isObject(p)) throw bad(`${what} must be { text, media_ids } or a string`);
    for (const k of Object.keys(p)) if (k !== "text" && k !== "media_ids") throw bad(`${what}: unknown field "${k}"`);
    if (p.text !== undefined && typeof p.text !== "string") throw bad(`${what}.text must be a string`);
    const text = (p.text as string | undefined) ?? "";
    if (text.length > MAX_TEXT) throw bad(`${what}.text is too long`);
    return { text, mediaIds: p.media_ids === undefined ? [] : ids(p.media_ids, `${what}.media_ids`, MAX_MEDIA) };
  });
}

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
  const known = new Set(["text", "channel_ids", "media_ids", "publish_at", "mode", "channel_text", "settings", "thread", "campaign_id"]);
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
  if (body.publish_at !== undefined) out.publishAt = body.publish_at === null ? null : body.publish_at === "best" ? "best" : time(body.publish_at, "publish_at");
  if (body.channel_text !== undefined) out.channelText = textMap(body.channel_text, "channel_text");
  if (body.settings !== undefined) out.settings = settingsMap(body.settings);
  if (body.thread !== undefined) out.thread = threadParts(body.thread);
  if (body.campaign_id !== undefined) out.campaignId = body.campaign_id === null ? null : id(body.campaign_id, "campaign_id");
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

/** A link to a file to add to the media library. */
export function mediaLink(body: unknown): { url: URL; alt: string | null } {
  if (!isObject(body)) throw bad("Send a JSON object");
  for (const k of Object.keys(body)) if (k !== "url" && k !== "alt") throw bad(`Unknown field "${k}"`);
  const url = link(body.url, ["http:", "https:"]);
  if (body.alt !== undefined && body.alt !== null && typeof body.alt !== "string") throw bad("alt must be a string");
  const alt = typeof body.alt === "string" && body.alt.trim() ? body.alt.trim().slice(0, 1000) : null;
  return { url, alt };
}

/** A web address the server will call: the right scheme, no password in it, not too long. */
export function link(v: unknown, schemes: string[], what = "url"): URL {
  if (typeof v !== "string" || !v.trim()) throw bad(`${what} is required`);
  if (v.length > 2000) throw bad(`${what} is too long`);
  let u: URL;
  try {
    u = new URL(v.trim());
  } catch {
    throw bad(`${what} isn't a valid web address`);
  }
  if (!schemes.includes(u.protocol)) throw bad(`${what} must start with ${schemes.map((s) => `${s}//`).join(" or ")}`);
  if (u.username || u.password) throw bad(`${what} can't have a user name or password in it`);
  if (!u.hostname) throw bad(`${what} needs a host`);
  return u;
}

/** A webhook to add: an https URL and the events it wants. */
export function webhookInput(body: unknown, events: readonly string[]): { url: URL; events: string[] } {
  if (!isObject(body)) throw bad("Send a JSON object");
  for (const k of Object.keys(body)) if (k !== "url" && k !== "events") throw bad(`Unknown field "${k}"`);
  // Names are checked again when a delivery is sent; plain private addresses and local names are refused here.
  const url = publicHttps(body.url);
  if (!Array.isArray(body.events) || !body.events.length) throw bad(`events must be a list of one or more of ${events.join(", ")}`);
  const picked = [...new Set(body.events)];
  for (const e of picked) if (typeof e !== "string" || !events.includes(e)) throw bad(`Unknown event "${String(e)}". Use ${events.join(", ")}`);
  return { url, events: picked as string[] };
}

/** The address part of webhookInput, shared with the partner webhook. */
function publicHttps(v: unknown, what = "url"): URL {
  const url = link(v, ["https:"], what);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.localhost|.*\.internal|.*\.local)$/i.test(host) || (isIP(host) && !isPublicAddress(host))) throw bad("The webhook address must be on the public internet");
  return url;
}

// The partner API (src/app/api/partner). Its errors in what was sent are 422, as the partner contract says.

const unprocessable = (e: unknown) => new ApiError(422, "invalid_request", e instanceof Error ? e.message : String(e));
const partner = <T,>(fn: () => T): T => {
  try {
    return fn();
  } catch (e) {
    throw e instanceof ApiError && e.status !== 400 ? e : unprocessable(e);
  }
};

/** The partner's own id: letters, digits and . _ : @ -, up to 200. */
export const EXTERNAL_ID = /^[A-Za-z0-9._:@-]{1,200}$/;

/** A brand to make: { name, domain, external_id }. domain may be a bare host ("acme.com") or a link; null or left out
 *  for none. The brand keeps it as its website (CapyInfographic reads the brand's look from it). */
export function partnerBrandInput(body: unknown): { name: string; website: string | null; externalId: string } {
  return partner(() => {
    if (!isObject(body)) throw bad("Send a JSON object");
    for (const k of Object.keys(body)) if (k !== "name" && k !== "domain" && k !== "external_id") throw bad(`Unknown field "${k}"`);
    if (typeof body.name !== "string" || !body.name.trim()) throw bad("name is required");
    const name = body.name.trim();
    if (name.length > 60) throw bad("name is up to 60 characters");
    if (typeof body.external_id !== "string" || !EXTERNAL_ID.test(body.external_id)) throw bad("external_id is required: up to 200 letters, digits and . _ : @ -");
    let website: string | null = null;
    if (body.domain != null && body.domain !== "") {
      if (typeof body.domain !== "string" || body.domain.length > 253) throw bad("domain must be a web address like acme.com");
      const raw = body.domain.trim();
      const u = link(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`, ["https:", "http:"], "domain");
      if (!/^([a-z0-9-]+\.)+[a-z]{2,63}$/i.test(u.hostname)) throw bad("domain must be a web address like acme.com");
      website = `https://${u.hostname.toLowerCase()}`;
    }
    return { name, website, externalId: body.external_id };
  });
}

/** The host a brand's website is on, as the partner sent it as domain. */
export const domainOf = (website: string | null | undefined): string | null => {
  if (!website) return null;
  try {
    return new URL(website).hostname;
  } catch {
    return null;
  }
};

/** A month as "YYYY-MM" (UTC), or this month when left out: its first moment and the next month's. */
export function monthRange(v: unknown, now = new Date()): { month: string; from: Date; to: Date } {
  return partner(() => {
    const m = v == null || v === "" ? now.toISOString().slice(0, 7) : v;
    if (typeof m !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(m)) throw bad("month must be YYYY-MM, like 2026-11");
    const [y, mo] = m.split("-").map(Number);
    return { month: m, from: new Date(Date.UTC(y, mo - 1, 1)), to: new Date(Date.UTC(y, mo, 1)) };
  });
}

/** The partner webhook: { url, secret? }. secret, when sent, is a Standard Webhooks secret (whsec_ and base64). */
export function partnerHookInput(body: unknown, validSecret: (s: string) => boolean): { url: URL; secret: string | null } {
  return partner(() => {
    if (!isObject(body)) throw bad("Send a JSON object");
    for (const k of Object.keys(body)) if (k !== "url" && k !== "secret") throw bad(`Unknown field "${k}"`);
    const url = publicHttps(body.url);
    if (body.secret == null || body.secret === "") return { url, secret: null };
    if (typeof body.secret !== "string" || !validSecret(body.secret)) throw bad("secret must be whsec_ and 24 to 64 random bytes in base64, or left out to get a new one");
    return { url, secret: body.secret };
  });
}

/** The hosts a partner may send people back to after connecting (PARTNER_RETURN_HOSTS: exact host names, comma or
 *  space separated). Nothing listed: no return_url is allowed. */
export const returnHosts = (v: string | undefined): string[] =>
  (v ?? "")
    .split(/[\s,]+/)
    .map((h) => h.trim().toLowerCase())
    .filter((h) => /^([a-z0-9-]+\.)+[a-z]{2,63}$/.test(h));

/**
 * Where a white-label sign-in sends the person back: https, on a listed host exactly (no other port, no user name, no
 * fragment), so a partner key can't turn the callback into an open redirect.
 */
export function returnUrl(v: unknown, hosts: readonly string[]): string {
  return partner(() => {
    const u = link(v, ["https:"], "return_url");
    if (u.port) throw bad("return_url can't name a port");
    if (u.hash) throw bad("return_url can't have a #fragment");
    if (!hosts.includes(u.hostname.toLowerCase())) throw bad("return_url must be on a host allowed for this partner");
    return u.toString();
  });
}

/** A white-label connect start: { network, return_url }. `networks` are the ones set up on this server. */
export function partnerConnectInput(body: unknown, networks: readonly string[], hosts: readonly string[]): { network: string; returnUrl: string } {
  return partner(() => {
    if (!isObject(body)) throw bad("Send a JSON object");
    for (const k of Object.keys(body)) if (k !== "network" && k !== "return_url") throw bad(`Unknown field "${k}"`);
    if (typeof body.network !== "string" || !networks.includes(body.network)) throw bad(`network must be one of ${networks.join(", ") || "(none set up)"}`);
    return { network: body.network, returnUrl: returnUrl(body.return_url, hosts) };
  });
}

/** The accounts picked after a sign-in: { ids: [...] }, ids as the pick listed them. */
export function partnerPickInput(body: unknown): string[] {
  return partner(() => {
    if (!isObject(body)) throw bad("Send a JSON object");
    for (const k of Object.keys(body)) if (k !== "ids") throw bad(`Unknown field "${k}"`);
    if (!Array.isArray(body.ids) || !body.ids.length) throw bad("ids must be a list of one or more option ids");
    if (body.ids.length > 100) throw bad("ids can have up to 100 ids");
    for (const x of body.ids) if (typeof x !== "string" || !x || x.length > 200) throw bad("ids must be option ids from the pick");
    return [...new Set(body.ids as string[])];
  });
}

/**
 * How to delete a post. Without `everywhere` only Capybaroar's record goes (a post that went out stays on the
 * networks). With it, the post is deleted on its channels: all of them, or the ones in `channel_ids` (a list, or the
 * REST query's comma-separated ids). `everywhere` takes true or false, or "true"/"false" from a query string.
 */
export function deleteArgs(everywhereV: unknown, channelsV: unknown): { everywhere: boolean; channelIds: string[] | null } {
  const flag = everywhereV == null || everywhereV === "" ? false : everywhereV === true || everywhereV === "true" ? true : everywhereV === false || everywhereV === "false" ? false : null;
  if (flag === null) throw bad("everywhere must be true or false");
  if (channelsV == null || channelsV === "") return { everywhere: flag, channelIds: null };
  if (!flag) throw bad("channel_ids only goes with everywhere: true");
  const list = typeof channelsV === "string" ? channelsV.split(",").map((x) => x.trim()).filter(Boolean) : channelsV;
  const out = ids(list, "channel_ids", MAX_CHANNELS);
  if (!out.length) throw bad("Pick at least one channel");
  return { everywhere: true, channelIds: out };
}

/** An AI picture or video request (genRules.ts has the rules). */
export function generationInput(body: unknown): GenRequest {
  try {
    return genRequest(body);
  } catch (e) {
    throw bad(e instanceof Error ? e.message : String(e));
  }
}
