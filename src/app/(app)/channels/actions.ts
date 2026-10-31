"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { saveAccounts } from "@/lib/channels";
import { blueskyLogin } from "@/lib/providers/bluesky";

export async function connectBluesky(_: { error?: string }, form: FormData): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await getCtx();
  const handle = String(form.get("handle") ?? "").trim().replace(/^@/, "");
  const password = String(form.get("password") ?? "").trim();
  if (!handle || !password) return { error: "Enter your handle and app password" };
  try {
    const s = await blueskyLogin(handle, password);
    const prof = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(s.did)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    await saveAccounts(ctx.workspaceId, "bluesky", [
      { accountId: s.did, name: prof?.displayName || s.handle, username: s.handle, avatar: prof?.avatar ?? null, accessToken: password, extra: { handle: s.handle } },
    ]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath("/channels");
  return { ok: true };
}

export async function removeChannel(id: string) {
  const ctx = await getCtx();
  const { error } = await adminClient().from("channels").delete().eq("id", id).eq("workspace_id", ctx.workspaceId);
  if (error) throw new Error(error.message);
  revalidatePath("/channels");
  revalidatePath("/calendar");
}
