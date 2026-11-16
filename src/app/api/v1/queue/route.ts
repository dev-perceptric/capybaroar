import { route } from "@/lib/api/http";
import { optionalChannelIds } from "@/lib/api/input";

export const dynamic = "force-dynamic";

/** The next free queue time: of the workspace's queue, or (?channel_ids=a,b) for a post to these channels. */
export const GET = route(async ({ ops, query }) => ({ body: { publish_at: await ops.nextSlot(optionalChannelIds(query.get("channel_ids"))) } }));
