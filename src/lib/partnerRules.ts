// The partner API, the pure half: which brands a partner key may touch, making a brand only once per external_id,
// what a brand looks like to the partner, and connect links (one browser, 24 hours). It runs on a PartnerStore, so
// tests drive it with an in-memory one; src/lib/partner.ts is the Supabase store.
import { createHash, randomBytes } from "node:crypto";
import { ApiError, domainOf, isId } from "./api/input";
import type { PartnerCtx } from "./api/keyRules";

export type PartnerBrand = { id: string; workspace_id: string; name: string; website: string | null; external_id: string | null };
export type PartnerChannel = { id: string; network: string; name: string; status: "active" | "reconnect" };
export type ConnectLink = { id: string; workspace_id: string; brand_id: string; created_by: string; expires_at: string; claimed_at: string | null; browser_hash: string | null; ended_at: string | null };
export type Usage = { posts_published: number; posts_created: number; ai_files: number; credits: number };

export interface PartnerStore {
  brand(id: string): Promise<PartnerBrand | null>;
  brandByExternal(workspaceId: string, externalId: string): Promise<PartnerBrand | null>;
  /** Make the brand. Throws BrandTaken when another request made one with the same external_id first. */
  addBrand(p: PartnerCtx, b: { name: string; website: string | null; externalId: string }): Promise<PartnerBrand>;
  /** Delete the brand with its channels, posts, files, keys and connect links. */
  removeBrand(p: PartnerCtx, b: PartnerBrand): Promise<void>;
  channels(workspaceId: string, brandId: string): Promise<PartnerChannel[]>;
  /** Disconnect one of the brand's channels the way the Channels page does, and send channel.lost. False when it was
   *  already gone. */
  removeChannel(p: PartnerCtx, b: PartnerBrand, c: PartnerChannel): Promise<boolean>;
  makeKey(p: PartnerCtx, b: PartnerBrand): Promise<{ key: string; prefix: string }>;
  revokeKeys(workspaceId: string, brandId: string): Promise<void>;
  addLink(row: { workspace_id: string; brand_id: string; created_by: string; token_hash: string; expires_at: string }): Promise<void>;
  usage(workspaceId: string, brandId: string, from: Date, to: Date): Promise<Usage>;
}

export class BrandTaken extends Error {}

/** How long a connect link works after it's made. */
export const LINK_TTL_MS = 24 * 3600 * 1000;
/** The cookie that ties a claimed connect link to the browser that claimed it. */
export const CONNECT_COOKIE = "cb_connect";

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
/** 32 random bytes, so a link's token is long enough for the error log to redact it. */
export const newLinkToken = () => randomBytes(32).toString("base64url");

/** The brand behind an id, if the partner made it in its own workspace. Another workspace's brand, or one made in the
 *  app, is "not yours" (403); an id that isn't a brand is 404. */
export async function ownBrand(store: PartnerStore, p: PartnerCtx, id: string): Promise<PartnerBrand> {
  if (!isId(id)) throw new ApiError(404, "not_found", "Brand not found");
  const b = await store.brand(id.toLowerCase());
  if (!b) throw new ApiError(404, "not_found", "Brand not found");
  if (b.workspace_id !== p.workspaceId || !b.external_id) throw new ApiError(403, "forbidden", "This brand wasn't made with this partner key's workspace");
  return b;
}

/** What a brand's channels add up to: none yet, all signed in, or one needs reconnecting. */
export const brandStatus = (channels: PartnerChannel[]): "no_channels" | "connected" | "needs_reconnect" =>
  !channels.length ? "no_channels" : channels.some((c) => c.status === "reconnect") ? "needs_reconnect" : "connected";

export const brandOut = (b: PartnerBrand) => ({ id: b.id, name: b.name, domain: domainOf(b.website), external_id: b.external_id });

export function brandView(b: PartnerBrand, channels: PartnerChannel[]) {
  return { ...brandOut(b), status: brandStatus(channels), channels: channels.map((c) => ({ id: c.id, network: c.network, name: c.name, status: c.status })) };
}

/** Make a brand, once per external_id: the same external_id again answers 200 with the brand it already made. */
export async function createPartnerBrand(store: PartnerStore, p: PartnerCtx, input: { name: string; website: string | null; externalId: string }): Promise<{ status: 200 | 201; body: ReturnType<typeof brandOut> }> {
  const had = await store.brandByExternal(p.workspaceId, input.externalId);
  if (had) return { status: 200, body: brandOut(had) };
  try {
    return { status: 201, body: brandOut(await store.addBrand(p, input)) };
  } catch (e) {
    if (!(e instanceof BrandTaken)) throw e;
    // Two tries at once: the other one made it.
    const now = await store.brandByExternal(p.workspaceId, input.externalId);
    if (!now) throw new ApiError(409, "conflict", "A brand with this external_id is being made. Try again.");
    return { status: 200, body: brandOut(now) };
  }
}

export async function getPartnerBrand(store: PartnerStore, p: PartnerCtx, id: string) {
  const b = await ownBrand(store, p, id);
  return brandView(b, await store.channels(p.workspaceId, b.id));
}

/** Delete a brand: its keys and connect links stop working at once. */
export async function deletePartnerBrand(store: PartnerStore, p: PartnerCtx, id: string) {
  const b = await ownBrand(store, p, id);
  await store.revokeKeys(p.workspaceId, b.id);
  await store.removeBrand(p, b);
}

/** Disconnect one channel of the brand. A channel that isn't this brand's now (already disconnected, another brand's,
 *  or never there) is 404, so a retry after a disconnect that went through answers 404 too. */
export async function disconnectPartnerChannel(store: PartnerStore, p: PartnerCtx, brandId: string, channelId: string) {
  const b = await ownBrand(store, p, brandId);
  const gone = () => new ApiError(404, "not_found", "Channel not found");
  if (!isId(channelId)) throw gone();
  const c = (await store.channels(p.workspaceId, b.id)).find((x) => x.id === channelId.toLowerCase());
  if (!c) throw gone();
  // Two disconnects at once: the other one did it.
  if (!(await store.removeChannel(p, b, c))) throw gone();
}

export async function makeBrandKey(store: PartnerStore, p: PartnerCtx, id: string) {
  return store.makeKey(p, await ownBrand(store, p, id));
}

export async function revokeBrandKeysOf(store: PartnerStore, p: PartnerCtx, id: string) {
  const b = await ownBrand(store, p, id);
  await store.revokeKeys(p.workspaceId, b.id);
}

/** A one-time connect link for this brand. The token is only in the link; the store keeps its hash. */
export async function makeConnectLink(store: PartnerStore, p: PartnerCtx, id: string, appUrl: string, now = Date.now()) {
  const b = await ownBrand(store, p, id);
  const token = newLinkToken();
  const expires_at = new Date(now + LINK_TTL_MS).toISOString();
  await store.addLink({ workspace_id: p.workspaceId, brand_id: b.id, created_by: p.userId, token_hash: sha256(token), expires_at });
  return { url: `${appUrl.replace(/\/$/, "")}/connect/${token}`, expires_at };
}

export async function brandUsage(store: PartnerStore, p: PartnerCtx, id: string, m: { month: string; from: Date; to: Date }) {
  const b = await ownBrand(store, p, id);
  const u = await store.usage(p.workspaceId, b.id, m.from, m.to);
  // tasks: what a partner bills or caps by, one for each post that went out on one channel.
  return { brand_id: b.id, external_id: b.external_id, month: m.month, tasks: u.posts_published, ...u };
}

// Connect links

export type LinkProblem = "gone" | "expired" | "ended" | "claimed" | null;

/**
 * Whether this browser may use the link now. `browser` is the hash of the secret in this browser's cookie, or null.
 * A link no browser has claimed yet can be claimed (null); once claimed, only that browser may use it.
 */
export function linkProblem(link: ConnectLink | null, browser: string | null, now = Date.now()): LinkProblem {
  if (!link) return "gone";
  if (link.ended_at) return "ended";
  if (new Date(link.expires_at).getTime() <= now) return "expired";
  if (link.browser_hash && link.browser_hash !== browser) return "claimed";
  return null;
}

/** What the page says for each problem. */
export const LINK_MESSAGES: Record<Exclude<LinkProblem, null>, { title: string; line: string }> = {
  gone: { title: "This link doesn't work", line: "Ask for a new link." },
  expired: { title: "This link expired", line: "Links work for 24 hours. Ask for a new one." },
  ended: { title: "You're all set", line: "This link is closed. Ask for a new one to connect more accounts." },
  claimed: { title: "This link was already used", line: "It works only in the browser that opened it first. Ask for a new one." },
};

/** The connect cookie: "<link id>.<browser secret>". */
export function readConnectCookie(v: string | null | undefined): { linkId: string; secret: string } | null {
  if (!v) return null;
  const at = v.indexOf(".");
  const linkId = v.slice(0, at);
  const secret = v.slice(at + 1);
  if (at < 0 || !isId(linkId) || !/^[A-Za-z0-9_-]{43}$/.test(secret)) return null;
  return { linkId: linkId.toLowerCase(), secret };
}
