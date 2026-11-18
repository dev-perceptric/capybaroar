import { READS, type ReadName } from "@/lib/appReads";
import { readArgs } from "@/lib/readRules";

export const dynamic = "force-dynamic";

// GET /api/app/<name>?a=<JSON array of arguments>: one of the app's reads (src/lib/appReads.ts), signed in by cookie
// like any page. getCtx inside each read sends signed-out people to /login, which the browser sees as a failed read.
export async function GET(req: Request, { params }: { params: Promise<{ read: string }> }) {
  const { read } = await params;
  const fn = Object.hasOwn(READS, read) ? (READS[read as ReadName] as (...args: unknown[]) => Promise<unknown>) : null;
  if (!fn) return Response.json({ error: "Not found" }, { status: 404 });
  const args = readArgs(new URL(req.url).searchParams.get("a"));
  if (!args) return Response.json({ error: "Bad arguments" }, { status: 400 });
  return Response.json(await fn(...args), { headers: { "Cache-Control": "private, no-store" } });
}
