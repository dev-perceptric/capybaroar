import { cleanRegistration } from "@/lib/oauth/rules";
import { registerClient } from "@/lib/oauth/store";
import { oauthJson, preflight } from "@/lib/oauth/http";
import { trustedIp } from "@/lib/clientIp";
import { LIMITS, hashed, take } from "@/lib/limits";

export const dynamic = "force-dynamic";

// RFC 7591 dynamic client registration: MCP apps (Claude, Claude Code, others) register themselves as public clients.
export async function POST(req: Request) {
  // A bounded number of registrations an hour from one IP (LIMITS.oauthRegisterIp), so nobody can fill the table.
  const ip = trustedIp(req.headers);
  const wait = await take(hashed("oauth-register:ip", ip || "unknown"), LIMITS.oauthRegisterIp);
  if (wait) return oauthJson({ error: "temporarily_unavailable", error_description: "Too many registrations. Try again later." }, 429, { "retry-after": String(wait) });
  let body: unknown;
  try {
    body = JSON.parse((await req.text()).slice(0, 20000));
  } catch {
    return oauthJson({ error: "invalid_client_metadata", error_description: "Send the registration as JSON" }, 400);
  }
  const c = cleanRegistration(body);
  if (!c.ok) return oauthJson({ error: c.error, error_description: c.description }, 400);
  try {
    const r = await registerClient(c.name, c.redirectUris);
    return oauthJson(
      { client_id: r.id, client_id_issued_at: r.createdAt, client_name: c.name, redirect_uris: c.redirectUris, token_endpoint_auth_method: "none", grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], scope: "mcp" },
      201,
    );
  } catch {
    return oauthJson({ error: "temporarily_unavailable", error_description: "Try again in a moment" }, 503);
  }
}
export const OPTIONS = preflight;
