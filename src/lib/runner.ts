import "server-only";
import { hostname } from "node:os";
import { adminClient } from "./supabase/server";
import { readSecret, writeSecret } from "./channels";
import { mediaFiles } from "./media";
import { settlePost } from "./posts";
import { providerOf } from "./providers";
import { AuthError, PostError, type Secret } from "./providers/types";

// The publisher. Runs inside the web server: every 15 seconds it claims due jobs (row locks, so two servers never
// take the same one), and once an hour it refreshes tokens that expire soon and records follower counts.
const WORKER = `${hostname()}:${process.pid}`;
const BACKOFF_MIN = [1, 5, 15, 60, 240];

type Job = { id: number; kind: string; payload: Record<string, string>; attempts: number; max_attempts: number };

let started = false;
export function startRunner() {
  if (started) return;
  started = true;
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      await runDue();
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

export async function runDue() {
  const db = adminClient();
  const { data, error } = await db.rpc("claim_jobs", { worker: WORKER, n: 5 });
  if (error) throw new Error(error.message);
  for (const job of (data ?? []) as Job[]) {
    try {
      if (job.kind === "publish") await publishTarget(job.payload.targetId);
      await db.from("jobs").update({ done_at: new Date().toISOString(), locked_at: null, last_error: null }).eq("id", job.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const final = e instanceof AuthError || e instanceof PostError || job.attempts >= job.max_attempts;
      if (final) {
        await db.from("jobs").update({ done_at: new Date().toISOString(), locked_at: null, last_error: msg }).eq("id", job.id);
        if (job.kind === "publish") await failTarget(job.payload.targetId, msg);
      } else {
        const wait = BACKOFF_MIN[Math.min(job.attempts - 1, BACKOFF_MIN.length - 1)] * 60000;
        await db.from("jobs").update({ run_after: new Date(Date.now() + wait).toISOString(), locked_at: null, last_error: msg }).eq("id", job.id);
        await db.from("post_targets").update({ status: "pending", error: `${msg} (retrying)` }).eq("id", job.payload.targetId);
      }
    }
  }
}

const canRefresh = (p: NonNullable<ReturnType<typeof providerOf>>, s: Secret) => (p.refreshable ? p.refreshable(s) : Boolean(s.refreshToken));

async function freshSecret(channelId: string, network: string): Promise<Secret> {
  const s = await readSecret(channelId);
  const p = providerOf(network);
  if (p?.refresh && canRefresh(p, s) && s.expiresAt && s.expiresAt.getTime() < Date.now() + 5 * 60000) {
    const next = await p.refresh(s);
    await writeSecret(channelId, next);
    return { ...s, accessToken: next.accessToken, refreshToken: next.refreshToken ?? null, expiresAt: next.expiresAt ?? null };
  }
  return s;
}

async function publishTarget(targetId: string) {
  const db = adminClient();
  const { data: t } = await db
    .from("post_targets")
    .select("id, status, remote_id, post_id, channel_id, posts(text, media_ids, workspace_id), channels(network, account_id, name, status)")
    .eq("id", targetId)
    .maybeSingle();
  if (!t) return;
  // Already out (a retry after the post went through): never post twice.
  if (t.status === "published" || t.remote_id) {
    await db.from("post_targets").update({ status: "published" }).eq("id", t.id);
    await settlePost(t.post_id);
    return;
  }
  const post = t.posts as unknown as { text: string; media_ids: string[]; workspace_id: string };
  const ch = t.channels as unknown as { network: string; account_id: string; name: string; status: string };
  if (ch.status === "reconnect") throw new AuthError(`Reconnect ${ch.name}`);
  const p = providerOf(ch.network);
  if (!p) throw new PostError(`${ch.network} isn't supported yet`);
  await db.from("posts").update({ status: "publishing" }).eq("id", t.post_id).eq("status", "scheduled");
  await db.from("post_targets").update({ status: "publishing", error: null }).eq("id", t.id);
  try {
    const secret = await freshSecret(t.channel_id, ch.network);
    const media = await mediaFiles(post.workspace_id, post.media_ids ?? []);
    const out = await p.publish(secret, ch.account_id, { text: post.text, media });
    await db.from("post_targets").update({ status: "published", remote_id: out.id, url: out.url ?? null, error: null, published_at: new Date().toISOString() }).eq("id", t.id);
  } catch (e) {
    if (e instanceof AuthError) await db.from("channels").update({ status: "reconnect" }).eq("id", t.channel_id);
    throw e;
  }
  await settlePost(t.post_id);
}

async function failTarget(targetId: string, msg: string) {
  const db = adminClient();
  const { data } = await db.from("post_targets").update({ status: "failed", error: msg }).eq("id", targetId).neq("status", "published").select("post_id").maybeSingle();
  if (data) await settlePost(data.post_id);
}

/** Hourly: refresh tokens that expire within a week, and record today's follower counts. */
export async function upkeep() {
  const db = adminClient();
  const { data: chans } = await db.from("channels").select("id, workspace_id, network, account_id, status").eq("status", "active");
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
      if (e instanceof AuthError) await db.from("channels").update({ status: "reconnect" }).eq("id", c.id);
      console.error(`upkeep ${c.network}:`, e instanceof Error ? e.message : e);
    }
  }
}
