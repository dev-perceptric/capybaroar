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

/** Weekday and hour cells with their results, as the best times come from Analytics. */
export type BestCell = { day: number; hour: number; posts: number; engagement: number };

/** The best `n` hours of the week, once there are 10 posts with results, from hours with at least 2 posts. */
export function pickBest(cells: BestCell[], n = 3): { day: number; hour: number }[] {
  if (cells.reduce((s, c) => s + c.posts, 0) < 10) return [];
  return cells
    .filter((c) => c.posts >= 2)
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, n)
    .map(({ day, hour }) => ({ day, hour }));
}

const at = (day: number, time: string): Slot => ({ day, time });
const WEEKDAYS = [1, 2, 3, 4, 5];

/** Ready-made queues. "best" comes from the workspace's own results. */
export const QUEUE_PRESETS = {
  weekdays: { label: "Weekdays at 9", slots: WEEKDAYS.map((d) => at(d, "09:00")) },
  lunch: { label: "Morning and lunch", slots: WEEKDAYS.flatMap((d) => [at(d, "08:30"), at(d, "12:30")]) },
  daily: { label: "Every day, twice", slots: [0, 1, 2, 3, 4, 5, 6].flatMap((d) => [at(d, "09:00"), at(d, "17:00")]) },
} as const;
export type QueuePreset = keyof typeof QUEUE_PRESETS | "best";

/** Best hours as queue slots, sorted by day and time. */
export const slotsFromBest = (best: { day: number; hour: number }[]): Slot[] =>
  best.map((b) => at(b.day, `${String(b.hour).padStart(2, "0")}:00`)).sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));

/** The next of these best hours at least 30 minutes from now, in the workspace's time zone. Null without best times. */
export function nextBestTime(best: { day: number; hour: number }[], timeZone: string, now = new Date()): Date | null {
  if (!best.length) return null;
  return nextQueueSlot(slotsFromBest(best), timeZone, new Set(), new Date(now.getTime() + 30 * 60000));
}

/** Popular hours across every Capybaroar account on one network: only once 200 posts have results, from hours with 5. */
export function pickPopular(cells: BestCell[], n = 3): { day: number; hour: number }[] {
  if (cells.reduce((s, c) => s + c.posts, 0) < 200) return [];
  return cells
    .filter((c) => c.posts >= 5)
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, n)
    .map(({ day, hour }) => ({ day, hour }));
}
