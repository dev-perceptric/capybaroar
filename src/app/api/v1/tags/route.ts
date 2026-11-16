import { route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/** The workspace's tags; send their ids as tag_ids on a post. */
export const GET = route(async ({ ops }) => ({ body: { tags: await ops.tags() } }));
