// Bulk posts, kept free of Supabase so the browser can show the preview and tests can run it: a CSV file read into
// one planned post per row (with every problem found per row before anything is saved), and the times a stack of
// uploaded files is spread over. The server reads the same file again with the same rules before it saves.
import { parseCsv } from "./csv";
import { networkOf, NETWORKS, type NetworkId } from "./networks";
import { nextQueueSlot, todayIn, zonedInstant, type Slot } from "./queue";
import { splitThread } from "./thread";

export const MAX_ROWS = 500;
/** Server actions take up to 1 MB, and the file goes along with every save. */
export const MAX_CSV = 900_000;

export type BulkChannel = { id: string; name: string; username?: string | null; network: NetworkId; brand_id: string | null; status: string };

export type BulkRow = {
  /** The line in the file (the header is line 1). */
  line: number;
  at: string | null;
  channelIds: string[];
  text: string;
  mediaUrl: string | null;
  firstComment: string | null;
  title: string | null;
  /** A campaign by name: an existing one, or a new one made on import. */
  campaign: string | null;
  /** Problems that stop the row being saved at all. */
  errors: string[];
  /** Settings a network needs before it can go out (a YouTube title): the row can only be a draft. */
  holds: string[];
};

const COLUMNS = {
  date: ["date", "day"],
  time: ["time", "hour"],
  channels: ["channels", "channel", "network", "networks"],
  text: ["text", "message", "content", "post", "caption"],
  media: ["media", "media url", "media_url", "mediaurl", "image", "image url", "video", "url"],
  comment: ["first comment", "first_comment", "firstcomment", "comment"],
  title: ["title"],
  campaign: ["campaign"],
} as const;
type Col = keyof typeof COLUMNS;

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Settings every channel starts with (each network field's default), plus the row's first comment and title. */
export function settingsFor(network: NetworkId, extra: { firstComment?: string | null; title?: string | null } = {}): Record<string, string> {
  const fields = networkOf(network).fields ?? [];
  const out: Record<string, string> = Object.fromEntries(fields.filter((f) => f.initial).map((f) => [f.key, f.initial!]));
  if (extra.firstComment && fields.some((f) => f.key === "first_comment")) out.first_comment = extra.firstComment;
  if (extra.title && fields.some((f) => f.key === "title")) out.title = extra.title;
  return out;
}

/** Read a date ("2026-11-05" or "2026/11/05") and a time ("09:30", "9:30 PM") as an instant in the zone. */
export function readWhen(date: string, time: string, timeZone: string): Date | null {
  let d = date.trim();
  let t = time.trim();
  // One column holding both: "2026-11-05 09:30" or "2026-11-05T09:30".
  const both = /^(\S+)[T ](.+)$/.exec(d);
  if (both && !t) [d, t] = [both[1], both[2]];
  const dm = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(d);
  const tm = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])?\.?\s*m?\.?$/i.exec(t);
  if (!dm || !tm) return null;
  const [y, m, day] = [+dm[1], +dm[2], +dm[3]];
  let hh = +tm[1];
  const mm = +tm[2];
  const ampm = tm[3]?.toLowerCase();
  if (ampm) {
    if (hh < 1 || hh > 12) return null;
    hh = (hh % 12) + (ampm === "p" ? 12 : 0);
  }
  if (m < 1 || m > 12 || day < 1 || day > 31 || hh > 23 || mm > 59) return null;
  const check = new Date(Date.UTC(y, m - 1, day));
  if (check.getUTCMonth() !== m - 1) return null;
  return zonedInstant(y, m - 1, day, hh, mm, timeZone);
}

/** Channel names or networks ("LinkedIn | X", "Acme Page"). A network picks every channel on it. */
export function matchChannels(cell: string, channels: BulkChannel[]): { ids: string[]; unknown: string[] } {
  const ids: string[] = [];
  const unknown: string[] = [];
  for (const raw of cell.split(/[|;,\n]/)) {
    const want = norm(raw);
    if (!want) continue;
    const byName = channels.filter((c) => norm(c.name) === want || c.username?.toLowerCase() === want.replace(/^@/, ""));
    const net = NETWORKS.find((n) => n.id === want || norm(n.name) === want);
    const found = byName.length ? byName : net ? channels.filter((c) => c.network === net.id) : [];
    if (!found.length) unknown.push(raw.trim());
    for (const c of found) if (!ids.includes(c.id)) ids.push(c.id);
  }
  return { ids, unknown };
}

/** Every row of the file as a planned post. `error` is for the file as a whole (no header, too many rows). */
export function parseBulk(csv: string, channels: BulkChannel[], timeZone: string, now = new Date()): { rows: BulkRow[]; error: string | null } {
  const table = parseCsv(csv);
  if (!table.length) return { rows: [], error: "This file is empty" };
  const head = table[0].map(norm);
  const at: Partial<Record<Col, number>> = {};
  for (const col of Object.keys(COLUMNS) as Col[]) {
    const i = head.findIndex((h) => (COLUMNS[col] as readonly string[]).includes(h));
    if (i >= 0) at[col] = i;
  }
  if (at.date == null || at.channels == null || at.text == null) return { rows: [], error: "The first row needs the columns date, time, channels and text" };
  const body = table.slice(1);
  if (body.length > MAX_ROWS) return { rows: [], error: `Up to ${MAX_ROWS} rows at a time` };
  const byId = new Map(channels.map((c) => [c.id, c]));
  const cell = (r: string[], col: Col) => (at[col] == null ? "" : (r[at[col]!] ?? "").trim());
  const rows = body.map((r, i): BulkRow => {
    const errors: string[] = [];
    const holds: string[] = [];
    const text = cell(r, "text").replace(/\r\n/g, "\n");
    const mediaUrl = cell(r, "media") || null;
    const firstComment = cell(r, "comment") || null;
    const title = cell(r, "title") || null;
    const campaign = cell(r, "campaign").replace(/\s+/g, " ").trim() || null;
    if (campaign && [...campaign].length > 60) errors.push("Campaign names are up to 60 characters");
    const when = readWhen(cell(r, "date"), cell(r, "time"), timeZone);
    if (!when) errors.push("Use a date like 2026-11-05 and a time like 09:30");
    else if (when.getTime() < now.getTime() + 60000) errors.push("Pick a time in the future");
    const { ids, unknown } = matchChannels(cell(r, "channels"), channels);
    if (unknown.length) errors.push(`No channel called ${unknown.map((u) => `"${u}"`).join(", ")}`);
    else if (!ids.length) errors.push("Pick at least one channel");
    const picked = ids.map((id) => byId.get(id)!);
    if (new Set(picked.map((c) => c.brand_id)).size > 1) errors.push("Pick channels from one brand");
    if (mediaUrl && !/^https?:\/\/\S+$/i.test(mediaUrl)) errors.push("The media URL must start with http:// or https://");
    if (!text && !mediaUrl) errors.push("Write something or add a media URL");
    if (firstComment && picked.length && !picked.some((c) => (networkOf(c.network).fields ?? []).some((f) => f.key === "first_comment"))) errors.push("These channels don't take a first comment");
    for (const c of picked) {
      const n = networkOf(c.network);
      if (c.status === "reconnect") errors.push(`Reconnect ${c.name} first`);
      // A line holding only --- starts the next post of a thread. Networks without threads post the first only.
      const parts = splitThread(text);
      if ([...parts.text].length > n.limit) errors.push(`${c.name}: ${n.name} posts are up to ${n.limit.toLocaleString("en-US")} characters`);
      if (n.thread) parts.thread.forEach((p, k) => [...p.text].length > n.limit && errors.push(`${c.name}: post ${k + 2} of the thread is over ${n.limit.toLocaleString("en-US")} characters`));
      if (n.needsMedia && !mediaUrl) errors.push(`${c.name}: ${n.name} needs a picture or video`);
      const settings = settingsFor(c.network, { firstComment, title });
      for (const f of n.fields ?? []) if (f.required && !settings[f.key]?.trim()) holds.push(`${c.name}: ${f.label} is required`);
    }
    return { line: i + 2, at: when?.toISOString() ?? null, channelIds: ids, text, mediaUrl, firstComment, title, campaign, errors, holds };
  });
  return { rows, error: rows.length ? null : "This file has a header and no rows" };
}

/** One post a day at a wall-clock time in the zone, starting today if that time is still ahead. */
export function dailyTimes(n: number, time: string, timeZone: string, now = new Date()): Date[] {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m || n <= 0) return [];
  const t = todayIn(timeZone, now);
  const out: Date[] = [];
  for (let i = 0; out.length < n && i < n + 2; i++) {
    const day = new Date(Date.UTC(t.y, t.m, t.d + i));
    const at = zonedInstant(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), +m[1], +m[2], timeZone);
    if (at.getTime() > now.getTime() + 60000) out.push(at);
  }
  return out;
}

/** The queue's next free slots, one per post, each taken before the next is looked for. Null when they run out. */
export function queueTimes(n: number, slots: Slot[], timeZone: string, taken: Set<number>, now = new Date()): Date[] | null {
  const busy = new Set(taken);
  const out: Date[] = [];
  for (let i = 0; i < n; i++) {
    const at = nextQueueSlot(slots, timeZone, busy, now);
    if (!at) return null;
    busy.add(at.getTime());
    out.push(at);
  }
  return out;
}

/** A sample file with every column, for people starting from nothing. */
export const TEMPLATE = "date,time,channels,text,media url,first comment,campaign\n2026-12-01,09:30,LinkedIn | X,\"Our winter launch is live, read more at https://example.com\",,,Winter launch\n";
