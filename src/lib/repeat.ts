// Repeating posts, the pure half: how often, and when each copy goes out. No Supabase, so tests run it as it is.
// - A copy goes out at the same wall-clock time in the workspace's time zone, through daylight saving changes.
// - Monthly copies keep the day of the month, or the month's last day when it's shorter (Jan 31, Feb 28, Mar 31).
import { zonedInstant } from "./queue";

export const REPEATS = {
  "1d": { label: "Every day", days: 1, months: 0 },
  "2d": { label: "Every 2 days", days: 2, months: 0 },
  "3d": { label: "Every 3 days", days: 3, months: 0 },
  "4d": { label: "Every 4 days", days: 4, months: 0 },
  "5d": { label: "Every 5 days", days: 5, months: 0 },
  "6d": { label: "Every 6 days", days: 6, months: 0 },
  "1w": { label: "Every week", days: 7, months: 0 },
  "2w": { label: "Every 2 weeks", days: 14, months: 0 },
  "1m": { label: "Every month", days: 0, months: 1 },
} as const;
export type Repeat = keyof typeof REPEATS;
export const isRepeat = (v: unknown): v is Repeat => typeof v === "string" && v in REPEATS;

const fmts = new Map<string, Intl.DateTimeFormat>();
/** An instant's wall clock in a zone. */
function wallOf(at: Date, timeZone: string) {
  let f = fmts.get(timeZone);
  if (!f) fmts.set(timeZone, (f = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })));
  const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month - 1, d: +p.day, hh: +p.hour, mm: +p.minute };
}

/** The `k`th copy after the post at `at` (k = 1 is the next one). */
export function repeatAt(at: Date, r: Repeat, timeZone: string, k: number): Date {
  const w = wallOf(at, timeZone);
  const { days, months } = REPEATS[r];
  if (months) {
    const first = new Date(Date.UTC(w.y, w.m + months * k, 1));
    const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    return zonedInstant(first.getUTCFullYear(), first.getUTCMonth(), Math.min(w.d, last), w.hh, w.mm, timeZone);
  }
  const day = new Date(Date.UTC(w.y, w.m, w.d + days * k));
  return zonedInstant(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), w.hh, w.mm, timeZone);
}

/** The first copy more than a minute after `now`: after downtime, one copy at the next time, never a burst. */
export function nextRepeat(at: Date, r: Repeat, timeZone: string, now = new Date()): Date {
  for (let k = 1; k < 5000; k++) {
    const t = repeatAt(at, r, timeZone, k);
    if (t.getTime() > now.getTime() + 60000) return t;
  }
  throw new Error("No next time for this repeat");
}

/** The copies still to come that fall in [from, to), for the calendar to show ahead. At most `max`. */
export function repeatsBetween(at: Date, r: Repeat, timeZone: string, from: Date, to: Date, max = 62): Date[] {
  const out: Date[] = [];
  for (let k = 1; out.length < max && k < 5000; k++) {
    const t = repeatAt(at, r, timeZone, k);
    if (t.getTime() >= to.getTime()) break;
    if (t.getTime() >= from.getTime()) out.push(t);
  }
  return out;
}
