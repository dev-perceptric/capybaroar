// White-label connect, the pure half: a partner (Morning Telos) shows its own connect page and sends its customer
// straight to a network's sign-in. No Capybaroar page is ever shown: the start answers the network's own sign-in
// address, the callback sends the person back to the partner's return_url (on an allowed host) with cb_status, and
// a network that shares several Pages or accounts is picked through the partner API. Sign-ins and picks are random,
// kept only as hashes, used once, 30 minutes, and tied to the brand and the partner's workspace. It runs on a
// ConnectStore, so tests drive it with an in-memory one; src/lib/partnerConnect.ts is the Supabase store.
import { randomBytes, randomUUID } from "node:crypto";
import { ApiError, partnerConnectInput, partnerPickInput } from "./api/input";
import type { PartnerCtx } from "./api/keyRules";
import { networkOf, type NetworkId } from "./networks";
import { ownBrand, sha256, type PartnerChannel, type PartnerStore } from "./partnerRules";
import { NoAccounts, type Account } from "./providers/types";

/** How long a started sign-in can be finished, and how long its pick waits. */
export const CONNECT_TTL_MS = 30 * 60 * 1000;
export const PICK_TTL_MS = 30 * 60 * 1000;

/** Networks where the person picks from Pages, business accounts or channels they manage after signing in. They may
 *  come back with cb_status=pick. The rest connect the one account that signed in. */
const PAGE_NETWORKS: readonly string[] = ["linkedin-page", "facebook", "instagram", "youtube", "gbp"];
export type NetworkKind = "profile" | "page";
export const kindOf = (id: string): NetworkKind => (PAGE_NETWORKS.includes(id) ? "page" : "profile");

/** GET /api/partner/networks: the one-click networks set up on this server. */
export const partnerNetworkList = (ids: readonly NetworkId[]) => ({ networks: ids.map((id) => ({ id, name: networkOf(id).name, kind: kindOf(id) })) });

/** Why a white-label sign-in didn't connect, as the short code in the return_url's `reason`. */
export type ConnectReason = "cancelled" | "failed" | "expired" | "used" | "no_accounts" | "taken" | "plan_limit";

/** A connect the app turns down: the account is in another brand (taken) or the plan has no room (plan_limit). */
export class ConnectRefused extends Error {
  constructor(
    public reason: "taken" | "plan_limit",
    message: string,
  ) {
    super(message);
  }
}

/** One started sign-in, as the store gives it back (never its hashes or what was kept for the exchange). */
export type ConnectSession = {
  id: string;
  workspace_id: string;
  brand_id: string;
  created_by: string;
  network: string;
  return_url: string;
  expires_at: string;
  used_at: string | null;
  pick_expires_at: string | null;
  picked_at: string | null;
};

/** What the exchange needs from the start: the PKCE verifier and any values the network's sign-in asked to keep. */
export type Kept = { verifier: string; input: Record<string, string> };

export type NewSession = { id: string; workspace_id: string; brand_id: string; created_by: string; key_id: string; network: string; return_url: string; state_hash: string; expires_at: string };

export interface ConnectStore {
  add(row: NewSession, kept: Kept): Promise<void>;
  byState(stateHash: string): Promise<ConnectSession | null>;
  /** Use the sign-in, once and before it expires. Null when another request used it first (or it expired). */
  use(id: string, now: Date): Promise<Kept | null>;
  /** Keep the accounts the network shared until the partner picks (the Supabase store seals them). */
  setPick(id: string, pickHash: string, accounts: Account[], expiresAt: string): Promise<void>;
  byPick(pickHash: string): Promise<(ConnectSession & { accounts: Account[] }) | null>;
  /** Use the pick, once and before it expires. False when another request used it first. */
  usePick(id: string, now: Date): Promise<boolean>;
}

/** The app's side of finishing: the network's exchange, the checks the normal flow makes, and saving the channels
 *  (saveAccounts, which also sends the partner webhook's channel.connected). */
export type FinishDeps = {
  exchange: (network: string, code: string, kept: Kept) => Promise<Account[]>;
  /** Throws ConnectRefused when the accounts can't go into this brand. */
  check: (s: ConnectSession, accounts: Account[]) => Promise<void>;
  save: (s: ConnectSession, accounts: Account[]) => Promise<PartnerChannel[]>;
  log?: (message: string) => void;
};

/** 32 random bytes: a sign-in's state and a pick token. */
export const newConnectToken = () => randomBytes(32).toString("base64url");
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** The partner's return_url with cb_status and the rest set; anything already in its query stays. */
export function returnTo(url: string, params: Record<string, string>): string {
  const u = new URL(url);
  for (const k of ["cb_status", "network", "reason", "pick"]) u.searchParams.delete(k);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

const expired = (at: string | null, now: number) => !at || new Date(at).getTime() <= now;

/**
 * POST /api/partner/brands/{id}/connect/start: { network, return_url } -> { url }, the network's own sign-in address.
 * Only the state's hash is kept; the state itself is only in that address.
 */
export async function startPartnerConnect(
  store: PartnerStore,
  cs: ConnectStore,
  p: PartnerCtx,
  brandId: string,
  body: unknown,
  o: { networks: readonly string[]; hosts: readonly string[]; authUrl: (network: string, state: string, verifier: string) => Promise<{ url: string; keep: Record<string, string> }>; now?: number },
): Promise<{ url: string }> {
  const b = await ownBrand(store, p, brandId);
  const input = partnerConnectInput(body, o.networks, o.hosts);
  const state = newConnectToken();
  const verifier = randomBytes(32).toString("base64url");
  const { url, keep } = await o.authUrl(input.network, state, verifier);
  await cs.add(
    {
      id: randomUUID(),
      workspace_id: p.workspaceId,
      brand_id: b.id,
      created_by: p.userId,
      key_id: p.keyId,
      network: input.network,
      return_url: input.returnUrl,
      state_hash: sha256(state),
      expires_at: new Date((o.now ?? Date.now()) + CONNECT_TTL_MS).toISOString(),
    },
    { verifier, input: keep },
  );
  return { url };
}

/** A network's own error code, as one of ours: its text is never passed on. */
const networkReason = (code: string): ConnectReason => (code === "access_denied" || code === "user_cancelled_login" || code === "user_cancelled_authorize" ? "cancelled" : "failed");

/**
 * The network's callback, when the state is a white-label sign-in: where to send the person (302), always the
 * partner's return_url. Null when the state isn't one (a sign-in from the app or a connect link), so the callback
 * goes on as before.
 */
export async function partnerCallback(cs: ConnectStore, q: { network: string; state: string | null; code: string | null; error: string | null }, d: FinishDeps & { now?: number }): Promise<string | null> {
  if (!q.state || !TOKEN.test(q.state)) return null;
  const s = await cs.byState(sha256(q.state));
  if (!s) return null;
  const back = (params: Record<string, string>) => returnTo(s.return_url, { network: s.network, ...params });
  const error = (reason: ConnectReason) => back({ cb_status: "error", reason });
  try {
    return await finishSession(cs, s, q, d, back, error);
  } catch (e) {
    // Once the state is the partner's, the person always goes back to the partner's page, never to Capybaroar's.
    d.log?.(`callback failed: ${e instanceof Error ? e.message : String(e)}`);
    return error("failed");
  }
}

async function finishSession(
  cs: ConnectStore,
  s: ConnectSession,
  q: { network: string; code: string | null; error: string | null },
  d: FinishDeps & { now?: number },
  back: (params: Record<string, string>) => string,
  error: (reason: ConnectReason) => string,
): Promise<string> {
  const now = d.now ?? Date.now();
  if (s.used_at) return error("used");
  if (expired(s.expires_at, now)) return error("expired");
  // Used up first, whatever happens next: a state works once.
  const kept = await cs.use(s.id, new Date(now));
  if (!kept) return error("used");
  if (q.network !== s.network) return error("failed");
  if (q.error) return error(networkReason(q.error));
  if (!q.code) return error("failed");
  let accounts: Account[];
  try {
    accounts = await d.exchange(s.network, q.code, kept);
  } catch (e) {
    if (e instanceof NoAccounts) return error("no_accounts");
    d.log?.(`sign-in didn't finish: ${e instanceof Error ? e.message : String(e)}`);
    return error("failed");
  }
  if (!accounts.length) return error("no_accounts");
  if (accounts.length > 1) {
    const pick = newConnectToken();
    await cs.setPick(s.id, sha256(pick), accounts, new Date(now + PICK_TTL_MS).toISOString());
    return back({ cb_status: "pick", pick });
  }
  try {
    await d.check(s, accounts);
    await d.save(s, accounts);
  } catch (e) {
    if (e instanceof ConnectRefused) return error(e.reason);
    d.log?.(`couldn't save the channel: ${e instanceof Error ? e.message : String(e)}`);
    return error("failed");
  }
  return back({ cb_status: "connected" });
}

/** The pick behind a token, if it's this partner's. Another workspace's pick reads as not found. */
async function pickOf(store: PartnerStore, cs: ConnectStore, p: PartnerCtx, token: string, now: number) {
  const gone = new ApiError(404, "not_found", "Pick not found");
  if (!TOKEN.test(token)) throw gone;
  const s = await cs.byPick(sha256(token));
  if (!s || s.workspace_id !== p.workspaceId) throw gone;
  // The brand must still be one this partner made.
  await ownBrand(store, p, s.brand_id);
  if (s.picked_at) throw new ApiError(410, "used", "This pick was already used. Start connecting again.");
  if (expired(s.pick_expires_at, now)) throw new ApiError(410, "expired", "This pick expired. Start connecting again.");
  return s;
}

/** GET /api/partner/connect/pick/{token}: the Pages or accounts the person can connect. Never their tokens. */
export async function pickOptions(store: PartnerStore, cs: ConnectStore, p: PartnerCtx, token: string, now = Date.now()) {
  const s = await pickOf(store, cs, p, token, now);
  return { network: s.network, options: s.accounts.map((a) => ({ id: a.accountId, name: a.name, ...(a.avatar ? { picture: a.avatar } : {}) })) };
}

/** POST /api/partner/connect/pick/{token}: { ids } connects those, with the same checks as any connect. Once. */
export async function pickConnect(store: PartnerStore, cs: ConnectStore, p: PartnerCtx, token: string, body: unknown, d: Pick<FinishDeps, "check" | "save">, now = Date.now()): Promise<{ channels: PartnerChannel[] }> {
  const s = await pickOf(store, cs, p, token, now);
  const ids = partnerPickInput(body);
  const chosen = ids.map((id) => s.accounts.find((a) => a.accountId === id));
  if (chosen.some((a) => !a)) throw new ApiError(422, "invalid_request", "ids must be option ids from this pick");
  const accounts = chosen as Account[];
  try {
    await d.check(s, accounts);
  } catch (e) {
    if (e instanceof ConnectRefused) throw new ApiError(409, e.reason, e.message);
    throw e;
  }
  if (!(await cs.usePick(s.id, new Date(now)))) throw new ApiError(410, "used", "This pick was already used. Start connecting again.");
  return { channels: await d.save(s, accounts) };
}
