// Changing a published post on its networks. The rules, kept free of Supabase so tests can run them against fake
// networks and a fake store.
// - Only channels the post went out on, and not deleted since, can change. Only networks whose provider has `edit`
//   and whose network lists `edit` in networks.ts do; on others the change is refused before anything is sent.
// - The text changes when the network allows it; settings change only for the keys the network lists. Everything else
//   stays as it went out. A change that changes nothing isn't sent.
// - Each change is checked like a new post (length, required settings) before it's sent.
// - Channels run side by side, each with its own time limit, and nothing one throws gets past it: every channel asked
//   gives exactly one result. AuthError marks the channel "reconnect", like publishing.
// - The new text and settings are saved on the channel's row only after the network took them. Saving is tried 3 times.
// - One run per post at a time on this server.
import { AuthError, type Provider, type Secret } from "./providers/types";
import { networkOf, type NetworkId } from "./networks";

export type EditTarget = {
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
  /** What went out (or the last saved edit). */
  text: string;
  settings: Record<string, string>;
  media: number;
};

/** The new text and settings for one channel, as typed. */
export type EditChange = { channelId: string; text: string; settings: Record<string, string> };

export type EditResult = {
  channelId: string;
  channelName: string;
  network: string;
  /** edited, unchanged (nothing to send), failed (the post stays as it was) or skipped (can't be edited). */
  result: "edited" | "unchanged" | "failed" | "skipped";
  error: string | null;
};

export interface EditStore {
  secret(channelId: string, p: Provider): Promise<Secret>;
  saved(targetId: string, text: string, settings: Record<string, string>): Promise<void>;
  reconnect(channelId: string): Promise<void>;
}

export const EDIT_TIMEOUT_MS = 30000;
const running = new Set<string>();
const nameOf = (network: string) => networkOf(network as NetworkId)?.name ?? network;
const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));
const same = (a: Record<string, string>, b: Record<string, string>) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if ((a[k] ?? "") !== (b[k] ?? "")) return false;
  return true;
};

/** What can change on this network after it went out, or null when nothing can. */
export function editRules(network: string, providers: (network: string) => Provider | null) {
  const n = networkOf(network as NetworkId);
  return n?.edit && providers(network)?.edit ? n.edit : null;
}

/** Whether this channel's post can be edited from here now. */
export const canEdit = (t: Pick<EditTarget, "status" | "remoteId" | "deletedAt" | "network">, providers: (network: string) => Provider | null) =>
  t.status === "published" && !!t.remoteId && !t.deletedAt && !!editRules(t.network, providers);

/** The text and settings that would go out: allowed changes on top of what went out. */
export function merged(t: EditTarget, c: EditChange, rules: { text: boolean; settings: string[] }) {
  const settings = { ...t.settings };
  for (const k of rules.settings) {
    const v = (c.settings[k] ?? "").trim();
    if (v) settings[k] = v;
    else delete settings[k];
  }
  return { text: rules.text ? c.text.trim() : t.text, settings };
}

/** Why this change can't go to the network, or null: too long, or a required setting left empty. */
export function editProblem(t: EditTarget, next: { text: string; settings: Record<string, string> }): string | null {
  const n = networkOf(t.network as NetworkId);
  if (!n) return null;
  if ([...next.text].length > n.limit) return `Over ${n.name}'s ${n.limit.toLocaleString("en-US")} characters`;
  for (const f of n.fields ?? []) if (f.required && !(next.settings[f.key] ?? "").trim()) return `${n.name} needs ${f.label.toLowerCase()}`;
  return null;
}

/** Send the changes, side by side. Returns one result per change, in the order given. */
export async function editTargets(
  store: EditStore,
  providers: (network: string) => Provider | null,
  targets: EditTarget[],
  changes: EditChange[],
  timeoutMs = EDIT_TIMEOUT_MS,
): Promise<EditResult[]> {
  const postId = targets[0]?.postId;
  if (!postId || !changes.length) return [];
  if (running.has(postId)) throw new Error("This post is being changed. Try again in a moment.");
  running.add(postId);
  try {
    return await Promise.all(changes.map((c) => one(store, providers, targets, c, timeoutMs)));
  } finally {
    running.delete(postId);
  }
}

async function one(store: EditStore, providers: (network: string) => Provider | null, targets: EditTarget[], c: EditChange, timeoutMs: number): Promise<EditResult> {
  const t = targets.find((x) => x.channelId === c.channelId);
  if (!t) return { channelId: c.channelId, channelName: "", network: "", result: "skipped", error: "This post didn't go to that channel" };
  const base = { channelId: t.channelId, channelName: t.channelName, network: t.network };
  const failed = (error: string): EditResult => ({ ...base, result: "failed", error });
  if (!canEdit(t, providers)) return { ...base, result: "skipped", error: t.deletedAt ? "Deleted on the network" : `${nameOf(t.network)} posts can't be edited from here` };
  const rules = editRules(t.network, providers)!;
  const next = merged(t, c, rules);
  if (next.text === t.text && same(next.settings, t.settings)) return { ...base, result: "unchanged", error: null };
  const problem = editProblem(t, next);
  if (problem) return failed(problem);
  if (t.channelStatus === "reconnect") return failed(`Reconnect ${t.channelName} first`);
  const p = providers(t.network)!;
  try {
    const s = await store.secret(t.channelId, p);
    await within(p.edit!(s, t.accountId, { id: t.remoteId!, url: t.url, at: t.publishedAt, media: t.media, text: t.text }, { text: next.text, media: [], settings: next.settings }), timeoutMs, `${nameOf(t.network)} didn't answer in time. Try again.`);
  } catch (e) {
    if (e instanceof AuthError) await store.reconnect(t.channelId).catch(() => undefined);
    return failed(messageOf(e));
  }
  // It changed on the network. Saving that may fail: then it shows as failed, and sending the same change again is harmless.
  for (let i = 1; ; i++) {
    try {
      await store.saved(t.id, next.text, next.settings);
      break;
    } catch (e) {
      if (i >= 3) return failed(`Changed on ${nameOf(t.network)}, but not saved here: ${messageOf(e)}`);
    }
  }
  return { ...base, result: "edited", error: null };
}

function within<T>(work: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([work, late]).finally(() => clearTimeout(timer));
}
