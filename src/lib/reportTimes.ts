// Reports' times and sending rules, kept free of Supabase so tests can run them against an in-memory store.
// - A weekly report is due Monday 9:00 and a monthly one the 1st at 9:00, in the workspace's time zone. The period
//   ("w:2026-11-02", "m:2026-11") names the due time it belongs to.
// - Every server's hourly upkeep looks for due reports. Queueing one moves the report's queued_period from the value
//   that server saw to the new period in the same step as adding the job (queue_report in SQL), so two servers that
//   look at once add one job between them.
// - A report scheduled after this period's due time waits for the next one (saving sets queued_period to the current
//   period).
// - The job emails the link. Without mail set up it ends without sending; last_sent_at moves only when an email went
//   out. A failed send throws, so the job retries. A job for a period that was already sent (a retry after the email
//   went out, or "Send now" after the due time) sends nothing.
import { todayIn, zonedInstant } from "./queue";

export type Schedule = "none" | "weekly" | "monthly";
export type RangeKey = "7" | "30" | "90" | "last_month";
export type SectionKey = "summary" | "growth" | "top" | "best" | "formats" | "channels" | "notes";

export const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "growth", label: "Followers" },
  { key: "top", label: "Top posts" },
  { key: "best", label: "Best time to post" },
  { key: "formats", label: "By format" },
  { key: "channels", label: "By channel" },
  { key: "notes", label: "Notes" },
];
export const RANGES: { value: RangeKey; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "last_month", label: "Last month" },
];
export const SCHEDULES: { value: Schedule; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];
export const SEND_HOUR = 9;

const ymd = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);

/** The latest due time at or before now, and its period. null when the report has no schedule. */
export function periodAt(schedule: Schedule, timeZone: string, now: Date): { key: string; at: Date } | null {
  if (schedule === "none") return null;
  const t = todayIn(timeZone, now);
  if (schedule === "weekly") {
    const since = (new Date(Date.UTC(t.y, t.m, t.d)).getUTCDay() + 6) % 7; // days since Monday
    let d = t.d - since;
    let at = zonedInstant(t.y, t.m, d, SEND_HOUR, 0, timeZone);
    if (at.getTime() > now.getTime()) at = zonedInstant(t.y, t.m, (d -= 7), SEND_HOUR, 0, timeZone);
    return { key: `w:${ymd(t.y, t.m, d)}`, at };
  }
  let m = t.m;
  let at = zonedInstant(t.y, m, 1, SEND_HOUR, 0, timeZone);
  if (at.getTime() > now.getTime()) at = zonedInstant(t.y, --m, 1, SEND_HOUR, 0, timeZone);
  return { key: `m:${ymd(t.y, m, 1).slice(0, 7)}`, at };
}

/**
 * The days a report covers: the last 7, 30 or 90 whole days before today, or last calendar month, in the workspace's
 * time zone. `to` is the start of the day after the last one.
 */
export function reportSpan(range: RangeKey, timeZone: string, now: Date): { from: Date; to: Date; days: number } {
  const t = todayIn(timeZone, now);
  if (range === "last_month") {
    const from = zonedInstant(t.y, t.m - 1, 1, 0, 0, timeZone);
    const to = zonedInstant(t.y, t.m, 1, 0, 0, timeZone);
    return { from, to, days: Math.round((Date.UTC(t.y, t.m, 1) - Date.UTC(t.y, t.m - 1, 1)) / 86400000) };
  }
  const days = Number(range);
  return { from: zonedInstant(t.y, t.m, t.d - days, 0, 0, timeZone), to: zonedInstant(t.y, t.m, t.d, 0, 0, timeZone), days };
}

export type ScheduledReport = { id: string; schedule: Schedule; timeZone: string; queued: string | null };
export type ReportJob = { reportId: string; period: string; at: string };

export interface ReportStore {
  /** Reports with a schedule, someone to send to, and a plan that has reports. */
  scheduled(): Promise<ScheduledReport[]>;
  /** Moves queued_period from `seen` to `period` and adds the job, only if it's still `seen`. True when it did. */
  queue(id: string, seen: string | null, period: string, at: Date): Promise<boolean>;
  /** The report as the job needs it; `allowed` is false once the plan no longer has reports. */
  report(id: string): Promise<{ schedule: Schedule; sendTo: string[]; lastSentAt: Date | null; allowed: boolean } | null>;
  mailReady(): boolean;
  /** Emails the report. True when the email went out. */
  send(id: string): Promise<boolean>;
  sent(id: string, at: Date): Promise<void>;
}

/** Hourly: queue one email for each report whose period has come and wasn't queued yet. Returns how many this call queued. */
export async function queueDue(store: ReportStore, now = new Date()) {
  let n = 0;
  for (const r of await store.scheduled()) {
    const p = periodAt(r.schedule, r.timeZone, now);
    if (!p || p.key === r.queued) continue;
    if (await store.queue(r.id, r.queued, p.key, p.at)) n++;
  }
  return n;
}

export type JobResult = "sent" | "gone" | "unscheduled" | "already sent" | "no mail" | "no recipients";

/** One queued email. Throws when sending failed, so the job retries. */
export async function runReportJob(store: ReportStore, job: ReportJob, now = new Date()): Promise<JobResult> {
  const r = await store.report(job.reportId);
  if (!r || !r.allowed) return "gone";
  if (r.schedule === "none") return "unscheduled";
  if (r.lastSentAt && r.lastSentAt.getTime() >= new Date(job.at).getTime()) return "already sent";
  if (!r.sendTo.length) return "no recipients";
  if (!store.mailReady()) return "no mail";
  if (!(await store.send(job.reportId))) throw new Error("Couldn't send the report email");
  await store.sent(job.reportId, now);
  return "sent";
}
