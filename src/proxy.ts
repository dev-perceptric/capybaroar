import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Keeps the Supabase session fresh and sends signed-out people to /login. Invites, review links, report links and
// link-in-bio pages open signed out. /mfa and /mfa/setup need a session at any level; getCtx (src/lib/session.ts)
// decides who has to go there.
const OPEN = ["/login", "/signup", "/reset", "/auth/", "/l/", "/invite/", "/review/", "/r/", "/b/", "/.well-known/"];

const HOME = "/calendar";
const site = () => process.env.APP_URL || "http://localhost:3000";

/** Only paths on this site, so a link can't send someone elsewhere after signing in. Browsers drop tabs and line
 * breaks from addresses and read "\\" as "/", so "/\t/evil.com" would leave: anything with those is refused, and
 * what's left must resolve to this site's own origin. */
export function safeNext(v: string | null | undefined): string {
  if (!v || v.length > 2000 || !v.startsWith("/") || /[\u0000-\u0020\u007f-\u009f\\]/.test(v) || /^\/[/\\]/.test(v)) return HOME;
  // Encoded slashes and backslashes right after the first one ("/%2F/evil.com") read as another site in some places.
  if (/^\/%(2f|5c)/i.test(v)) return HOME;
  try {
    const base = new URL(site());
    const u = new URL(v, base);
    if (u.origin !== base.origin) return HOME;
    return u.pathname + u.search + u.hash;
  } catch {
    return HOME;
  }
}

/** Set on every request the proxy sees (PATH_HEADER in src/lib/session.ts), replacing any a visitor sent: the path
 *  being opened, so the two-factor step in getCtx can bring people back to it. */
const PATH_HEADER = "x-cb-path";

export async function proxy(request: NextRequest) {
  request.headers.set(PATH_HEADER, request.nextUrl.pathname + request.nextUrl.search);
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
    // An app's sign-in request (OAuth) comes back here after logging in, with all its parameters.
    url.search = path === "/oauth/authorize" ? `?next=${encodeURIComponent(path + request.nextUrl.search)}` : "";
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
