// The visitor's IP for limits (sign-in tries, sign-ups, app registration), read only from a header our own proxy sets.
// Pure, so tests/redirect.test.ts checks it.
// - CLIENT_IP_HEADER names the header when it's set (for a proxy we don't know).
// - On Fly (FLY_APP_NAME is set), Fly-Client-IP: Fly's edge writes it and visitors can't.
// - Elsewhere (Caddy on the VPS), X-Real-IP, then the last X-Forwarded-For address (the one our proxy added). The
//   first X-Forwarded-For address is whatever the visitor sent, so it's never used.

type Headers = { get(name: string): string | null };

const clean = (v: string | null | undefined) => (v ?? "").trim().slice(0, 64);

export function trustedIp(h: Headers, env: Record<string, string | undefined> = process.env): string {
  const named = env.CLIENT_IP_HEADER?.trim().toLowerCase();
  if (named) return clean(h.get(named)?.split(",")[0]);
  if (env.FLY_APP_NAME) return clean(h.get("fly-client-ip"));
  const real = clean(h.get("x-real-ip"));
  if (real) return real;
  const hops = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return clean(hops.at(-1));
}
