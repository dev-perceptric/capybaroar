import { route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/** The next free slot of the workspace's posting queue. */
export const GET = route(async ({ ops }) => ({ body: { publish_at: await ops.nextSlot() } }));
