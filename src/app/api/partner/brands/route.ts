import { readJson } from "@/lib/api/http";
import { partnerBrandInput } from "@/lib/api/input";
import { partnerRoute } from "@/lib/api/partnerHttp";
import { partnerStore } from "@/lib/partner";
import { createPartnerBrand } from "@/lib/partnerRules";

export const dynamic = "force-dynamic";

/** Make a brand: { name, domain, external_id }. 201 when made; the same external_id again is 200 with that brand. */
export const POST = partnerRoute(async ({ req, partner }) => createPartnerBrand(partnerStore, partner, partnerBrandInput(await readJson(req))));
