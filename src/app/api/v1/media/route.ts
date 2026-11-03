import { readJson, route } from "@/lib/api/http";
import { mediaLink } from "@/lib/api/input";

export const dynamic = "force-dynamic";

export const GET = route(async ({ ops }) => ({ body: { media: await ops.media() } }));

/** Add a picture or video from a public link to the media library. */
export const POST = route(async ({ req, ops }) => {
  const m = mediaLink(await readJson(req));
  return { status: 201, body: { media: await ops.uploadFromLink(m.url, m.alt) } };
});
