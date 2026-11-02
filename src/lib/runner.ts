import "server-only";
import { hostname } from "node:os";
import { adminClient } from "./supabase/server";
import { readSecret, writeSecret } from "./channels";
import { mediaFiles } from "./media";
import { settlePost } from "./posts";
import { providerOf } from "./providers";
import { AuthError, type Provider, type Secret } from "./providers/types";
import { STATS_AFTER_MIN, runDue, type Job, type Store, type TargetCtx } from "./publisher";
import { enqueue } from "./jobs";
import { sendAlert } from "./alerts";

// Runs inside the web server: every 15 seconds it publishes due posts, and once an hour it refreshes tokens that
// expire soon and records follower counts.
const WORKER = `${hostname()}:${process.pid}`;

const canRefresh = (p: Provider, s: Secret) => (p.refreshable ? p.refreshable(s) : Boolean(s.refreshToken));

type Row = {
  id: string;
  status: string;
  remote_id: string | null;
  post_id: string;
  workspace_id: string;
  channel_id: string;
  text: string | null;
  settings: Record<string, string> | null;
  posts: { text: string; media_ids: string[] };
  channels: { network: string; account_id: string; name: string; status: string };
};

export const supabaseStore: Store = {
  async claim(worker, n) {
    const { data, error } = await adminClient().rpc("claim_jobs", { worker, n });
    if (error) throw new Error(error.message);
    return (data ?? []) as Job[];
  },
  async jobDone(id, error) {
    await adminClient().from("jobs").update({ done_at: new Date().toISOString(), locked_at: null, last_error: error }).eq("id", id);
  },
  async jobRetry(id, runAfter, error) {
    await adminClient().from("jobs").update({ run_after: runAfter.toISOString(), locked_at: null, last_error: error }).eq("id", id);
  },
  async target(id) {
    const { data } = await adminClient()
      .from("post_targets")
      .select("id, status, remote_id, post_id, workspace_id, channel_id, text, settings, posts(text, media_ids), channels(network, account_id, name, status)")
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    const r = data as unknown as Row;
    return {
      id: r.id,
      status: r.status,
      remoteId: r.remote_id,
      postId: r.post_id,
      workspaceId: r.workspace_id,
      channelId: r.channel_id,
      channelName: r.channels.name,
      channelStatus: r.channels.status,
      network: r.channels.network,
      accountId: r.channels.account_id,
      text: r.text ?? r.posts.text,
      settings: r.settings ?? {},
      mediaIds: r.posts.media_ids ?? [],
    };
  },
  async publishing(t) {
    const db = adminClient();
    await db.from("posts").update({ status: "publishing" }).eq("id", t.postId).eq("status", "scheduled");
    await db.from("post_targets").update({ status: "publishing", error: null }).eq("id", t.id);
  },
  async published(t, out) {
    const { error } = await adminClient()
      .from("post_targets")
      .update({ status: "published", remote_id: out.id, url: out.url ?? null, note: out.note ?? null, error: null, published_at: new Date().toISOString() })
      .eq("id", t.id);
    if (error) throw new Error(error.message);
  },
  async retrying(targetId, error) {
    await adminClient().from("post_targets").update({ status: "pending", error }).eq("id", targetId).neq("status", "published");
  },
  async failed(targetId, error) {
    const { data } = await adminClient().from("post_targets").update({ status: "failed", error }).eq("id", targetId).neq("status", "published").select("id").maybeSingle();
    return data ? supabaseStore.target(targetId) : null;
  },
  async reconnect(channelId) {
    await adminClient().from("channels").update({ status: "reconnect" }).eq("id", channelId);
  },
  settle: settlePost,
  async secret(channelId, p) {
    const s = await readSecret(channelId);
    if (p.refresh && canRefresh(p, s) && s.expiresAt && s.expiresAt.getTime() < Date.now() + 5 * 60000) {
      const next = await p.refresh(s);
      await writeSecret(channelId, next);
      return { ...s, accessToken: next.accessToken, refreshToken: next.refreshToken ?? null, expiresAt: next.expiresAt ?? null };
    }
    return s;
  },
  media: mediaFiles,
  alert: (kind: "post_failed" | "reconnect", t: TargetCtx, error: string) => sendAlert(kind, t, error),
  async statsLater(t) {
    for (const min of STATS_AFTER_MIN) await enqueue("stats", { targetId: t.id }, new Date(Date.now() + min * 60000));
  },
  async saveStats(t, st) {
    const n = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? null : Math.round(v));
    const { error } = await adminClient()
      .from("post_metrics")
      .upsert({
        target_id: t.id,
        workspace_id: t.workspaceId,
        channel_id: t.channelId,
        fetched_at: new Date().toISOString(),
        views: n(st.views),
        reach: n(st.reach),
        impressions: n(st.impressions),
        likes: n(st.likes),
        comments: n(st.comments),
        shares: n(st.shares),
        saves: n(st.saves),
        clicks: n(st.clicks),
      });
    if (error) throw new Error(error.message);
  },
};

const BATCH = 5;
let started = false;
export function startRunner() {
  if (started) return;
  started = true;
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      // A full batch means more are due (posts at a popular time): keep going for up to a minute instead of waiting
      // 15 seconds per batch of 5.
      const until = Date.now() + 60000;
      while ((await runDue(supabaseStore, providerOf, WORKER, BATCH)) === BATCH && Date.now() < until);
    } catch (e) {
      console.error("runner:", e);
    } finally {
      busy = false;
    }
  };
  setInterval(tick, 15000);
  void tick();
  const hourly = () => upkeep().catch((e) => console.error("upkeep:", e));
  setInterval(hourly, 3600000);
  setTimeout(hourly, 30000);
  console.log(`runner started on ${WORKER}`);
}

/** Hourly: refresh tokens that expire within a week, and record today's follower counts. */
export async function upkeep() {
  const db = adminClient();
  const { data: chans } = await db.from("channels").select("id, workspace_id, network, account_id, name, status").eq("status", "active");
  const today = new Date().toISOString().slice(0, 10);
  const { data: done } = await db.from("metrics").select("channel_id").eq("day", today);
  const counted = new Set((done ?? []).map((r) => r.channel_id));
  for (const c of chans ?? []) {
    const p = providerOf(c.network);
    if (!p) continue;
    try {
      const s = await readSecret(c.id);
      if (p.refresh && canRefresh(p, s) && s.expiresAt && s.expiresAt.getTime() < Date.now() + 7 * 86400000) await writeSecret(c.id, await p.refresh(s));
      if (p.followers && !counted.has(c.id)) {
        const followers = await p.followers(await readSecret(c.id), c.account_id);
        if (followers != null) await db.from("metrics").upsert({ channel_id: c.id, workspace_id: c.workspace_id, day: today, followers });
      }
    } catch (e) {
      if (e instanceof AuthError) {
        await db.from("channels").update({ status: "reconnect" }).eq("id", c.id);
        await sendAlert("reconnect", { channelId: c.id, workspaceId: c.workspace_id, channelName: c.name, network: c.network } as TargetCtx, e.message);
      }
      console.error(`upkeep ${c.network}:`, e instanceof Error ? e.message : e);
    }
  }
}
