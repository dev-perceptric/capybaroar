import "server-only";
import { adminClient } from "./supabase/server";

type Metrics = { views: number | null; reach: number | null; impressions: number | null; likes: number | null; comments: number | null; shares: number | null; saves: number | null; clicks: number | null; engagement: number };
type Row = {
  id: string;
  channel_id: string;
  published_at: string;
  text: string | null;
  url: string | null;
  deleted_at: string | null;
  posts: { text: string; media_ids: string[] };
  post_metrics: Metrics | Metrics[] | null;
};

/** `deleted`: deleted on the network since; its numbers stay. */
export type TopPost = { id: string; channelId: string; at: string; text: string; url: string | null; deleted: boolean; format: Format; m: Metrics | null; rate: number | null };
export type Format = "video" | "picture" | "text";
export type Totals = { posts: number; views: number; engagement: number; rate: number | null; withStats: number };

const DAY = 86400000;
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
/** People who saw it: reach when the network gives it, else views, else impressions. */
const seen = (m: Metrics | null) => (m ? (m.reach ?? m.views ?? m.impressions ?? null) : null);

const FULL = "id, channel_id, published_at, text, url, deleted_at, posts(text, media_ids), post_metrics(views, reach, impressions, likes, comments, shares, saves, clicks, engagement)";
/** Enough for best times: when it went out and how it did. */
const TIMES = "published_at, post_metrics(engagement)";
/** One channel, a brand's channels (a list), or every channel (null). */
type Channels = string | string[] | null;

async function published(workspaceId: string, from: Date, to: Date, channelId: Channels, cols = FULL) {
  let q = adminClient()
    .from("post_targets")
    .select(cols)
    .eq("workspace_id", workspaceId)
    .eq("status", "published")
    .gte("published_at", from.toISOString())
    .lt("published_at", to.toISOString())
    .order("published_at");
  if (Array.isArray(channelId)) q = q.in("channel_id", channelId);
  else if (channelId) q = q.eq("channel_id", channelId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Row[];
}

function totals(rows: Row[]): Totals {
  let views = 0;
  let engagement = 0;
  let seenSum = 0;
  let seenEng = 0;
  let withStats = 0;
  for (const r of rows) {
    const m = one(r.post_metrics);
    if (!m) continue;
    withStats++;
    engagement += m.engagement;
    const s = seen(m);
    if (s != null) {
      views += s;
      if (s > 0) {
        seenSum += s;
        seenEng += m.engagement;
      }
    }
  }
  return { posts: rows.length, views, engagement, rate: seenSum ? seenEng / seenSum : null, withStats };
}

// Making a date format is slow next to using one, and a 90-day range runs one per post: keep one per time zone.
const dateFormats = new Map<string, Intl.DateTimeFormat>();
const formatFor = (key: string, make: () => Intl.DateTimeFormat) => {
  let f = dateFormats.get(key);
  if (!f) dateFormats.set(key, (f = make()));
  return f;
};

/** Weekday (0 = Sunday) and hour of an instant in a time zone. */
function dayHour(iso: string, timeZone: string) {
  const f = formatFor(`dh:${timeZone}`, () => new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "numeric", hourCycle: "h23" }));
  const p = Object.fromEntries(f.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), hour: Number(p.hour) % 24 };
}
const dateIn = (iso: string, timeZone: string) => formatFor(`d:${timeZone}`, () => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })).format(new Date(iso));

export type BestCell = { day: number; hour: number; posts: number; engagement: number };

/** Average engagement per post by weekday and hour, from the last 90 days. */
export async function bestTimes(workspaceId: string, timeZone: string, channelId: Channels = null): Promise<BestCell[]> {
  return bestCells(await published(workspaceId, new Date(Date.now() - 90 * DAY), new Date(), channelId, TIMES), timeZone);
}

function bestCells(rows: Pick<Row, "published_at" | "post_metrics">[], timeZone: string): BestCell[] {
  const cells = new Map<string, BestCell>();
  for (const r of rows) {
    const m = one(r.post_metrics);
    if (!m) continue;
    const { day, hour } = dayHour(r.published_at, timeZone);
    const k = `${day}:${hour}`;
    const c = cells.get(k) ?? { day, hour, posts: 0, engagement: 0 };
    c.posts++;
    c.engagement += m.engagement;
    cells.set(k, c);
  }
  return [...cells.values()].map((c) => ({ ...c, engagement: c.engagement / c.posts }));
}

/** The best 3 slots, once there's enough data to mean something (10 posts with results). */
export async function suggestedTimes(workspaceId: string, timeZone: string) {
  const cells = await bestTimes(workspaceId, timeZone);
  if (cells.reduce((s, c) => s + c.posts, 0) < 10) return [];
  return cells
    .filter((c) => c.posts >= 2)
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 3)
    .map(({ day, hour }) => ({ day, hour }));
}

export async function analytics(workspaceId: string, timeZone: string, days: number, channelId: Channels) {
  const db = adminClient();
  const now = new Date();
  const from = new Date(now.getTime() - days * DAY);
  const before = new Date(from.getTime() - days * DAY);
  let fq = db.from("metrics").select("channel_id, day, followers").eq("workspace_id", workspaceId).gte("day", before.toISOString().slice(0, 10)).order("day");
  if (Array.isArray(channelId)) fq = fq.in("channel_id", channelId);
  else if (channelId) fq = fq.eq("channel_id", channelId);
  // Best times look at the last 90 days: on the 90-day view that's the current range itself.
  const [cur, prev, best90, { data: followers }] = await Promise.all([
    published(workspaceId, from, now, channelId),
    published(workspaceId, before, from, channelId),
    days === 90 ? null : bestTimes(workspaceId, timeZone, channelId),
    fq,
  ]);
  const best = best90 ?? bestCells(cur, timeZone);

  const mediaIds = [...new Set(cur.flatMap((r) => r.posts.media_ids ?? []))];
  const { data: media } = mediaIds.length ? await db.from("media").select("id, mime").in("id", mediaIds) : { data: [] };
  const mime = new Map((media ?? []).map((m) => [m.id as string, m.mime as string]));
  const formatOf = (r: Row): Format => {
    const ms = (r.posts.media_ids ?? []).map((id) => mime.get(id) ?? "");
    return ms.some((x) => x.startsWith("video/")) ? "video" : ms.length ? "picture" : "text";
  };

  const daily = new Map<string, { posts: number; engagement: number }>();
  for (let t = from.getTime(); t <= now.getTime(); t += DAY) daily.set(dateIn(new Date(t).toISOString(), timeZone), { posts: 0, engagement: 0 });
  for (const r of cur) {
    const d = daily.get(dateIn(r.published_at, timeZone));
    if (!d) continue;
    d.posts++;
    d.engagement += one(r.post_metrics)?.engagement ?? 0;
  }

  const top: TopPost[] = cur.map((r) => {
    const m = one(r.post_metrics);
    const s = seen(m);
    return { id: r.id, channelId: r.channel_id, at: r.published_at, text: r.text ?? r.posts.text, url: r.deleted_at ? null : r.url, deleted: !!r.deleted_at, format: formatOf(r), m, rate: m && s ? m.engagement / s : null };
  });

  const formats = (["video", "picture", "text"] as Format[]).map((f) => {
    const list = top.filter((t) => t.format === f && t.m);
    return { format: f, posts: top.filter((t) => t.format === f).length, avg: list.length ? list.reduce((s, t) => s + t.m!.engagement, 0) / list.length : null };
  });

  return {
    days,
    current: totals(cur),
    previous: totals(prev),
    daily: [...daily.entries()].map(([day, v]) => ({ day, ...v })),
    best,
    top: top.filter((t) => t.m).sort((a, b) => b.m!.engagement - a.m!.engagement).slice(0, 10),
    formats,
    followers: (followers ?? []) as { channel_id: string; day: string; followers: number | null }[],
    since: from.toISOString().slice(0, 10),
  };
}

export type Analytics = Awaited<ReturnType<typeof analytics>>;
