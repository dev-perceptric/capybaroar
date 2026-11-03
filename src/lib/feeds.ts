import "server-only";
import { adminClient } from "./supabase/server";
import { listChannels } from "./channels";
import { networkOf } from "./networks";
import { memberActor, savePost } from "./posts";
import { settingsFor } from "./bulk";
import { fillTemplate, newItems, parseFeed, type Feed, type FeedItem } from "./rss";
import { safeGet } from "./safefetch";
import { shorten } from "./composer";
import { runEvergreenDue } from "./repost";

// RSS and Atom feeds that fill a brand's calendar. Every 30 minutes each active feed is read once (the first server
// to move fetched_at claims it). Items not seen before become drafts or queued posts on the feed's channels, with the
// link shortened so clicks are counted. A new feed posts only its newest item; the rest count as seen.

export type FeedRow = {
  id: string;
  brand_id: string;
  url: string;
  title: string;
  channel_ids: string[];
  template: string;
  mode: "draft" | "queue";
  active: boolean;
  fetched_at: string | null;
  error: string | null;
};

const COLS = "id, brand_id, url, title, channel_ids, template, mode, active, fetched_at, error";
const MAX_BYTES = 2 * 1024 * 1024;
const EVERY_MIN = 30;
/** New items one feed turns into posts per read: a feed that publishes 40 at once doesn't flood the calendar. */
const PER_READ = 3;
const KEEP_SEEN = 300;

export async function listFeeds(workspaceId: string, scope: string[] | null): Promise<FeedRow[]> {
  if (scope && !scope.length) return [];
  let q = adminClient().from("feeds").select(COLS).eq("workspace_id", workspaceId);
  if (scope) q = q.in("brand_id", scope);
  const { data, error } = await q.order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as FeedRow[];
}

async function readFeed(url: string): Promise<Feed> {
  const got = await safeGet(url, { maxBytes: MAX_BYTES, timeoutMs: 15000, accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5" });
  return parseFeed(got.body.toString("utf8"));
}

type Input = { url: string; channelIds: string[]; template: string; mode: "draft" | "queue" };

async function checkInput(workspaceId: string, brandId: string, input: Input) {
  const template = input.template.trim();
  if (!template) throw new Error("Write a template");
  if (template.length > 1000) throw new Error("Templates are up to 1,000 characters");
  if (!template.includes("{title}") && !template.includes("{link}") && !template.includes("{summary}")) throw new Error("Use {title}, {link} or {summary} in the template");
  if (!input.channelIds.length) throw new Error("Pick at least one channel");
  const channels = await listChannels(workspaceId, [brandId]);
  for (const id of input.channelIds) if (!channels.some((c) => c.id === id)) throw new Error("Pick channels from this brand");
  for (const id of input.channelIds) {
    const n = networkOf(channels.find((c) => c.id === id)!.network);
    if (n.needsMedia) throw new Error(`${n.name} needs a picture or video, so it can't post feed items`);
  }
  return { template, mode: input.mode === "queue" ? ("queue" as const) : ("draft" as const), channelIds: [...new Set(input.channelIds)] };
}

/** Add a feed: read it once to check it, and post its newest item now. */
export async function addFeed(workspaceId: string, userId: string, brandId: string, input: Input): Promise<FeedRow> {
  const checked = await checkInput(workspaceId, brandId, input);
  const feed = await readFeed(input.url);
  const url = new URL(input.url.trim()).toString();
  if (!feed.items.length) throw new Error("This feed has no items yet");
  const newest = newItems(feed.items, new Set(), 1)[0];
  const seen = feed.items.map((i) => i.guid).filter((g) => g !== newest.guid).slice(0, KEEP_SEEN);
  const { data, error } = await adminClient()
    .from("feeds")
    .insert({ workspace_id: workspaceId, brand_id: brandId, url, title: (feed.title || new URL(url).hostname).slice(0, 200), channel_ids: checked.channelIds, template: checked.template, mode: checked.mode, seen, created_by: userId })
    .select(COLS)
    .single();
  if (error) throw new Error(error.code === "23505" ? "This feed is already added" : error.message);
  const row = data as FeedRow;
  await postItems(workspaceId, { ...row, created_by: userId, seen }, feed.items).catch((e) => console.error("feed first read:", e instanceof Error ? e.message : e));
  return row;
}

export async function updateFeed(workspaceId: string, id: string, brandIds: string[] | null, patch: Partial<Input> & { active?: boolean }) {
  const db = adminClient();
  const { data: cur } = await db.from("feeds").select("brand_id, url, channel_ids, template, mode").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (!cur || (brandIds && !brandIds.includes(cur.brand_id as string))) throw new Error("Feed not found");
  const next: Record<string, unknown> = {};
  if (patch.active != null) next.active = patch.active;
  if (patch.template != null || patch.channelIds != null || patch.mode != null) {
    const checked = await checkInput(workspaceId, cur.brand_id as string, {
      url: cur.url as string,
      template: patch.template ?? (cur.template as string),
      channelIds: patch.channelIds ?? (cur.channel_ids as string[]),
      mode: patch.mode ?? (cur.mode as "draft" | "queue"),
    });
    Object.assign(next, { template: checked.template, channel_ids: checked.channelIds, mode: checked.mode });
  }
  if (patch.active) next.error = null;
  const { error } = await db.from("feeds").update(next).eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

export async function deleteFeed(workspaceId: string, id: string, brandIds: string[] | null) {
  let q = adminClient().from("feeds").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (brandIds) q = q.in("brand_id", brandIds);
  const { error } = await q;
  if (error) throw new Error(error.message);
}

type Claimed = FeedRow & { workspace_id?: string; created_by: string | null; seen: string[] };

/** Turn a feed's unseen items into posts. Each item is marked seen right after its post is saved. */
async function postItems(workspaceId: string, feed: Claimed, items: FeedItem[]) {
  const db = adminClient();
  const seen = new Set(feed.seen);
  const todo = newItems(items, seen, PER_READ);
  if (!todo.length) return;
  const channels = (await listChannels(workspaceId, [feed.brand_id])).filter((c) => feed.channel_ids.includes(c.id));
  if (!channels.length) throw new Error("This feed's channels were removed");
  // Posts are saved as the person who added the feed: their role decides approval.
  const actor = await memberActor(workspaceId, feed.created_by, feed.brand_id);
  if (!actor || !feed.created_by) throw new Error("The person who added this feed left the workspace. Add it again.");
  const userId = feed.created_by;
  const limit = Math.min(...channels.map((c) => networkOf(c.network).limit));
  const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
  let lastError: string | null = null;
  for (const item of todo) {
    let link = item.link;
    if (/^https?:\/\//i.test(link)) link = await shorten(workspaceId, link).catch(() => link);
    const text = fillTemplate(feed.template, item, link, limit);
    const targets = channels.map((c) => ({ channelId: c.id, text: null, settings: settingsFor(c.network) }));
    const save = (mode: "draft" | "queue") => savePost(workspaceId, userId, { text, mediaIds: [], targets, publishAt: mode === "draft" ? new Date(Date.now() + 86400000).toISOString() : null, mode }, actor);
    try {
      try {
        await save(feed.mode);
      } catch (e) {
        // Over the plan's posts or no free slot: keep the item as a draft instead of losing it.
        if (feed.mode !== "queue") throw e;
        lastError = message(e);
        await save("draft");
      }
    } catch (e) {
      lastError = message(e);
      continue;
    }
    seen.add(item.guid);
    feed.seen = [item.guid, ...feed.seen.filter((g) => g !== item.guid)].slice(0, KEEP_SEEN);
    await db.from("feeds").update({ seen: feed.seen, last_item_guid: item.guid }).eq("id", feed.id);
  }
  // Items older than the ones posted this round count as seen, so a burst isn't posted over the next reads. Items
  // still in the feed are kept first, so they're never forgotten and posted again.
  for (const i of items) if (!todo.includes(i)) seen.add(i.guid);
  const current = items.map((i) => i.guid).filter((g) => seen.has(g));
  const kept = [...new Set([...current, ...feed.seen])].slice(0, KEEP_SEEN);
  await db.from("feeds").update({ seen: kept, error: lastError?.slice(0, 500) ?? null }).eq("id", feed.id);
}

/** Read every feed that's due. Runs on each server; a conditional update makes one server read each feed. */
export async function runFeeds() {
  const db = adminClient();
  const before = new Date(Date.now() - (EVERY_MIN - 5) * 60000).toISOString();
  const { data, error } = await db.from("feeds").select(`${COLS}, workspace_id, created_by, seen`).eq("active", true).or(`fetched_at.is.null,fetched_at.lt."${before}"`).order("fetched_at", { ascending: true, nullsFirst: true }).limit(500);
  if (error) throw new Error(error.message);
  const due = (data ?? []) as (Claimed & { workspace_id: string })[];
  let i = 0;
  const work = async () => {
    while (i < due.length) {
      const f = due[i++];
      const now = new Date().toISOString();
      let claim = db.from("feeds").update({ fetched_at: now }).eq("id", f.id);
      claim = f.fetched_at ? claim.eq("fetched_at", f.fetched_at) : claim.is("fetched_at", null);
      const { data: won } = await claim.select("id").maybeSingle();
      if (!won) continue;
      try {
        const feed = await readFeed(f.url);
        await postItems(f.workspace_id, f, feed.items);
      } catch (e) {
        await db.from("feeds").update({ error: (e instanceof Error ? e.message : String(e)).slice(0, 500) }).eq("id", f.id);
      }
    }
  };
  // A few at a time: one slow site doesn't hold up the rest.
  await Promise.all(Array.from({ length: 5 }, work));
}

/** Every 30 minutes: feeds, then evergreen posts that are due. */
export async function contentUpkeep() {
  await runFeeds().catch((e) => console.error("feeds:", e instanceof Error ? e.message : e));
  await runEvergreenDue().catch((e) => console.error("evergreen:", e instanceof Error ? e.message : e));
}
