import { NextResponse } from "next/server";
import { resolveLink } from "@/lib/composer";
import { appUrl } from "@/lib/channels";

// Short links: count the click, then send the visitor on.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = await resolveLink(code);
  return NextResponse.redirect(url ?? `${appUrl()}/`, url ? 302 : 307);
}
