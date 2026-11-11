import "server-only";
import { adminClient } from "../supabase/server";
import { hashToken } from "../crypto";
import { ApiError } from "../api/input";
import type { ApiCtx } from "../api/types";
import { ACCESS_SECONDS, CODE_MINUTES, REFRESH_DAYS, isAccessToken, newAccessToken, newClientId, newCode, newRefreshToken, pkceOk, redirectMatches } from "./rules";

// OAuth for the MCP server, the stored half (026_oauth.sql). Every code and token is kept only as a hash.

/** An error the token endpoint sends back as { error, error_description } (RFC 6749). */
export class OAuthError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

const busy = () => new OAuthError("temporarily_unavailable", "Try again in a moment", 503);

export async function registerClient(name: string, redirectUris: string[]): Promise<{ id: string; createdAt: number }> {
  const id = newClientId();
  const { error } = await adminClient().from("oauth_clients").insert({ id, name, redirect_uris: redirectUris });
  if (error) throw busy();
  return { id, createdAt: Math.floor(Date.now() / 1000) };
}

export async function getClient(id: string): Promise<{ id: string; name: string; redirectUris: string[] } | null> {
  if (!/^cbc_[A-Za-z0-9_-]{10,40}$/.test(id)) return null;
  const { data } = await adminClient().from("oauth_clients").select("id, name, redirect_uris").eq("id", id).maybeSingle();
  return data ? { id: data.id as string, name: data.name as string, redirectUris: data.redirect_uris as string[] } : null;
}

/** The workspaces this person may connect an app to: every one they're in, except as a client. */
export async function connectableWorkspaces(userId: string): Promise<{ id: string; name: string }[]> {
  const { data } = await adminClient().from("members").select("workspace_id, role, workspaces(name)").eq("user_id", userId).neq("role", "client").order("created_at");
  return ((data ?? []) as unknown as { workspace_id: string; workspaces: { name: string } }[]).map((r) => ({ id: r.workspace_id, name: r.workspaces.name }));
}

export async function createCode(a: { clientId: string; workspaceId: string; userId: string; redirectUri: string; challenge: string; resource: string | null }): Promise<string> {
  const code = newCode();
  const { error } = await adminClient()
    .from("oauth_codes")
    .insert({ hash: hashToken(code), client_id: a.clientId, workspace_id: a.workspaceId, user_id: a.userId, redirect_uri: a.redirectUri, challenge: a.challenge, resource: a.resource, expires_at: new Date(Date.now() + CODE_MINUTES * 60000).toISOString() });
  if (error) throw new Error("Couldn't finish connecting. Try again.");
  return code;
}

type Pair = { access_token: string; token_type: "Bearer"; expires_in: number; refresh_token: string; scope: string };

async function issue(grantId: string): Promise<Pair> {
  const access = newAccessToken();
  const refresh = newRefreshToken();
  const now = Date.now();
  const { error } = await adminClient()
    .from("oauth_tokens")
    .insert({ grant_id: grantId, access_hash: hashToken(access), refresh_hash: hashToken(refresh), access_expires_at: new Date(now + ACCESS_SECONDS * 1000).toISOString(), refresh_expires_at: new Date(now + REFRESH_DAYS * 86400000).toISOString() });
  if (error) throw busy();
  return { access_token: access, token_type: "Bearer", expires_in: ACCESS_SECONDS, refresh_token: refresh, scope: "mcp" };
}

/** authorization_code: one use, unexpired, same app, same redirect address, and the PKCE verifier matches. */
export async function exchangeCode(f: Record<string, string>): Promise<Pair> {
  if (!f.code || !f.client_id || !f.redirect_uri) throw new OAuthError("invalid_request", "Send code, client_id, redirect_uri and code_verifier");
  const db = adminClient();
  // Marks the code used in the same statement that finds it, so two requests can't both redeem it.
  const { data: c, error } = await db
    .from("oauth_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("hash", hashToken(f.code))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("client_id, workspace_id, user_id, redirect_uri, challenge")
    .maybeSingle();
  if (error) throw busy();
  if (!c) throw new OAuthError("invalid_grant", "The code is wrong, used or expired");
  if (c.client_id !== f.client_id) throw new OAuthError("invalid_grant", "The code was issued to another app");
  if (!redirectMatches([c.redirect_uri as string], f.redirect_uri)) throw new OAuthError("invalid_grant", "The redirect_uri doesn't match the one used to sign in");
  if (!pkceOk(f.code_verifier, c.challenge as string)) throw new OAuthError("invalid_grant", "The code_verifier doesn't match the code_challenge");
  const { data: g, error: e2 } = await db.from("oauth_grants").insert({ client_id: c.client_id, workspace_id: c.workspace_id, user_id: c.user_id }).select("id").single();
  if (e2) throw busy();
  return issue(g.id as string);
}

/** refresh_token: works once. A second use of the same refresh token revokes the whole grant. */
export async function refreshTokens(f: Record<string, string>): Promise<Pair> {
  if (!f.refresh_token) throw new OAuthError("invalid_request", "Send refresh_token");
  const db = adminClient();
  const hash = hashToken(f.refresh_token);
  const { data: t, error } = await db.from("oauth_tokens").update({ rotated_at: new Date().toISOString() }).eq("refresh_hash", hash).is("rotated_at", null).select("grant_id, refresh_expires_at").maybeSingle();
  if (error) throw busy();
  if (!t) {
    const { data: old } = await db.from("oauth_tokens").select("grant_id").eq("refresh_hash", hash).maybeSingle();
    if (old) await db.from("oauth_grants").update({ revoked_at: new Date().toISOString() }).eq("id", old.grant_id).is("revoked_at", null);
    throw new OAuthError("invalid_grant", "The refresh token is wrong or was already used");
  }
  if (new Date(t.refresh_expires_at as string).getTime() < Date.now()) throw new OAuthError("invalid_grant", "The refresh token expired. Connect again.");
  const { data: g } = await db.from("oauth_grants").select("id, client_id, revoked_at").eq("id", t.grant_id).maybeSingle();
  if (!g || g.revoked_at) throw new OAuthError("invalid_grant", "This connection was removed. Connect again.");
  if (f.client_id && f.client_id !== g.client_id) throw new OAuthError("invalid_grant", "The refresh token was issued to another app");
  return issue(g.id as string);
}

/** RFC 7009: revoking an access or refresh token ends its grant. Unknown tokens are fine (always 200). */
export async function revokeToken(token: string) {
  if (!token) return;
  const db = adminClient();
  const h = hashToken(token);
  const { data } = await db.from("oauth_tokens").select("grant_id").or(`access_hash.eq.${h},refresh_hash.eq.${h}`).maybeSingle();
  if (data) await db.from("oauth_grants").update({ revoked_at: new Date().toISOString() }).eq("id", data.grant_id).is("revoked_at", null);
}

const unauthorized = (message: string) => new ApiError(401, "unauthorized", message);

/** The workspace and person behind an access token, checked like an API key: still a member, current role and brands. */
export async function oauthCtx(token: string): Promise<ApiCtx> {
  if (!isAccessToken(token)) throw unauthorized("Connect again");
  const db = adminClient();
  const { data: t, error } = await db.from("oauth_tokens").select("grant_id, access_expires_at, oauth_grants(workspace_id, user_id, revoked_at, last_used_at)").eq("access_hash", hashToken(token)).maybeSingle();
  if (error) throw new ApiError(503, "unavailable", "Couldn't check the sign-in just now. Try again in a moment.");
  const g = t?.oauth_grants as unknown as { workspace_id: string; user_id: string; revoked_at: string | null; last_used_at: string | null } | null;
  if (!t || !g || g.revoked_at) throw unauthorized("This connection was removed. Connect again.");
  if (new Date(t.access_expires_at as string).getTime() < Date.now()) throw unauthorized("The access token expired");
  const { data: m, error: e2 } = await db.from("members").select("role, brand_ids, workspaces(name, timezone)").eq("workspace_id", g.workspace_id).eq("user_id", g.user_id).maybeSingle();
  if (e2) throw new ApiError(503, "unavailable", "Couldn't check the sign-in just now. Try again in a moment.");
  if (!m) throw unauthorized("You're no longer in this workspace");
  const role = m.role as ApiCtx["role"] | "client";
  if (role === "client") throw new ApiError(403, "forbidden", "Clients can't use the MCP server");
  if (!g.last_used_at || Date.now() - new Date(g.last_used_at).getTime() > 60000) {
    void db.from("oauth_grants").update({ last_used_at: new Date().toISOString() }).eq("id", t.grant_id).then(() => undefined, () => undefined);
  }
  const ws = m.workspaces as unknown as { name: string; timezone: string };
  return {
    keyId: `oauth:${t.grant_id}`,
    workspaceId: g.workspace_id,
    workspaceName: ws.name,
    timezone: ws.timezone,
    userId: g.user_id,
    role,
    brandIds: role === "owner" || role === "admin" ? null : ((m.brand_ids as string[] | null) ?? null),
    via: "oauth",
  };
}

export type ConnectedApp = { id: string; name: string; created_at: string; last_used_at: string | null; user_id: string };

/** Apps connected to this workspace with OAuth and not revoked, for Settings. */
export async function listConnectedApps(workspaceId: string): Promise<ConnectedApp[]> {
  const { data, error } = await adminClient().from("oauth_grants").select("id, created_at, last_used_at, user_id, oauth_clients(name)").eq("workspace_id", workspaceId).is("revoked_at", null).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as (Omit<ConnectedApp, "name"> & { oauth_clients: { name: string } })[]).map((r) => ({ id: r.id, name: r.oauth_clients?.name ?? "MCP app", created_at: r.created_at, last_used_at: r.last_used_at, user_id: r.user_id }));
}

export async function revokeConnectedApp(workspaceId: string, id: string) {
  const { error } = await adminClient().from("oauth_grants").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}
