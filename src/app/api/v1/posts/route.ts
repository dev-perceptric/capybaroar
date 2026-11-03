import { readJson, route } from "@/lib/api/http";
import { optionalId, postFields, range } from "@/lib/api/input";
import type { Ops } from "@/lib/api/types";

export const dynamic = "force-dynamic";

/** Posts with a publish time between from and to (the next 30 days without them). */
export const GET = route(async ({ ops, query }) => {
  const r = range(query.get("from"), query.get("to"));
  return { body: { posts: await ops.posts(r.from, r.to, optionalId(query.get("brand_id"), "brand_id")) } };
});

/** One post: a draft unless mode says schedule, now or queue. */
export const POST = route(async ({ req, ops }) => {
  const f = postFields(await readJson(req), false) as Parameters<Ops["create"]>[0];
  return { status: 201, body: { post: await ops.create(f) } };
});
