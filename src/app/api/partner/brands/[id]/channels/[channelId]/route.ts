import { partnerRoute } from "@/lib/api/partnerHttp";
import { partnerStore } from "@/lib/partner";
import { disconnectPartnerChannel } from "@/lib/partnerRules";

export const dynamic = "force-dynamic";

type P = { id: string; channelId: string };

/** Disconnect one of the brand's channels, as the Channels page does: its access on the network ends where that's
 *  possible, and its scheduled posts no longer go out on it. channel.lost goes to the partner webhook. 204 when done;
 *  a channel that isn't the brand's (already disconnected too) is 404. */
export const DELETE = partnerRoute<P>(async ({ partner, params }) => {
  await disconnectPartnerChannel(partnerStore, partner, params.id, params.channelId);
  return { status: 204, body: null };
});
