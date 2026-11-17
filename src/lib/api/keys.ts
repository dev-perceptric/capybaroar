import "server-only";
import { randomBytes } from "node:crypto";
import { adminClient } from "../supabase/server";
import { hashToken } from "../crypto";
import { ApiError } from "./input";
import type { ApiCtx } from "./types";
import { record } from "../auditActor";
import { MAX_BRAND_KEYS, MAX_KEYS, PREFIXES, keyContext, partnerContext, shownPrefix, type KeyKind, type KeyLookup, type KeyRow, type PartnerCtx } from "./keyRules";

// API keys: a prefix for their kind ("cbr_", "cb_partner_", "cbr_brand_", see keyRules.ts) and 32 random bytes. Only
// the hash is stored, so a key is shown once, when it's made.
export { KEY_PREFIX, MAX_KEYS, looksLikeKey } from "./keyRules";

export type ApiKeyRow = { id: string; name: string; prefix: string; kind: "member" | "partner"; created_at: string; last_used_at: string | null };

export const newKey = (kind: KeyKind = "member") => `${PREFIXES[kind]}${randomBytes(32).toString("base64url")}`;

/** The keys Settings lists: member and partner keys. Brand keys belong to the partner's customers and are many. */
export async function listApiKeys(workspaceId: string): Promise<ApiKeyRow[]> {
  const { data, error } = await adminClient().from("api_keys").select("id, name, prefix, kind, created_at, last_used_at").eq("workspace_id", workspaceId).neq("kind", "brand").order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as ApiKeyRow[];
}

/** Make a member or partner key for this person in this workspace. The key comes back once and is never shown again. */
export async function createApiKey(workspaceId: string, userId: string, name: string, kind: "member" | "partner" = "member"): Promise<{ id: string; key: string }> {
  const clean = name.trim().slice(0, 60);
  if (!clean) throw new Error("Name the key");
  const db = adminClient();
  const { count } = await db.from("api_keys").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).neq("kind", "brand");
  if ((count ?? 0) >= MAX_KEYS) throw new Error(`A workspace can have up to ${MAX_KEYS} keys. Delete one first.`);
  const key = newKey(kind);
  const prefix = shownPrefix(key);
  const { data, error } = await db.from("api_keys").insert({ workspace_id: workspaceId, user_id: userId, name: clean, kind, prefix, hash: hashToken(key) }).select("id").single();
  if (error) throw new Error(error.message);
  await record({ workspaceId, action: "api_key.created", target: { type: "api_key", id: data.id as string, label: clean }, meta: { prefix, kind } });
  return { id: data.id as string, key };
}

export async function deleteApiKey(workspaceId: string, id: string) {
  const { data, error } = await adminClient().from("api_keys").delete().eq("id", id).eq("workspace_id", workspaceId).neq("kind", "brand").select("name, prefix");
  if (error) throw new Error(error.message);
  for (const k of data ?? []) await record({ workspaceId, action: "api_key.deleted", target: { type: "api_key", id, label: k.name as string }, meta: { prefix: k.prefix as string } });
}

/** A key that sees only this brand, made through a partner key. It acts as the partner key's maker. */
export async function createBrandKey(p: PartnerCtx, brandId: string, brandName: string): Promise<{ key: string; prefix: string }> {
  const db = adminClient();
  const { count, error: e1 } = await db.from("api_keys").select("id", { count: "exact", head: true }).eq("brand_id", brandId);
  if (e1) throw new ApiError(503, "unavailable", "Couldn't make the key just now. Try again in a moment.");
  if ((count ?? 0) >= MAX_BRAND_KEYS) throw new ApiError(409, "too_many_keys", `A brand can have up to ${MAX_BRAND_KEYS} keys. Revoke them first.`);
  const key = newKey("brand");
  const prefix = shownPrefix(key);
  const { data, error } = await db
    .from("api_keys")
    .insert({ workspace_id: p.workspaceId, user_id: p.userId, brand_id: brandId, kind: "brand", name: brandName.slice(0, 60) || "Brand", prefix, hash: hashToken(key) })
    .select("id")
    .single();
  if (error) throw new ApiError(503, "unavailable", "Couldn't make the key just now. Try again in a moment.");
  await record({ workspaceId: p.workspaceId, action: "api_key.created", target: { type: "api_key", id: data.id as string, label: brandName }, meta: { prefix, kind: "brand", brand_id: brandId } });
  return { key, prefix };
}

/** Revoke every key of this brand at once. */
export async function revokeBrandKeys(workspaceId: string, brandId: string) {
  const { data, error } = await adminClient().from("api_keys").delete().eq("workspace_id", workspaceId).eq("brand_id", brandId).eq("kind", "brand").select("id, name, prefix");
  if (error) throw new ApiError(503, "unavailable", "Couldn't revoke the keys just now. Try again in a moment.");
  for (const k of data ?? []) await record({ workspaceId, action: "api_key.deleted", target: { type: "api_key", id: k.id as string, label: k.name as string }, meta: { prefix: k.prefix as string, kind: "brand" } });
}

const lookup: KeyLookup = {
  async key(hash) {
    const { data, error } = await adminClient().from("api_keys").select("id, kind, workspace_id, user_id, brand_id, last_used_at").eq("hash", hash).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    // Last used, at most once a minute, so busy keys don't write on every request.
    if (!data.last_used_at || Date.now() - new Date(data.last_used_at as string).getTime() > 60000) {
      void adminClient().from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(() => undefined, () => undefined);
    }
    return data as KeyRow;
  },
  async member(workspaceId, userId) {
    const { data, error } = await adminClient().from("members").select("role, brand_ids, workspaces(name, timezone)").eq("workspace_id", workspaceId).eq("user_id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return { role: data.role as string, brand_ids: (data.brand_ids as string[] | null) ?? null, workspace: data.workspaces as unknown as { name: string; timezone: string } };
  },
  async brand(id) {
    const { data, error } = await adminClient().from("brands").select("id, workspace_id, external_id").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as { id: string; workspace_id: string; external_id: string | null } | null) ?? null;
  },
};

/** The workspace and person behind a member or brand key, checked on every request (keyRules.ts has the rules). */
export const keyCtx = (key: string): Promise<ApiCtx> => keyContext(lookup, key, hashToken(key));

/** The workspace behind a partner key. */
export const partnerCtx = (key: string | null): Promise<PartnerCtx> => partnerContext(lookup, key, key ? hashToken(key) : "");
