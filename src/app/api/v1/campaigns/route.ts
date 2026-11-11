import { route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/** Campaigns with their posts by status and engagements; send a campaign's id as campaign_id on a post. */
export const GET = route(async ({ ops }) => ({ body: { campaigns: await ops.campaigns() } }));
