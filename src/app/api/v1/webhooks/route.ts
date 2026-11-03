import { readJson, route } from "@/lib/api/http";
import { webhookInput } from "@/lib/api/input";
import { EVENTS } from "@/lib/api/hookRules";

export const dynamic = "force-dynamic";

export const GET = route(async ({ ops }) => ({ body: { webhooks: await ops.webhooks() } }));

/** Add a webhook. The signing secret comes back once. */
export const POST = route(async ({ req, ops }) => {
  const w = webhookInput(await readJson(req), EVENTS);
  return { status: 201, body: await ops.createWebhook(w.url, w.events) };
});
