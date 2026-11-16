"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { isPaused } from "@/lib/networks";
import { managerCtx, writerCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { saveAccounts } from "@/lib/channels";
import { revokeChannel } from "@/lib/workspaceDelete";
import { getBrandCtx, homeBrand, mayUseBrand, moveChannel } from "@/lib/brands";
import { providerOf } from "@/lib/providers";
import type { NetworkId } from "@/lib/networks";
import { record } from "@/lib/auditActor";
import { cleanSlots, isSlot, type Slot } from "@/lib/queue";
import { queueTime } from "@/lib/posts";

/** Connect a network that uses a form (Bluesky, Telegram, Discord). */
export async function connectWithForm(network: string, values: Record<string, string>): Promise<{ error?: string }> {
  const ctx = await getBrandCtx();
  if (ctx.role === "client") return { error: "Clients can't connect channels" };
  const p = providerOf(network);
  if (!p?.form?.configured() || isPaused(network)) return { error: "This network isn't set up" };
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
    const { data: ch } = await db.from("channels").select("brand_id, network, account_id, name").eq("id", id).eq("workspace_id", ctx.workspaceId).maybeSingle();
    if (!ch || !mayUseBrand(ctx, ch.brand_id as string | null)) return { error: "Channel not found" };
    // End the app's access on the network too (TikTok asks for this), unless a channel that stays still uses the same
    // sign-in (another workspace, or another Google location). Best effort: a failed revoke never blocks disconnecting.
    // Its Inbox items, results and posts' targets go with the row (on delete cascade).
    await revokeChannel(id);
    const { error } = await db.from("channels").delete().eq("id", id).eq("workspace_id", ctx.workspaceId);
    if (error) return { error: error.message };
    await record({ workspaceId: ctx.workspaceId, action: "channel.removed", target: { type: "channel", id, label: ch.name as string }, meta: { network: ch.network as string } }, ctx);
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

/** A channel this person may change: in the workspace and in one of their brands. */
async function ownChannel(id: string) {
  const ctx = await writerCtx();
  const { data: ch } = await adminClient().from("channels").select("id, brand_id, name, nickname").eq("id", id).eq("workspace_id", ctx.workspaceId).maybeSingle();
  if (!ch || !mayUseBrand(ctx, ch.brand_id as string | null)) throw new Error("Channel not found");
  return { ctx, ch: ch as { id: string; brand_id: string | null; name: string; nickname: string | null } };
}

/** Give a channel a name of the team's choosing, or (empty) go back to the network's name. */
export async function renameChannel(id: string, nickname: string): Promise<{ error?: string }> {
  try {
    const { ctx, ch } = await ownChannel(id);
    const v = nickname.trim();
    if (v.length > 80) return { error: "Keep the name under 80 characters" };
    const next = v && v !== ch.name ? v : null;
    const { error } = await adminClient().from("channels").update({ nickname: next }).eq("id", id).eq("workspace_id", ctx.workspaceId);
    if (error) return { error: error.message };
    await record({ workspaceId: ctx.workspaceId, action: "channel.renamed", target: { type: "channel", id, label: ch.name }, meta: { nickname: next ?? "" } }, ctx);
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/channels");
  revalidatePath("/calendar");
  return {};
}

/** A channel's own queue times, or (null) the workspace's. */
export async function saveChannelQueue(id: string, slots: Slot[] | null): Promise<{ error?: string }> {
  try {
    const { ctx, ch } = await ownChannel(id);
    if (slots && !slots.every(isSlot)) return { error: "Each slot needs a day and a time" };
    const queue = slots?.length ? cleanSlots(slots) : null;
    const { error } = await adminClient().from("channels").update({ queue }).eq("id", id).eq("workspace_id", ctx.workspaceId);
    if (error) return { error: error.message };
    await record({ workspaceId: ctx.workspaceId, action: "channel.queue_changed", target: { type: "channel", id, label: ch.nickname || ch.name }, meta: { slots: queue?.length ?? 0 } }, ctx);
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/calendar");
  return {};
}

/** The channel's next free queue time, to start a post at. Null when its queue has none. */
export async function nextChannelSlot(id: string): Promise<string | null> {
  try {
    const { ctx } = await ownChannel(id);
    return (await queueTime(ctx.workspaceId, [id])).toISOString();
  } catch (e) {
    unstable_rethrow(e);
    return null;
  }
}

/** The workspace's queue times and time zone, to show what a channel without its own uses. */
export async function workspaceQueue(): Promise<{ slots: Slot[]; timezone: string }> {
  const ctx = await writerCtx();
  const { data } = await adminClient().from("workspaces").select("queue, timezone").eq("id", ctx.workspaceId).single();
  return { slots: ((data?.queue ?? []) as Slot[]).filter(isSlot), timezone: (data?.timezone as string) ?? "UTC" };
}
