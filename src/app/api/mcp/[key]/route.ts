import { mcpPost, notAllowed } from "@/lib/api/mcpRoute";

export const dynamic = "force-dynamic";

// The same server with the key in the link, for apps that take only a link (custom connectors).
export const POST = async (req: Request, { params }: { params: Promise<{ key: string }> }) => mcpPost(req, (await params).key);
export const GET = notAllowed;
export const DELETE = notAllowed;
