import { route } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export const GET = route(async ({ ops }) => ({ body: { brands: await ops.brands() } }));
