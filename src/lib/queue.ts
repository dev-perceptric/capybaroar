// Saved time slots ("Mon, Wed, Fri at 9 AM") in the workspace time zone, and finding the next free one.
export type Slot = { day: number; time: string };

// Making a date format is slow next to using one, and finding a slot can check hundreds of times: one per zone.
const clocks = new Map<string, Intl.DateTimeFormat>();
const clockIn = (timeZone: string) => {
  let f = clocks.get(timeZone);
  if (!f) clocks.set(timeZone, (f = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })));
  return f;
};

/** Minutes the zone is ahead of UTC at this instant (negative west of Greenwich). */
function offsetMinutes(at: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    clockIn(timeZone)
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** The instant a wall-clock time happens in a zone (handles daylight saving changes). */
export function zonedInstant(y: number, m: number, d: number, hh: number, mm: number, timeZone: string): Date {
  const guess = Date.UTC(y, m, d, hh, mm);
  const first = guess - offsetMinutes(new Date(guess), timeZone) * 60000;
  return new Date(guess - offsetMinutes(new Date(first), timeZone) * 60000);
}

/** Today's date in a zone, as year, month (0-based) and day. */
export function todayIn(timeZone: string, now: Date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month - 1, d: +p.day };
}

/** The earliest slot after now that has no post yet, looking 8 weeks ahead. */
export function nextQueueSlot(slots: Slot[], timeZone: string, taken: Set<number>, now = new Date()): Date | null {
  const t = todayIn(timeZone, now);
  for (let i = 0; i < 56; i++) {
    const day = new Date(Date.UTC(t.y, t.m, t.d + i));
    const found = slots
      .filter((s) => s.day === day.getUTCDay())
      .map((s) => {
        const [hh, mm] = s.time.split(":").map(Number);
        return zonedInstant(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hh, mm, timeZone);
      })
      .filter((at) => at.getTime() > now.getTime() + 60000 && !taken.has(at.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    if (found.length) return found[0];
  }
  return null;
}
