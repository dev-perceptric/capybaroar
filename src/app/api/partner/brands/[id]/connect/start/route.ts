import { readJson } from "@/lib/api/http";
import { partnerRoute } from "@/lib/api/partnerHttp";
import { linkNetworks, partnerStore } from "@/lib/partner";
import { connectStore, partnerAuthUrl, partnerReturnHosts } from "@/lib/partnerConnect";
import { startPartnerConnect } from "@/lib/partnerConnectRules";

export const dynamic = "force-dynamic";

type P = { id: string };

/** White-label connect: { network, return_url } -> { url }, the network's own sign-in. It works once, for 30 minutes,
 *  and comes back to return_url with cb_status. */
export const POST = partnerRoute<P>(async ({ req, partner, params }) => ({
  body: await startPartnerConnect(partnerStore, connectStore, partner, params.id, await readJson(req), { networks: linkNetworks(), hosts: partnerReturnHosts(), authUrl: partnerAuthUrl }),
}));
