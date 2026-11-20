import { readJson } from "@/lib/api/http";
import { partnerRoute } from "@/lib/api/partnerHttp";
import { partnerStore } from "@/lib/partner";
import { connectStore, partnerFinish } from "@/lib/partnerConnect";
import { pickConnect, pickOptions } from "@/lib/partnerConnectRules";

export const dynamic = "force-dynamic";

type P = { token: string };

/** The Pages or accounts a sign-in shared, to pick from: { network, options: [{ id, name, picture? }] }. */
export const GET = partnerRoute<P>(async ({ partner, params }) => ({ body: await pickOptions(partnerStore, connectStore, partner, params.token) }));

/** Connect the picked ones: { ids } -> { channels }. Once. */
export const POST = partnerRoute<P>(async ({ req, partner, params }) => ({ body: await pickConnect(partnerStore, connectStore, partner, params.token, await readJson(req), partnerFinish) }));
