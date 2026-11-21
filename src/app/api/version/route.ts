export const dynamic = "force-dynamic";

/** The running build, so tabs opened before an update can tell they're stale, and the commit it was built from, so a
 * deploy can check it went live (build-images.yml). */
export function GET() {
  return Response.json(
    { build: process.env.NEXT_PUBLIC_BUILD ?? "", commit: process.env.GIT_COMMIT ?? "" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
