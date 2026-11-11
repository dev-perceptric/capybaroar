// OAuth for the MCP server, the pure half: what a registration may hold, how a redirect address is matched, the PKCE
// check, the token formats and the discovery documents. No Supabase and no fetch, so tests/oauth.test.ts runs it as it
// is. The store and the routes are in store.ts and src/app (.well-known, api/oauth, oauth/authorize).
import { createHash, randomBytes } from "node:crypto";

export const ACCESS_PREFIX = "cbo_";
export const REFRESH_PREFIX = "cbx_";
export const CLIENT_PREFIX = "cbc_";
export const ACCESS_SECONDS = 60 * 60;
export const REFRESH_DAYS = 60;
export const CODE_MINUTES = 10;
export const MAX_REDIRECTS = 10;
export const SCOPE = "mcp";

/** Claude's callback, which the connectors directory requires. Other MCP apps register their own. */
export const CLAUDE_CALLBACK = "https://claude.ai/api/mcp/auth_callback";

const random = () => randomBytes(32).toString("base64url");
export const newAccessToken = () => ACCESS_PREFIX + random();
export const newRefreshToken = () => REFRESH_PREFIX + random();
export const newClientId = () => CLIENT_PREFIX + randomBytes(16).toString("base64url");
export const newCode = () => random();
export const isAccessToken = (v: string) => /^cbo_[A-Za-z0-9_-]{43}$/.test(v);

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** A redirect address an app may register: https anywhere, or http on this computer (Claude Code, desktop apps). */
export function redirectProblem(uri: unknown): string | null {
  if (typeof uri !== "string" || !uri || uri.length > 2000) return "Each redirect_uri must be a URL";
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return `Not a URL: ${uri}`;
  }
  if (u.hash) return "A redirect_uri can't have a #fragment";
  if (u.protocol === "https:") return null;
  if (u.protocol === "http:" && LOOPBACK.has(u.hostname)) return null;
  return `A redirect_uri must use https, or http on localhost: ${uri}`;
}

/** Checks a registration body and returns the clean client, or the reason it's refused (RFC 7591 error codes). */
export function cleanRegistration(body: unknown): { ok: true; name: string; redirectUris: string[] } | { ok: false; error: string; description: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const uris = b.redirect_uris;
  if (!Array.isArray(uris) || !uris.length) return { ok: false, error: "invalid_redirect_uri", description: "Send at least one redirect_uri" };
  if (uris.length > MAX_REDIRECTS) return { ok: false, error: "invalid_redirect_uri", description: `At most ${MAX_REDIRECTS} redirect_uris` };
  for (const u of uris) {
    const p = redirectProblem(u);
    if (p) return { ok: false, error: "invalid_redirect_uri", description: p };
  }
  const method = b.token_endpoint_auth_method;
  if (method !== undefined && method !== "none") return { ok: false, error: "invalid_client_metadata", description: "Only public clients (token_endpoint_auth_method none) are supported" };
  const raw = typeof b.client_name === "string" ? b.client_name.replace(/\s+/g, " ").trim() : "";
  return { ok: true, name: (raw || "MCP app").slice(0, 100), redirectUris: [...new Set(uris as string[])] };
}

/**
 * Whether a redirect address in a request matches one the app registered. Exact, except that a loopback address may
 * use any port, since apps on a computer pick a free port each time (RFC 8252).
 */
export function redirectMatches(registered: string[], asked: string): boolean {
  if (registered.includes(asked)) return true;
  let a: URL;
  try {
    a = new URL(asked);
  } catch {
    return false;
  }
  if (a.protocol !== "http:" || !LOOPBACK.has(a.hostname)) return false;
  return registered.some((r) => {
    try {
      const u = new URL(r);
      return u.protocol === "http:" && u.hostname === a.hostname && u.pathname === a.pathname && u.search === a.search;
    } catch {
      return false;
    }
  });
}

/** PKCE with S256: the verifier's SHA-256, base64url, must equal the challenge sent when signing in. */
export function pkceOk(verifier: unknown, challenge: string): boolean {
  if (typeof verifier !== "string" || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false;
  return createHash("sha256").update(verifier).digest("base64url") === challenge;
}

export type AuthorizeAsk = { clientId: string; redirectUri: string; state: string; challenge: string; resource: string | null };

/**
 * Checks the sign-in request's parameters. `redirect` is false when the redirect address itself can't be trusted, so
 * the error shows on our page instead of being sent anywhere.
 */
export function cleanAuthorize(q: Record<string, string | undefined>, registered: string[] | null, mcpUrl: string): { ok: true; ask: AuthorizeAsk } | { ok: false; redirect: boolean; error: string; description: string } {
  if (!q.client_id || !registered) return { ok: false, redirect: false, error: "invalid_client", description: "This app isn't registered with Capybaroar" };
  if (!q.redirect_uri || !redirectMatches(registered, q.redirect_uri)) return { ok: false, redirect: false, error: "invalid_request", description: "This redirect address isn't registered for the app" };
  if (q.response_type !== "code") return { ok: false, redirect: true, error: "unsupported_response_type", description: "Only response_type=code is supported" };
  if (!q.code_challenge || !/^[A-Za-z0-9_-]{43}$/.test(q.code_challenge)) return { ok: false, redirect: true, error: "invalid_request", description: "Send a PKCE code_challenge" };
  if (q.code_challenge_method !== "S256") return { ok: false, redirect: true, error: "invalid_request", description: "code_challenge_method must be S256" };
  if (q.resource && q.resource.replace(/\/$/, "") !== mcpUrl) return { ok: false, redirect: true, error: "invalid_target", description: `The resource must be ${mcpUrl}` };
  return { ok: true, ask: { clientId: q.client_id, redirectUri: q.redirect_uri, state: q.state ?? "", challenge: q.code_challenge, resource: q.resource ?? null } };
}

/** The redirect back to the app, with the code or the error and the app's state. */
export function backTo(redirectUri: string, params: Record<string, string>): string {
  const u = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
  return u.toString();
}

export const mcpUrlOf = (base: string) => `${base}/api/mcp`;

/** RFC 9728: where the MCP server's sign-in lives. Claude reads it from the 401's WWW-Authenticate header. */
export const protectedResource = (base: string) => ({
  resource: mcpUrlOf(base),
  authorization_servers: [base],
  scopes_supported: [SCOPE],
  bearer_methods_supported: ["header"],
  resource_name: "Capybaroar",
  resource_documentation: "https://capybaroar.com/docs/mcp",
});

export const resourceMetadataUrl = (base: string) => `${base}/.well-known/oauth-protected-resource`;

/** RFC 8414: the authorization server's endpoints and what it supports. */
export const authorizationServer = (base: string) => ({
  issuer: base,
  authorization_endpoint: `${base}/oauth/authorize`,
  token_endpoint: `${base}/api/oauth/token`,
  registration_endpoint: `${base}/api/oauth/register`,
  revocation_endpoint: `${base}/api/oauth/revoke`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  code_challenge_methods_supported: ["S256"],
  token_endpoint_auth_methods_supported: ["none"],
  revocation_endpoint_auth_methods_supported: ["none"],
  scopes_supported: [SCOPE],
  service_documentation: "https://capybaroar.com/docs/mcp",
});

/** The WWW-Authenticate header for a request to the MCP server with no valid token. */
export const challengeHeader = (base: string, error?: string) =>
  `Bearer resource_metadata="${resourceMetadataUrl(base)}"${error ? `, error="${error}"` : ""}`;

/** MCP tools the directory listing leaves out: making AI pictures and videos (the directory's rules). */
export const DIRECTORY_HIDDEN = new Set(["generate_media", "get_generation"]);
