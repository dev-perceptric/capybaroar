// Report schedule tests: when a weekly (Monday 9:00) or monthly (1st, 9:00) report is due in the workspace's time zone,
// the days a report covers, and the sending rules against an in-memory store whose queue() is a compare-and-set like
// queue_report in SQL.
// They prove: due times land on 9:00 local in zones east and west of UTC, on half-hour zones and across daylight
// saving changes; two servers looking at once queue one email; a period is queued once; a report scheduled late waits
// for the next period; last_sent_at moves only when an email went out; a retried or repeated job never sends twice.
import { test } from "node:test";
import assert from "node:assert/strict";
import { periodAt, queueDue, reportSpan, runReportJob, type ReportJob, type ReportStore, type Schedule } from "../src/lib/reportTimes";

const at = (iso: string) => new Date(iso);
const key = (s: Schedule, tz: string, iso: string) => periodAt(s, tz, at(iso))?.key;

test("weekly reports are due Monday 9:00 in the workspace's zone", () => {
  // Monday, Nov 2 2026. London is on GMT, Los Angeles on PST, Auckland on NZDT (+13).
  assert.equal(key("weekly", "Europe/London", "2026-11-02T08:59:00Z"), "w:2026-10-26");
  assert.equal(key("weekly", "Europe/London", "2026-11-02T09:00:00Z"), "w:2026-11-02");
  assert.equal(periodAt("weekly", "Europe/London", at("2026-11-02T09:00:00Z"))!.at.toISOString(), "2026-11-02T09:00:00.000Z");
  assert.equal(key("weekly", "America/Los_Angeles", "2026-11-02T16:59:00Z"), "w:2026-10-26");
  assert.equal(periodAt("weekly", "America/Los_Angeles", at("2026-11-02T17:00:00Z"))!.at.toISOString(), "2026-11-02T17:00:00.000Z");
  assert.equal(key("weekly", "Asia/Tokyo", "2026-11-02T00:00:00Z"), "w:2026-11-02");
  // Auckland's Monday 9:00 is Sunday evening in UTC.
  assert.equal(periodAt("weekly", "Pacific/Auckland", at("2026-11-01T20:00:00Z"))!.at.toISOString(), "2026-11-01T20:00:00.000Z");
  assert.equal(key("weekly", "Pacific/Auckland", "2026-11-01T20:00:00Z"), "w:2026-11-02");
  assert.equal(key("weekly", "Pacific/Auckland", "2026-11-01T19:59:00Z"), "w:2026-10-26");
  // Half-hour zone.
  assert.equal(periodAt("weekly", "Asia/Kolkata", at("2026-11-02T04:00:00Z"))!.at.toISOString(), "2026-11-02T03:30:00.000Z");
  // Later in the week still belongs to Monday's period; Sunday night too.
  assert.equal(key("weekly", "Europe/London", "2026-11-08T23:59:00Z"), "w:2026-11-02");
  assert.equal(key("none", "Europe/London", "2026-11-02T09:00:00Z"), undefined);
});

test("weekly due times follow daylight saving changes", () => {
  // Berlin moves to summer time on Sunday Mar 28 2027: Monday 9:00 is 08:00Z the week before and 07:00Z after.
  assert.equal(periodAt("weekly", "Europe/Berlin", at("2027-03-22T08:00:00Z"))!.at.toISOString(), "2027-03-22T08:00:00.000Z");
  assert.equal(periodAt("weekly", "Europe/Berlin", at("2027-03-29T07:00:00Z"))!.at.toISOString(), "2027-03-29T07:00:00.000Z");
  assert.equal(key("weekly", "Europe/Berlin", "2027-03-29T06:59:00Z"), "w:2027-03-22");
  // Los Angeles leaves summer time on Sunday Nov 1 2026: Oct 26 9:00 was 16:00Z.
  assert.equal(periodAt("weekly", "America/Los_Angeles", at("2026-11-02T10:00:00Z"))!.at.toISOString(), "2026-10-26T16:00:00.000Z");
});

test("monthly reports are due on the 1st at 9:00, across the year", () => {
  assert.equal(key("monthly", "Pacific/Auckland", "2026-11-30T19:59:00Z"), "m:2026-11");
  assert.equal(key("monthly", "Pacific/Auckland", "2026-11-30T20:00:00Z"), "m:2026-12");
  assert.equal(key("monthly", "America/Los_Angeles", "2027-01-01T16:59:00Z"), "m:2026-12");
  assert.equal(key("monthly", "America/Los_Angeles", "2027-01-01T17:00:00Z"), "m:2027-01");
  assert.equal(key("monthly", "UTC", "2026-11-15T12:00:00Z"), "m:2026-11");
});

test("a report covers whole days in the workspace's zone", () => {
  const week = reportSpan("7", "Europe/London", at("2026-11-03T10:00:00Z"));
  assert.deepEqual([week.from.toISOString(), week.to.toISOString(), week.days], ["2026-10-27T00:00:00.000Z", "2026-11-03T00:00:00.000Z", 7]);
  // It's already Dec 1 in Auckland: last month is November there.
  const nov = reportSpan("last_month", "Pacific/Auckland", at("2026-11-30T20:30:00Z"));
  assert.deepEqual([nov.from.toISOString(), nov.to.toISOString(), nov.days], ["2026-10-31T11:00:00.000Z", "2026-11-30T11:00:00.000Z", 30]);
  const dec = reportSpan("last_month", "America/New_York", at("2027-01-01T12:00:00Z"));
  assert.deepEqual([dec.from.toISOString(), dec.to.toISOString(), dec.days], ["2026-12-01T05:00:00.000Z", "2027-01-01T05:00:00.000Z", 31]);
  // March 2027 in Berlin has a 23-hour day: still 31 days.
  assert.equal(reportSpan("last_month", "Europe/Berlin", at("2027-04-02T12:00:00Z")).days, 31);
});

class Memory implements ReportStore {
  reports = new Map<string, { schedule: Schedule; timeZone: string; queued: string | null; sendTo: string[]; lastSentAt: Date | null; allowed: boolean }>();
  jobs: ReportJob[] = [];
  mail = true;
  failSends = 0;
  sends = 0;

  add(id: string, schedule: Schedule, timeZone: string, queued: string | null = null) {
    this.reports.set(id, { schedule, timeZone, queued, sendTo: ["a@client.com"], lastSentAt: null, allowed: true });
  }
  async scheduled() {
    return [...this.reports.entries()].filter(([, r]) => r.schedule !== "none" && r.sendTo.length && r.allowed).map(([id, r]) => ({ id, schedule: r.schedule, timeZone: r.timeZone, queued: r.queued }));
  }
  async queue(id: string, seen: string | null, period: string, when: Date) {
    // Give the other caller a chance to run in between, as a second server would.
    await new Promise((r) => setImmediate(r));
    const r = this.reports.get(id)!;
    if (r.queued !== seen) return false;
    r.queued = period;
    this.jobs.push({ reportId: id, period, at: when.toISOString() });
    return true;
  }
  async report(id: string) {
    const r = this.reports.get(id);
    return r ? { schedule: r.schedule, sendTo: r.sendTo, lastSentAt: r.lastSentAt, allowed: r.allowed } : null;
  }
  mailReady() {
    return this.mail;
  }
  async send() {
    if (this.failSends > 0) {
      this.failSends--;
      return false;
    }
    this.sends++;
    return true;
  }
  async sent(id: string, when: Date) {
    this.reports.get(id)!.lastSentAt = when;
  }
}

test("two servers looking at once queue one email per period", async () => {
  const s = new Memory();
  s.add("r1", "weekly", "Europe/London");
  s.add("r2", "monthly", "Pacific/Auckland");
  const now = at("2026-11-02T09:05:00Z");
  const [a, b, c] = await Promise.all([queueDue(s, now), queueDue(s, now), queueDue(s, now)]);
  assert.equal(a + b + c, 2);
  assert.deepEqual(s.jobs.map((j) => j.period).sort(), ["m:2026-11", "w:2026-11-02"]);
  // The next hours of the same period add nothing.
  for (let h = 1; h < 24 * 6; h++) await queueDue(s, new Date(now.getTime() + h * 3600000));
  assert.equal(s.jobs.length, 2);
  // Next Monday adds the next week, once.
  await Promise.all([queueDue(s, at("2026-11-09T09:30:00Z")), queueDue(s, at("2026-11-09T09:31:00Z"))]);
  assert.deepEqual(s.jobs.map((j) => j.period).sort(), ["m:2026-11", "w:2026-11-02", "w:2026-11-09"]);
});

test("a report scheduled after the due time waits for the next period", async () => {
  const s = new Memory();
  const saved = at("2026-11-04T15:00:00Z"); // a Wednesday
  s.add("r1", "weekly", "America/New_York", periodAt("weekly", "America/New_York", saved)!.key);
  assert.equal(await queueDue(s, saved), 0);
  assert.equal(await queueDue(s, at("2026-11-09T13:59:00Z")), 0); // Monday 8:59 in New York
  assert.equal(await queueDue(s, at("2026-11-09T14:00:00Z")), 1);
});

test("last_sent_at moves only when an email went out, and a period is never sent twice", async () => {
  const s = new Memory();
  s.add("r1", "weekly", "Europe/London");
  await queueDue(s, at("2026-11-02T09:05:00Z"));
  const job = s.jobs[0];

  s.mail = false;
  assert.equal(await runReportJob(s, job, at("2026-11-02T09:06:00Z")), "no mail");
  assert.equal(s.reports.get("r1")!.lastSentAt, null);

  s.mail = true;
  s.failSends = 2;
  await assert.rejects(runReportJob(s, job, at("2026-11-02T09:07:00Z")));
  await assert.rejects(runReportJob(s, job, at("2026-11-02T09:08:00Z")));
  assert.equal(s.reports.get("r1")!.lastSentAt, null);
  assert.equal(await runReportJob(s, job, at("2026-11-02T09:20:00Z")), "sent");
  assert.equal(s.reports.get("r1")!.lastSentAt!.toISOString(), "2026-11-02T09:20:00.000Z");
  // The same job again (a worker that crashed after sending) sends nothing.
  assert.equal(await runReportJob(s, job, at("2026-11-02T09:30:00Z")), "already sent");
  assert.equal(s.sends, 1);

  // Turned off or deleted before the job ran: nothing goes out.
  s.reports.get("r1")!.schedule = "none";
  assert.equal(await runReportJob(s, { ...job, at: "2026-11-09T09:00:00Z" }), "unscheduled");
  s.reports.delete("r1");
  assert.equal(await runReportJob(s, { ...job, at: "2026-11-09T09:00:00Z" }), "gone");
  assert.equal(s.sends, 1);
});
