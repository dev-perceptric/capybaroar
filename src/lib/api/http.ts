import "server-only";
import { ApiError } from "./input";
import { RateLimit } from "./limit";
import { isAccessToken } from "../oauth/rules";
import { oauthCtx } from "../oauth/store";
import { keyCtx } from "./keys";
import { realOps } from "./ops";
import type { ApiCtx, Ops } from "./types";

// What every API and MCP request goes through: the key, the rate limit, the body and the error format.
const limiter = new RateLimit();
export const MAX_BODY = 1_000_000;

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { ...(body === null ? {} : { "content-type": "application/json" }), "cache-control": "no-store", ...headers } });
}

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) {
    const headers: Record<string, string> = e.status === 401 ? { "www-authenticate": 'Bearer realm="capybaroar"' } : {};
    return json({ error: { code: e.code, message: e.message } }, e.status, headers);
  }
  // Rules the app shows people ("Pick a time in the future", plan limits) come back as they are.
  const message = e instanceof Error ? e.message : String(e);
  console.error("[api]", message);
  return json({ error: { code: "invalid_request", message } }, 400);
}

const bearer = (req: Request) => {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(\S+)$/i.exec(h.trim());
  return m ? m[1] : null;
};

/** The key's workspace and person, after the rate limit. `pathKey` is the key from an MCP link. */
export async function authorize(req: Request, pathKey?: string): Promise<{ ctx: ApiCtx; ops: Ops }> {
  const key = pathKey ?? bearer(req);
  if (!key) throw new ApiError(401, "unauthorized", "Send an API key from Settings as Authorization: Bearer cbr_...");
  // OAuth access tokens (apps connected through a sign-in) work wherever a key does.
  const ctx = !pathKey && isAccessToken(key) ? await oauthCtx(key) : await keyCtx(key);
  const wait = limiter.take(ctx.keyId);
  if (wait) throw Object.assign(new ApiError(429, "rate_limited", `Too many requests. Try again in ${wait} seconds.`), { wait });
  return { ctx, ops: realOps(ctx) };
}

export async function readJson(req: Request): Promise<unknown> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) throw new ApiError(413, "too_large", "The request body is too large");
  const text = await req.text();
  if (text.length > MAX_BODY) throw new ApiError(413, "too_large", "The request body is too large");
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "invalid_json", "The request body isn't valid JSON");
  }
}

/** A REST route: authorize, run, and answer in the API's one format. */
export function route<P = Record<string, never>>(fn: (a: { req: Request; ctx: ApiCtx; ops: Ops; params: P; query: URLSearchParams }) => Promise<{ status?: number; body: unknown }>) {
  return async (req: Request, context: { params: Promise<P> }) => {
    try {
      const { ctx, ops } = await authorize(req);
      const params = (await context?.params) ?? ({} as P);
      const r = await fn({ req, ctx, ops, params, query: new URL(req.url).searchParams });
      return json(r.body, r.status ?? 200);
    } catch (e) {
      const res = errorResponse(e);
      const wait = (e as { wait?: number }).wait;
      if (wait) res.headers.set("retry-after", String(wait));
      return res;
    }
  };
}
