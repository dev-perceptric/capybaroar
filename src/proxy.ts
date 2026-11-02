import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Keeps the Supabase session fresh and sends signed-out people to /login. Invites and review links open signed out.
const OPEN = ["/login", "/signup", "/auth/", "/l/", "/invite/", "/review/"];

/** Only paths on this site, so a link can't send someone elsewhere after signing in. */
export const safeNext = (v: string | null | undefined) => (v && /^\/(?![/\\])/.test(v) ? v : "/calendar");

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Verified locally against Supabase's public key; refreshes the session when it has expired.
  const { data } = await sb.auth.getClaims();
  const user = data?.claims?.sub ? data.claims : null;
  const path = request.nextUrl.pathname;
  const open = OPEN.some((p) => path === p || path.startsWith(p));
  if (!user && !open) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (user && (path === "/login" || path === "/signup")) {
    const url = new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url);
    return NextResponse.redirect(url);
  }
  return response;
}

// OAuth returns, API routes for jobs and static files skip the check.
export const config = {
  matcher: ["/((?!api/|integrations/|_next/|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
