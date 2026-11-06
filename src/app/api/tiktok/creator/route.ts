import { NextResponse, type NextRequest } from "next/server";
import { getBrandCtx, mayUseBrand } from "@/lib/brands";
import { adminClient } from "@/lib/supabase/server";
import { readSecret, writeSecret } from "@/lib/channels";
import { AuthError } from "@/lib/providers/types";
import { creatorInfo, tiktok } from "@/lib/providers/tiktok";

// What TikTok lets this channel post right now: the account's name and picture, who can watch, and whether comments,
// Duet and Stitch are allowed. TikTok's content sharing rules ask the composer to show these before posting.
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("channel");
  if (!id) return NextResponse.json({ error: "Missing channel" }, { status: 400 });
  const ctx = await getBrandCtx();
  const { data: ch } = await adminClient().from("channels").select("id, network, brand_id").eq("id", id).eq("workspace_id", ctx.workspaceId).maybeSingle();
  if (!ch || ch.network !== "tiktok" || !mayUseBrand(ctx, (ch.brand_id as string | null) ?? null)) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  try {
    let s = await readSecret(id);
    if (tiktok.refresh && s.refreshToken && s.expiresAt && s.expiresAt.getTime() < Date.now() + 5 * 60000) {
      const next = await tiktok.refresh(s);
      await writeSecret(id, next);
      s = { ...s, accessToken: next.accessToken };
    }
    return NextResponse.json(await creatorInfo(s.accessToken));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: e instanceof AuthError ? "Reconnect this TikTok channel" : msg }, { status: e instanceof AuthError ? 401 : 502 });
  }
}
