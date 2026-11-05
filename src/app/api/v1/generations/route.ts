import { readJson, route } from "@/lib/api/http";
import { generationInput } from "@/lib/api/input";

export const dynamic = "force-dynamic";

/** Start an AI picture or video: {"kind": "image", "prompt": "..."}. Check it with GET /api/v1/generations/{id}. */
export const POST = route(async ({ req, ops }) => ({ status: 202, body: { generation: await ops.generate(generationInput(await readJson(req))) } }));
