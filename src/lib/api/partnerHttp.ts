import "server-only";
import { charge, errorResponse, json } from "./http";
import { partnerCtx } from "./keys";
import type { PartnerCtx } from "./keyRules";

// The partner API's one door: a partner key (cb_partner_...), the same 120 requests a minute per key, and errors as
// { error: { code, message } }.

const bearer = (req: Request) => /^Bearer\s+(\S+)$/i.exec((req.headers.get("authorization") ?? "").trim())?.[1] ?? null;

export function partnerRoute<P = Record<string, never>>(fn: (a: { req: Request; partner: PartnerCtx; params: P; query: URLSearchParams }) => Promise<{ status?: number; body: unknown }>) {
  return async (req: Request, context: { params: Promise<P> }) => {
    try {
      const partner = await partnerCtx(bearer(req));
      await charge(partner, 1);
      const params = (await context?.params) ?? ({} as P);
      const r = await fn({ req, partner, params, query: new URL(req.url).searchParams });
      return json(r.body, r.status ?? 200);
    } catch (e) {
      const res = errorResponse(e);
      const wait = (e as { wait?: number }).wait;
      if (wait) res.headers.set("retry-after", String(wait));
      return res;
    }
  };
}
