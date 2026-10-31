"use server";

import { revalidatePath } from "next/cache";
import { getCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";

export async function saveWorkspace(name: string, timezone: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  if (!name.trim()) return { error: "Enter a name" };
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    return { error: "Unknown time zone" };
  }
  const db = adminClient();
  const { data: me } = await db.from("members").select("role").eq("workspace_id", ctx.workspaceId).eq("user_id", ctx.userId).single();
  if (!me || me.role === "editor") return { error: "Only owners and admins can change this" };
  const { error } = await db.from("workspaces").update({ name: name.trim(), timezone }).eq("id", ctx.workspaceId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}
