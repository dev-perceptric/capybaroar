import { NextResponse, type NextRequest } from "next/server";
import { userClient } from "@/lib/supabase/server";

// Email links and Google sign-in come back here with a code to swap for a session.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const to = new URL("/calendar", request.url);
  if (code) {
    const sb = await userClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) to.pathname = "/login";
  }
  return NextResponse.redirect(to);
}
