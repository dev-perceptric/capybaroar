import { NextResponse, type NextRequest } from "next/server";
import { userClient } from "@/lib/supabase/server";
import { safeNext } from "@/proxy";

// Email links and Google sign-in come back here with a code to swap for a session.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // `next` brings people back to where they started, like an invite.
  const to = new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url);
  if (code) {
    const sb = await userClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      to.pathname = "/login";
      to.search = "";
    }
  }
  return NextResponse.redirect(to);
}
