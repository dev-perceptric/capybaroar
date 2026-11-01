import "server-only";
import { open, seal } from "./crypto";
import { adminClient } from "./supabase/server";
import { assertCanAddChannel, newChannelCount } from "./billing";
import type { NetworkId } from "./networks";
import type { Account, Secret } from "./providers/types";

/** A connected account: one LinkedIn profile, one Facebook Page, one TikTok account. */
export type Channel = { id: string; network: NetworkId; account_id: string; name: string; username: string | null; avatar: string | null; status: "active" | "reconnect" };

export const appUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
export const redirectFor = (network: string) => `${appUrl()}/integrations/social/${network}`;

export async function listChannels(workspaceId: string): Promise<Channel[]> {
  const { data, error } = await adminClient().from("channels").select("id, network, account_id, name, username, avatar, status").eq("workspace_id", workspaceId).order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Channel[];
}

/** Save connected accounts. Reconnecting the same account updates it in place. */
export async function saveAccounts(workspaceId: string, network: NetworkId, accounts: Account[]) {
  await assertCanAddChannel(workspaceId, await newChannelCount(workspaceId, network, accounts.map((a) => a.accountId)));
  const db = adminClient();
  for (const a of accounts) {
    const { data: ch, error } = await db
      .from("channels")
      .upsert({ workspace_id: workspaceId, network, account_id: a.accountId, name: a.name, username: a.username ?? null, avatar: a.avatar ?? null, status: "active" }, { onConflict: "workspace_id,network,account_id" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const { error: e2 } = await db.from("channel_secrets").upsert({
      channel_id: ch.id,
      access_token: seal(a.accessToken),
      refresh_token: a.refreshToken ? seal(a.refreshToken) : null,
      expires_at: a.expiresAt?.toISOString() ?? null,
      extra: a.extra ?? {},
    });
    if (e2) throw new Error(e2.message);
  }
}

export async function readSecret(channelId: string): Promise<Secret> {
  const { data, error } = await adminClient().from("channel_secrets").select("access_token, refresh_token, expires_at, extra").eq("channel_id", channelId).single();
  if (error) throw new Error(error.message);
  return {
    accessToken: open(data.access_token),
    refreshToken: data.refresh_token ? open(data.refresh_token) : null,
    expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    extra: (data.extra ?? {}) as Record<string, unknown>,
  };
}

export async function writeSecret(channelId: string, s: { accessToken: string; refreshToken?: string | null; expiresAt?: Date | null }) {
  const { error } = await adminClient()
    .from("channel_secrets")
    .update({ access_token: seal(s.accessToken), refresh_token: s.refreshToken ? seal(s.refreshToken) : null, expires_at: s.expiresAt?.toISOString() ?? null })
    .eq("channel_id", channelId);
  if (error) throw new Error(error.message);
}
