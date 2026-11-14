import { NextResponse, type NextRequest } from "next/server";
import { userClient } from "@/lib/supabase/server";
import { downloadUrl } from "@/lib/exports";

export const dynamic = "force-dynamic";

const text = (body: string, status: number) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

/** The emailed link: for the person who asked, within its 24 hours, a redirect to a one-minute signed address. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await (await userClient()).auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/api/exports/${id}`)}`, req.url));
  try {
    const r = await downloadUrl(id, userId);
    if ("url" in r) return NextResponse.redirect(r.url, { status: 303, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
    if (r.error === "expired") return text("This link has expired. Ask for a new export in Settings.", 410);
    if (r.error === "not_ready") return text("This export isn't ready yet.", 409);
    return text("Export not found.", 404);
  } catch (e) {
    console.error("export link:", e instanceof Error ? e.message : e);
    return text("Couldn't open the export. Try again in a minute.", 503);
  }
}
