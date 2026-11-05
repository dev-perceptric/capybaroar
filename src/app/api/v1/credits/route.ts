import { route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/** The workspace's AI credits: plan credits this month, bought credits, the total left and the next refill. */
export const GET = route(async ({ ops }) => ({ body: { credits: await ops.credits() } }));
