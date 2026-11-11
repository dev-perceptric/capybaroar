"use server";

import { revalidatePath } from "next/cache";
import { revokeConnectedApp } from "@/lib/oauth/store";
import { unstable_rethrow } from "next/navigation";
import { canManage, getCtx, managerCtx, type Ctx, type Role } from "@/lib/session";
import { createBrand, createReviewLink, deleteBrand, renameBrand, revokeReviewLink, setApproval } from "@/lib/brands";
import { createInvite, removeMember, revokeInvite, setMemberBrands, setMemberRole } from "@/lib/team";
import { adminClient } from "@/lib/supabase/server";
import { createApiKey, deleteApiKey } from "@/lib/api/keys";
import { assertCanUseApprovals } from "@/lib/billing";
import { createWebhook, deleteWebhook, setWebhookOn, testWebhook } from "@/lib/webhooks";
import { webhookInput } from "@/lib/api/input";
import { EVENTS } from "@/lib/api/hookRules";

export async function saveWorkspace(name: string, timezone: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  if (!name.trim()) return { error: "Enter a name" };
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    return { error: "Unknown time zone" };
  }
  if (!canManage(ctx.role)) return { error: "Only owners and admins can change this" };
  const { error } = await adminClient().from("workspaces").update({ name: name.trim(), timezone }).eq("id", ctx.workspaceId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

/** The workspace's best hours (up to 7) as queue times, from its own results. Empty until there's enough data. */
export async function bestQueue(): Promise<{ day: number; time: string }[]> {
  const ctx = await getCtx();
  const { suggestedTimes } = await import("@/lib/analytics");
  const { slotsFromBest } = await import("@/lib/queue");
  return slotsFromBest(await suggestedTimes(ctx.workspaceId, ctx.timezone, 7));
}

export async function saveQueue(slots: { day: number; time: string }[]): Promise<{ error?: string }> {
  const ctx = await getCtx();
  if (!canManage(ctx.role)) return { error: "Only owners and admins can change this" };
  const clean = slots.filter((s) => Number.isInteger(s.day) && s.day >= 0 && s.day <= 6 && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.time));
  if (clean.length !== slots.length) return { error: "Each slot needs a day and a time" };
  const unique = [...new Map(clean.map((s) => [`${s.day} ${s.time}`, s])).values()].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const { error } = await adminClient().from("workspaces").update({ queue: unique }).eq("id", ctx.workspaceId);
  if (error) return { error: error.message };
  return {};
}

// Brands

const fail = (e: unknown) => {
  unstable_rethrow(e);
  return { error: e instanceof Error ? e.message : String(e) };
};

/** Run an owner-or-admin change and refresh every screen (the switcher lists brands). */
async function manage(fn: (ctx: Ctx) => Promise<unknown>): Promise<{ error?: string }> {
  try {
    await fn(await managerCtx());
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/", "layout");
  return {};
}

export async function addBrand(name: string) {
  return manage((ctx) => createBrand(ctx.workspaceId, name));
}
export async function loadBrandKit(id: string) {
  const ctx = await managerCtx();
  const { getBrandKit } = await import("@/lib/brands");
  return getBrandKit(ctx.workspaceId, id);
}
export async function saveBrandKitFor(id: string, kit: { voice: string; avoid: string; hashtags: string }) {
  const { saveBrandKit } = await import("@/lib/brands");
  return manage((ctx) => saveBrandKit(ctx.workspaceId, id, kit));
}
export async function saveBrandName(id: string, name: string) {
  return manage((ctx) => renameBrand(ctx.workspaceId, id, name));
}
export async function removeBrand(id: string) {
  return manage((ctx) => deleteBrand(ctx.workspaceId, id));
}
export async function saveApproval(id: string, on: boolean) {
  return manage(async (ctx) => {
    if (on) await assertCanUseApprovals(ctx.workspaceId);
    await setApproval(ctx.workspaceId, id, on);
  });
}
export async function removeReviewLink(brandId: string) {
  return manage((ctx) => revokeReviewLink(ctx.workspaceId, brandId));
}

export async function newReviewLink(brandId: string): Promise<{ error?: string; url?: string }> {
  let url = "";
  const r = await manage(async (ctx) => {
    await assertCanUseApprovals(ctx.workspaceId);
    url = await createReviewLink(ctx.workspaceId, brandId, ctx.userId);
  });
  return r.error ? r : { url };
}

// Members and invites

export async function invite(email: string, role: Role, brandIds: string[] | null): Promise<{ error?: string; link?: string; emailed?: boolean }> {
  let out: { link: string; emailed: boolean } | null = null;
  const r = await manage(async (ctx) => {
    // Clients only approve posts, so inviting one comes with approvals.
    if (role === "client") await assertCanUseApprovals(ctx.workspaceId);
    out = await createInvite(ctx, { email, role, brandIds });
  });
  return r.error ? r : out!;
}

export async function withdrawInvite(id: string) {
  return manage((ctx) => revokeInvite(ctx.workspaceId, id));
}
export async function saveMemberRole(userId: string, role: Role) {
  return manage(async (ctx) => {
    if (role === "client") await assertCanUseApprovals(ctx.workspaceId);
    await setMemberRole(ctx, userId, role);
  });
}
export async function saveMemberBrands(userId: string, brandIds: string[] | null) {
  return manage((ctx) => setMemberBrands(ctx, userId, brandIds));
}
export async function removeMemberFrom(userId: string) {
  return manage((ctx) => removeMember(ctx, userId));
}

// API and MCP keys

export async function newApiKey(name: string): Promise<{ error?: string; key?: string }> {
  try {
    const ctx = await managerCtx();
    const { key } = await createApiKey(ctx.workspaceId, ctx.userId, name);
    revalidatePath("/settings");
    return { key };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function removeApiKey(id: string): Promise<{ error?: string }> {
  try {
    const ctx = await managerCtx();
    await deleteApiKey(ctx.workspaceId, id);
    revalidatePath("/settings");
    return {};
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// Webhooks

export async function addWebhook(url: string, events: string[]): Promise<{ error?: string; secret?: string }> {
  try {
    const ctx = await managerCtx();
    const w = webhookInput({ url, events }, EVENTS);
    const { secret } = await createWebhook(ctx.workspaceId, ctx.userId, w.url, w.events);
    revalidatePath("/settings");
    return { secret };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function removeWebhook(id: string): Promise<{ error?: string }> {
  try {
    const ctx = await managerCtx();
    await deleteWebhook(ctx.workspaceId, id);
    revalidatePath("/settings");
    return {};
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function saveWebhookOn(id: string, on: boolean): Promise<{ error?: string }> {
  try {
    const ctx = await managerCtx();
    await setWebhookOn(ctx.workspaceId, id, on);
    revalidatePath("/settings");
    return {};
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sendTestWebhook(id: string): Promise<{ error?: string }> {
  try {
    const ctx = await managerCtx();
    await testWebhook(ctx.workspaceId, id);
    return {};
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// Credits

export async function saveAutoTopUp(pack: number | null, max: number): Promise<{ error?: string }> {
  const { setAutoTopUp } = await import("@/lib/credits");
  return manage((ctx) => setAutoTopUp(ctx.workspaceId, pack, max));
}

export async function saveBrandLimit(brandId: string, limit: number | null): Promise<{ error?: string }> {
  const { setBrandLimit } = await import("@/lib/credits");
  return manage((ctx) => setBrandLimit(ctx.workspaceId, brandId, limit));
}

/** Remove an app connected with OAuth (Claude, an MCP client). It stops working at once. */
export async function removeConnectedApp(id: string): Promise<{ error?: string }> {
  try {
    const ctx = await managerCtx();
    await revokeConnectedApp(ctx.workspaceId, id);
    revalidatePath("/settings");
    return {};
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
