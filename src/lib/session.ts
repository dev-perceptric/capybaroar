import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { adminClient, userClient } from "./supabase/server";

export type Ctx = { userId: string; email: string; name: string; workspaceId: string; workspaceName: string; timezone: string };

/** The signed-in user and their workspace. The first visit makes the workspace. */
export const getCtx = cache(async (): Promise<Ctx> => {
  const sb = await userClient();
  // Checks the sign-in token's signature here (cached public key), with no round trip to Supabase Auth.
  const { data } = await sb.auth.getClaims();
  const c = data?.claims;
  if (!c?.sub) redirect("/login");
  const user = { id: c.sub, email: (c.email as string) ?? "", user_metadata: (c.user_metadata ?? {}) as Record<string, unknown> };
  const db = adminClient();
  const { data: m } = await db.from("members").select("workspace_id, workspaces(name, timezone)").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
  const name = (user.user_metadata?.name as string | undefined) || user.email!.split("@")[0];
  if (m) {
    const ws = m.workspaces as unknown as { name: string; timezone: string };
    return { userId: user.id, email: user.email!, name, workspaceId: m.workspace_id as string, workspaceName: ws.name, timezone: ws.timezone };
  }
  const company = (user.user_metadata?.company as string | undefined) || `${name}'s workspace`;
  const { data: ws, error } = await db.from("workspaces").insert({ name: company }).select("id, name, timezone").single();
  if (error) throw new Error(error.message);
  const { error: e2 } = await db.from("members").insert({ workspace_id: ws.id, user_id: user.id, role: "owner" });
  if (e2) throw new Error(e2.message);
  return { userId: user.id, email: user.email!, name, workspaceId: ws.id as string, workspaceName: ws.name as string, timezone: ws.timezone as string };
});
