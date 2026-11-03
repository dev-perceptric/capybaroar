import { readJson, route } from "@/lib/api/http";
import { bad, id } from "@/lib/api/input";

export const dynamic = "force-dynamic";

type P = { id: string };

/** Turn a webhook on or off: {"enabled": true}. */
export const PATCH = route<P>(async ({ req, ops, params }) => {
  const b = (await readJson(req)) as { enabled?: unknown };
  if (typeof b?.enabled !== "boolean" || Object.keys(b).length !== 1) throw bad('Send {"enabled": true} or {"enabled": false}');
  return { body: { webhook: await ops.setWebhook(id(params.id), b.enabled) } };
});

export const DELETE = route<P>(async ({ ops, params }) => {
  await ops.deleteWebhook(id(params.id));
  return { body: { deleted: true } };
});
