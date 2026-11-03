import "server-only";
import { hostname } from "node:os";
import { adminClient } from "./supabase/server";
import { readSecret, writeSecret } from "./channels";
import { mediaFiles } from "./media";
import { settlePost } from "./posts";
import { providerOf } from "./providers";
import { AuthError, type Provider, type Secret } from "./providers/types";
import { STATS_AFTER_MIN, runDue, runInbox, type Job, type Store, type TargetCtx } from "./publisher";
import { enqueue } from "./jobs";
import { sendAlert } from "./alerts";

// Runs inside the web server: every 15 seconds it publishes due posts and runs Inbox reads, every 10 minutes it
// queues an Inbox read for each channel that has one, and once an hour it refreshes tokens that expire soon and
// records follower counts.
const WORKER = `${hostname()}:${process.pid}`;

const canRefresh = (p: Provider, s: Secret) => (p.refreshable ? p.refreshable(s) : Boolean(s.refreshToken));

type Row = {
  id: string;
  status: string;
  remote_id: string | null;
  deleted_at: string | null;
  post_id: string;
  workspace_id: string;
  channel_id: string;
  text: string | null;
  settings: Record<string, string> | null;
  posts: { text: string; media_ids: string[]; status: string };
  channels: { network: string; account_id: string; name: string; status: string };
};

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

export const supabaseStore: Store = {
  async claim(worker, n) {
    const { data, error } = await adminClient().rpc("claim_jobs", { worker, n });
    if (error) throw new Error(error.message);
    return (data ?? []) as Job[];
  },
  async claimInbox(worker, n) {
    const { data, error } = await adminClient().rpc("claim_inbox_jobs", { worker, n });
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
      .select("id, status, remote_id, deleted_at, post_id, workspace_id, channel_id, text, settings, posts(text, media_ids, status), channels(network, account_id, name, status)")
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    const r = data as unknown as Row;
    return {
      id: r.id,
      status: r.status,
      remoteId: r.remote_id,
      postId: r.post_id,
      postStatus: r.posts.status,
      workspaceId: r.workspace_id,
      channelId: r.channel_id,
      channelName: r.channels.name,
      channelStatus: r.channels.status,
      network: r.channels.network,
      accountId: r.channels.account_id,
      text: r.text ?? r.posts.text,
      settings: r.settings ?? {},
      mediaIds: r.posts.media_ids ?? [],
      deletedAt: r.deleted_at,
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
  async inboxChannel(id) {
    const { data } = await adminClient().from("channels").select("id, workspace_id, network, account_id, name, status, inbox_state(cursor, fetched_at)").eq("id", id).maybeSingle();
    if (!data) return null;
    const st = one(data.inbox_state as { cursor: string | null; fetched_at: string | null } | { cursor: string | null; fetched_at: string | null }[] | null);
    return {
      id: data.id as string,
      workspaceId: data.workspace_id as string,
      name: data.name as string,
      network: data.network as string,
      accountId: data.account_id as string,
      status: data.status as string,
      cursor: st?.cursor ?? null,
      fetchedAt: st?.fetched_at ? new Date(st.fetched_at) : null,
    };
  },
  async threadsOf(channelId, networkIds) {
    const out = new Map<string, string>();
    for (let i = 0; i < networkIds.length; i += 200) {
      const { data, error } = await adminClient().from("inbox_items").select("network_id, thread_id").eq("channel_id", channelId).in("network_id", networkIds.slice(i, i + 200));
      if (error) throw new Error(error.message);
      for (const r of data ?? []) out.set(r.network_id as string, r.thread_id as string);
    }
    return out;
  },
  async saveInbox(c, rows, cursor, at) {
    const db = adminClient();
    // Our own posts, so an item links to the post it's under.
    const remote = [...new Set(rows.map((r) => r.postRemoteId).filter((v): v is string => !!v))];
    const targets = new Map<string, string>();
    for (let i = 0; i < remote.length; i += 200) {
      const { data, error } = await db.from("post_targets").select("id, remote_id").eq("channel_id", c.id).in("remote_id", remote.slice(i, i + 200));
      if (error) throw new Error(error.message);
      for (const t of data ?? []) targets.set(t.remote_id as string, t.id as string);
    }
    const clip = (v: string | null | undefined, n: number) => (v == null ? null : v.slice(0, n));
    const records = rows.map((r) => ({
      workspace_id: c.workspaceId,
      channel_id: c.id,
      kind: r.kind,
      network_id: r.networkId,
      thread_id: r.threadId,
      parent_id: r.parentId ?? null,
      target_id: (r.postRemoteId && targets.get(r.postRemoteId)) || null,
      post_remote_id: r.postRemoteId ?? null,
      post_url: clip(r.postUrl, 2000),
      post_text: clip(r.postText, 2000),
      url: clip(r.url, 2000),
      author_id: r.authorId ?? null,
      author_name: (r.authorName || "").slice(0, 200),
      author_handle: clip(r.authorHandle, 200),
      author_avatar: clip(r.authorAvatar, 2000),
      text: r.text.slice(0, 10000),
      created_at: r.createdAt.toISOString(),
      fetched_at: at.toISOString(),
      mine: Boolean(r.mine),
      status: r.status,
      liked: Boolean(r.liked),
      hidden: Boolean(r.hidden),
      extra: r.extra ?? {},
    }));
    for (let i = 0; i < records.length; i += 500) {
      const { error } = await db.from("inbox_items").upsert(records.slice(i, i + 500), { onConflict: "channel_id,network_id", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }
    // The cursor moves only once the items are in: a failure above reads them again next round.
    const { error } = await db.from("inbox_state").upsert({ channel_id: c.id, cursor, fetched_at: at.toISOString(), error: null });
    if (error) throw new Error(error.message);
  },
  async closeThread(channelId, threadId, before) {
    const { error } = await adminClient().from("inbox_items").update({ status: "done" }).eq("channel_id", channelId).eq("thread_id", threadId).eq("status", "open").eq("mine", false).lt("created_at", before.toISOString());
    if (error) throw new Error(error.message);
  },
  async inboxError(channelId, error) {
    await adminClient().from("inbox_state").upsert({ channel_id: channelId, error: error.slice(0, 500) });
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
  let reading = false;
  const read = async () => {
    if (reading) return;
    reading = true;
    try {
      await runInbox(supabaseStore, providerOf, WORKER);
    } catch (e) {
      console.error("inbox:", e instanceof Error ? e.message : e);
    } finally {
      reading = false;
    }
  };
  setInterval(read, 15000);
  const queueReads = () => queueInbox().catch((e) => console.error("inbox queue:", e instanceof Error ? e.message : e));
  setInterval(queueReads, 600000);
  setTimeout(queueReads, 45000);
  const hourly = () => upkeep().catch((e) => console.error("upkeep:", e));
  setInterval(hourly, 3600000);
  setTimeout(hourly, 30000);
  console.log(`runner started on ${WORKER}`);
}

/**
 * Every 10 minutes: one Inbox read for each active channel whose network has an Inbox, unless one is waiting or ran
 * in the last 9 minutes (every server runs this, so the second one to look finds the first one's reads).
 */
export async function queueInbox() {
  const db = adminClient();
  const { data: chans, error } = await db.from("channels").select("id, network").eq("status", "active");
  if (error) throw new Error(error.message);
  const want = (chans ?? []).filter((c) => {
    const p = providerOf(c.network);
    return p?.inbox && (p.inbox.enabled ? p.inbox.enabled() : true);
  });
  const recent = new Date(Date.now() - 9 * 60000).toISOString();
  const { data: waiting, error: e1 } = await db.from("jobs").select("payload").eq("kind", "inbox").or(`done_at.is.null,done_at.gt."${recent}"`);
  if (e1) throw new Error(e1.message);
  const have = new Set((waiting ?? []).map((j) => (j.payload as { channelId?: string }).channelId));
  // Networks read less often than every round: skip channels read within their own interval.
  const slow = want.filter((c) => (providerOf(c.network)!.inbox!.every ?? 10) > 10);
  const lastRead = new Map<string, number>();
  for (let i = 0; i < slow.length; i += 200) {
    const { data } = await db.from("inbox_state").select("channel_id, fetched_at").in("channel_id", slow.slice(i, i + 200).map((c) => c.id));
    for (const r of data ?? []) if (r.fetched_at) lastRead.set(r.channel_id as string, new Date(r.fetched_at as string).getTime());
  }
  const due = (c: { id: string; network: string }) => Date.now() - (lastRead.get(c.id) ?? 0) >= ((providerOf(c.network)!.inbox!.every ?? 10) - 1) * 60000;
  const rows = want.filter((c) => !have.has(c.id) && due(c)).map((c) => ({ kind: "inbox", payload: { channelId: c.id } }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error: e } = await db.from("jobs").insert(rows.slice(i, i + 500));
    if (e) throw new Error(e.message);
  }
  // Finished reads are only history: keep an hour of them.
  await db.from("jobs").delete().eq("kind", "inbox").lt("done_at", new Date(Date.now() - 3600000).toISOString());
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
