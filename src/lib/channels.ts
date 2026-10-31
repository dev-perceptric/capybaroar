import type { NetworkId } from "./networks";

/** A connected account: one LinkedIn profile, one Facebook Page, one TikTok account. */
export type Channel = { id: string; network: NetworkId; name: string; avatar: string | null };

/** The workspace's connected channels. Reads from Supabase once sign-in is in. */
export function useChannels(): Channel[] {
  return [];
}
