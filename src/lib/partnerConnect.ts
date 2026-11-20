import "server-only";
import { adminClient } from "./supabase/server";
import { open, seal } from "./crypto";
import { assertCanAddChannel, newChannelCount } from "./billing";
import { redirectFor, saveAccounts } from "./channels";
import { ApiError, returnHosts } from "./api/input";
import { PROVIDERS, providerOf } from "./providers";
import type { NetworkId } from "./networks";
import type { Account } from "./providers/types";
import { ConnectRefused, type ConnectSession, type ConnectStore, type FinishDeps, type Kept } from "./partnerConnectRules";

// White-label connect on the real database (rules in partnerConnectRules.ts, table in 051_partner_connect.sql).
// What the exchange needs and the accounts waiting for a pick hold tokens, so both are sealed, bound to the row.

const COLS = "id, workspace_id, brand_id, created_by, network, return_url, expires_at, used_at, pick_expires_at, picked_at";
const aad = (id: string) => `partner_connect:${id}`;
const busy = () => new ApiError(503, "unavailable", "Couldn't reach the database just now. Try again in a moment.");

type StoredAccount = Omit<Account, "expiresAt"> & { expiresAt?: string | null };
const toStored = (a: Account): StoredAccount => ({ ...a, expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null });
const fromStored = (a: StoredAccount): Account => ({ ...a, expiresAt: a.expiresAt ? new Date(a.expiresAt) : null });

export const connectStore: ConnectStore = {
  async add(row, kept) {
    const { error } = await adminClient()
      .from("partner_connects")
      .insert({ ...row, kept: seal(JSON.stringify(kept), aad(row.id)) });
    if (error) throw busy();
  },
  async byState(stateHash) {
    const { data, error } = await adminClient().from("partner_connects").select(COLS).eq("state_hash", stateHash).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ConnectSession | null) ?? null;
  },
  async use(id, now) {
    const { data, error } = await adminClient()
      .from("partner_connects")
      .update({ used_at: now.toISOString() })
      .eq("id", id)
      .is("used_at", null)
      .gt("expires_at", now.toISOString())
      .select("id, kept")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return JSON.parse(open(data.kept as string, aad(id))) as Kept;
  },
  async setPick(id, pickHash, accounts, expiresAt) {
    const { error } = await adminClient()
      .from("partner_connects")
      .update({ pick_hash: pickHash, pick_expires_at: expiresAt, pick_accounts: seal(JSON.stringify(accounts.map(toStored)), aad(id)) })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
  async byPick(pickHash) {
    const { data, error } = await adminClient().from("partner_connects").select(`${COLS}, pick_accounts`).eq("pick_hash", pickHash).maybeSingle();
    if (error) throw busy();
    if (!data) return null;
    const { pick_accounts, ...s } = data as ConnectSession & { pick_accounts: string | null };
    const accounts = pick_accounts ? (JSON.parse(open(pick_accounts, aad(s.id))) as StoredAccount[]).map(fromStored) : [];
    return { ...s, accounts };
  },
  async usePick(id, now) {
    // The network tokens go with it: the chosen ones are in channel_secrets from here on.
    const { data, error } = await adminClient()
      .from("partner_connects")
      .update({ picked_at: now.toISOString(), pick_accounts: null })
      .eq("id", id)
      .is("picked_at", null)
      .gt("pick_expires_at", now.toISOString())
      .select("id")
      .maybeSingle();
    if (error) throw busy();
    return !!data;
  },
};

/** PARTNER_RETURN_HOSTS: where a white-label sign-in may send people back. */
export const partnerReturnHosts = () => returnHosts(process.env.PARTNER_RETURN_HOSTS);

/** The network's sign-in address for a white-label start, on the same callback as every other sign-in. */
export async function partnerAuthUrl(network: string, state: string, verifier: string): Promise<{ url: string; keep: Record<string, string> }> {
  const oauth = PROVIDERS[network as NetworkId]?.oauth;
  if (!oauth?.configured()) throw new ApiError(422, "invalid_request", "This network isn't set up");
  const r = await oauth.authUrl({ state, verifier, redirect: redirectFor(network), input: {} });
  return typeof r === "string" ? { url: r, keep: {} } : { url: r.url, keep: r.keep };
}

/** The same checks as a connect link: an account already in another brand of the workspace stays there, and the
 *  plan's channel limit holds. */
async function check(s: ConnectSession, accounts: Account[]) {
  const ids = accounts.map((a) => a.accountId);
  const { data: taken, error } = await adminClient().from("channels").select("brand_id").eq("workspace_id", s.workspace_id).eq("network", s.network).in("account_id", ids);
  if (error) throw new Error(error.message);
  if ((taken ?? []).some((t) => t.brand_id !== s.brand_id)) throw new ConnectRefused("taken", "This account is already connected to another brand");
  try {
    await assertCanAddChannel(s.workspace_id, await newChannelCount(s.workspace_id, s.network, ids));
  } catch (e) {
    throw new ConnectRefused("plan_limit", e instanceof Error ? e.message : String(e));
  }
}

export const partnerFinish: FinishDeps = {
  async exchange(network, code, kept) {
    const oauth = providerOf(network)?.oauth;
    if (!oauth) throw new Error("This network isn't set up");
    return oauth.exchange({ code, verifier: kept.verifier, redirect: redirectFor(network), input: kept.input });
  },
  check,
  // saveAccounts also tells the partner webhook (channel.connected).
  async save(s, accounts) {
    const saved = await saveAccounts(s.workspace_id, s.network as NetworkId, accounts, s.brand_id);
    return saved.map((c) => ({ id: c.id, network: c.network, name: c.name, status: "active" as const }));
  },
  log: (m) => console.error("[partner-connect]", m),
};
