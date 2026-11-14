import { NextResponse, type NextRequest } from "next/server";
import { confirmSubscriber } from "@/lib/subscribers";
import { backTo, cleanToken } from "@/lib/subscriberRules";

const site = () => process.env.SITE_URL || "https://capybaroar.com";

export async function GET(request: NextRequest) {
  const t = cleanToken(request.nextUrl.searchParams.get("t"));
  const ok = t ? await confirmSubscriber(t).catch(() => false) : false;
  return NextResponse.redirect(backTo(site(), ok ? "yes" : "error"), 303);
}
