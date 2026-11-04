import { NextResponse } from "next/server";
import { resolveLink } from "@/lib/composer";
import { appUrl } from "@/lib/channels";
import { isBot } from "@/lib/bioViews";

// Short links: count the click, then send the visitor on.
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = await resolveLink(code, !isBot(req.headers.get("user-agent")));
  return NextResponse.redirect(url ?? `${appUrl()}/`, url ? 302 : 307);
}
