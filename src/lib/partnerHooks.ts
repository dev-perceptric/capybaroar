import "server-only";
import { adminClient } from "./supabase/server";
import { emitPartner } from "./webhooks";
import { partnerChannelData, type PartnerEvent } from "./api/hookRules";

// The partner webhook's channel events (046_partner.sql). Its own file with few imports, so channels.ts, the runner
// and the channels page can call it without pulling in the partner API.

type ChannelRef = { id: string; workspace_id: string; brand_id: string | null; network: string; name: string };

/** Tell the partner a channel of one of its brands was connected or lost. Brands made in the app are skipped. Never throws. */
export async function partnerChannelEvent(type: PartnerEvent, channels: ChannelRef[]) {
  try {
    const brands = [...new Set(channels.map((c) => c.brand_id).filter((b): b is string => !!b))];
    if (!brands.length) return;
    const { data, error } = await adminClient().from("brands").select("id, external_id").in("id", brands).not("external_id", "is", null);
    if (error) throw new Error(error.message);
    const ext = new Map((data ?? []).map((b) => [b.id as string, b.external_id as string]));
    for (const c of channels) {
      const external = c.brand_id ? ext.get(c.brand_id) : undefined;
      if (!external) continue;
      await emitPartner(c.workspace_id, type, partnerChannelData(c, external));
    }
  } catch (e) {
    console.error(`[partner] couldn't send ${type}:`, e instanceof Error ? e.message : e);
  }
}
