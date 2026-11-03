import { route } from "@/lib/api/http";
import { optionalId } from "@/lib/api/input";

export const dynamic = "force-dynamic";

export const GET = route(async ({ ops, query }) => ({ body: { channels: await ops.channels(optionalId(query.get("brand_id"), "brand_id")) } }));
