import "server-only";
import { listBrands, mayUseBrand } from "../brands";
import { listChannels, type Channel } from "../channels";
import { networkOf } from "../networks";
import { threadOf } from "../thread";
import { campaignCounts, listCampaigns } from "../campaigns";
import { nextBestTime } from "../queue";
import { assertPostAccess, deletePost, getPost, postsBetween, queueTime, savePost, type PostRow, type SaveInput } from "../posts";
import { listMedia, mediaThumbs } from "../media";
import { createWebhook, deleteWebhook, listWebhooks, setWebhookOn, testWebhook } from "../webhooks";
import { uploadFromLink } from "./upload";
import { getGeneration, startGeneration, type Generation } from "../generations";
import { brandOfScope, creditsOf } from "../credits";
import { adminClient } from "../supabase/server";
import { analytics, suggestedTimes } from "../analytics";
import { unpublishPost } from "../unpublish";
import { UnpublishError } from "../unpublisher";
import { ApiError, isId } from "./input";
import type { PostFields } from "./input";
import type { ApiChannel, ApiChannelGroup, ApiCredits, ApiCtx, ApiGeneration, ApiMedia, ApiPost, Ops } from "./types";
import { listGroups } from "../channelGroups";
import { groupChannels } from "../groupRules";
import { postTarget, record, runAs, type Actor } from "../auditActor";

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
    thread: !!n.thread,
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
    thread: (p.thread ?? []).map((t) => ({ text: t.text, media_ids: t.media_ids ?? [] })),
    campaign_id: p.campaign_id ?? null,
    channels: p.post_targets.map((t) => ({ channel_id: t.channel_id, status: t.status, text: t.text, settings: t.settings ?? {}, url: t.url, error: t.error, deleted_at: t.deleted_at ?? null, thread_urls: (t.parts ?? []).map((x) => x.url) })),
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

/** Who the audit log credits an API request to: the key's person through a key ("api") or a connected app ("app").
 *  The agent (keyId "agent") is the signed-in person themselves. */
export function apiActor(ctx: Pick<ApiCtx, "keyId" | "userId" | "via">): Actor {
  return { id: ctx.userId, kind: ctx.keyId === "agent" ? "user" : ctx.via === "oauth" ? "app" : "api", label: null };
}

/** Every action runs as the request's actor, so the lib functions it reaches record it as the API or an app. */
export function realOps(ctx: ApiCtx): Ops {
  const ops = opsFor(ctx);
  const who = apiActor(ctx);
  return Object.fromEntries(Object.entries(ops).map(([k, f]) => [k, (...a: unknown[]) => runAs(who, () => (f as (...x: unknown[]) => Promise<unknown>)(...a))])) as unknown as Ops;
}

function opsFor(ctx: ApiCtx): Ops {
  // Webhooks see every brand's posts, so only owners and admins manage them.
  const manager = () => {
    if (ctx.role !== "owner" && ctx.role !== "admin") throw new ApiError(403, "forbidden", "Only owners and admins can manage webhooks");
  };
  const hook = async (id: string) => {
    const h = (await listWebhooks(ctx.workspaceId)).find((x) => x.id === id);
    if (!h) throw notFound("Webhook");
    return h;
  };
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
  // publish_at "best": the next of the workspace's best hours, at least 30 minutes from now.
  const resolveBest = async <F extends { publishAt?: string | null }>(f: F): Promise<F> => {
    if (f.publishAt !== "best") return f;
    const at = nextBestTime(await suggestedTimes(ctx.workspaceId, ctx.timezone, 7), ctx.timezone);
    if (!at) throw new ApiError(400, "invalid_request", "There aren't enough results yet to know the best times. Send a time, or use mode queue.");
    return { ...f, publishAt: at.toISOString() };
  };
  const save = async (input: SaveInput) => {
    const channels = new Map((await listChannels(ctx.workspaceId, ctx.brandIds)).map((c) => [c.id, c]));
    for (const t of input.targets) if (!channels.has(t.channelId)) throw new ApiError(400, "invalid_request", `Channel ${t.channelId} isn't in this workspace. Use an id from list_channels.`);
    checkSettings(channels, Object.fromEntries(input.targets.map((t) => [t.channelId, t.settings])));
    // Files (and covers) must be this workspace's, drafts included.
    const files = [...new Set([...input.mediaIds, ...input.targets.map((t) => t.settings.cover).filter(Boolean), ...(input.thread ?? []).flatMap((p) => p.mediaIds)])];
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

  const oneMedia = async (mediaId: string): Promise<ApiMedia | null> => {
    const { data } = await adminClient().from("media").select("id, name, mime, size, alt, created_at").eq("id", mediaId).eq("workspace_id", ctx.workspaceId).maybeSingle();
    if (!data) return null;
    const [m] = await mediaThumbs(ctx.workspaceId, [mediaId]);
    return { id: mediaId, name: data.name as string, mime: data.mime as string, size: data.size as number, alt: (data.alt as string | null) ?? null, created_at: data.created_at as string, preview_url: m?.thumb ?? null };
  };
  const toGeneration = async (g: Generation): Promise<ApiGeneration> => ({
    id: g.id,
    kind: g.kind,
    model: g.model,
    prompt: g.prompt,
    status: g.status,
    error: g.error,
    media: g.media_id ? await oneMedia(g.media_id) : null,
    credits: g.credits,
    reason: g.reason,
    created_at: g.created_at,
  });

  return {
    async brands() {
      return (await listBrands(ctx.workspaceId)).filter((b) => mayUseBrand(ctx, b.id)).map((b) => ({ id: b.id, name: b.name, needs_approval: b.needs_approval }));
    },
    async channels(brandId) {
      return (await listChannels(ctx.workspaceId, scopeFor(brandId))).map(toChannel);
    },
    async channelGroups(): Promise<ApiChannelGroup[]> {
      const [groups, channels] = await Promise.all([listGroups(ctx.workspaceId, ctx.brandIds), listChannels(ctx.workspaceId, ctx.brandIds)]);
      return groups.map((g) => ({ id: g.id, name: g.name, brand_id: g.brand_id, channel_ids: groupChannels(g, channels) })).filter((g) => g.channel_ids.length);
    },
    async campaigns() {
      const all = await listCampaigns(ctx.workspaceId, ctx.brandIds);
      const counts = await campaignCounts(ctx.workspaceId, all.map((c) => c.id));
      return all.map((c) => ({ id: c.id, name: c.name, color: c.tone, brand_id: c.brand_id, ...(counts[c.id] ?? { scheduled: 0, published: 0, failed: 0, drafts: 0, engagements: 0 }) }));
    },
    async posts(from, to, brandId) {
      return (await postsBetween(ctx.workspaceId, from, to, scopeFor(brandId))).map(toPost);
    },
    async post(id) {
      return toPost(await load(id));
    },
    async create(f) {
      f = await resolveBest(f);
      return save({ text: f.text ?? "", mediaIds: f.mediaIds ?? [], thread: f.thread ?? [], campaignId: f.campaignId ?? null, targets: targetsOf(f.channelIds, f), publishAt: f.publishAt ?? null, mode: f.mode });
    },
    async update(id, f) {
      f = await resolveBest(f);
      const cur = await load(id);
      if (!EDITABLE.includes(cur.status)) throw new ApiError(409, "conflict", "This post already went out");
      const mode = f.mode ?? (cur.status === "draft" ? "draft" : "schedule");
      const publishAt = f.publishAt !== undefined ? f.publishAt : cur.publish_at;
      if ((mode === "draft" || mode === "schedule") && !publishAt) throw new ApiError(400, "invalid_request", `publish_at is required when mode is ${mode}`);
      const channelIds = f.channelIds ?? cur.post_targets.map((t) => t.channel_id);
      return save({ id, text: f.text ?? cur.text, mediaIds: f.mediaIds ?? cur.media_ids ?? [], thread: f.thread ?? threadOf(cur.thread), campaignId: f.campaignId, targets: targetsOf(channelIds, f, cur), publishAt, mode });
    },
    async remove(id) {
      const cur = await load(id);
      if (cur.status === "publishing") throw new ApiError(409, "conflict", "This post is going out right now. Try again in a minute.");
      await assertPostAccess(ctx.workspaceId, id, ctx.brandIds);
      const target = await postTarget(ctx.workspaceId, id);
      await deletePost(ctx.workspaceId, id);
      await record({ workspaceId: ctx.workspaceId, action: "post.deleted", target });
    },
    async uploadFromLink(url, alt) {
      return (await oneMedia(await uploadFromLink(ctx.workspaceId, ctx.userId, url, alt)))!;
    },
    async generate(r) {
      const g = await startGeneration({ workspaceId: ctx.workspaceId, userId: ctx.userId, brandId: ctx.spendBrand !== undefined ? ctx.spendBrand : brandOfScope(ctx.brandIds) }, r);
      return { ...(await toGeneration(g)), credits_charged: g.status === "failed" ? 0 : g.credits, credits_left: g.creditsLeft };
    },
    async credits(): Promise<ApiCredits> {
      const c = await creditsOf(ctx.workspaceId);
      return { plan: c.plan, plan_credits: c.planTotal, plan_credits_left: c.planLeft, bought_credits_left: c.bought, credits_left: c.left, refills_at: c.refillAt };
    },
    async generation(genId) {
      return toGeneration(await getGeneration(ctx.workspaceId, genId));
    },
    async webhooks() {
      manager();
      return listWebhooks(ctx.workspaceId);
    },
    async createWebhook(url, events) {
      manager();
      return createWebhook(ctx.workspaceId, ctx.userId, url, events);
    },
    async setWebhook(id, enabled) {
      manager();
      await hook(id);
      await setWebhookOn(ctx.workspaceId, id, enabled);
      return hook(id);
    },
    async deleteWebhook(id) {
      manager();
      await hook(id);
      await deleteWebhook(ctx.workspaceId, id);
    },
    async testWebhook(id) {
      manager();
      await hook(id);
      await testWebhook(ctx.workspaceId, id);
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
      return (await listMedia(ctx.workspaceId, { brandIds: ctx.brandIds, userId: ctx.userId })).map((m) => ({ id: m.id, name: m.name, mime: m.mime, size: m.size, alt: m.alt, created_at: m.created_at, preview_url: m.thumb }));
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
