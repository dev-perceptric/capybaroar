// Key kinds and what each one may do, the pure half of keys.ts, so tests cover every rule. A key is a prefix and 32
// random bytes (base64url, 43 characters). Only its hash is stored.
//
// - member  "cbr_..."         an app or agent acting as the person who made it (Settings > API).
// - partner "cb_partner_..."  another product (Morning Telos) making brands in its own workspace: /api/partner only.
// - brand   "cbr_brand_..."   one of the partner's customers: /api/v1 and MCP, as an editor of that one brand.
import { ApiError } from "./input";
import type { ApiCtx } from "./types";

export type KeyKind = "member" | "partner" | "brand";

export const KEY_PREFIX = "cbr_";
export const PARTNER_PREFIX = "cb_partner_";
export const BRAND_PREFIX = "cbr_brand_";
export const PREFIXES: Record<KeyKind, string> = { member: KEY_PREFIX, partner: PARTNER_PREFIX, brand: BRAND_PREFIX };

const BODY = "[A-Za-z0-9_-]{43}";
const SHAPES: [KeyKind, RegExp][] = [
  ["brand", new RegExp(`^cbr_brand_${BODY}$`)],
  ["partner", new RegExp(`^cb_partner_${BODY}$`)],
  ["member", new RegExp(`^cbr_${BODY}$`)],
];

/** The kinds a string could be, by its shape. A member key that happens to start with "brand_" also has the brand
 *  shape: the stored row's kind decides (keyKindMatches). */
export function keyKinds(v: string): KeyKind[] {
  return SHAPES.filter(([, re]) => re.test(v)).map(([k]) => k);
}

export const looksLikeKey = (v: string) => keyKinds(v).length > 0;

/** The stored row's kind must be one the key's shape allows. */
export const keyKindMatches = (key: string, stored: KeyKind) => keyKinds(key).includes(stored);

/** How many characters of a key the list shows, so people can tell keys apart. */
export const shownPrefix = (key: string) => key.slice(0, (PREFIXES[keyKinds(key)[0] ?? "member"] ?? KEY_PREFIX).length + 8);

/** The most member and partner keys in a workspace, and brand keys for one brand. */
export const MAX_KEYS = 25;
export const MAX_BRAND_KEYS = 5;

const unauthorized = (message: string) => new ApiError(401, "unauthorized", message);
const unavailable = () => new ApiError(503, "unavailable", "Couldn't check the key just now. Try again in a moment.");

export type KeyRow = { id: string; kind: KeyKind; workspace_id: string; user_id: string; brand_id: string | null };
export type MemberRow = { role: string; brand_ids: string[] | null; workspace: { name: string; timezone: string } };
export type BrandRow = { id: string; workspace_id: string; external_id: string | null };

/** What keyCtx and partnerCtx read about a key, so the rules can run on rows from a test. */
export type KeyLookup = {
  key(hash: string): Promise<KeyRow | null>;
  member(workspaceId: string, userId: string): Promise<MemberRow | null>;
  brand(id: string): Promise<BrandRow | null>;
};

const isManager = (role: string) => role === "owner" || role === "admin";

async function find(look: KeyLookup, key: string, hash: string): Promise<KeyRow> {
  let k: KeyRow | null;
  try {
    k = await look.key(hash);
  } catch {
    throw unavailable();
  }
  if (!k || !keyKindMatches(key, k.kind)) throw unauthorized("This API key was deleted or never existed");
  return k;
}

async function memberOf(look: KeyLookup, k: KeyRow): Promise<MemberRow | null> {
  try {
    return await look.member(k.workspace_id, k.user_id);
  } catch {
    throw unavailable();
  }
}

/**
 * The context for /api/v1 and MCP. Member keys act as their person with their role and brands. Brand keys act as an
 * editor of their one brand (draft and schedule, never members, billing, keys or webhooks), and stop working when
 * the person who made the partner key leaves or stops being an owner or admin. Partner keys are refused here.
 */
export async function keyContext(look: KeyLookup, key: string, hash: string): Promise<ApiCtx> {
  if (!looksLikeKey(key)) throw unauthorized("Send an API key from Settings as Authorization: Bearer cbr_...");
  const k = await find(look, key, hash);
  if (k.kind === "partner") throw new ApiError(403, "forbidden", "Partner keys work only on /api/partner. Make a brand key for this.");
  const m = await memberOf(look, k);
  if (!m) throw unauthorized("The person who made this key left the workspace");
  if (m.role === "client") throw new ApiError(403, "forbidden", "Clients can't use the API");
  const base = { keyId: k.id, workspaceId: k.workspace_id, workspaceName: m.workspace.name, timezone: m.workspace.timezone, userId: k.user_id };
  if (k.kind === "brand") {
    if (!isManager(m.role)) throw unauthorized("The person who made this key is no longer an owner or admin");
    let b: BrandRow | null;
    try {
      b = k.brand_id ? await look.brand(k.brand_id) : null;
    } catch {
      throw unavailable();
    }
    if (!b || b.workspace_id !== k.workspace_id) throw unauthorized("This key's brand was deleted");
    return { ...base, role: "editor", brandIds: [b.id], keyKind: "brand" };
  }
  const role = m.role as ApiCtx["role"];
  return { ...base, role, brandIds: isManager(role) ? null : (m.brand_ids ?? null), keyKind: "member" };
}

/** Who a partner key belongs to. */
export type PartnerCtx = { keyId: string; workspaceId: string; userId: string };

/** The context for /api/partner: a partner key whose maker is still an owner or admin of its workspace. */
export async function partnerContext(look: KeyLookup, key: string | null, hash: string): Promise<PartnerCtx> {
  if (!key) throw unauthorized("Send a partner key as Authorization: Bearer cb_partner_...");
  if (!keyKinds(key).includes("partner")) throw unauthorized("This isn't a partner key. Send one as Authorization: Bearer cb_partner_...");
  const k = await find(look, key, hash);
  if (k.kind !== "partner") throw unauthorized("This isn't a partner key");
  const m = await memberOf(look, k);
  if (!m) throw unauthorized("The person who made this key left the workspace");
  if (!isManager(m.role)) throw unauthorized("The person who made this key is no longer an owner or admin");
  return { keyId: k.id, workspaceId: k.workspace_id, userId: k.user_id };
}
