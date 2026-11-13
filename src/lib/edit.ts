import "server-only";
import { adminClient } from "./supabase/server";
import { providerOf } from "./providers";
import { supabaseStore } from "./runner";
import { editTargets, type EditChange, type EditResult, type EditStore, type EditTarget } from "./editor";
import type { Asker } from "./unpublisher";

// Edit a published post, on the real workspace: the rules are in editor.ts.

type Chan = { network: string; account_id: string; name: string; status: string };
type Row = {
  id: string;
  status: string;
  brand_id: string | null;
  text: string;
  media_ids: string[] | null;
  post_targets: { id: string; channel_id: string; status: string; remote_id: string | null; url: string | null; text: string | null; settings: Record<string, string> | null; published_at: string | null; deleted_at: string | null; channels: Chan | Chan[] | null }[];
};

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

async function load(workspaceId: string, postId: string, by: Asker): Promise<EditTarget[]> {
  const { data, error } = await adminClient()
    .from("posts")
    .select("id, status, brand_id, text, media_ids, post_targets(id, channel_id, status, remote_id, url, text, settings, published_at, deleted_at, channels(network, account_id, name, status))")
    .eq("id", postId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const p = data as Row | null;
  if (!p || (by.brandIds && (p.brand_id == null || !by.brandIds.includes(p.brand_id)))) throw new Error("Post not found");
  if (by.role === "client") throw new Error("Clients can only approve or reject posts");
  if (p.status !== "published" && p.status !== "partial") throw new Error("Only posts that went out can be edited here");
  return p.post_targets.flatMap((t) => {
    const c = one(t.channels);
    if (!c) return [];
    return [
      {
        id: t.id,
        postId: p.id,
        channelId: t.channel_id,
        channelName: c.name,
        channelStatus: c.status,
        network: c.network,
        accountId: c.account_id,
        status: t.status,
        remoteId: t.remote_id,
        url: t.url,
        publishedAt: t.published_at ? new Date(t.published_at) : null,
        deletedAt: t.deleted_at ? new Date(t.deleted_at) : null,
        text: t.text ?? p.text,
        settings: t.settings ?? {},
        media: (p.media_ids ?? []).length,
      },
    ];
  });
}

const store: EditStore = {
  secret: (channelId, p) => supabaseStore.secret(channelId, p),
  async saved(targetId, text, settings) {
    const { error } = await adminClient().from("post_targets").update({ text, settings }).eq("id", targetId);
    if (error) throw new Error(error.message);
  },
  reconnect: (channelId) => supabaseStore.reconnect(channelId),
};

/** Change a published post's text and allowed settings on each channel given. One result per change. */
export async function editPost(workspaceId: string, postId: string, changes: EditChange[], by: Asker): Promise<EditResult[]> {
  const targets = await load(workspaceId, postId, by);
  return editTargets(store, providerOf, targets, changes);
}
