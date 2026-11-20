import { partnerRoute } from "@/lib/api/partnerHttp";
import { linkNetworks } from "@/lib/partner";
import { partnerNetworkList } from "@/lib/partnerConnectRules";

export const dynamic = "force-dynamic";

/** The one-click networks set up on this server: { networks: [{ id, name, kind }] }. kind "page" may need a pick. */
export const GET = partnerRoute(async () => ({ body: partnerNetworkList(linkNetworks()) }));
