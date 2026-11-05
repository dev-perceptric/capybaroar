import { route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/** Saved channel groups; send a group's channel_ids to POST /api/v1/posts to post to all of them. */
export const GET = route(async ({ ops }) => ({ body: { groups: await ops.channelGroups() } }));
