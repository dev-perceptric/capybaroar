import { OAuthError, exchangeCode, refreshTokens } from "@/lib/oauth/store";
import { formOf, oauthJson, preflight } from "@/lib/oauth/http";

export const dynamic = "force-dynamic";

// The token endpoint: a code (with its PKCE verifier) for a token pair, or a refresh token for a new pair.
export async function POST(req: Request) {
  const f = await formOf(req);
  try {
    if (f.grant_type === "authorization_code") return oauthJson(await exchangeCode(f));
    if (f.grant_type === "refresh_token") return oauthJson(await refreshTokens(f));
    return oauthJson({ error: "unsupported_grant_type", error_description: "Use authorization_code or refresh_token" }, 400);
  } catch (e) {
    if (e instanceof OAuthError) return oauthJson({ error: e.code, error_description: e.message }, e.status);
    return oauthJson({ error: "temporarily_unavailable", error_description: "Try again in a moment" }, 503);
  }
}
export const OPTIONS = preflight;
