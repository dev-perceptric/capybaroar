// Evergreen posts: a published post goes out again every N weeks, as a copy. Kept free of Supabase so tests run it
// against an in-memory store.
// - A due row is claimed by moving next_at forward only if it still holds the value that was read (compare and set),
//   so however many servers run this at once, one period makes at most one copy.
// - The claim comes before the copy: a copy that fails is recorded and that period is skipped, never made twice.
// - After downtime the row makes one copy, and the next one is a full period later (no burst of catch-up copies).

export const WEEK_MS = 7 * 86400000;
export const EVERGREEN_WEEKS = [1, 2, 4, 8, 12, 26] as const;

export type EvergreenRow = { postId: string; workspaceId: string; everyWeeks: number; nextAt: string; createdBy: string | null };

export interface EvergreenStore {
  due(now: Date, n: number): Promise<EvergreenRow[]>;
  /** Set next_at to `to` only where it is still `from`. True when this caller made the change. */
  claim(postId: string, from: string, to: string): Promise<boolean>;
  /** Make the copy; returns its id. */
  repost(row: EvergreenRow): Promise<string>;
  done(postId: string, copyId: string | null, error: string | null, at: Date): Promise<void>;
}

/** When the next copy is due after one made now for the period that started at `prev`. */
export function nextEvergreenAt(prev: Date, weeks: number, now: Date): Date {
  const step = weeks * WEEK_MS;
  const t = prev.getTime() + step;
  return new Date(t > now.getTime() ? t : now.getTime() + step);
}

/** Make the copies that are due. Returns how many were made. */
export async function runEvergreen(store: EvergreenStore, now = new Date(), n = 50): Promise<number> {
  let made = 0;
  for (const row of await store.due(now, n)) {
    if (new Date(row.nextAt).getTime() > now.getTime()) continue;
    const to = nextEvergreenAt(new Date(row.nextAt), row.everyWeeks, now);
    if (!(await store.claim(row.postId, row.nextAt, to.toISOString()))) continue;
    try {
      const id = await store.repost(row);
      made++;
      await store.done(row.postId, id, null, now);
    } catch (e) {
      await store.done(row.postId, null, (e instanceof Error ? e.message : String(e)).slice(0, 500), now);
    }
  }
  return made;
}
