// Showing times in a time zone the person picks instead of their computer's. The calendar and composer work with Dates
// whose local clock reads the picked zone's wall clock ("wall" Dates), and turn them back into real instants to save.
// A null zone means the computer's own, and both functions return the Date as it is.
import { zonedInstant } from "./queue";

const fmts = new Map<string, Intl.DateTimeFormat>();
function parts(at: Date, zone: string) {
  let f = fmts.get(zone);
  if (!f) fmts.set(zone, (f = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })));
  const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month - 1, d: +p.day, hh: +p.hour, mm: +p.minute, ss: +p.second };
}

/** A Date whose local clock reads what a clock in `zone` reads at `at`. */
export function toWall(at: Date, zone: string | null): Date {
  if (!zone) return at;
  const p = parts(at, zone);
  return new Date(p.y, p.m, p.d, p.hh, p.mm, p.ss, at.getMilliseconds());
}

/** The real instant a wall Date (from toWall, or built from a day and an hour on the calendar) means in `zone`. */
export function fromWall(wall: Date, zone: string | null): Date {
  if (!zone) return wall;
  const at = zonedInstant(wall.getFullYear(), wall.getMonth(), wall.getDate(), wall.getHours(), wall.getMinutes(), zone);
  return new Date(at.getTime() + wall.getSeconds() * 1000 + wall.getMilliseconds());
}

/** A zone's short name for labels: "America/New_York" reads "New York". */
export const zoneName = (zone: string) => zone.split("/").pop()!.replace(/_/g, " ");

/** Every zone this browser knows, for the picker. */
export const allZones = () => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"]);
