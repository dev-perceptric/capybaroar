// Dates and numbers, one way everywhere: US English, so a date never reads one way beside US money and another in the
// next column. Screens call these instead of toLocaleString, toLocaleDateString or Intl directly
// (tests/ui-rules.test.ts fails if one does).

type When = string | number | Date | null | undefined;
const asDate = (v: When) => (v == null || v === "" ? null : v instanceof Date ? v : new Date(v));
const fmt = (v: When, o: Intl.DateTimeFormatOptions, empty = "—") => {
  const d = asDate(v);
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString("en-US", o) : empty;
};

/** "Mar 4", or "Mar 4, 2025" when it's not this year (or `year` is set). */
export function fmtDate(v: When, opts: { year?: boolean; weekday?: "short" | "long"; month?: "short" | "long" } = {}) {
  const d = asDate(v);
  const year = opts.year ?? (d ? d.getFullYear() !== new Date().getFullYear() : false);
  return fmt(v, { month: opts.month ?? "short", day: "numeric", ...(year ? { year: "numeric" } : {}), ...(opts.weekday ? { weekday: opts.weekday } : {}) });
}

/** "3:05 PM", or "3 PM" on the hour. */
export function fmtTime(v: When) {
  const d = asDate(v);
  return fmt(v, { hour: "numeric", ...(d && d.getMinutes() === 0 ? {} : { minute: "2-digit" }) });
}

/** "Tue, Mar 4, 3:05 PM". */
export function fmtDateTime(v: When, opts: { weekday?: boolean; year?: boolean } = {}) {
  return fmt(v, { ...(opts.weekday === false ? {} : { weekday: "short" }), month: "short", day: "numeric", ...(opts.year ? { year: "numeric" } : {}), hour: "numeric", minute: "2-digit" });
}

/** Any other date shape, still in US English: fmtParts(d, { month: "long", year: "numeric" }) is "March 2025". */
export const fmtParts = (v: When, o: Intl.DateTimeFormatOptions) => fmt(v, o);

/** "12,480". */
export const fmtNum = (n: number | null | undefined, digits?: number) => (n ?? 0).toLocaleString("en-US", digits == null ? undefined : { maximumFractionDigits: digits });

/** "$12,480", whole dollars unless `cents`. */
export const fmtMoney = (n: number | null | undefined, currency = "USD", cents = false) =>
  (n ?? 0).toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: cents ? 2 : 0, minimumFractionDigits: cents ? 2 : 0 });
