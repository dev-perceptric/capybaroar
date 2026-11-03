import "server-only";
import { authorize, errorResponse, json, readJson } from "./http";
import { ApiError } from "./input";
import { handleMcp, parseError } from "./mcp";

/** One MCP request over HTTP POST. `pathKey` is the key from a link, for apps that only take a link. */
export async function mcpPost(req: Request, pathKey?: string) {
  let auth;
  try {
    auth = await authorize(req, pathKey);
  } catch (e) {
    const res = errorResponse(e);
    const wait = (e as { wait?: number }).wait;
    if (wait) res.headers.set("retry-after", String(wait));
    return res;
  }
  let body: unknown;
  try {
    body = await readJson(req);
  } catch (e) {
    if (e instanceof ApiError && e.code === "invalid_json") return json(parseError(), 400);
    return errorResponse(e);
  }
  const out = await handleMcp(body, auth.ops, auth.ctx.timezone);
  return out === null ? json(null, 202) : json(out);
}

/** This server answers each POST on its own: no event stream and no sessions to end. */
export const notAllowed = () => json({ error: { code: "method_not_allowed", message: "Send MCP messages with POST" } }, 405, { allow: "POST" });
