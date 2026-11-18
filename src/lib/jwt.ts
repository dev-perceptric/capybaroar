// The signed-in person's claims, checked here instead of asking Supabase Auth on every request.
//
// Supabase Auth signs sessions with HS256 (the JWT_SECRET of the Supabase install). For that kind of token,
// sb.auth.getClaims() can't check the signature itself and calls Supabase Auth's /user over the network; the proxy and
// getCtx both did that on every page, prefetch and server action. With SUPABASE_JWT_SECRET set to the same secret,
// the signature and expiry are checked here with Web Crypto (no network). Anything this check can't vouch for (no
// secret, another algorithm, a signature that doesn't match, an expired token) goes the old way through getClaims, so
// a wrong or missing secret only loses the speed, never signs anyone out.
//
// One difference: a token stays good until it expires (JWT_EXPIRY, 1 hour by default) even if its session was ended
// elsewhere, the same as Supabase's own local check with signing keys.

import type { SupabaseClient } from "@supabase/supabase-js";

type Claims = { sub?: string; exp?: number; [k: string]: unknown };
type Verdict = { ok: true; claims: Claims } | { ok: false; reason: "format" | "alg" | "signature" | "expired" };

const b64urlBytes = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "="));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const json = (s: string) => JSON.parse(new TextDecoder().decode(b64urlBytes(s))) as Record<string, unknown>;

const keys = new Map<string, Promise<CryptoKey>>();
const keyFor = (secret: string) => {
  let k = keys.get(secret);
  if (!k) keys.set(secret, (k = crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"])));
  return k;
};

/** Checks an HS256 token's signature and expiry. Pure but for Web Crypto, so tests/jwt.test.ts runs it. */
export async function verifyHs256(token: string, secret: string, now = Date.now()): Promise<Verdict> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "format" };
  let header: Record<string, unknown>;
  let claims: Claims;
  try {
    header = json(parts[0]);
    claims = json(parts[1]) as Claims;
  } catch {
    return { ok: false, reason: "format" };
  }
  if (header.alg !== "HS256") return { ok: false, reason: "alg" };
  let good = false;
  try {
    good = await crypto.subtle.verify("HMAC", await keyFor(secret), b64urlBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  } catch {
    good = false;
  }
  if (!good) return { ok: false, reason: "signature" };
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= now) return { ok: false, reason: "expired" };
  return { ok: true, claims };
}

type AuthLike = { auth: Pick<SupabaseClient["auth"], "getSession" | "getClaims"> };

let warned = false;

/** The session's claims, or null when signed out. getSession refreshes an expiring session first (cookies). */
export async function sessionClaims(sb: AuthLike): Promise<Claims | null> {
  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  if (secret) {
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    const v = await verifyHs256(token, secret);
    if (v.ok && v.claims.sub) return v.claims;
    if (!v.ok && v.reason === "signature" && !warned) {
      warned = true;
      console.error("auth: SUPABASE_JWT_SECRET doesn't match Supabase Auth's JWT_SECRET; checking sessions over the network instead");
    }
  }
  const { data } = await sb.auth.getClaims();
  return data?.claims?.sub ? (data.claims as Claims) : null;
}
