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

export async function saveQueue(slots: { day: number; time: string }[]): Promise<{ error?: string }> {
  const ctx = await getCtx();
  const clean = slots.filter((s) => Number.isInteger(s.day) && s.day >= 0 && s.day <= 6 && /^([01]\d|2[0-3]):[0-5]\d$/.test(s.time));
  if (clean.length !== slots.length) return { error: "Each slot needs a day and a time" };
  const unique = [...new Map(clean.map((s) => [`${s.day} ${s.time}`, s])).values()].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const { error } = await adminClient().from("workspaces").update({ queue: unique }).eq("id", ctx.workspaceId);
  if (error) return { error: error.message };
  return {};
}
