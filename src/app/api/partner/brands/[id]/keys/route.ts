import { partnerRoute } from "@/lib/api/partnerHttp";
import { partnerStore } from "@/lib/partner";
import { makeBrandKey, revokeBrandKeysOf } from "@/lib/partnerRules";

export const dynamic = "force-dynamic";

type P = { id: string };

/** A key (cbr_brand_...) for /api/v1 and MCP that sees only this brand. Shown once. */
export const POST = partnerRoute<P>(async ({ partner, params }) => ({ status: 201, body: await makeBrandKey(partnerStore, partner, params.id) }));

/** Revoke every key of this brand at once. */
export const DELETE = partnerRoute<P>(async ({ partner, params }) => {
  await revokeBrandKeysOf(partnerStore, partner, params.id);
  return { status: 204, body: null };
});
