import "server-only";
import { adminClient } from "./supabase/server";
import { analytics, type Analytics } from "./analytics";
import { appUrl, listChannels, type Channel } from "./channels";
import { mailReady, sendEmail } from "./alerts";
import { PLANS, assertCanUseReports, effectivePlan, limitsOf, type Billing } from "./billing";
import { mayUseBrand } from "./brands";
import { hashToken, newToken, open, seal } from "./crypto";
import { mediaThumbs } from "./media";
import { fmtNum, fmtParts } from "./format";
import type { Ctx } from "./session";
import { RANGES, SCHEDULES, SECTIONS, periodAt, queueDue, reportSpan, runReportJob, type RangeKey, type ReportJob, type ReportStore, type Schedule, type SectionKey } from "./reportTimes";

// Reports: a saved view of a brand's analytics with a public link (/r/<token>) and an optional weekly or monthly
// email. The sending rules live in reportTimes.ts.

export type Report = {
  id: string;
  brandId: string | null;
  name: string;
  range: RangeKey;
  sections: SectionKey[];
  notes: string;
  schedule: Schedule;
  sendTo: string[];
  lastSentAt: string | null;
  logoMediaId: string | null;
  accent: string | null;
  /** The share link, or null when it was sealed with an older key. */
  url: string | null;
};

export type ReportInput = Omit<Report, "id" | "lastSentAt" | "url">;

type Row = {
  id: string;
  workspace_id: string;
  brand_id: string | null;
  name: string;
  range_days: RangeKey;
  sections: SectionKey[];
  notes: string;
  schedule: Schedule;
  send_to: string[];
  last_sent_at: string | null;
  logo_media_id: string | null;
  accent: string | null;
  token: string;
};

const COLS = "id, workspace_id, brand_id, name, range_days, sections, notes, schedule, send_to, last_sent_at, logo_media_id, accent, token";
const reportUrl = (token: string) => `${appUrl()}/r/${token}`;
const EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;
const ACCENT = /^#[0-9a-fA-F]{6}$/;

const shape = (r: Row): Report => {
  let url: string | null = null;
  try {
    url = reportUrl(open(r.token));
  } catch {
    // sealed with an older key
  }
  return { id: r.id, brandId: r.brand_id, name: r.name, range: r.range_days, sections: r.sections, notes: r.notes, schedule: r.schedule, sendTo: r.send_to, lastSentAt: r.last_sent_at, logoMediaId: r.logo_media_id, accent: r.accent, url };
};

/** The workspace's reports; `scope` keeps only these brands' (null: every report, "All brands" ones too). */
export async function listReports(workspaceId: string, scope: string[] | null): Promise<Report[]> {
  if (scope && !scope.length) return [];
  let q = adminClient().from("reports").select(COLS).eq("workspace_id", workspaceId);
  if (scope) q = q.in("brand_id", scope);
  const { data, error } = await q.order("created_at");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(shape);
}

/** Checks a report's fields. Throws the first problem. */
function clean(input: ReportInput, whiteLabel: boolean) {
  const name = input.name.trim();
  if (!name) throw new Error("Enter a name");
  if (name.length > 80) throw new Error("Names are up to 80 characters");
  if (!RANGES.some((r) => r.value === input.range)) throw new Error("Pick a range");
  if (!SCHEDULES.some((s) => s.value === input.schedule)) throw new Error("Pick a schedule");
  const sections = SECTIONS.map((s) => s.key).filter((k) => input.sections.includes(k));
  if (!sections.length) throw new Error("Pick at least one section");
  const notes = input.notes.trim();
  if (notes.length > 5000) throw new Error("Notes are up to 5,000 characters");
  const sendTo = [...new Set(input.sendTo.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const bad = sendTo.find((e) => !EMAIL.test(e) || e.length > 320);
  if (bad) throw new Error(`${bad} isn't an email address`);
  if (sendTo.length > 20) throw new Error("Send to up to 20 addresses");
  if (input.schedule !== "none" && !sendTo.length) throw new Error("Add an email to send to");
  const accent = whiteLabel && input.accent?.trim() ? input.accent.trim() : null;
  if (accent && !ACCENT.test(accent)) throw new Error("Colors look like #1F6FEB");
  return { name, range_days: input.range, sections, notes, schedule: input.schedule, send_to: sendTo, accent, logo_media_id: whiteLabel ? input.logoMediaId : null };
}

/** Create (id null) or change a report. Returns its id. */
export async function saveReport(ctx: Pick<Ctx, "workspaceId" | "userId" | "timezone" | "brandIds">, id: string | null, input: ReportInput) {
  await assertCanUseReports(ctx.workspaceId);
  const limits = await limitsOf(ctx.workspaceId);
  const row = clean(input, limits.whiteLabel);
  const db = adminClient();
  if (input.brandId) {
    const { data: b } = await db.from("brands").select("id").eq("id", input.brandId).eq("workspace_id", ctx.workspaceId).maybeSingle();
    if (!b || !mayUseBrand(ctx, input.brandId)) throw new Error("Brand not found");
  } else if (ctx.brandIds) throw new Error("Pick a brand");
  if (row.logo_media_id) {
    const { data: m } = await db.from("media").select("mime").eq("id", row.logo_media_id).eq("workspace_id", ctx.workspaceId).maybeSingle();
    if (!m || !String(m.mime).startsWith("image/")) throw new Error("Pick an image for the logo");
  }
  // A schedule set after this period's due time starts with the next period.
  const queued = periodAt(row.schedule, ctx.timezone, new Date())?.key ?? null;
  if (!id) {
    const token = newToken();
    const { data, error } = await db
      .from("reports")
      .insert({ ...row, brand_id: input.brandId, workspace_id: ctx.workspaceId, queued_period: queued, token_hash: hashToken(token), token: seal(token), created_by: ctx.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data.id as string;
  }
  const { data: cur } = await db.from("reports").select("brand_id, schedule").eq("id", id).eq("workspace_id", ctx.workspaceId).maybeSingle();
  if (!cur || !mayUseBrand(ctx, cur.brand_id as string | null)) throw new Error("Report not found");
  const { error } = await db
    .from("reports")
    .update({ ...row, brand_id: input.brandId, ...(cur.schedule !== row.schedule ? { queued_period: queued } : {}) })
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId);
  if (error) throw new Error(error.message);
  return id;
}

export async function deleteReport(ctx: Pick<Ctx, "workspaceId" | "brandIds">, id: string) {
  const db = adminClient();
  const { data: cur } = await db.from("reports").select("brand_id").eq("id", id).eq("workspace_id", ctx.workspaceId).maybeSingle();
  if (!cur || !mayUseBrand(ctx, cur.brand_id as string | null)) throw new Error("Report not found");
  const { error } = await db.from("reports").delete().eq("id", id).eq("workspace_id", ctx.workspaceId);
  if (error) throw new Error(error.message);
}

// The report page and its email

type Ws = Pick<Billing, "plan" | "trial_ends_at"> & { name: string; timezone: string };

export type ReportView = {
  name: string;
  /** The brand's name, or "All brands". */
  title: string;
  period: string;
  workspace: string;
  timezone: string;
  sections: SectionKey[];
  notes: string;
  channels: Channel[];
  data: Analytics | null;
  /** The agency's logo and color (Agency plan), in place of Capybaroar's. */
  white: { logo: string | null; accent: string | null } | null;
};

async function rowById(id: string) {
  const { data } = await adminClient().from("reports").select(COLS).eq("id", id).maybeSingle();
  return (data as Row | null) ?? null;
}

async function workspaceOf(id: string): Promise<Ws | null> {
  const { data } = await adminClient().from("workspaces").select("name, timezone, plan, trial_ends_at").eq("id", id).maybeSingle();
  return (data as Ws | null) ?? null;
}

/** What a report shows today. */
async function build(r: Row, ws: Ws, now = new Date()): Promise<ReportView> {
  const db = adminClient();
  const tz = ws.timezone;
  const [brand, channels] = await Promise.all([
    r.brand_id ? db.from("brands").select("name").eq("id", r.brand_id).maybeSingle() : null,
    listChannels(r.workspace_id, r.brand_id ? [r.brand_id] : null),
  ]);
  const span = reportSpan(r.range_days, tz, now);
  const data = channels.length ? await analytics(r.workspace_id, tz, span.days, r.brand_id ? channels.map((c) => c.id) : null, span) : null;
  const last = new Date(span.to.getTime() - 43200000);
  const period =
    r.range_days === "last_month"
      ? fmtParts(last, { month: "long", year: "numeric", timeZone: tz })
      : `${fmtParts(span.from, { month: "short", day: "numeric", timeZone: tz })} – ${fmtParts(last, { month: "short", day: "numeric", year: "numeric", timeZone: tz })}`;
  let white: ReportView["white"] = null;
  if (PLANS[effectivePlan(ws)].whiteLabel && (r.logo_media_id || r.accent)) {
    const logo = r.logo_media_id ? ((await mediaThumbs(r.workspace_id, [r.logo_media_id]))[0]?.thumb ?? null) : null;
    white = { logo, accent: r.accent };
  }
  return {
    name: r.name,
    title: (brand?.data?.name as string | undefined) ?? "All brands",
    period,
    workspace: ws.name,
    timezone: tz,
    sections: r.sections,
    notes: r.notes,
    channels,
    data,
    white,
  };
}

/** The report a share link opens, or null when it was deleted or the plan no longer has reports. */
export async function reportForToken(token: string, now = new Date()): Promise<ReportView | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const { data } = await adminClient().from("reports").select(COLS).eq("token_hash", hashToken(token)).maybeSingle();
  if (!data) return null;
  const r = data as Row;
  const ws = await workspaceOf(r.workspace_id);
  if (!ws || !PLANS[effectivePlan(ws)].reports) return null;
  return build(r, ws, now);
}

const change = (cur: number, prev: number) => (prev > 0 ? ` (${cur >= prev ? "+" : "-"}${fmtNum((Math.abs(cur - prev) / prev) * 100, 0)}% vs previous)` : "");

/** Emails a report's link and headline numbers to its addresses. True when the email went out. Never throws. */
async function deliver(r: Row, ws: Ws) {
  try {
    const v = await build(r, ws);
    const url = shape(r).url;
    if (!url) return false;
    const lines = [v.period];
    const d = v.data;
    if (d) {
      lines.push(`Posts out: ${fmtNum(d.current.posts)}${change(d.current.posts, d.previous.posts)}`);
      if (d.current.withStats) {
        lines.push(`Reach: ${fmtNum(d.current.views)}${change(d.current.views, d.previous.views)}`);
        lines.push(`Engagements: ${fmtNum(d.current.engagement)}${change(d.current.engagement, d.previous.engagement)}`);
      }
      if (d.current.rate != null) lines.push(`Engagement rate: ${fmtNum(d.current.rate * 100, 1)}%`);
    }
    lines.push("", `Prepared by ${ws.name}`);
    return await sendEmail(r.send_to, `${v.title} report, ${v.period}`, { title: `${v.title}: ${r.name}`, body: lines.join("\n"), button: "Open the report", href: url, label: v.white ? ws.name : undefined });
  } catch (e) {
    console.error("report mail:", e instanceof Error ? e.message : e);
    return false;
  }
}

/** "Send now" from the reports screen. */
export async function sendReportNow(ctx: Pick<Ctx, "workspaceId" | "brandIds">, id: string) {
  await assertCanUseReports(ctx.workspaceId);
  const r = await rowById(id);
  if (!r || r.workspace_id !== ctx.workspaceId || !mayUseBrand(ctx, r.brand_id)) throw new Error("Report not found");
  if (!r.send_to.length) throw new Error("Add an email to send to");
  if (!mailReady()) throw new Error("Email isn't set up on this server");
  const ws = await workspaceOf(r.workspace_id);
  if (!ws || !(await deliver(r, ws))) throw new Error("Couldn't send the email");
  await adminClient().from("reports").update({ last_sent_at: new Date().toISOString() }).eq("id", id);
}

// Scheduled sending (runner.ts): the hourly look for due reports and the job that emails one.

type ScheduledRow = { id: string; schedule: Schedule; send_to: string[]; queued_period: string | null; workspaces: Ws | Ws[] | null };
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export const reportStore: ReportStore = {
  async scheduled() {
    const { data, error } = await adminClient().from("reports").select("id, schedule, send_to, queued_period, workspaces(name, timezone, plan, trial_ends_at)").neq("schedule", "none");
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as ScheduledRow[]).flatMap((r) => {
      const ws = one(r.workspaces);
      return ws && r.send_to.length && PLANS[effectivePlan(ws)].reports ? [{ id: r.id, schedule: r.schedule, timeZone: ws.timezone, queued: r.queued_period }] : [];
    });
  },
  async queue(id, seen, period, at) {
    const { data, error } = await adminClient().rpc("queue_report", { report: id, seen, period, due: at.toISOString() });
    if (error) throw new Error(error.message);
    return data === true;
  },
  async report(id) {
    const r = await rowById(id);
    if (!r) return null;
    const ws = await workspaceOf(r.workspace_id);
    return { schedule: r.schedule, sendTo: r.send_to, lastSentAt: r.last_sent_at ? new Date(r.last_sent_at) : null, allowed: !!ws && PLANS[effectivePlan(ws)].reports };
  },
  mailReady,
  async send(id) {
    const r = await rowById(id);
    const ws = r ? await workspaceOf(r.workspace_id) : null;
    return !!r && !!ws && deliver(r, ws);
  },
  // The email is out: a failure here is logged, not thrown, so the job doesn't retry and send it again.
  async sent(id, at) {
    const { error } = await adminClient().from("reports").update({ last_sent_at: at.toISOString() }).eq("id", id);
    if (error) console.error("report sent:", error.message);
  },
};

/** Hourly, on every server: queue the emails that are due. */
export const queueReports = () => queueDue(reportStore);

/** A "report" job. */
export const runReport = async (payload: Record<string, string>) => {
  await runReportJob(reportStore, payload as unknown as ReportJob);
};
