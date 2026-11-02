import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminClient, userClient } from "./supabase/server";

/** owner and admin run the workspace; editors write posts; clients see their brands' calendar and approve. */
export type Role = "owner" | "admin" | "editor" | "client";

export type Ctx = {
  userId: string;
  email: string;
  name: string;
  workspaceId: string;
  workspaceName: string;
  timezone: string;
  role: Role;
  /** The brands this person may see, or null for every brand. */
  brandIds: string[] | null;
  /** Every workspace this person belongs to, for the switcher. */
  workspaces: { id: string; name: string }[];
};

/** The workspace picked in the switcher (an invite also sets it). */
export const WORKSPACE_COOKIE = "cb_ws";

export const canManage = (role: Role) => role === "owner" || role === "admin";
export const canApprove = (role: Role) => role !== "editor";

type MemberRow = { workspace_id: string; role: Role; brand_ids: string[] | null; workspaces: { name: string; timezone: string } };

/** The signed-in user and their workspace. The first visit makes the workspace. */
export const getCtx = cache(async (): Promise<Ctx> => {
  const sb = await userClient();
  // Checks the sign-in token's signature here (cached public key), with no round trip to Supabase Auth.
  const { data } = await sb.auth.getClaims();
  const c = data?.claims;
  if (!c?.sub) redirect("/login");
  const user = { id: c.sub, email: (c.email as string) ?? "", user_metadata: (c.user_metadata ?? {}) as Record<string, unknown> };
  const db = adminClient();
  const { data: rows } = await db.from("members").select("workspace_id, role, brand_ids, workspaces(name, timezone)").eq("user_id", user.id).order("created_at");
  const name = (user.user_metadata?.name as string | undefined) || user.email!.split("@")[0];
  const all = (rows ?? []) as unknown as MemberRow[];
  if (all.length) {
    const want = (await cookies()).get(WORKSPACE_COOKIE)?.value;
    const m = all.find((r) => r.workspace_id === want) ?? all[0];
    return {
      userId: user.id,
      email: user.email!,
      name,
      workspaceId: m.workspace_id,
      workspaceName: m.workspaces.name,
      timezone: m.workspaces.timezone,
      role: m.role,
      brandIds: m.role === "owner" || m.role === "admin" ? null : (m.brand_ids ?? null),
      workspaces: all.map((r) => ({ id: r.workspace_id, name: r.workspaces.name })),
    };
  }
  const company = (user.user_metadata?.company as string | undefined) || `${name}'s workspace`;
  const { data: ws, error } = await db.from("workspaces").insert({ name: company }).select("id, name, timezone").single();
  if (error) throw new Error(error.message);
  const { error: e2 } = await db.from("members").insert({ workspace_id: ws.id, user_id: user.id, role: "owner" });
  if (e2) throw new Error(e2.message);
  await db.from("brands").insert({ workspace_id: ws.id, name: String(ws.name).slice(0, 60) });
  return { userId: user.id, email: user.email!, name, workspaceId: ws.id as string, workspaceName: ws.name as string, timezone: ws.timezone as string, role: "owner", brandIds: null, workspaces: [{ id: ws.id as string, name: ws.name as string }] };
});

/** getCtx for screens clients don't have: they go to the calendar. */
export async function teamCtx() {
  const ctx = await getCtx();
  if (ctx.role === "client") redirect("/calendar");
  return ctx;
}

/** getCtx for actions only owners and admins may take. Throws for everyone else. */
export async function managerCtx() {
  const ctx = await getCtx();
  if (!canManage(ctx.role)) throw new Error("Only owners and admins can change this");
  return ctx;
}

/** getCtx for actions that write posts or channels. Throws for clients. */
export async function writerCtx() {
  const ctx = await getCtx();
  if (ctx.role === "client") throw new Error("Clients can only approve or reject posts");
  return ctx;
}
