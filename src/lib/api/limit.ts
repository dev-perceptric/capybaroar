// Requests per key per minute, counted on this server. One key that loops can't slow everyone else down.

export const PER_MINUTE = 120;

export class RateLimit {
  private windows = new Map<string, { start: number; count: number }>();
  constructor(
    private max = PER_MINUTE,
    private windowMs = 60000,
  ) {}

  /** Counts one request. Returns 0 when it may go ahead, or the seconds to wait. */
  take(key: string, now = Date.now()): number {
    let w = this.windows.get(key);
    if (!w || now - w.start >= this.windowMs) {
      w = { start: now, count: 0 };
      this.windows.set(key, w);
      // Old windows are only memory: drop them now and then.
      if (this.windows.size > 5000) for (const [k, v] of this.windows) if (now - v.start >= this.windowMs) this.windows.delete(k);
    }
    if (w.count >= this.max) return Math.max(1, Math.ceil((w.start + this.windowMs - now) / 1000));
    w.count++;
    return 0;
  }
}
