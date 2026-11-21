import "server-only";
import { randomBytes } from "node:crypto";
import { adminClient } from "./supabase/server";
import { assertCanAddBrand } from "./billing";
import { record } from "./auditActor";
import { disconnectChannel, revokeChannel } from "./workspaceDelete";
import { createBrandKey, revokeBrandKeys } from "./api/keys";
import { ApiError } from "./api/input";
import { OFFERED, isPaused, type NetworkId } from "./networks";
import { PROVIDERS } from "./providers";
import { BrandTaken, LINK_TTL_MS, linkProblem, sha256, type ConnectLink, type LinkProblem, type PartnerBrand, type PartnerStore } from "./partnerRules";
import { storedPaths } from "./thumbRules";
import { stored, withThumb } from "./media";

// The partner API on the real database (rules in partnerRules.ts) and connect link sessions.

const COLORS = ["violet", "green", "sky", "amber", "pink", "turquoise", "red", "yellow", "gray"];
const BRAND_COLS = "id, workspace_id, name, website, external_id";
const busy = () => new ApiError(503, "unavailable", "Couldn't reach the database just now. Try again in a moment.");

async function removeBrandData(workspaceId: string, brandId: string) {
  const db = adminClient();
  // Channels first, signed out on their networks where that's possible; their post targets and results go with them.
  const { data: chans } = await db.from("channels").select("id").eq("workspace_id", workspaceId).eq("brand_id", brandId);
  const ids = (chans ?? []).map((c) => c.id as string);
  for (const id of ids) await revokeChannel(id, new Set(ids));
  if (ids.length) {
    const { error } = await db.from("channels").delete().eq("workspace_id", workspaceId).in("id", ids);
    if (error) throw busy();
  }
  const { error: e2 } = await db.from("posts").delete().eq("workspace_id", workspaceId).eq("brand_id", brandId);
  if (e2) throw busy();
  // The brand's files, from storage too.
  for (;;) {
    const { data, error } = await db.from("media").select(await withThumb("id, path")).eq("workspace_id", workspaceId).eq("brand_id", brandId).limit(100);
    if (error) throw busy();
    const files = (data ?? []) as unknown as { id: string }[];
    if (!files.length) break;
    await db.storage.from("media").remove(storedPaths(files.map(stored)));
    const { error: e3 } = await db.from("media").delete().in("id", files.map((f) => f.id));
    if (e3) throw busy();
  }
}

export const partnerStore: PartnerStore = {
  async brand(id) {
    const { data, error } = await adminClient().from("brands").select(BRAND_COLS).eq("id", id).maybeSingle();
    if (error) throw busy();
    return (data as PartnerBrand | null) ?? null;
  },
  async brandByExternal(workspaceId, externalId) {
    const { data, error } = await adminClient().from("brands").select(BRAND_COLS).eq("workspace_id", workspaceId).eq("external_id", externalId).maybeSingle();
    if (error) throw busy();
    return (data as PartnerBrand | null) ?? null;
  },
  async addBrand(p, b) {
    try {
      await assertCanAddBrand(p.workspaceId);
    } catch (e) {
      throw new ApiError(409, "plan_limit", e instanceof Error ? e.message : String(e));
    }
    const db = adminClient();
    const { count } = await db.from("brands").select("id", { count: "exact", head: true }).eq("workspace_id", p.workspaceId);
    const { data, error } = await db
      .from("brands")
      .insert({ workspace_id: p.workspaceId, name: b.name, website: b.website, external_id: b.externalId, color: COLORS[(count ?? 0) % COLORS.length] })
      .select(BRAND_COLS)
      .single();
    if (error?.code === "23505") throw new BrandTaken();
    if (error || !data) throw busy();
    await record({ workspaceId: p.workspaceId, action: "brand.created", target: { type: "brand", id: data.id as string, label: b.name }, meta: { via: "partner", external_id: b.externalId } }, { userId: p.userId });
    return data as PartnerBrand;
  },
  async removeBrand(p, b) {
    await removeBrandData(p.workspaceId, b.id);
    const { error } = await adminClient().from("brands").delete().eq("id", b.id).eq("workspace_id", p.workspaceId);
    if (error) throw busy();
    await record({ workspaceId: p.workspaceId, action: "brand.deleted", target: { type: "brand", id: b.id, label: b.name }, meta: { via: "partner", external_id: b.external_id } }, { userId: p.userId });
  },
  async channels(workspaceId, brandId) {
    const { data, error } = await adminClient().from("channels").select("id, network, name, status").eq("workspace_id", workspaceId).eq("brand_id", brandId).order("created_at");
    if (error) throw busy();
    return (data ?? []) as { id: string; network: string; name: string; status: "active" | "reconnect" }[];
  },
  async removeChannel(p, b, c) {
    try {
      return await disconnectChannel(p.workspaceId, { id: c.id, brand_id: b.id, network: c.network, name: c.name }, { userId: p.userId }, { via: "partner", external_id: b.external_id });
    } catch {
      throw busy();
    }
  },
  makeKey: (p, b) => createBrandKey(p, b.id, b.name),
  revokeKeys: (workspaceId, brandId) => revokeBrandKeys(workspaceId, brandId),
  async addLink(row) {
    const { error } = await adminClient().from("connect_links").insert(row);
    if (error) throw busy();
    await record({ workspaceId: row.workspace_id, action: "brand.connect_link_created", target: { type: "brand", id: row.brand_id }, meta: { expires_at: row.expires_at } }, { userId: row.created_by });
  },
  async usage(workspaceId, brandId, from, to) {
    const db = adminClient();
    const range = <Q extends { gte(c: string, v: string): Q; lt(c: string, v: string): Q }>(q: Q, col: string) => q.gte(col, from.toISOString()).lt(col, to.toISOString());
    const { data: chans, error: e0 } = await db.from("channels").select("id").eq("workspace_id", workspaceId).eq("brand_id", brandId);
    if (e0) throw busy();
    const ids = (chans ?? []).map((c) => c.id as string);
    const [published, created, files, spent] = await Promise.all([
      ids.length ? range(db.from("post_targets").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "published").in("channel_id", ids), "published_at") : Promise.resolve({ count: 0, error: null }),
      range(db.from("posts").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("brand_id", brandId), "created_at"),
      range(db.from("generations").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("brand_id", brandId).eq("status", "done"), "created_at"),
      range(db.from("credit_entries").select("amount").eq("workspace_id", workspaceId).eq("brand_id", brandId).neq("kind", "grant"), "created_at").limit(50000),
    ]);
    if (published.error || created.error || files.error || spent.error) throw busy();
    const credits = -((spent.data ?? []) as { amount: number }[]).reduce((s, r) => s + Number(r.amount), 0);
    return { posts_published: published.count ?? 0, posts_created: created.count ?? 0, ai_files: files.count ?? 0, credits: Math.max(0, credits) };
  },
};

// Connect link sessions

const LINK_COLS = "id, workspace_id, brand_id, created_by, expires_at, claimed_at, browser_hash, ended_at";

export async function linkByToken(token: string): Promise<ConnectLink | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const { data } = await adminClient().from("connect_links").select(LINK_COLS).eq("token_hash", sha256(token)).maybeSingle();
  return (data as ConnectLink | null) ?? null;
}

export async function linkById(id: string): Promise<ConnectLink | null> {
  const { data } = await adminClient().from("connect_links").select(LINK_COLS).eq("id", id).maybeSingle();
  return (data as ConnectLink | null) ?? null;
}

/** Claim a link for this browser. Returns the cookie secret, or the problem. Only one browser can win a claim. */
export async function claimLink(token: string): Promise<{ link: ConnectLink; secret: string } | { problem: Exclude<LinkProblem, null> }> {
  const link = await linkByToken(token);
  const problem = linkProblem(link, null);
  if (problem) return { problem };
  const secret = randomBytes(32).toString("base64url");
  const { data } = await adminClient()
    .from("connect_links")
    .update({ claimed_at: new Date().toISOString(), browser_hash: sha256(secret) })
    .eq("id", link!.id)
    .is("browser_hash", null)
    .is("ended_at", null)
    .select(LINK_COLS)
    .maybeSingle();
  if (!data) return { problem: "claimed" };
  return { link: data as ConnectLink, secret };
}

/** The link this browser's cookie holds, if it may still use it. */
export async function linkSession(cookie: { linkId: string; secret: string } | null): Promise<{ link: ConnectLink } | { problem: Exclude<LinkProblem, null> }> {
  if (!cookie) return { problem: "gone" };
  const link = await linkById(cookie.linkId);
  const problem = linkProblem(link, sha256(cookie.secret));
  if (problem) return { problem };
  if (!link!.browser_hash) return { problem: "gone" };
  return { link: link! };
}

export async function endLink(id: string) {
  await adminClient().from("connect_links").update({ ended_at: new Date().toISOString() }).eq("id", id).is("ended_at", null);
}

/** Seconds a connect cookie should last: until the link expires. */
export const cookieAge = (link: ConnectLink) => Math.max(60, Math.min(LINK_TTL_MS / 1000, Math.floor((new Date(link.expires_at).getTime() - Date.now()) / 1000)));

export async function brandName(id: string): Promise<string | null> {
  const { data } = await adminClient().from("brands").select("name").eq("id", id).maybeSingle();
  return (data?.name as string | undefined) ?? null;
}

/** The networks a connect link offers: those with a one-click sign-in that's set up on this server. Networks that
 *  ask for a form (Bluesky, Telegram, Discord) or a server name (Mastodon) are connected in the app. */
export const linkNetworks = (): NetworkId[] => OFFERED.filter((n) => !isPaused(n.id) && !!PROVIDERS[n.id].oauth?.configured() && !PROVIDERS[n.id].oauth?.asks?.length).map((n) => n.id);
