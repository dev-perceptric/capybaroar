// Deleting a published post from its networks. The rules, kept free of Supabase so tests can run them against fake
// networks and a fake store.
// - Only channels the post went out on have something to delete. One already deleted is never asked again.
// - A network with no delete API (Instagram, TikTok), an id that wasn't kept or a permission the channel wasn't given
//   is "manual": it's deleted in the app, from the post's link.
// - Channels run side by side, each with its own time limit, and nothing one throws gets past it: every channel asked
//   gives exactly one result.
// - A 404 means it's already gone, which counts as deleted. AuthError marks the channel "reconnect", like publishing.
// - Each delete is saved on its channel's row. Once every channel the post went out on is deleted, the post is
//   "deleted": the row stays for Analytics and leaves the calendar.
// - One run per post at a time on this server. Another server deleting the same post at once is harmless: the second
//   delete finds a 404, which counts as deleted.
import { AuthError, NotFound, type Provider, type Remote, type Secret } from "./providers/types";
import { networkOf, type NetworkId } from "./networks";

export type UnpublishTarget = {
  id: string;
  postId: string;
  channelId: string;
  channelName: string;
  channelStatus: string;
  network: string;
  accountId: string;
  status: string;
  remoteId: string | null;
  url: string | null;
  publishedAt: Date | null;
  deletedAt: Date | null;
  /** The channel's text and the post's number of files: what went out. */
  text: string;
  media: number;
};

export type ChannelResult = {
  channelId: string;
  channelName: string;
  network: string;
  /** deleted (now or before), failed (try again), manual (delete it in the app) or skipped (nothing went out there). */
  result: "deleted" | "failed" | "manual" | "skipped";
  error: string | null;
  note: string | null;
  url: string | null;
};

/**
 * One channel as the delete dialog shows it. `reason` says why it can't be deleted from here: `manual` when it's done in
 * the network's app (no delete API, no id, a missing permission), otherwise the channel must be reconnected first.
 */
export type PlanItem = { channelId: string; channelName: string; network: string; url: string | null; deleted: boolean; manual: boolean; reason: string | null };

export interface UnpublishStore {
  secret(channelId: string, p: Provider): Promise<Secret>;
  deleted(targetId: string, at: Date): Promise<void>;
  reconnect(channelId: string): Promise<void>;
  /** Every channel the post went out on is deleted: so is the post. */
  postDeleted(postId: string): Promise<void>;
}

/** Who asks, and the post asked about. */
export type Asker = { role: string; brandIds: string[] | null };

export class UnpublishError extends Error {
  constructor(
    public code: "not_found" | "forbidden" | "conflict",
    message: string,
  ) {
    super(message);
  }
}

/** Statuses of a post that went out somewhere. */
export const OUT = ["published", "partial", "deleted"];

/**
 * Writers delete posts (clients only approve), within their brands. Approval doesn't apply: taking a post down never
 * waits for anyone.
 */
export function checkUnpublish(post: { status: string; brandId: string | null } | null, by: Asker) {
  if (!post || (by.brandIds && (post.brandId == null || !by.brandIds.includes(post.brandId)))) throw new UnpublishError("not_found", "Post not found");
  if (by.role === "client") throw new UnpublishError("forbidden", "Clients can only approve or reject posts");
  if (post.status === "publishing") throw new UnpublishError("conflict", "This post is going out right now. Try again in a minute.");
  if (!OUT.includes(post.status)) throw new UnpublishError("conflict", "This post hasn't gone out yet");
}

export const wentOut = (t: Pick<UnpublishTarget, "status" | "remoteId">) => t.status === "published" && !!t.remoteId;
const remoteOf = (t: UnpublishTarget): Remote => ({ id: t.remoteId!, url: t.url, at: t.publishedAt, media: t.media, text: t.text });
const nameOf = (network: string) => networkOf(network as NetworkId)?.name ?? network;
const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Why this channel's post is deleted in the app instead (no delete API, no id, a missing permission), or null. */
export function manualReason(t: UnpublishTarget, p: Provider | null, s: Secret | null): string | null {
  if (!p?.unpublish) return `Delete it in the ${nameOf(t.network)} app`;
  return s ? (p.unpublishable?.(s, remoteOf(t)) ?? null) : null;
}

/** What the delete dialog lists: each channel the post went out on. `secretOf` is null when it can't be read. */
export function planOf(targets: UnpublishTarget[], providers: (network: string) => Provider | null, secretOf: (t: UnpublishTarget) => Secret | null): PlanItem[] {
  return targets.filter(wentOut).map((t) => {
    const base = { channelId: t.channelId, channelName: t.channelName, network: t.network, url: t.url, deleted: !!t.deletedAt };
    if (t.deletedAt) return { ...base, manual: false, reason: null };
    const p = providers(t.network);
    const s = p?.unpublish ? secretOf(t) : null;
    const manual = manualReason(t, p, s);
    if (manual) return { ...base, manual: true, reason: manual };
    return { ...base, manual: false, reason: t.channelStatus === "reconnect" || !s ? `Reconnect ${t.channelName} first` : null };
  });
}

export const UNPUBLISH_TIMEOUT_MS = 30000;
const running = new Set<string>();

/**
 * Delete the post on the channels picked ("all": every channel it went out on). Returns one result per channel asked,
 * in the post's order, and whether the post itself is now deleted.
 */
export async function unpublishTargets(
  store: UnpublishStore,
  providers: (network: string) => Provider | null,
  targets: UnpublishTarget[],
  pick: string[] | "all",
  timeoutMs = UNPUBLISH_TIMEOUT_MS,
): Promise<{ results: ChannelResult[]; postDeleted: boolean }> {
  const postId = targets[0]?.postId;
  if (!postId) return { results: [], postDeleted: false };
  if (running.has(postId)) throw new UnpublishError("conflict", "This post is being deleted. Try again in a moment.");
  running.add(postId);
  try {
    const want = pick === "all" ? null : new Set(pick);
    const chosen = want ? targets.filter((t) => want.has(t.channelId)) : targets.filter(wentOut);
    const done = new Set<string>();
    const results = await Promise.all(
      chosen.map(async (t) => {
        const r = await one(store, providers, t, timeoutMs);
        if (r.result === "deleted") done.add(t.id);
        return r;
      }),
    );
    const out = targets.filter(wentOut);
    const postDeleted = out.length > 0 && out.every((t) => t.deletedAt || done.has(t.id));
    if (postDeleted) {
      try {
        await store.postDeleted(postId);
      } catch {
        // every channel is deleted and saved; the next delete finds nothing to do and marks the post again
      }
    }
    return { results, postDeleted };
  } finally {
    running.delete(postId);
  }
}

async function one(store: UnpublishStore, providers: (network: string) => Provider | null, t: UnpublishTarget, timeoutMs: number): Promise<ChannelResult> {
  const base = { channelId: t.channelId, channelName: t.channelName, network: t.network, url: t.url, error: null, note: null };
  const failed = (error: string): ChannelResult => ({ ...base, result: "failed", error });
  if (!wentOut(t)) return { ...base, result: "skipped", error: "Nothing went out on this channel" };
  if (t.deletedAt) return { ...base, result: "deleted" };
  const p = providers(t.network);
  const noApi = manualReason(t, p, null);
  if (noApi) return { ...base, result: "manual", error: noApi };
  if (t.channelStatus === "reconnect") return failed(`Reconnect ${t.channelName} first`);
  let note: string | null = null;
  try {
    const s = await store.secret(t.channelId, p!);
    const reason = manualReason(t, p, s);
    if (reason) return { ...base, result: "manual", error: reason };
    try {
      const r = await within(p!.unpublish!(s, t.accountId, remoteOf(t)), timeoutMs, `${nameOf(t.network)} didn't answer in time. Try again.`);
      note = (r && r.note) || null;
    } catch (e) {
      // Already gone on the network: that's what was asked.
      if (!(e instanceof NotFound)) throw e;
    }
  } catch (e) {
    if (e instanceof AuthError) await store.reconnect(t.channelId).catch(() => undefined);
    return failed(messageOf(e));
  }
  // It's gone on the network. Saving that may fail: then it shows as failed, and the next try finds a 404.
  const at = new Date();
  for (let i = 1; ; i++) {
    try {
      await store.deleted(t.id, at);
      break;
    } catch (e) {
      if (i >= 3) return failed(`Deleted on ${nameOf(t.network)}, but not saved here: ${messageOf(e)}`);
    }
  }
  return { ...base, result: "deleted", note };
}

function within<T>(work: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([work, late]).finally(() => clearTimeout(timer));
}
