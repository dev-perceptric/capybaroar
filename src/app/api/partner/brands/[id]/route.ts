import { partnerRoute } from "@/lib/api/partnerHttp";
import { partnerStore } from "@/lib/partner";
import { deletePartnerBrand, getPartnerBrand } from "@/lib/partnerRules";

export const dynamic = "force-dynamic";

type P = { id: string };

/** The brand with its channels and status: no_channels, connected or needs_reconnect. */
export const GET = partnerRoute<P>(async ({ partner, params }) => ({ body: await getPartnerBrand(partnerStore, partner, params.id) }));

/** Delete the brand with its channels, posts and files. Its brand keys and connect links stop working at once. */
export const DELETE = partnerRoute<P>(async ({ partner, params }) => {
  await deletePartnerBrand(partnerStore, partner, params.id);
  return { status: 204, body: null };
});
