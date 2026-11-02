"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { userClient } from "@/lib/supabase/server";
import { acceptInvite } from "@/lib/team";
import { WORKSPACE_COOKIE } from "@/lib/session";
import { BRAND_COOKIE } from "@/lib/brands";

/** Join the workspace as the signed-in user, then open it. */
export async function accept(token: string): Promise<{ error?: string }> {
  const { data } = await (await userClient()).auth.getClaims();
  const c = data?.claims;
  if (!c?.sub) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  let ws: string;
  try {
    ws = await acceptInvite(token, { id: c.sub, email: (c.email as string) ?? "" });
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  const jar = await cookies();
  jar.set(WORKSPACE_COOKIE, ws, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  jar.delete(BRAND_COOKIE);
  redirect("/calendar");
}

export async function signOutTo(token: string) {
  await (await userClient()).auth.signOut();
  redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
}
