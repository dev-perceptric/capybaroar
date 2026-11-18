import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sendBuiltMail, mailReady } from "./alerts";
import { effectivePlan, onTrial, PAID, PLANS, trialDaysLeft, type PlanId } from "./billing";
import { appUrl } from "./channels";
import { creditsOf } from "./credits";
import { aiMail, awayMail, bioMail, channelMail, endingMail, firstPostMail, helpMail, liveMail, overMail, welcomeMail, type Foot, type Mail, type Sign } from "./nurtureMail";
import { nextSlots, pickStep, type NurtureStep } from "./nurturePlan";
import { adminClient } from "./supabase/server";

// Getting-started emails for a new workspace's first weeks, sent to the person who made it (its first owner).
// Which one goes out when: src/lib/nurturePlan.ts. The words and look: src/lib/nurtureMail.ts. The runner calls
// this every hour (runner.ts). Each send is logged in nurture_log (049) first, so two servers never send the same one.
//
// Settings (all optional):
//   NURTURE_START      only workspaces made on or after this time get them (default 2026-11-19), so older ones never do
//   NURTURE_REPLY_TO   where replies go (default hello@mail.capybaroar.com)
//   NURTURE_SIGN_NAME  a person to show on the help email ("Sam Reed"), with NURTURE_SIGN_ROLE under it
//   NURTURE_OFF=1      stops them

const HOUR = 36e5;
const DAY = 864e5;
const AWAY_EVERY = 90 * DAY;
const PER_RUN = 50;

const start = () => process.env.NURTURE_START?.trim() || "2026-11-19T00:00:00Z";
const replyTo = () => process.env.NURTURE_REPLY_TO?.trim() || "hello@mail.capybaroar.com";
const signer = (): Sign | null => {
  const name = process.env.NURTURE_SIGN_NAME?.trim();
  return name ? { name, role: process.env.NURTURE_SIGN_ROLE?.trim() || "Capybaroar" } : null;
};
const secret = () => process.env.TOKEN_KEY || process.env.AUDIT_SALT || "";

// ─────────────── the "turn them off" link ───────────────

const sign = (payload: string, key: string) => createHmac("sha256", `tips:${key}`).update(payload).digest("base64url").slice(0, 32);

export function tipsToken(workspaceId: string, userId: string, key = secret()) {
  const payload = Buffer.from(`${workspaceId}|${userId}`, "utf8").toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

/** The workspace and person in a token, or null when it was changed or made with another key. */
export function readTipsToken(token: string, key = secret()): { workspaceId: string; userId: string } | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !key) return null;
  const want = Buffer.from(sign(payload, key));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const [workspaceId, userId] = Buffer.from(payload, "base64url").toString("utf8").split("|");
  const uuid = /^[0-9a-f-]{36}$/i;
  return workspaceId && userId && uuid.test(workspaceId) && uuid.test(userId) ? { workspaceId, userId } : null;
}

// ─────────────── helpers ───────────────

/** The weekday (0 Sunday), minutes past midnight and hour now in a time zone. */
function localNow(tz: string | null | undefined) {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz || "UTC", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const hour = Number(p.hour);
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), minutes: hour * 60 + Number(p.minute), hour };
  } catch {
    const d = new Date();
    return { day: d.getUTCDay(), minutes: d.getUTCHours() * 60 + d.getUTCMinutes(), hour: d.getUTCHours() };
  }
}

function ago(iso: string | null | undefined) {
  if (!iso) return null;
  const d = Math.floor((Date.now() - Date.parse(iso)) / DAY);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
}

function when(iso: string, tz: string | null | undefined) {
  try {
    return new Date(iso).toLocaleString("en-US", { timeZone: tz || "UTC", weekday: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return new Date(iso).toUTCString().slice(0, 22);
  }
}

const line = (text: string | null) => {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  return t ? (t.length > 60 ? `${t.slice(0, 57).trimEnd()}...` : t) : "A post";
};

type Ws = { id: string; name: string; timezone: string | null; created_at: string; queue: unknown; plan: PlanId; plan_status: string | null; trial_ends_at: string | null };
type Owner = { user_id: string; tips?: boolean; created_at: string };
type Db = ReturnType<typeof adminClient>;

async function count(q: PromiseLike<{ count: number | null }>) {
  return (await q).count ?? 0;
}

// ─────────────── one workspace ───────────────

async function nurtureOne(db: Db, w: Ws): Promise<boolean> {
  const { data: owners } = await db.from("members").select("user_id, tips, created_at").eq("workspace_id", w.id).eq("role", "owner").order("created_at").limit(1);
  const owner = owners?.[0] as Owner | undefined;
  if (!owner || owner.tips === false) return false;
  // Someone who was already in another workspace isn't new. Only their first one gets these.
  const { data: older } = await db.from("members").select("workspace_id").eq("user_id", owner.user_id).lt("created_at", owner.created_at).limit(1);
  if (older?.length) return false;

  const now = Date.now();
  const { data: log } = await db.from("nurture_log").select("step, sent_at").eq("workspace_id", w.id).eq("user_id", owner.user_id);
  const logged = (log ?? []) as { step: string; sent_at: string }[];
  const sent = new Set(logged.filter((r) => r.step !== "away" || now - Date.parse(r.sent_at) < AWAY_EVERY).map((r) => r.step));
  const sentRecently = logged.some((r) => now - Date.parse(r.sent_at) < 20 * HOUR);

  const nowIso = new Date(now).toISOString();
  const [channels, scheduled, published, generations, bios, seen] = await Promise.all([
    count(db.from("channels").select("id", { count: "exact", head: true }).eq("workspace_id", w.id)),
    count(db.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", w.id).in("status", ["scheduled", "publishing", "review"]).gte("publish_at", nowIso)),
    count(db.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", w.id).in("status", ["published", "partial"])),
    count(db.from("generations").select("id", { count: "exact", head: true }).eq("workspace_id", w.id)),
    count(db.from("bio_pages").select("id", { count: "exact", head: true }).eq("workspace_id", w.id)),
    db.rpc("last_seen", { p_user: owner.user_id }).then((r) => (r.error ? null : (r.data as string | null))),
  ]);
  const lastSeen = seen ? Date.parse(seen) : null;
  const plan = effectivePlan(w);
  const trial = onTrial(w);
  const paid = PAID.includes(w.plan) && ["active", "trialing", "past_due"].includes(w.plan_status ?? "");
  const trialEnd = w.trial_ends_at ? Date.parse(w.trial_ends_at) : NaN;
  const local = localNow(w.timezone);

  const step = pickStep({
    ageHours: (now - Date.parse(w.created_at)) / HOUR,
    plan,
    trial,
    paid,
    daysLeft: trialDaysLeft(w),
    trialEndedHours: w.plan === "free" && Number.isFinite(trialEnd) && trialEnd < now ? (now - trialEnd) / HOUR : null,
    channels,
    scheduled,
    published,
    generations,
    bio: bios > 0,
    idleDays: lastSeen ? (now - lastSeen) / DAY : null,
    localHour: local.hour,
    sent,
    sentRecently,
  });
  if (!step) return false;

  const build = await builder(db, step, w, { plan, trial, trialEnd, channels, scheduled, published, generations, bio: bios > 0, local });
  if (!build) return false;
  const { data: user } = await db.auth.admin.getUserById(owner.user_id);
  const to = user?.user?.email;
  if (!to) return false;

  const period = step === "away" ? String(Math.floor(now / AWAY_EVERY)) : "once";
  const { error } = await db.from("nurture_log").insert({ workspace_id: w.id, user_id: owner.user_id, step, period });
  if (error) return false; // already sent, or 049_nurture.sql not run yet
  const unsubscribe = `${appUrl()}/api/email/tips?t=${encodeURIComponent(tipsToken(w.id, owner.user_id))}`;
  const mail = build({ unsubscribe, settings: `${appUrl()}/settings?tab=account` });
  // A hiccup is tried again with growing waits before the claim is given back.
  for (let attempt = 0; ; attempt++) {
    try {
      await sendBuiltMail(to, mail, { replyTo: replyTo(), headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
      return true;
    } catch (e) {
      if (attempt >= 2) {
        console.error(`Nurture ${step} for ${w.id} failed:`, e instanceof Error ? e.message : e);
        await db.from("nurture_log").delete().eq("workspace_id", w.id).eq("user_id", owner.user_id).eq("step", step).eq("period", period);
        return false;
      }
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
}

type Ctx = { plan: PlanId; trial: boolean; trialEnd: number; channels: number; scheduled: number; published: number; generations: number; bio: boolean; local: { day: number; minutes: number } };

/** The email for one step, or null when there's nothing worth sending. */
async function builder(db: Db, step: NurtureStep, w: Ws, c: Ctx): Promise<((f: Foot) => Mail) | null> {
  const app = appUrl();
  switch (step) {
    case "welcome": {
      const credits = c.trial ? await creditsOf(w.id).then((x) => x.left).catch(() => 0) : 0;
      const steps = [
        { title: "Make your workspace", done: true },
        { title: "Connect a channel", done: c.channels > 0 },
        { title: "Schedule your first post", done: c.scheduled + c.published > 0 },
        { title: "Let Capy write a post", done: c.generations > 0 },
        { title: "Make your link in bio", done: c.bio },
      ];
      return (f) => welcomeMail({ steps, trialEnds: c.trial ? new Date(c.trialEnd) : null, credits, url: c.channels ? `${app}/calendar` : `${app}/channels` }, f);
    }
    case "channel":
      return (f) => channelMail({ url: `${app}/channels` }, f);
    case "first": {
      const slot = nextSlots(w.queue, c.local.day, c.local.minutes, 1)[0] ?? null;
      return (f) => firstPostMail({ slot, ai: PLANS[c.plan].ai, url: `${app}/calendar` }, f);
    }
    case "live": {
      const { data } = await db.from("posts").select("text, publish_at").eq("workspace_id", w.id).in("status", ["scheduled", "review"]).gte("publish_at", new Date().toISOString()).order("publish_at").limit(3);
      const next = ((data ?? []) as { text: string | null; publish_at: string }[]).map((p) => ({ line: line(p.text), when: when(p.publish_at, w.timezone) }));
      return (f) => liveMail({ published: c.published, channels: c.channels, scheduled: c.scheduled, next, url: `${app}/calendar` }, f);
    }
    case "ai": {
      const credits = await creditsOf(w.id).then((x) => x.left).catch(() => 0);
      if (credits <= 0) return null;
      return (f) => aiMail({ credits, url: `${app}/agents` }, f);
    }
    case "bio":
      return (f) => bioMail({ name: w.name, url: `${app}/bio` }, f);
    case "ending":
      if (!Number.isFinite(c.trialEnd)) return null;
      return (f) => endingMail({ days: trialDaysLeft(w), ends: new Date(c.trialEnd), channels: c.channels, url: `${app}/settings?tab=billing` }, f);
    case "over": {
      const cols: PlanId[] = ["free", "creator", "pro"];
      const unlimited = (v: number | null) => (v === null ? "Unlimited" : String(v));
      const pick = c.channels > PLANS.creator.channels ? 2 : 1;
      return (f) =>
        overMail(
          {
            cols: cols.map((p) => PLANS[p].name),
            rows: [
              { label: "Channels", values: cols.map((p) => String(PLANS[p].channels)) },
              { label: "Posts a month", values: cols.map((p) => unlimited(PLANS[p].postsPerMonth)) },
              { label: "AI credits a month", values: cols.map((p) => (PLANS[p].aiCredits ? PLANS[p].aiCredits.toLocaleString("en-US") : "None")) },
              { label: "Team", values: cols.map((p) => (PLANS[p].members === 1 ? "Just you" : String(PLANS[p].members))) },
              { label: "Price a month", values: cols.map((p) => `$${PLANS[p].price}`) },
            ],
            pick,
            price: PLANS[cols[pick]].price,
            url: `${app}/settings?tab=billing`,
            stayUrl: `${app}/calendar`,
          },
          f,
        );
    }
    case "help":
      return (f) => helpMail({ url: `${app}/calendar`, sign: signer() }, f);
    case "away": {
      const since = new Date(Date.now() - 30 * DAY).toISOString();
      const [published, last] = await Promise.all([
        count(db.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", w.id).in("status", ["published", "partial"]).gte("publish_at", since)),
        db.from("posts").select("publish_at").eq("workspace_id", w.id).in("status", ["published", "partial"]).order("publish_at", { ascending: false }).limit(1),
      ]);
      const lastPost = ago((last.data?.[0] as { publish_at?: string } | undefined)?.publish_at);
      const slots = nextSlots(w.queue, c.local.day, c.local.minutes, 3);
      return (f) => awayMail({ lastPost, published, slots, url: `${app}/calendar` }, f);
    }
  }
}

/** Send the getting-started emails that are due. Returns how many went out. Never throws. */
export async function sendNurture(): Promise<number> {
  if (!mailReady() || process.env.NURTURE_OFF?.trim() === "1") return 0;
  const db = adminClient();
  const { data: list, error } = await db.from("workspaces").select("id, name, timezone, created_at, queue, plan, plan_status, trial_ends_at").gte("created_at", start()).is("deleting_at", null).order("created_at");
  if (error) {
    console.error("nurture:", error.message);
    return 0;
  }
  let sent = 0;
  for (const w of (list ?? []) as Ws[]) {
    if (sent >= PER_RUN) break;
    try {
      if (await nurtureOne(db, w)) sent++;
    } catch (e) {
      console.error(`Nurture for ${w.id} failed:`, e instanceof Error ? e.message : e);
    }
  }
  return sent;
}
