import { partnerRoute } from "@/lib/api/partnerHttp";
import { appUrl } from "@/lib/channels";
import { partnerStore } from "@/lib/partner";
import { makeConnectLink } from "@/lib/partnerRules";

export const dynamic = "force-dynamic";

type P = { id: string };

/** A one-time page, for 24 hours, where the brand's owner connects their social accounts without an account. */
export const POST = partnerRoute<P>(async ({ partner, params }) => ({ status: 201, body: await makeConnectLink(partnerStore, partner, params.id, appUrl()) }));
