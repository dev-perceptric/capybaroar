import { readJson, route } from "@/lib/api/http";
import { id, postFields } from "@/lib/api/input";

export const dynamic = "force-dynamic";

type P = { id: string };

export const GET = route<P>(async ({ ops, params }) => ({ body: { post: await ops.post(id(params.id)) } }));

/** Change only the fields sent. */
export const PATCH = route<P>(async ({ req, ops, params }) => ({ body: { post: await ops.update(id(params.id), postFields(await readJson(req), true)) } }));

export const DELETE = route<P>(async ({ ops, params }) => {
  await ops.remove(id(params.id));
  return { body: { deleted: true } };
});
