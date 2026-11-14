import "server-only";
import { adminClient } from "./supabase/server";
import { readSecret } from "./channels";
import { providerOf } from "./providers";
import { supabaseStore } from "./runner";
import type { Secret } from "./providers/types";
import { record, snippet } from "./auditActor";
import { checkUnpublish, planOf, unpublishTargets, type Asker, type ChannelResult, type PlanItem, type UnpublishStore, type UnpublishTarget } from "./unpublisher";

// Delete everywhere, on the real workspace: the rules are in unpublisher.ts.

type Chan = { network: string; account_id: string; name: string; status: string };
type Row = {
  id: string;
  status: string;
  brand_id: string | null;
  text: string;
  media_ids: string[] | null;
  post_targets: { id: string; channel_id: string; status: string; remote_id: string | null; url: string | null; text: string | null; published_at: string | null; deleted_at: string | null; parts: { id: string; url: string | null }[] | null; channels: Chan | Chan[] | null }[];
};

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

async function load(workspaceId: string, postId: string, by: Asker) {
  const { data, error } = await adminClient()
    .from("posts")
    .select("id, status, brand_id, text, media_ids, post_targets(id, channel_id, status, remote_id, url, text, published_at, deleted_at, parts, channels(network, account_id, name, status))")
    .eq("id", postId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const p = data as Row | null;
  checkUnpublish(p && { status: p.status, brandId: p.brand_id }, by);
  const targets: UnpublishTarget[] = p!.post_targets.flatMap((t) => {
    const c = one(t.channels);
    if (!c) return [];
    return [
      {
        id: t.id,
        postId: p!.id,
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
        text: t.text ?? p!.text,
        media: (p!.media_ids ?? []).length,
        parts: t.parts ?? [],
      },
    ];
  });
  return targets;
}

const store: UnpublishStore = {
  secret: (channelId, p) => supabaseStore.secret(channelId, p),
  async deleted(targetId, at) {
    const { error } = await adminClient().from("post_targets").update({ deleted_at: at.toISOString() }).eq("id", targetId).is("deleted_at", null);
    if (error) throw new Error(error.message);
  },
  reconnect: (channelId) => supabaseStore.reconnect(channelId),
  async postDeleted(postId) {
    const { error } = await adminClient().from("posts").update({ status: "deleted", updated_at: new Date().toISOString() }).eq("id", postId);
    if (error) throw new Error(error.message);
  },
};

/** The channels a published post went out on, for the delete dialog: already deleted, or why it's done in the app. */
export async function unpublishPlan(workspaceId: string, postId: string, by: Asker): Promise<PlanItem[]> {
  const targets = await load(workspaceId, postId, by);
  const secrets = new Map<string, Secret | null>();
  await Promise.all(
    targets.map(async (t) => {
      if (providerOf(t.network)?.unpublishable) secrets.set(t.channelId, await readSecret(t.channelId).catch(() => null));
    }),
  );
  // Networks that don't look at the tokens to decide get an empty secret: reading it isn't needed.
  const empty: Secret = { accessToken: "", refreshToken: null, expiresAt: null, extra: {} };
  return planOf(targets, providerOf, (t) => (secrets.has(t.channelId) ? secrets.get(t.channelId)! : empty));
}

/**
 * Delete a published post on the channels picked ("all": every channel it went out on), side by side. The post's row
 * stays: once every channel is deleted its status is "deleted". `deletePost` removes the row (Remove from Capybaroar).
 */
export async function unpublishPost(workspaceId: string, postId: string, channelIds: string[] | "all", by: Asker): Promise<{ results: ChannelResult[]; postDeleted: boolean }> {
  const targets = await load(workspaceId, postId, by);
  const out = await unpublishTargets(store, providerOf, targets, channelIds);
  // Only channels deleted by this request: ones deleted before keep their deleted_at.
  const before = new Set(targets.filter((t) => t.deletedAt).map((t) => t.channelId));
  const now = out.results.filter((r) => r.result === "deleted" && !before.has(r.channelId));
  if (now.length)
    await record({
      workspaceId,
      action: "post.deleted_everywhere",
      target: { type: "post", id: postId, label: snippet(targets[0]?.text ?? "") },
      meta: { channels: now.map((r) => r.channelName), ...(out.results.some((r) => r.result === "failed") ? { failed: out.results.filter((r) => r.result === "failed").map((r) => r.channelName) } : {}) },
    });
  return out;
}
