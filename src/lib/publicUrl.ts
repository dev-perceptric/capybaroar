// The address people reach the app at, for redirects. Inside the container the server listens on HOSTNAME=::
// (Dockerfile), so request.url reads "http://[::]:3000/..." and a redirect built from it sends the browser somewhere it
// can't open. APP_URL comes first; without it, the Host the proxy passed on. Pure, so tests/redirect.test.ts runs it.

type Headers = { get(name: string): string | null };

/** A host a browser can open: a name or bracketed IPv6 with an optional port, never a bind-all address. */
const HOST = /^(?:[a-z0-9-]+(?:\.[a-z0-9-]+)*|\[[0-9a-f:.]+\])(?::\d{1,5})?$/i;
const BIND_ALL = /^(?:\[::\]|0\.0\.0\.0)(?::\d+)?$/;

export function publicOrigin(h: Headers, env: Record<string, string | undefined> = process.env): string {
  const app = env.APP_URL?.trim();
  if (app) {
    try {
      return new URL(app).origin;
    } catch {
      // A broken APP_URL: fall through to the headers.
    }
  }
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase();
  const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim() === "http" ? "http" : "https";
  if (host && HOST.test(host) && !BIND_ALL.test(host)) return `${proto}://${host}`;
  return "http://localhost:3000";
}

/** `path` on the public address. */
export const publicUrl = (path: string, h: Headers, env: Record<string, string | undefined> = process.env) => new URL(path, publicOrigin(h, env));
