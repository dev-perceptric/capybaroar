// Requests per key per minute. The count that holds is in Postgres (take_rate in 032_auth_limits.sql), shared by every
// server; this in-memory one is the fallback when the database can't be asked, so one key that loops still can't slow
// everyone else down.

export const PER_MINUTE = 120;
/** The most JSON-RPC messages one MCP request may carry. Each one counts against the key's limit. */
export const MAX_RPC_BATCH = 25;

export class RateLimit {
  private windows = new Map<string, { start: number; count: number }>();
  constructor(
    private max = PER_MINUTE,
    private windowMs = 60000,
  ) {}

  /** Counts `n` requests. Returns 0 when they may go ahead, or the seconds to wait. */
  take(key: string, now = Date.now(), n = 1): number {
    let w = this.windows.get(key);
    if (!w || now - w.start >= this.windowMs) {
      w = { start: now, count: 0 };
      this.windows.set(key, w);
      // Old windows are only memory: drop them now and then.
      if (this.windows.size > 5000) for (const [k, v] of this.windows) if (now - v.start >= this.windowMs) this.windows.delete(k);
    }
    if (w.count + n > this.max) return Math.max(1, Math.ceil((w.start + this.windowMs - now) / 1000));
    w.count += n;
    return 0;
  }
}
