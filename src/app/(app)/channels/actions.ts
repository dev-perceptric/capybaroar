"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { managerCtx, writerCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { saveAccounts } from "@/lib/channels";
import { getBrandCtx, homeBrand, mayUseBrand, moveChannel } from "@/lib/brands";
import { providerOf } from "@/lib/providers";
import type { NetworkId } from "@/lib/networks";

/** Connect a network that uses a form (Bluesky, Telegram, Discord). */
export async function connectWithForm(network: string, values: Record<string, string>): Promise<{ error?: string }> {
  const ctx = await getBrandCtx();
  if (ctx.role === "client") return { error: "Clients can't connect channels" };
  const p = providerOf(network);
  if (!p?.form?.configured()) return { error: "This network isn't set up" };
  for (const f of p.form.fields) if (!values[f.key]?.trim()) return { error: `Enter ${f.label.toLowerCase()}` };
  try {
    const accounts = await p.form.connect(Object.fromEntries(p.form.fields.map((f) => [f.key, values[f.key].trim()])));
    await saveAccounts(ctx.workspaceId, network as NetworkId, accounts, homeBrand(ctx));
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/channels");
  return {};
}

export async function removeChannel(id: string): Promise<{ error?: string }> {
  try {
    const ctx = await writerCtx();
    const db = adminClient();
    const { data: ch } = await db.from("channels").select("brand_id").eq("id", id).eq("workspace_id", ctx.workspaceId).maybeSingle();
    if (!ch || !mayUseBrand(ctx, ch.brand_id as string | null)) return { error: "Channel not found" };
    const { error } = await db.from("channels").delete().eq("id", id).eq("workspace_id", ctx.workspaceId);
    if (error) return { error: error.message };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/channels");
  revalidatePath("/calendar");
  return {};
}

/** Move a channel to another brand. Its scheduled posts keep going out. */
export async function setChannelBrand(id: string, brandId: string): Promise<{ error?: string }> {
  try {
    const ctx = await managerCtx();
    await moveChannel(ctx.workspaceId, id, brandId);
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/channels");
  revalidatePath("/calendar");
  return {};
}
