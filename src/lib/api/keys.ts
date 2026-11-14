import "server-only";
import { randomBytes } from "node:crypto";
import { adminClient } from "../supabase/server";
import { hashToken } from "../crypto";
import { ApiError } from "./input";
import type { ApiCtx } from "./types";
import { record } from "../auditActor";

// API keys: "cbr_" and 32 random bytes. Only the hash is stored, so a key is shown once, when it's made.
export const KEY_PREFIX = "cbr_";
export const MAX_KEYS = 25;

export type ApiKeyRow = { id: string; name: string; prefix: string; created_at: string; last_used_at: string | null };

export const newKey = () => `${KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
export const looksLikeKey = (v: string) => /^cbr_[A-Za-z0-9_-]{43}$/.test(v);

export async function listApiKeys(workspaceId: string): Promise<ApiKeyRow[]> {
  const { data, error } = await adminClient().from("api_keys").select("id, name, prefix, created_at, last_used_at").eq("workspace_id", workspaceId).order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as ApiKeyRow[];
}

/** Make a key for this person in this workspace. The key comes back once and is never shown again. */
export async function createApiKey(workspaceId: string, userId: string, name: string): Promise<{ id: string; key: string }> {
  const clean = name.trim().slice(0, 60);
  if (!clean) throw new Error("Name the key");
  const db = adminClient();
  const { count } = await db.from("api_keys").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId);
  if ((count ?? 0) >= MAX_KEYS) throw new Error(`A workspace can have up to ${MAX_KEYS} keys. Delete one first.`);
  const key = newKey();
  const { data, error } = await db.from("api_keys").insert({ workspace_id: workspaceId, user_id: userId, name: clean, prefix: key.slice(0, 12), hash: hashToken(key) }).select("id").single();
  if (error) throw new Error(error.message);
  await record({ workspaceId, action: "api_key.created", target: { type: "api_key", id: data.id as string, label: clean }, meta: { prefix: key.slice(0, 12) } });
  return { id: data.id as string, key };
}

export async function deleteApiKey(workspaceId: string, id: string) {
  const { data, error } = await adminClient().from("api_keys").delete().eq("id", id).eq("workspace_id", workspaceId).select("name, prefix");
  if (error) throw new Error(error.message);
  for (const k of data ?? []) await record({ workspaceId, action: "api_key.deleted", target: { type: "api_key", id, label: k.name as string }, meta: { prefix: k.prefix as string } });
}

const unauthorized = (message: string) => new ApiError(401, "unauthorized", message);

/** The workspace and person behind a key. Checks the person is still a member, with their current role and brands. */
export async function keyCtx(key: string): Promise<ApiCtx> {
  if (!looksLikeKey(key)) throw unauthorized("Send an API key from Settings as Authorization: Bearer cbr_...");
  const db = adminClient();
  const { data: k, error } = await db.from("api_keys").select("id, workspace_id, user_id, last_used_at").eq("hash", hashToken(key)).maybeSingle();
  // A database hiccup is ours: 503, so the caller tries again.
  if (error) throw new ApiError(503, "unavailable", "Couldn't check the key just now. Try again in a moment.");
  if (!k) throw unauthorized("This API key was deleted or never existed");
  const { data: m, error: e2 } = await db.from("members").select("role, brand_ids, workspaces(name, timezone)").eq("workspace_id", k.workspace_id).eq("user_id", k.user_id).maybeSingle();
  if (e2) throw new ApiError(503, "unavailable", "Couldn't check the key just now. Try again in a moment.");
  if (!m) throw unauthorized("The person who made this key left the workspace");
  const role = m.role as ApiCtx["role"] | "client";
  if (role === "client") throw new ApiError(403, "forbidden", "Clients can't use the API");
  const ws = m.workspaces as unknown as { name: string; timezone: string };
  // Last used, at most once a minute, so busy keys don't write on every request.
  if (!k.last_used_at || Date.now() - new Date(k.last_used_at as string).getTime() > 60000) {
    void db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", k.id).then(() => undefined, () => undefined);
  }
  return {
    keyId: k.id as string,
    workspaceId: k.workspace_id as string,
    workspaceName: ws.name,
    timezone: ws.timezone,
    userId: k.user_id as string,
    role,
    brandIds: role === "owner" || role === "admin" ? null : ((m.brand_ids as string[] | null) ?? null),
  };
}
