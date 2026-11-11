// Threads, the pure half: how parts are stored, cleaned and checked. No Supabase, so tests run it as it is.
// - A post's text is the thread's first post. `thread` holds the parts after it, each with its own text and files.
// - Only networks marked `thread` in networks.ts post the parts. Other channels get the first post only.
// - Empty parts are dropped. A post has at most THREAD_MAX parts after the first.
import { THREAD_MAX, type ThreadPart } from "./networks";

/** A part as posts.thread stores it. */
export type StoredPart = { text: string; media_ids: string[] };

/** Stored parts as the app uses them. Anything malformed is skipped. */
export function threadOf(stored: unknown): ThreadPart[] {
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((p): p is StoredPart => !!p && typeof p === "object" && typeof (p as StoredPart).text === "string")
    .map((p) => ({ text: p.text, mediaIds: Array.isArray(p.media_ids) ? p.media_ids.filter((m) => typeof m === "string") : [] }));
}

export const storedThread = (parts: ThreadPart[]): StoredPart[] => parts.map((p) => ({ text: p.text, media_ids: p.mediaIds }));

/** Trims each part and drops empty ones. Throws when there are too many. */
export function cleanThread(parts: ThreadPart[] | undefined): ThreadPart[] {
  const out = (parts ?? []).map((p) => ({ text: p.text.trim(), mediaIds: [...new Set(p.mediaIds)] })).filter((p) => p.text || p.mediaIds.length);
  if (out.length > THREAD_MAX) throw new Error(`A thread has up to ${THREAD_MAX + 1} posts`);
  return out;
}

/** Why a part can't go to a network with this character limit, or null. `n` is its place in the thread (2 and up). */
export function partProblem(p: ThreadPart, n: number, limit: number, networkName: string): string | null {
  if ([...p.text].length > limit) return `Post ${n} of the thread is over ${networkName}'s ${limit.toLocaleString("en-US")} characters`;
  return null;
}

/**
 * Splits text into a thread on lines holding only "---" (bulk upload and the API's plain-text form).
 * The first piece is the main post; the rest are parts with no files.
 */
export function splitThread(text: string): { text: string; thread: ThreadPart[] } {
  const pieces = text.split(/\r?\n[ \t]*---[ \t]*(?:\r?\n|$)/);
  return { text: pieces[0].trim(), thread: pieces.slice(1).map((t) => ({ text: t.trim(), mediaIds: [] })).filter((p) => p.text) };
}

/** The settings a thread's later parts keep: those about the whole post (Mastodon visibility), never a first comment or cover. */
export function partSettings(settings: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(settings).filter(([k]) => k !== "first_comment" && k !== "cover"));
}
