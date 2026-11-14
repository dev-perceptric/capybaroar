import "server-only";
import { hostname } from "node:os";
import { adminClient } from "./supabase/server";
import { readSecret, writeSecret } from "./channels";
import { mediaFiles } from "./media";
import { settlePost } from "./posts";
import { providerOf } from "./providers";
import { AuthError, type Provider, type Published, type Secret } from "./providers/types";
import { takesThread } from "./networks";
import { threadOf, type StoredPart } from "./thread";
import { STATS_AFTER_MIN, runDue, runInbox, runJob, type Job, type Store, type TargetCtx } from "./publisher";
import { enqueue } from "./jobs";
import { sendAlert } from "./alerts";
import { deliverDue, emit, pruneDeliveries } from "./webhooks";
import { queueReports, runReport } from "./reports";
import { HeldJobs, keepHeld, onePerPeriod } from "./ops";
import { beat, cleanupOps, opsStore, trackError } from "./opsdb";
import { aiReady, runGenerations } from "./generations";
import { runAutoTopUps, sweepHolds } from "./credits";
import { runWorkspaceDelete } from "./workspaceDelete";
import { pruneOld } from "./prune";
import { runDataExport } from "./exports";

// Runs inside the web server: every 15 seconds it publishes due posts and runs Inbox reads, every 10 minutes it
// queues an Inbox read for each channel that has one, and once an hour it refreshes tokens that expire soon and
// records follower counts. Every server runs this: jobs are claimed under a lock (and kept locked while they run),
// and the 10-minute and hourly work goes to whichever server takes that period's turn (ops.ts).
const WORKER = `${hostname()}:${process.pid}`;
// Jobs claimed and still running, publish and stats apart from Inbox reads (each loop lets go of its own when it ends).
const held = new HeldJobs();
const heldInbox = new HeldJobs();
// Data exports run on their own claim and loop (037_exports.sql), one at a time.
const heldExports = new HeldJobs();

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
  parts: Published[] | null;
  posts: { text: string; media_ids: string[]; status: string; thread: StoredPart[] | null };
  channels: { network: string; account_id: string; name: string; status: string };
};

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

export const supabaseStore: Store = {
  async claim(worker, n) {
    const { data, error } = await adminClient().rpc("claim_jobs", { worker, n });
    if (error) throw new Error(error.message);
    held.hold((data ?? []).map((j: Job) => j.id));
    return (data ?? []) as Job[];
  },
  async claimInbox(worker, n) {
    const { data, error } = await adminClient().rpc("claim_inbox_jobs", { worker, n });
    if (error) throw new Error(error.message);
    heldInbox.hold((data ?? []).map((j: Job) => j.id));
    return (data ?? []) as Job[];
  },
  async jobDone(id, error) {
    held.release(id);
    heldInbox.release(id);
    await adminClient().from("jobs").update({ done_at: new Date().toISOString(), locked_at: null, last_error: error }).eq("id", id);
  },
  async jobRetry(id, runAfter, error) {
    held.release(id);
    heldInbox.release(id);
    await adminClient().from("jobs").update({ run_after: runAfter.toISOString(), locked_at: null, last_error: error }).eq("id", id);
  },
  async target(id) {
    const { data } = await adminClient()
      .from("post_targets")
      .select("id, status, remote_id, deleted_at, post_id, workspace_id, channel_id, text, settings, parts, posts(text, media_ids, status, thread), channels(network, account_id, name, status)")
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
      thread: takesThread(r.channels.network) ? threadOf(r.posts.thread) : [],
      parts: r.parts ?? [],
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
  async savePart(t, index, out) {
    const db = adminClient();
    const { data, error: e1 } = await db.from("post_targets").select("parts").eq("id", t.id).single();
    if (e1) throw new Error(e1.message);
    const parts = ((data?.parts as Published[] | null) ?? []).slice(0, index);
    // Only the part after the last saved one: a repeat of a saved part changes nothing.
    if (parts.length !== index) throw new Error(`Thread part ${index + 2} is out of order`);
    const { error } = await db.from("post_targets").update({ parts: [...parts, { id: out.id, url: out.url ?? null }] }).eq("id", t.id);
    if (error) throw new Error(error.message);
  },
  async threadStopped(t, error) {
    await adminClient().from("post_targets").update({ note: error }).eq("id", t.id);
  },
  async retrying(targetId, error) {
    await adminClient().from("post_targets").update({ status: "pending", error }).eq("id", targetId).neq("status", "published");
  },
  async failed(targetId, error) {
    const { data } = await adminClient().from("post_targets").update({ status: "failed", error }).eq("id", targetId).neq("status", "published").select("id").maybeSingle();
    return data ? supabaseStore.target(targetId) : null;
  },
  async reconnect(channelId) {
    // Webhooks hear about it once, when the channel changes, not on every try that finds it signed out.
    const { data } = await adminClient().from("channels").update({ status: "reconnect" }).eq("id", channelId).neq("status", "reconnect").select("id, workspace_id, name, network, brand_id");
    for (const c of data ?? []) await emit(c.workspace_id as string, "channel.reconnect", { channel_id: c.id, channel_name: c.name, network: c.network, brand_id: c.brand_id });
  },
  async event(type, t, extra) {
    const { data: p } = await adminClient().from("posts").select("brand_id").eq("id", t.postId).maybeSingle();
    await emit(t.workspaceId, type, {
      post_id: t.postId,
      brand_id: (p?.brand_id as string | null | undefined) ?? null,
      channel_id: t.channelId,
      channel_name: t.channelName,
      network: t.network,
      ...(type === "post.published" ? { url: extra.url ?? null } : { error: extra.error ?? null }),
    });
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
  report: runReport,
  deleteWorkspace: runWorkspaceDelete,
  dataExport: runDataExport,
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
      void trackError(e, "runner: publish");
    } finally {
      held.clear();
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
      void trackError(e, "runner: inbox");
    } finally {
      heldInbox.clear();
      reading = false;
    }
  };
  setInterval(read, 15000);
  // One server per period: the Inbox queue at most every 9 minutes, upkeep every 55 to 60 minutes (looked at every 5).
  const queueReads = () =>
    onePerPeriod(opsStore, "inbox_queue", 540, 600, WORKER, queueInbox).catch((e) => {
      console.error("inbox queue:", e instanceof Error ? e.message : e);
      void trackError(e, "runner: inbox queue");
    });
  setInterval(queueReads, 600000);
  setTimeout(queueReads, 45000);
  // Webhooks: their own loop, so a slow URL never holds up publishing.
  let hooking = false;
  const hooks = async () => {
    if (hooking) return;
    hooking = true;
    try {
      const until = Date.now() + 30000;
      while ((await deliverDue(10)) === 10 && Date.now() < until);
    } catch (e) {
      console.error("webhooks:", e instanceof Error ? e.message : e);
      void trackError(e, "runner: webhooks");
    } finally {
      hooking = false;
    }
  };
  setInterval(hooks, 10000);
  // AI pictures and videos: their own loop, so a video that takes minutes never holds up publishing.
  let making = false;
  const make = async () => {
    if (making || !aiReady()) return;
    making = true;
    try {
      await runGenerations();
    } catch (e) {
      console.error("generations:", e instanceof Error ? e.message : e);
      void trackError(e, "runner: generations");
    } finally {
      making = false;
    }
  };
  setInterval(make, 4000);
  // Data exports: their own claim and loop, so minutes of zipping gigabytes never hold up publishing.
  let exporting = false;
  const exportJobs = async () => {
    if (exporting) return;
    exporting = true;
    try {
      const { data, error } = await adminClient().rpc("claim_export_jobs", { worker: WORKER, n: 1 });
      // Until migration 037 is in, claim_jobs still hands exports to the publish loop.
      if (error?.code === "PGRST202") return;
      if (error) throw new Error(error.message);
      for (const job of (data ?? []) as Job[]) {
        heldExports.hold([job.id]);
        await runJob(supabaseStore, providerOf, job);
      }
    } catch (e) {
      console.error("exports:", e instanceof Error ? e.message : e);
      void trackError(e, "runner: exports");
    } finally {
      heldExports.clear();
      exporting = false;
    }
  };
  setInterval(exportJobs, 20000);
  // Automatic credit top-ups: each request is claimed by one server (credits.ts).
  let topping = false;
  const topUps = async () => {
    if (topping) return;
    topping = true;
    try {
      await runAutoTopUps();
    } catch (e) {
      console.error("auto top-ups:", e instanceof Error ? e.message : e);
      void trackError(e, "runner: auto top-ups");
    } finally {
      topping = false;
    }
  };
  setInterval(topUps, 30000);
  const hourly = () =>
    onePerPeriod(opsStore, "upkeep", 3300, 7200, WORKER, async () => {
      await upkeep();
      await cleanupOps();
      await pruneDeliveries();
      // Holds a stopped server left behind are settled or given back.
      await sweepHolds().catch((e) => {
        console.error("credits sweep:", e instanceof Error ? e.message : e);
        void trackError(e, "runner: credits sweep");
      });
      // What's past its keep time (retention.ts).
      await pruneOld().catch((e) => {
        console.error("prune:", e instanceof Error ? e.message : e);
        void trackError(e, "runner: prune");
      });
    }).catch((e) => {
      console.error("upkeep:", e);
      void trackError(e, "runner: upkeep");
    });
  // Each report period is claimed in the database, so every machine may check: only one sends.
  const reports = () => queueReports().catch((e) => {
    console.error("reports:", e instanceof Error ? e.message : e);
    void trackError(e, "runner: reports");
  });
  setInterval(() => {
    hourly();
    void reports();
  }, 300000);
  setTimeout(hourly, 30000);
  // Jobs still running keep their lock; the beat tells /api/health this server's runner is alive.
  setInterval(() => void keepHeld(opsStore, held, WORKER).then(() => keepHeld(opsStore, heldInbox, WORKER)).then(() => keepHeld(opsStore, heldExports, WORKER)), 60000);
  const bootedAt = new Date();
  const alive = () => beat(bootedAt).catch((e) => console.error("beat:", e instanceof Error ? e.message : e));
  setInterval(alive, 60000);
  void alive();
  // Every 30 minutes: RSS feeds and evergreen posts (src/lib/feeds.ts).
  const content = () => import("./feeds").then((m) => m.contentUpkeep()).catch((e) => {
      console.error("content:", e instanceof Error ? e.message : e);
      void trackError(e, "runner: content");
    });
  setInterval(content, 1800000);
  setTimeout(content, 60000);
  console.log(`runner started on ${WORKER}`);
}

/**
 * Every 10 minutes: one Inbox read for each active channel whose network has an Inbox, unless one is waiting or ran
 * in the last 9 minutes (one server a period takes the turn; a server that looks later finds its reads).
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
