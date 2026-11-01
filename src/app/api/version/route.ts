export const dynamic = "force-dynamic";

/** The running build, so tabs opened before an update can tell they're stale. */
export function GET() {
  return Response.json({ build: process.env.NEXT_PUBLIC_BUILD ?? "" }, { headers: { "Cache-Control": "no-store" } });
}
