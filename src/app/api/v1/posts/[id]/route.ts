import { readJson, route } from "@/lib/api/http";
import { deleteArgs, id, postFields } from "@/lib/api/input";

export const dynamic = "force-dynamic";

type P = { id: string };

export const GET = route<P>(async ({ ops, params }) => ({ body: { post: await ops.post(id(params.id)) } }));

/** Change only the fields sent. */
export const PATCH = route<P>(async ({ req, ops, params }) => ({ body: { post: await ops.update(id(params.id), postFields(await readJson(req), true)) } }));

/** Remove the record. With ?everywhere=true (and &channels=a,b) delete it on the networks instead; the record stays. */
export const DELETE = route<P>(async ({ ops, params, query }) => {
  const postId = id(params.id);
  const d = deleteArgs(query.get("everywhere"), query.get("channels"));
  if (d.everywhere) return { body: await ops.unpublish(postId, d.channelIds) };
  await ops.remove(postId);
  return { body: { deleted: true } };
});
