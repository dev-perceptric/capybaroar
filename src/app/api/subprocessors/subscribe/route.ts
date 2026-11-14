import { NextResponse, type NextRequest } from "next/server";
import { subscribe } from "@/lib/subscribers";
import { backTo, cleanEmail } from "@/lib/subscriberRules";
import { trustedIp } from "@/lib/clientIp";

// The sign-up form on capybaroar.com/subprocessors posts here, then the browser goes back to that page.
const site = () => process.env.SITE_URL || "https://capybaroar.com";

export async function POST(request: NextRequest) {
  let email: string | null = null;
  try {
    email = cleanEmail((await request.formData()).get("email"));
  } catch {
    email = null;
  }
  if (!email) return NextResponse.redirect(backTo(site(), "error"), 303);
  try {
    const r = await subscribe(email, trustedIp(request.headers));
    return NextResponse.redirect(backTo(site(), r === "sent" ? "check" : "error"), 303);
  } catch (e) {
    console.error("subprocessor subscribe:", e instanceof Error ? e.message : e);
    return NextResponse.redirect(backTo(site(), "error"), 303);
  }
}
