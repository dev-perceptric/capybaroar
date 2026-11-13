// Webhook deliveries run in a pool: each one settles on its own, and a free slot is filled with the next due
// delivery right away, so one slow URL holds only its own slot, never the rest. Pure, so tests cover it.

export type Pool = { running: Set<Promise<void>> };

export const newPool = (): Pool => ({ running: new Set() });

/**
 * Keep up to `slots` jobs running until the queue is empty or `budgetMs` has passed, then return how many were
 * claimed. Jobs still running when it returns keep going and keep their slot for the next call.
 */
export async function fillPool<T>(
  pool: Pool,
  opts: { slots: number; budgetMs: number; claim: (n: number) => Promise<T[]>; work: (job: T) => Promise<void>; failed?: (job: T, e: unknown) => void },
): Promise<number> {
  const until = Date.now() + opts.budgetMs;
  let claimed = 0;
  for (;;) {
    const room = opts.slots - pool.running.size;
    if (room > 0) {
      const jobs = await opts.claim(room);
      claimed += jobs.length;
      for (const job of jobs) {
        const p: Promise<void> = Promise.resolve()
          .then(() => opts.work(job))
          .catch((e) => opts.failed?.(job, e))
          .finally(() => pool.running.delete(p));
        pool.running.add(p);
      }
      // Nothing more is due: the running ones finish on their own.
      if (jobs.length < room) return claimed;
    }
    const left = until - Date.now();
    if (left <= 0 || !pool.running.size) return claimed;
    // Wait for any one slot to free up, or the budget to end.
    let timer: NodeJS.Timeout | undefined;
    await Promise.race([...pool.running, new Promise<void>((r) => (timer = setTimeout(r, left)))]);
    clearTimeout(timer);
  }
}
