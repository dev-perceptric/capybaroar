import { NextResponse, type NextRequest } from "next/server";
import { unsubscribe } from "@/lib/subscribers";
import { backTo, cleanToken } from "@/lib/subscriberRules";

const site = () => process.env.SITE_URL || "https://capybaroar.com";

// GET from the link in a notice; POST for mail apps' one-click unsubscribe (RFC 8058).
async function stop(request: NextRequest) {
  const t = cleanToken(request.nextUrl.searchParams.get("t"));
  const ok = t ? await unsubscribe(t).catch(() => false) : false;
  return ok;
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(backTo(site(), (await stop(request)) ? "off" : "error"), 303);
}

export async function POST(request: NextRequest) {
  return new NextResponse(null, { status: (await stop(request)) ? 200 : 400 });
}
