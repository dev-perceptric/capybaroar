import { mcpPost, notAllowed } from "@/lib/api/mcpRoute";

export const dynamic = "force-dynamic";

export const POST = (req: Request) => mcpPost(req);
export const GET = notAllowed;
export const DELETE = notAllowed;
