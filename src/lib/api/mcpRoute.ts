import "server-only";
import { authorize, charge, errorResponse, json, readJson } from "./http";
import { ApiError } from "./input";
import { handleMcp, parseError, rpcCount } from "./mcp";
import { appUrl } from "../channels";
import { DIRECTORY_HIDDEN, challengeHeader } from "../oauth/rules";

/** One MCP request over HTTP POST. `pathKey` is the key from a link, for apps that only take a link. */
export async function mcpPost(req: Request, pathKey?: string) {
  let auth;
  try {
    auth = await authorize(req, pathKey);
  } catch (e) {
    const res = errorResponse(e);
    const wait = (e as { wait?: number }).wait;
    if (wait) res.headers.set("retry-after", String(wait));
    // No or bad sign-in on the plain address: tell the app where to sign in (RFC 9728), so Claude can start OAuth.
    if (res.status === 401 && !pathKey) res.headers.set("www-authenticate", challengeHeader(appUrl(), req.headers.get("authorization") ? "invalid_token" : undefined));
    return res;
  }
  let body: unknown;
  try {
    body = await readJson(req);
  } catch (e) {
    if (e instanceof ApiError && e.code === "invalid_json") return json(parseError(), 400);
    return errorResponse(e);
  }
  // authorize counted this request once; each further message in a batch counts too.
  try {
    await charge(auth.ctx, rpcCount(body) - 1);
  } catch (e) {
    const res = errorResponse(e);
    const wait = (e as { wait?: number }).wait;
    if (wait) res.headers.set("retry-after", String(wait));
    return res;
  }
  const out = await handleMcp(body, auth.ops, auth.ctx.timezone, auth.ctx.via === "oauth" ? { hide: DIRECTORY_HIDDEN, oauth: true } : {});
  return out === null ? json(null, 202) : json(out);
}

/** This server answers each POST on its own: no event stream and no sessions to end. */
export const notAllowed = () => json({ error: { code: "method_not_allowed", message: "Send MCP messages with POST" } }, 405, { allow: "POST" });
