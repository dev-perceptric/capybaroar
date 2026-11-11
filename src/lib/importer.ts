import "server-only";
import { adminClient } from "./supabase/server";
import { listChannels } from "./channels";
import { ALLOWED, MAX_BYTES } from "./media";
import { savePost, type Actor, type PostStatus } from "./posts";
import { MAX_CSV, parseBulk, queueTimes, dailyTimes, settingsFor } from "./bulk";
import { splitThread } from "./thread";
import { assertCanScheduleMany } from "./billing";
import { safeGet, sniffMedia } from "./safefetch";
import type { Slot } from "./queue";

// Bulk upload: rows of a CSV file and stacks of uploaded files become posts, each saved by savePost with the person's
// actor, so plan limits, approvals and every channel check are the same as in the composer.

export type BulkResult = { key: string; status?: PostStatus; error?: string };

/** Download a picture or video from a link into the media library. Same types and size as uploads. */
export async function importMediaUrl(workspaceId: string, userId: string, url: string): Promise<string> {
  const got = await safeGet(url, { maxBytes: MAX_BYTES, timeoutMs: 120000, accept: "image/*,video/*" });
  const mime = sniffMedia(got.body);
  if (!mime || !ALLOWED.test(mime)) throw new Error("The media URL isn't a JPG, PNG, GIF, WebP, MP4, MOV or PDF");
  const base = decodeURIComponent(new URL(got.url).pathname.split("/").pop() || "file").replace(/[^\w.-]+/g, "-").slice(-80) || "file";
  const path = `${workspaceId}/${crypto.randomUUID()}-${base}`;
  const db = adminClient();
  const up = await db.storage.from("media").upload(path, got.body, { contentType: mime });
  if (up.error) throw new Error(up.error.message);
  const { data, error } = await db.from("media").insert({ workspace_id: workspaceId, path, name: base.slice(0, 200), mime, size: got.body.length, created_by: userId }).select("id").single();
  if (error) {
    await db.storage.from("media").remove([path]);
    throw new Error(error.message);
  }
  return data.id as string;
}

async function workspaceZone(workspaceId: string) {
  const { data } = await adminClient().from("workspaces").select("timezone, queue").eq("id", workspaceId).single();
  return { timeZone: (data?.timezone as string | undefined) ?? "UTC", slots: (data?.queue ?? []) as Slot[] };
}

/** Before a bulk save that schedules: throws when the plan's monthly posts can't hold them all. */
export async function checkRoom(workspaceId: string, n: number) {
  await assertCanScheduleMany(workspaceId, n);
}

/**
 * Save some rows of a CSV file, by line (the browser sends a few at a time so it can show progress, and never sends a
 * saved row again). The file is read again here with the same rules as the preview. Rows needing a setting only the
 * composer has stay drafts.
 */
export async function saveCsvRows(workspaceId: string, userId: string, actor: Actor, scope: string[] | null, csv: string, lines: number[], mode: "draft" | "schedule"): Promise<BulkResult[]> {
  if (lines.length > 25) throw new Error("Up to 25 rows per request");
  if (csv.length > MAX_CSV) throw new Error("CSV files are up to 900 KB");
  const [channels, { timeZone }] = await Promise.all([listChannels(workspaceId, scope), workspaceZone(workspaceId)]);
  const { rows, error } = parseBulk(csv, channels, timeZone);
  if (error) throw new Error(error);
  const fetched = new Map<string, string>();
  const out: BulkResult[] = [];
  const want = new Set(lines);
  for (const row of rows.filter((r) => want.has(r.line))) {
    const key = String(row.line);
    if (row.errors.length) {
      out.push({ key, error: row.errors[0] });
      continue;
    }
    try {
      let mediaIds: string[] = [];
      if (row.mediaUrl) {
        const id = fetched.get(row.mediaUrl) ?? (await importMediaUrl(workspaceId, userId, row.mediaUrl));
        fetched.set(row.mediaUrl, id);
        mediaIds = [id];
      }
      const byId = new Map(channels.map((c) => [c.id, c]));
      const r = await savePost(
        workspaceId,
        userId,
        {
          // A line holding only --- starts the next post of a thread. Channels without threads post the first only.
          ...splitThread(row.text),
          mediaIds,
          targets: row.channelIds.map((id) => ({ channelId: id, text: null, settings: settingsFor(byId.get(id)!.network, row) })),
          publishAt: row.at,
          mode: mode === "schedule" && !row.holds.length ? "schedule" : "draft",
        },
        actor,
      );
      out.push({ key, status: r.status });
    } catch (e) {
      out.push({ key, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return out;
}

/** Times for `n` uploaded files: the queue's next free slots, or one a day at a time of day. */
export async function spreadTimes(workspaceId: string, n: number, how: "queue" | "daily", time: string): Promise<string[]> {
  if (n < 1 || n > 100) throw new Error("Up to 100 files at a time");
  const { timeZone, slots } = await workspaceZone(workspaceId);
  if (how === "daily") {
    const times = dailyTimes(n, time, timeZone);
    if (times.length < n) throw new Error("Pick a time like 09:30");
    return times.map((d) => d.toISOString());
  }
  if (!slots.length) throw new Error("Add time slots to your queue in Settings first");
  const { data: taken } = await adminClient().from("posts").select("publish_at").eq("workspace_id", workspaceId).in("status", ["scheduled", "publishing", "review"]).gte("publish_at", new Date().toISOString());
  const times = queueTimes(n, slots, timeZone, new Set((taken ?? []).map((p) => new Date(p.publish_at as string).getTime())));
  if (!times) throw new Error("The queue has no free slot for every file in the next 8 weeks");
  return times.map((d) => d.toISOString());
}

/** One post per uploaded file, on the same channels. */
export async function saveMediaPosts(workspaceId: string, userId: string, actor: Actor, items: { key: string; mediaId: string; text: string; at: string }[], channelIds: string[], mode: "draft" | "schedule"): Promise<BulkResult[]> {
  if (items.length > 25) throw new Error("Up to 25 posts per request");
  const channels = await listChannels(workspaceId);
  const byId = new Map(channels.map((c) => [c.id, c]));
  const { data: mine } = await adminClient().from("media").select("id").eq("workspace_id", workspaceId).in("id", items.map((i) => i.mediaId));
  const ours = new Set((mine ?? []).map((m) => m.id as string));
  const out: BulkResult[] = [];
  for (const it of items) {
    try {
      if (!ours.has(it.mediaId)) throw new Error("A file in this post was deleted");
      const targets = channelIds.map((id) => {
        const c = byId.get(id);
        if (!c) throw new Error("A channel in this post was removed");
        return { channelId: id, text: null, settings: settingsFor(c.network) };
      });
      const r = await savePost(workspaceId, userId, { text: String(it.text ?? "").slice(0, 70000), mediaIds: [it.mediaId], targets, publishAt: it.at, mode }, actor);
      out.push({ key: it.key, status: r.status });
    } catch (e) {
      out.push({ key: it.key, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return out;
}
