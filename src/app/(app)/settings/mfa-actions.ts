"use server";

import { headers } from "next/headers";
import { getCtx } from "@/lib/session";
import { audit } from "@/lib/audit";
import { trustedIp } from "@/lib/clientIp";
import { verifiedFactors } from "@/lib/mfa";
import { retry } from "@/lib/mfaRules";
import { adminClient } from "@/lib/supabase/server";

// The workspace rule "everyone uses 2FA" (workspaces.require_mfa, 038_mfa.sql). Owners change it; members without 2FA
// are then sent to /mfa/setup before they use the workspace (getCtx).

export async function loadRequireTwoFactor(): Promise<{ on: boolean; owner: boolean }> {
  const ctx = await getCtx();
  const { data, error } = await adminClient().from("workspaces").select("require_mfa").eq("id", ctx.workspaceId).single();
  if (error) throw new Error("Couldn't load the 2FA rule");
  return { on: Boolean(data.require_mfa), owner: ctx.role === "owner" };
}

export async function setRequireTwoFactor(on: boolean): Promise<{ error?: string }> {
  const ctx = await getCtx();
  if (ctx.role !== "owner") return { error: "Only owners can change this" };
  // The owner first, so the rule never sends the person who set it to the set-up page.
  if (on && !(await verifiedFactors(ctx.userId)).length) return { error: "Turn on 2FA for your account first" };
  try {
    await retry(async () => {
      const { error, status } = await adminClient().from("workspaces").update({ require_mfa: on }).eq("id", ctx.workspaceId);
      if (error) throw Object.assign(new Error(error.message), { status });
    });
  } catch (e) {
    console.error("mfa rule:", e instanceof Error ? e.message : e);
    return { error: "Couldn't save" };
  }
  await audit({ workspaceId: ctx.workspaceId, actorId: ctx.userId, actorLabel: ctx.email, action: "auth.mfa_required", meta: { on }, ip: trustedIp(await headers()) });
  return {};
}
