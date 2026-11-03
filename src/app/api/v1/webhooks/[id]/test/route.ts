import { route } from "@/lib/api/http";
import { id } from "@/lib/api/input";

export const dynamic = "force-dynamic";

/** Send a ping event to the webhook now. */
export const POST = route<{ id: string }>(async ({ ops, params }) => {
  await ops.testWebhook(id(params.id));
  return { status: 202, body: { sent: true } };
});
