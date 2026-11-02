// The publisher's rules, kept free of Supabase so tests can run them against fake networks and a fake store.
// - A job is claimed under a lock; a crashed worker's lock expires after 10 minutes (claim_jobs in SQL).
// - Once a network returns a post id it is saved before the job is marked done, and a target with a saved id is
//   never published again.
// - AuthError marks the channel "reconnect"; AuthError and PostError fail the target at once; other errors retry
//   with backoff until max_attempts.
// - A post that is a draft or waits for approval (HELD) is never published, whatever jobs exist for it. Approving it
//   queues fresh jobs.
import { AuthError, PostError, type MediaFile, type PostStats, type Provider, type Published, type Secret } from "./providers/types";

export type Job = { id: number; kind: string; payload: Record<string, string>; attempts: number; max_attempts: number };

export type TargetCtx = {
  id: string;
  status: string;
  remoteId: string | null;
  postId: string;
  /** The post's own status: "review" and "draft" are never published. */
  postStatus?: string;
  workspaceId: string;
  channelId: string;
  channelName: string;
  channelStatus: string;
  network: string;
  accountId: string;
  text: string;
  settings: Record<string, string>;
  mediaIds: string[];
};

export interface Store {
  claim(worker: string, n: number): Promise<Job[]>;
  jobDone(id: number, error: string | null): Promise<void>;
  jobRetry(id: number, runAfter: Date, error: string): Promise<void>;
  target(id: string): Promise<TargetCtx | null>;
  publishing(t: TargetCtx): Promise<void>;
  published(t: TargetCtx, out: Published): Promise<void>;
  retrying(targetId: string, error: string): Promise<void>;
  /** Fails the target unless it was already published. Returns the target's context when it changed. */
  failed(targetId: string, error: string): Promise<TargetCtx | null>;
  reconnect(channelId: string): Promise<void>;
  settle(postId: string): Promise<void>;
  secret(channelId: string, provider: Provider): Promise<Secret>;
  media(workspaceId: string, ids: string[]): Promise<MediaFile[]>;
  alert(kind: "post_failed" | "reconnect", t: TargetCtx, error: string): Promise<void>;
  /** Queue result checks for a post that just went out (STATS_AFTER). */
  statsLater(t: TargetCtx): Promise<void>;
  saveStats(t: TargetCtx, stats: PostStats): Promise<void>;
}

/** When to read a post's results after it goes out: 1 hour, 1 day, 7 days, 30 days. */
export const STATS_AFTER_MIN = [60, 1440, 10080, 43200];

/** Post statuses the publisher leaves alone. */
export const HELD = ["draft", "review"];

/** Approval: an editor's post to a brand that needs approval waits in review instead of being scheduled. */
export const sendsToReview = (role: string | undefined, needsApproval: boolean) => needsApproval && role === "editor";

export const BACKOFF_MIN = [1, 5, 15, 60, 240];

export async function runDue(store: Store, providers: (network: string) => Provider | null, worker: string, n = 5) {
  const jobs = await store.claim(worker, n);
  for (const job of jobs) await runJob(store, providers, job);
  return jobs.length;
}

export async function runJob(store: Store, providers: (network: string) => Provider | null, job: Job) {
  try {
    if (job.kind === "publish") await publishTarget(store, providers, job.payload.targetId);
    else if (job.kind === "stats") await collectStats(store, providers, job.payload.targetId);
    await store.jobDone(job.id, null);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const final = e instanceof AuthError || e instanceof PostError || job.attempts >= job.max_attempts;
    if (final) {
      await store.jobDone(job.id, msg);
      if (job.kind === "publish") {
        const t = await store.failed(job.payload.targetId, msg);
        if (t) {
          await store.settle(t.postId);
          await store.alert(e instanceof AuthError ? "reconnect" : "post_failed", t, msg);
        }
      }
    } else {
      const wait = BACKOFF_MIN[Math.min(job.attempts - 1, BACKOFF_MIN.length - 1)] * 60000;
      await store.jobRetry(job.id, new Date(Date.now() + wait), msg);
      if (job.kind === "publish") await store.retrying(job.payload.targetId, `${msg} (retrying)`);
    }
  }
}

async function publishTarget(store: Store, providers: (network: string) => Provider | null, targetId: string) {
  const t = await store.target(targetId);
  if (!t) return;
  // Already out (a retry after the post went through): never post twice.
  if (t.status === "published" || t.remoteId) {
    if (t.status !== "published") await store.published(t, { id: t.remoteId! });
    await store.settle(t.postId);
    return;
  }
  // Waiting for approval, or back to a draft: not now. The job ends; approving queues a new one.
  if (t.postStatus && HELD.includes(t.postStatus)) return;
  if (t.channelStatus === "reconnect") throw new AuthError(`Reconnect ${t.channelName}`);
  const p = providers(t.network);
  if (!p) throw new PostError(`${t.network} isn't supported yet`);
  await store.publishing(t);
  let out: Published;
  try {
    const secret = await store.secret(t.channelId, p);
    const media = await store.media(t.workspaceId, t.mediaIds);
    const cover = t.settings.cover ? ((await store.media(t.workspaceId, [t.settings.cover]))[0] ?? null) : null;
    out = await p.publish(secret, t.accountId, { text: t.text, media, settings: t.settings, cover });
  } catch (e) {
    if (e instanceof AuthError) await store.reconnect(t.channelId);
    throw e;
  }
  // The post is live. Saving that is the one step that must not fail, or a retry would post again: try hard.
  await saveHard(() => store.published(t, out));
  await store.settle(t.postId);
  try {
    await store.statsLater(t);
  } catch {
    // results are a nice-to-have: never fail a published post over them
  }
}

async function collectStats(store: Store, providers: (network: string) => Provider | null, targetId: string) {
  const t = await store.target(targetId);
  if (!t?.remoteId || t.status !== "published") return;
  const p = providers(t.network);
  if (!p?.postStats) return;
  const secret = await store.secret(t.channelId, p);
  await store.saveStats(t, await p.postStats(secret, t.accountId, t.remoteId));
}

async function saveHard(fn: () => Promise<void>, tries = 5) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((r) => setTimeout(r, SAVE_RETRY_MS * i));
    }
  }
}

/** Wait between attempts to save a published post (tests set it to 0). */
export let SAVE_RETRY_MS = 500;
export const setSaveRetryMs = (ms: number) => {
  SAVE_RETRY_MS = ms;
};
