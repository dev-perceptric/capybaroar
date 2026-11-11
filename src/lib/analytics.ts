import "server-only";
import { adminClient } from "./supabase/server";
import { pickBest, pickPopular } from "./queue";

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

/**
 * Popular hours on each network across every workspace, for accounts without enough results of their own. Only totals
 * by weekday and hour leave this function, never a workspace's posts. Kept for a day per time zone.
 */
const popular = new Map<string, { at: number; value: Record<string, { day: number; hour: number }[]> }>();
export async function popularTimes(timeZone: string): Promise<Record<string, { day: number; hour: number }[]>> {
  const hit = popular.get(timeZone);
  if (hit && Date.now() - hit.at < DAY) return hit.value;
  const { data, error } = await adminClient()
    .from("post_targets")
    .select("published_at, channels(network), post_metrics(engagement)")
    .eq("status", "published")
    .gte("published_at", new Date(Date.now() - 90 * DAY).toISOString())
    .order("published_at", { ascending: false })
    .limit(20000);
  if (error) throw new Error(error.message);
  type P = { published_at: string; channels: { network: string } | { network: string }[] | null; post_metrics: Row["post_metrics"] };
  const byNetwork = new Map<string, P[]>();
  for (const r of (data ?? []) as unknown as P[]) {
    const n = one(r.channels)?.network;
    if (n) byNetwork.set(n, [...(byNetwork.get(n) ?? []), r]);
  }
  const value = Object.fromEntries([...byNetwork].map(([n, rows]) => [n, pickPopular(bestCells(rows, timeZone))]).filter(([, v]) => (v as unknown[]).length));
  popular.set(timeZone, { at: Date.now(), value });
  return value;
}

/** The best `n` slots (3 by default), once there's enough data to mean something (10 posts with results). */
export async function suggestedTimes(workspaceId: string, timeZone: string, n = 3) {
  return pickBest(await bestTimes(workspaceId, timeZone), n);
}

/** The last `days` days up to now, or a fixed `span` (a report's whole days); either is compared with the same length before it. */
export async function analytics(workspaceId: string, timeZone: string, days: number, channelId: Channels, span?: { from: Date; to: Date }) {
  const db = adminClient();
  const now = span?.to ?? new Date();
  const from = span?.from ?? new Date(now.getTime() - days * DAY);
  const before = new Date(from.getTime() - (now.getTime() - from.getTime()));
  let fq = db.from("metrics").select("channel_id, day, followers").eq("workspace_id", workspaceId).gte("day", before.toISOString().slice(0, 10)).order("day");
  if (span) fq = fq.lte("day", dateIn(now.toISOString(), timeZone));
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
  // A span's days are whole: step from noon of its first day and stop before `to`, so a daylight saving change
  // never adds or drops one.
  if (span) for (let t = from.getTime() + DAY / 2; t < now.getTime(); t += DAY) daily.set(dateIn(new Date(t).toISOString(), timeZone), { posts: 0, engagement: 0 });
  else for (let t = from.getTime(); t <= now.getTime(); t += DAY) daily.set(dateIn(new Date(t).toISOString(), timeZone), { posts: 0, engagement: 0 });
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

  const perChannel = new Map<string, Row[]>();
  for (const r of cur) {
    const list = perChannel.get(r.channel_id);
    if (list) list.push(r);
    else perChannel.set(r.channel_id, [r]);
  }

  return {
    days,
    current: totals(cur),
    byChannel: [...perChannel.entries()].map(([channelId, rows]) => ({ channelId, ...totals(rows) })),
    previous: totals(prev),
    daily: [...daily.entries()].map(([day, v]) => ({ day, ...v })),
    best,
    top: top.filter((t) => t.m).sort((a, b) => b.m!.engagement - a.m!.engagement).slice(0, 10),
    formats,
    followers: (followers ?? []) as { channel_id: string; day: string; followers: number | null }[],
    since: span ? dateIn(from.toISOString(), timeZone) : from.toISOString().slice(0, 10),
  };
}

export type Analytics = Awaited<ReturnType<typeof analytics>>;
