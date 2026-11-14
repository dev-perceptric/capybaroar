import "server-only";
import { EMPTY_KIT, cleanKit, type BrandKit } from "./brandKit";
import { cache } from "react";
import { cookies } from "next/headers";
import { adminClient } from "./supabase/server";
import { canManage, getCtx, type Ctx } from "./session";
import { assertCanAddBrand } from "./billing";
import { hashToken, newToken, open, seal } from "./crypto";
import { appUrl } from "./channels";
import { record } from "./auditActor";

// Brands are an agency's clients. Channels and posts belong to one; the switcher at the top of the sidebar picks the
// brand every screen shows (a cookie). Owners and admins can also pick "All brands".
export type BrandColor = "gray" | "violet" | "green" | "amber" | "red" | "turquoise" | "sky" | "pink" | "yellow";
export type Brand = { id: string; name: string; color: BrandColor; needs_approval: boolean };

export const BRAND_COOKIE = "cb_brand";
export const ALL_BRANDS = "all";
const COLORS: BrandColor[] = ["violet", "green", "sky", "amber", "pink", "turquoise", "red", "yellow", "gray"];

export async function listBrands(workspaceId: string): Promise<Brand[]> {
  const db = adminClient();
  const { data, error } = await db.from("brands").select("id, name, color, needs_approval").eq("workspace_id", workspaceId).order("created_at");
  if (error) throw new Error(error.message);
  if (data?.length) return data as Brand[];
  // Every workspace has at least one brand (006 made one for each workspace that existed then).
  const { data: ws } = await db.from("workspaces").select("name").eq("id", workspaceId).single();
  const { data: made, error: e2 } = await db.from("brands").insert({ workspace_id: workspaceId, name: String(ws?.name ?? "Brand").slice(0, 60), color: COLORS[0] }).select("id, name, color, needs_approval").single();
  if (e2) throw new Error(e2.message);
  return [made as Brand];
}

export type BrandCtx = Ctx & {
  /** The brands this person may see. */
  brands: Brand[];
  /** The brand picked in the switcher, or null for "All brands". */
  brand: Brand | null;
  /** The brand ids screens filter by, or null for no filter. */
  scope: string[] | null;
};

/** getCtx plus the brand the switcher has picked. */
export const getBrandCtx = cache(async (): Promise<BrandCtx> => {
  const ctx = await getCtx();
  const all = await listBrands(ctx.workspaceId);
  const brands = ctx.brandIds ? all.filter((b) => ctx.brandIds!.includes(b.id)) : all;
  const want = (await cookies()).get(BRAND_COOKIE)?.value;
  if (want === ALL_BRANDS && canManage(ctx.role) && brands.length > 1) return { ...ctx, brands, brand: null, scope: null };
  const brand = brands.find((b) => b.id === want) ?? brands[0] ?? null;
  return { ...ctx, brands, brand, scope: brand ? [brand.id] : [] };
});

/** The brand a new channel or post goes into: the picked one, or the first. */
export const homeBrand = (b: BrandCtx) => b.brand?.id ?? b.brands[0]?.id ?? null;

export const mayUseBrand = (ctx: Pick<Ctx, "brandIds">, brandId: string | null) => !ctx.brandIds || (brandId != null && ctx.brandIds.includes(brandId));

export async function createBrand(workspaceId: string, name: string): Promise<Brand> {
  const n = name.trim();
  if (!n) throw new Error("Enter a name");
  if (n.length > 60) throw new Error("Names are up to 60 characters");
  await assertCanAddBrand(workspaceId);
  const db = adminClient();
  const { count } = await db.from("brands").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId);
  const { data, error } = await db.from("brands").insert({ workspace_id: workspaceId, name: n, color: COLORS[(count ?? 0) % COLORS.length] }).select("id, name, color, needs_approval").single();
  if (error) throw new Error(error.message);
  await record({ workspaceId, action: "brand.created", target: { type: "brand", id: data.id as string, label: n } });
  return data as Brand;
}

export async function renameBrand(workspaceId: string, id: string, name: string) {
  const n = name.trim();
  if (!n) throw new Error("Enter a name");
  if (n.length > 60) throw new Error("Names are up to 60 characters");
  const db = adminClient();
  const { data: old } = await db.from("brands").select("name").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  const { data, error } = await db.from("brands").update({ name: n }).eq("id", id).eq("workspace_id", workspaceId).select("id");
  if (error) throw new Error(error.message);
  if (data?.length && old?.name !== n) await record({ workspaceId, action: "brand.renamed", target: { type: "brand", id, label: n }, meta: { from: (old?.name as string | undefined) ?? null, to: n } });
}

export async function setApproval(workspaceId: string, id: string, on: boolean) {
  const { data, error } = await adminClient().from("brands").update({ needs_approval: on }).eq("id", id).eq("workspace_id", workspaceId).select("name");
  if (error) throw new Error(error.message);
  if (data?.length) await record({ workspaceId, action: "brand.approval_changed", target: { type: "brand", id, label: data[0].name as string }, meta: { to: on ? "on" : "off" } });
}

/** Delete a brand with no channels. The last brand stays. Its posts stay, under "All brands". */
export async function deleteBrand(workspaceId: string, id: string) {
  const db = adminClient();
  const { count } = await db.from("brands").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId);
  if ((count ?? 0) <= 1) throw new Error("A workspace keeps at least one brand");
  const { count: chans } = await db.from("channels").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("brand_id", id);
  if (chans) throw new Error("Move or remove this brand's channels first");
  const { data, error } = await db.from("brands").delete().eq("id", id).eq("workspace_id", workspaceId).select("name");
  if (error) throw new Error(error.message);
  if (data?.length) await record({ workspaceId, action: "brand.deleted", target: { type: "brand", id, label: data[0].name as string } });
}

export async function moveChannel(workspaceId: string, channelId: string, brandId: string) {
  const db = adminClient();
  const { data: b } = await db.from("brands").select("id, name").eq("id", brandId).eq("workspace_id", workspaceId).maybeSingle();
  if (!b) throw new Error("Brand not found");
  const { data: ch } = await db.from("channels").select("name, network, brands(name)").eq("id", channelId).eq("workspace_id", workspaceId).maybeSingle();
  const { error } = await db.from("channels").update({ brand_id: brandId }).eq("id", channelId).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  const from = (ch?.brands as unknown as { name: string } | null)?.name ?? null;
  if (ch && from !== b.name) await record({ workspaceId, action: "channel.moved", target: { type: "channel", id: channelId, label: ch.name as string }, meta: { from, to: b.name as string, network: ch.network as string } });
}

// Review links: one per brand, opened without signing in.

const reviewUrl = (token: string) => `${appUrl()}/review/${token}`;

/** Make the brand's review link, replacing the old one. */
export async function createReviewLink(workspaceId: string, brandId: string, userId: string) {
  const db = adminClient();
  const { data: b } = await db.from("brands").select("id").eq("id", brandId).eq("workspace_id", workspaceId).maybeSingle();
  if (!b) throw new Error("Brand not found");
  const token = newToken();
  const { error } = await db.from("review_links").upsert({ brand_id: brandId, workspace_id: workspaceId, token_hash: hashToken(token), token: seal(token), created_by: userId, created_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  await record({ workspaceId, action: "brand.review_link_changed", target: { type: "brand", id: brandId, label: await brandName(workspaceId, brandId) }, meta: { link: "new" } });
  return reviewUrl(token);
}

export async function revokeReviewLink(workspaceId: string, brandId: string) {
  const { data, error } = await adminClient().from("review_links").delete().eq("brand_id", brandId).eq("workspace_id", workspaceId).select("brand_id");
  if (error) throw new Error(error.message);
  if (data?.length) await record({ workspaceId, action: "brand.review_link_changed", target: { type: "brand", id: brandId, label: await brandName(workspaceId, brandId) }, meta: { link: "turned off" } });
}

/** A brand's name for the log, or null. Never throws. */
async function brandName(workspaceId: string, id: string): Promise<string | null> {
  try {
    const { data } = await adminClient().from("brands").select("name").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
    return (data?.name as string | undefined) ?? null;
  } catch {
    return null;
  }
}

/** Each brand's open review link. */
export async function reviewLinks(workspaceId: string): Promise<Record<string, string>> {
  const { data, error } = await adminClient().from("review_links").select("brand_id, token").eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  const out: Record<string, string> = {};
  for (const r of data ?? []) {
    try {
      out[r.brand_id as string] = reviewUrl(open(r.token as string));
    } catch {
      // a link sealed with an older key: make a new one
    }
  }
  return out;
}

/** The brand a review link opens, or null when it was revoked or never existed. */
export async function brandForReview(token: string): Promise<(Brand & { workspaceId: string }) | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const db = adminClient();
  const { data } = await db.from("review_links").select("brand_id, workspace_id").eq("token_hash", hashToken(token)).maybeSingle();
  if (!data) return null;
  const { data: b } = await db.from("brands").select("id, name, color, needs_approval").eq("id", data.brand_id).single();
  return b ? { ...(b as Brand), workspaceId: data.workspace_id as string } : null;
}

/** A brand's kit (029_brand_kit.sql); empty for a brand of another workspace. */
export async function getBrandKit(workspaceId: string, brandId: string | null): Promise<BrandKit> {
  if (!brandId) return EMPTY_KIT;
  const { data } = await adminClient().from("brands").select("voice, avoid, hashtags").eq("id", brandId).eq("workspace_id", workspaceId).maybeSingle();
  return data ? { voice: (data.voice as string) ?? "", avoid: (data.avoid as string[]) ?? [], hashtags: (data.hashtags as string[]) ?? [] } : EMPTY_KIT;
}

/** Every brand's kit by brand id, with its name, for the agent and the composer. */
export async function brandKits(workspaceId: string): Promise<Record<string, BrandKit & { name: string }>> {
  const { data, error } = await adminClient().from("brands").select("id, name, voice, avoid, hashtags").eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).map((b) => [b.id as string, { name: b.name as string, voice: (b.voice as string) ?? "", avoid: (b.avoid as string[]) ?? [], hashtags: (b.hashtags as string[]) ?? [] }]));
}

export async function saveBrandKit(workspaceId: string, brandId: string, input: { voice?: unknown; avoid?: unknown; hashtags?: unknown }) {
  const kit = cleanKit(input);
  const { error } = await adminClient().from("brands").update(kit).eq("id", brandId).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  return kit;
}
