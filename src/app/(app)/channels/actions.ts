"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { saveAccounts } from "@/lib/channels";
import { providerOf } from "@/lib/providers";
import type { NetworkId } from "@/lib/networks";

/** Connect a network that uses a form (Bluesky, Telegram, Discord). */
export async function connectWithForm(network: string, values: Record<string, string>): Promise<{ error?: string }> {
  const ctx = await getCtx();
  const p = providerOf(network);
  if (!p?.form?.configured()) return { error: "This network isn't set up" };
  for (const f of p.form.fields) if (!values[f.key]?.trim()) return { error: `Enter ${f.label.toLowerCase()}` };
  try {
    const accounts = await p.form.connect(Object.fromEntries(p.form.fields.map((f) => [f.key, values[f.key].trim()])));
    await saveAccounts(ctx.workspaceId, network as NetworkId, accounts);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/channels");
  return {};
}

export async function removeChannel(id: string) {
  const ctx = await getCtx();
  const { error } = await adminClient().from("channels").delete().eq("id", id).eq("workspace_id", ctx.workspaceId);
  if (error) throw new Error(error.message);
  revalidatePath("/channels");
  revalidatePath("/calendar");
}
