"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { canManage, getCtx, WORKSPACE_COOKIE } from "@/lib/session";
import { ALL_BRANDS, BRAND_COOKIE, listBrands } from "@/lib/brands";

const YEAR = 60 * 60 * 24 * 365;
const opts = { path: "/", maxAge: YEAR, sameSite: "lax" as const, httpOnly: true, secure: process.env.NODE_ENV === "production" };

/** Pick the brand every screen shows, or "all" (owners and admins). */
export async function switchBrand(id: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  if (id === ALL_BRANDS) {
    if (!canManage(ctx.role)) return { error: "Pick a brand" };
  } else {
    const brands = await listBrands(ctx.workspaceId);
    if (!brands.some((b) => b.id === id && (!ctx.brandIds || ctx.brandIds.includes(b.id)))) return { error: "Brand not found" };
  }
  (await cookies()).set(BRAND_COOKIE, id, opts);
  revalidatePath("/", "layout");
  return {};
}

/** Open another workspace this person belongs to. */
export async function switchWorkspace(id: string): Promise<{ error?: string }> {
  const ctx = await getCtx();
  if (!ctx.workspaces.some((w) => w.id === id)) return { error: "Workspace not found" };
  const jar = await cookies();
  jar.set(WORKSPACE_COOKIE, id, opts);
  jar.delete(BRAND_COOKIE);
  revalidatePath("/", "layout");
  return {};
}
