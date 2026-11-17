import { monthRange } from "@/lib/api/input";
import { partnerRoute } from "@/lib/api/partnerHttp";
import { partnerStore } from "@/lib/partner";
import { brandUsage } from "@/lib/partnerRules";

export const dynamic = "force-dynamic";

type P = { id: string };

/** What the brand used in a month (?month=YYYY-MM, UTC; this month by default). */
export const GET = partnerRoute<P>(async ({ partner, params, query }) => ({ body: await brandUsage(partnerStore, partner, params.id, monthRange(query.get("month"))) }));
