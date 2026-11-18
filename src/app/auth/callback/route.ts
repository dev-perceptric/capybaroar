import { NextResponse, type NextRequest } from "next/server";
import { userClient } from "@/lib/supabase/server";
import { safeNext } from "@/proxy";
import { audit } from "@/lib/audit";
import { trustedIp } from "@/lib/clientIp";
import { noteSignIn } from "@/lib/devices";
import { firstWorkspaceId } from "@/lib/mfa";
import { mfaGate, mfaNext, verifiedTotp } from "@/lib/mfaRules";
import { publicUrl } from "@/lib/publicUrl";

// Email links and Google sign-in come back here with a code to swap for a session. Someone with an authenticator app
// goes on to /mfa first: the code swap only reaches aal1.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // `next` brings people back to where they started, like an invite.
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  // Built on the public address: request.url is the container's own (http://[::]:3000).
  const to = publicUrl(next, request.headers);
  if (code) {
    const sb = await userClient();
    const { data, error } = await sb.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      to.pathname = "/login";
      to.search = "";
    } else {
      const { data: claims } = await sb.auth.getClaims();
      const c = claims?.claims;
      const gate = mfaGate({ aal: (c?.aal as string | undefined) ?? null, verified: verifiedTotp(data.user.factors).length > 0, required: false, next: mfaNext(next, safeNext) });
      if (gate) return NextResponse.redirect(publicUrl(gate, request.headers));
      const amr = Array.isArray(c?.amr) ? (c.amr as ({ method?: string } | string)[]) : [];
      const method = amr.map((a) => (typeof a === "string" ? a : a.method)).find(Boolean) ?? "link";
      await audit({ workspaceId: await firstWorkspaceId(data.user.id), actorId: data.user.id, actorLabel: data.user.email ?? null, action: "auth.sign_in", meta: { method: method === "oauth" ? "google" : method }, ip: trustedIp(request.headers) });
      // A password reset link isn't a new sign-in to warn about: the reset itself sends its own email.
      if (!next.startsWith("/reset")) await noteSignIn({ userId: data.user.id, email: data.user.email ?? null, ip: trustedIp(request.headers) });
    }
  }
  return NextResponse.redirect(to);
}
