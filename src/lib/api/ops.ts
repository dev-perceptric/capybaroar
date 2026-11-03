import "server-only";
import { listBrands, mayUseBrand } from "../brands";
import { listChannels, type Channel } from "../channels";
import { networkOf } from "../networks";
import { assertPostAccess, deletePost, getPost, postsBetween, queueTime, savePost, type PostRow, type SaveInput } from "../posts";
import { listMedia } from "../media";
import { adminClient } from "../supabase/server";
import { analytics } from "../analytics";
import { unpublishPost } from "../unpublish";
import { UnpublishError } from "../unpublisher";
import { ApiError, isId } from "./input";
import type { PostFields } from "./input";
import type { ApiChannel, ApiCtx, ApiPost, Ops } from "./types";

// The API's actions on the real workspace. Every write goes through savePost, the same checks the calendar runs:
// character limits, required settings, media, plan limits, brands and approvals.

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const EDITABLE = ["draft", "review", "scheduled", "failed"];
const notFound = (what: string) => new ApiError(404, "not_found", `${what} not found`);

export function toChannel(c: Channel): ApiChannel {
  const n = networkOf(c.network);
  return {
    id: c.id,
    network: c.network,
    network_name: n.name,
    name: c.name,
    username: c.username,
    status: c.status,
    brand_id: c.brand_id,
    character_limit: n.limit,
    needs_media: !!n.needsMedia,
    settings: (n.fields ?? []).map((f) => ({
      key: f.key,
      label: f.label,
      kind: f.kind,
      required: !!f.required,
      ...(f.options ? { options: f.options.map((o) => o.value) } : {}),
      ...(f.when ? { only_when: f.when } : {}),
    })),
  };
}

export function toPost(p: PostRow): ApiPost {
  return {
    id: p.id,
    status: p.status,
    text: p.text,
    publish_at: p.publish_at,
    brand_id: p.brand_id,
    media_ids: p.media_ids ?? [],
    channels: p.post_targets.map((t) => ({ channel_id: t.channel_id, status: t.status, text: t.text, settings: t.settings ?? {}, url: t.url, error: t.error, deleted_at: t.deleted_at ?? null })),
  };
}

/** Settings a channel's network doesn't take, or a choice it doesn't offer, are refused before saving. */
function checkSettings(channels: Map<string, Channel>, settings: Record<string, Record<string, string>>) {
  for (const [cid, s] of Object.entries(settings)) {
    const c = channels.get(cid);
    if (!c) continue;
    const n = networkOf(c.network);
    for (const [k, v] of Object.entries(s)) {
      const f = (n.fields ?? []).find((x) => x.key === k);
      if (!f) throw new ApiError(400, "invalid_request", `${c.name}: ${n.name} has no setting "${k}"`);
      if (f.kind === "select" && f.options && !f.options.some((o) => o.value === v)) throw new ApiError(400, "invalid_request", `${c.name}: ${f.label} must be one of ${f.options.map((o) => o.value).join(", ")}`);
    }
  }
}

export function realOps(ctx: ApiCtx): Ops {
  const actor = { role: ctx.role, brandIds: ctx.brandIds, brandId: null };
  const scopeFor = (brandId: string | null) => {
    if (!brandId) return ctx.brandIds;
    if (!mayUseBrand(ctx, brandId)) throw notFound("Brand");
    return [brandId];
  };
  const load = async (id: string) => {
    const p = await getPost(ctx.workspaceId, id);
    if (!p || !mayUseBrand(ctx, p.brand_id)) throw notFound("Post");
    return p;
  };
  const save = async (input: SaveInput) => {
    const channels = new Map((await listChannels(ctx.workspaceId, ctx.brandIds)).map((c) => [c.id, c]));
    for (const t of input.targets) if (!channels.has(t.channelId)) throw new ApiError(400, "invalid_request", `Channel ${t.channelId} isn't in this workspace. Use an id from list_channels.`);
    checkSettings(channels, Object.fromEntries(input.targets.map((t) => [t.channelId, t.settings])));
    // Files (and covers) must be this workspace's, drafts included.
    const files = [...new Set([...input.mediaIds, ...input.targets.map((t) => t.settings.cover).filter(Boolean)])];
    if (files.length) {
      if (!files.every(isId)) throw new ApiError(400, "invalid_request", "A cover must be a file id from list_media");
      const { data, error } = await adminClient().from("media").select("id").eq("workspace_id", ctx.workspaceId).in("id", files);
      if (error) throw new ApiError(503, "unavailable", "Couldn't check the files just now. Try again in a moment.");
      const found = new Set((data ?? []).map((m) => m.id as string));
      const missing = files.find((f) => !found.has(f));
      if (missing) throw new ApiError(400, "invalid_request", `File ${missing} isn't in this workspace's media library`);
    }
    const r = await savePost(ctx.workspaceId, ctx.userId, input, actor);
    return toPost(await load(r.id));
  };
  const targetsOf = (channelIds: string[], f: PostFields, cur?: PostRow) => {
    const before = new Map((cur?.post_targets ?? []).map((t) => [t.channel_id, t]));
    for (const k of [...Object.keys(f.channelText ?? {}), ...Object.keys(f.settings ?? {})])
      if (!channelIds.includes(k)) throw new ApiError(400, "invalid_request", `channel_text and settings can only name the post's channels: ${k}`);
    return channelIds.map((channelId) => ({
      channelId,
      text: f.channelText ? (f.channelText[channelId] ?? null) : (before.get(channelId)?.text ?? null),
      settings: f.settings ? (f.settings[channelId] ?? {}) : (before.get(channelId)?.settings ?? {}),
    }));
  };

  return {
    async brands() {
      return (await listBrands(ctx.workspaceId)).filter((b) => mayUseBrand(ctx, b.id)).map((b) => ({ id: b.id, name: b.name, needs_approval: b.needs_approval }));
    },
    async channels(brandId) {
      return (await listChannels(ctx.workspaceId, scopeFor(brandId))).map(toChannel);
    },
    async posts(from, to, brandId) {
      return (await postsBetween(ctx.workspaceId, from, to, scopeFor(brandId))).map(toPost);
    },
    async post(id) {
      return toPost(await load(id));
    },
    async create(f) {
      return save({ text: f.text ?? "", mediaIds: f.mediaIds ?? [], targets: targetsOf(f.channelIds, f), publishAt: f.publishAt ?? null, mode: f.mode });
    },
    async update(id, f) {
      const cur = await load(id);
      if (!EDITABLE.includes(cur.status)) throw new ApiError(409, "conflict", "This post already went out");
      const mode = f.mode ?? (cur.status === "draft" ? "draft" : "schedule");
      const publishAt = f.publishAt !== undefined ? f.publishAt : cur.publish_at;
      if ((mode === "draft" || mode === "schedule") && !publishAt) throw new ApiError(400, "invalid_request", `publish_at is required when mode is ${mode}`);
      const channelIds = f.channelIds ?? cur.post_targets.map((t) => t.channel_id);
      return save({ id, text: f.text ?? cur.text, mediaIds: f.mediaIds ?? cur.media_ids ?? [], targets: targetsOf(channelIds, f, cur), publishAt, mode });
    },
    async remove(id) {
      const cur = await load(id);
      if (cur.status === "publishing") throw new ApiError(409, "conflict", "This post is going out right now. Try again in a minute.");
      await assertPostAccess(ctx.workspaceId, id, ctx.brandIds);
      await deletePost(ctx.workspaceId, id);
    },
    async unpublish(id, channelIds) {
      const cur = await load(id);
      const inPost = new Set(cur.post_targets.map((t) => t.channel_id));
      const missing = (channelIds ?? []).find((c) => !inPost.has(c));
      if (missing) throw new ApiError(400, "invalid_request", `Channel ${missing} isn't in this post`);
      try {
        const r = await unpublishPost(ctx.workspaceId, id, channelIds ?? "all", { role: ctx.role, brandIds: ctx.brandIds });
        return {
          deleted: r.postDeleted,
          channels: r.results.map((c) => ({ channel_id: c.channelId, name: c.channelName, network: c.network, result: c.result, error: c.error, note: c.note, url: c.url })),
        };
      } catch (e) {
        if (e instanceof UnpublishError) throw new ApiError(e.code === "not_found" ? 404 : e.code === "forbidden" ? 403 : 409, e.code, e.message);
        throw e;
      }
    },
    async media() {
      return (await listMedia(ctx.workspaceId)).map((m) => ({ id: m.id, name: m.name, mime: m.mime, size: m.size, alt: m.alt, created_at: m.created_at, preview_url: m.thumb }));
    },
    async nextSlot() {
      try {
        return (await queueTime(ctx.workspaceId)).toISOString();
      } catch (e) {
        throw new ApiError(409, "conflict", e instanceof Error ? e.message : String(e));
      }
    },
    async analytics(days, channelId) {
      const allowed = await listChannels(ctx.workspaceId, ctx.brandIds);
      if (channelId && !allowed.some((c) => c.id === channelId)) throw notFound("Channel");
      const scope = channelId ?? (ctx.brandIds ? allowed.map((c) => c.id) : null);
      const a = await analytics(ctx.workspaceId, ctx.timezone, days, scope);
      const t = (x: typeof a.current) => ({ posts: x.posts, reach: x.views, engagements: x.engagement, engagement_rate: x.rate, posts_with_results: x.withStats });
      const enough = a.best.reduce((s, c) => s + c.posts, 0) >= 10;
      return {
        days: a.days,
        since: a.since,
        current: t(a.current),
        previous: t(a.previous),
        best_times: enough
          ? a.best
              .filter((c) => c.posts >= 2)
              .sort((x, y) => y.engagement - x.engagement)
              .slice(0, 3)
              .map((c) => ({ weekday: WEEKDAYS[c.day], hour: c.hour }))
          : [],
        formats: a.formats.map((f) => ({ format: f.format, posts: f.posts, average_engagements: f.avg })),
        top_posts: a.top.slice(0, 5).map((p) => ({ id: p.id, channel_id: p.channelId, published_at: p.at, text: p.text, url: p.url, engagements: p.m?.engagement ?? 0, engagement_rate: p.rate })),
      };
    },
  };
}
