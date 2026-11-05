import { route } from "@/lib/api/http";
import { id } from "@/lib/api/input";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async ({ ops, params }) => ({ body: { generation: await ops.generation(id(params.id)) } }));
