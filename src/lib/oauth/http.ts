import "server-only";

// Answers for the OAuth endpoints. They're called by apps' servers and by browser-based MCP tools (like the MCP
// Inspector), so they allow any origin: none of them uses cookies.
export const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type, authorization, mcp-protocol-version" };

export const oauthJson = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS, ...extra } });

export const preflight = () => new Response(null, { status: 204, headers: CORS });

/** The request's fields, from a form body (what OAuth sends) or JSON. */
export async function formOf(req: Request): Promise<Record<string, string>> {
  const type = req.headers.get("content-type") ?? "";
  const text = (await req.text()).slice(0, 20000);
  if (type.includes("application/json")) {
    try {
      const o = JSON.parse(text) as Record<string, unknown>;
      return Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === "string")) as Record<string, string>;
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(text));
}
