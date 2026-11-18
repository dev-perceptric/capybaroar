// A brand key's second lock. The actions in ops.ts already limit a brand key to its brand (brandIds), the way they
// limit a member with some brands. This wraps them once more and checks every id that goes in and everything that
// comes out against the one brand, so a missed filter in one action can't show or change another customer's brand.
// Pure: it only sees Ops, so tests run it against fake actions that leak on purpose.
import { ApiError } from "./input";
import type { PostFields } from "./input";
import type { ApiPost, Ops } from "./types";

export type GuardDeps = {
  /** The brand of each of these files that is in the workspace. Missing ids aren't in it. */
  mediaBrands(ids: string[]): Promise<Map<string, string | null>>;
};

const notFound = (what: string) => new ApiError(404, "not_found", `${what} not found`);
const refused = () => new ApiError(403, "forbidden", "Brand keys can't manage webhooks");

/** Ops that touch only `brandId`: anything of another brand is "not found", webhooks are refused. */
export function brandOnly(ops: Ops, brandId: string, deps: GuardDeps): Ops {
  const sameBrand = (wanted: string | null) => {
    if (wanted && wanted !== brandId) throw notFound("Brand");
  };
  const ownChannels = async () => (await ops.channels(brandId)).filter((c) => c.brand_id === brandId);
  const ownPost = async (id: string): Promise<ApiPost> => {
    const p = await ops.post(id);
    if (p.brand_id !== brandId) throw notFound("Post");
    return p;
  };
  const checkMedia = async (ids: string[]) => {
    const want = [...new Set(ids.filter(Boolean))];
    if (!want.length) return;
    const brands = await deps.mediaBrands(want);
    const other = want.find((m) => brands.get(m) !== brandId);
    if (other) throw new ApiError(400, "invalid_request", `File ${other} isn't in this brand's media library`);
  };
  const checkFields = async (f: PostFields) => {
    if (f.channelIds) {
      const own = new Set((await ownChannels()).map((c) => c.id));
      const other = f.channelIds.find((c) => !own.has(c));
      if (other) throw new ApiError(400, "invalid_request", `Channel ${other} isn't in this workspace. Use an id from list_channels.`);
    }
    for (const k of [...Object.keys(f.channelText ?? {}), ...Object.keys(f.settings ?? {})]) {
      if (f.channelIds && !f.channelIds.includes(k)) throw new ApiError(400, "invalid_request", `channel_text and settings can only name the post's channels: ${k}`);
    }
    if (f.campaignId) {
      const own = (await ops.campaigns()).some((c) => c.id === f.campaignId && c.brand_id === brandId);
      if (!own) throw notFound("Campaign");
    }
    await checkMedia([...(f.mediaIds ?? []), ...(f.thread ?? []).flatMap((t) => t.mediaIds), ...Object.values(f.settings ?? {}).map((s) => s.cover ?? "")]);
  };
  const ownResult = (p: ApiPost) => {
    if (p.brand_id !== brandId) throw new ApiError(500, "internal", "The post landed in another brand");
    return p;
  };

  const guarded: Ops = {
    async brands() {
      return (await ops.brands()).filter((b) => b.id === brandId);
    },
    async channels(wanted) {
      sameBrand(wanted);
      return ownChannels();
    },
    async channelGroups() {
      const own = new Set((await ownChannels()).map((c) => c.id));
      return (await ops.channelGroups()).filter((g) => g.brand_id === brandId).map((g) => ({ ...g, channel_ids: g.channel_ids.filter((c) => own.has(c)) }));
    },
    async campaigns() {
      return (await ops.campaigns()).filter((c) => c.brand_id === brandId);
    },
    async posts(from, to, wanted) {
      sameBrand(wanted);
      return (await ops.posts(from, to, brandId)).filter((p) => p.brand_id === brandId);
    },
    post: ownPost,
    async create(f) {
      await checkFields(f);
      return ownResult(await ops.create(f));
    },
    async update(id, f) {
      await ownPost(id);
      await checkFields(f);
      return ownResult(await ops.update(id, f));
    },
    async remove(id) {
      await ownPost(id);
      return ops.remove(id);
    },
    async unpublish(id, channelIds) {
      await ownPost(id);
      return ops.unpublish(id, channelIds);
    },
    async media() {
      return (await ops.media()).filter((m) => m.brand_id === brandId);
    },
    nextSlot: () => ops.nextSlot(),
    async analytics(days, channelId) {
      const own = new Set((await ownChannels()).map((c) => c.id));
      if (channelId && !own.has(channelId)) throw notFound("Channel");
      const a = await ops.analytics(days, channelId);
      return { ...a, top_posts: a.top_posts.filter((p) => own.has(p.channel_id)) };
    },
    async uploadFromLink(url, alt) {
      const m = await ops.uploadFromLink(url, alt);
      if (m.brand_id !== brandId) throw new ApiError(500, "internal", "The file landed outside this brand");
      return m;
    },
    async generate(r) {
      if (r.sourceMediaId) await checkMedia([r.sourceMediaId]);
      return ops.generate(r);
    },
    async generation(id) {
      const g = await ops.generation(id);
      if (g.brand_id !== brandId) throw notFound("Generation");
      return g;
    },
    credits: () => ops.credits(),
    webhooks: async () => {
      throw refused();
    },
    createWebhook: async () => {
      throw refused();
    },
    setWebhook: async () => {
      throw refused();
    },
    deleteWebhook: async () => {
      throw refused();
    },
    testWebhook: async () => {
      throw refused();
    },
  };
  return guarded;
}
