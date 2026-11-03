import { route } from "@/lib/api/http";
import { days, optionalId } from "@/lib/api/input";

export const dynamic = "force-dynamic";

export const GET = route(async ({ ops, query }) => ({ body: { analytics: await ops.analytics(days(query.get("days")), optionalId(query.get("channel_id"), "channel_id")) } }));
