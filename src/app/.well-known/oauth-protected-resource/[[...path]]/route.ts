import { appUrl } from "@/lib/channels";
import { protectedResource } from "@/lib/oauth/rules";
import { oauthJson, preflight } from "@/lib/oauth/http";

export const dynamic = "force-dynamic";

// RFC 9728: the MCP server and the authorization server that signs people in for it. Served at the plain address and
// with the resource's path after it (/.well-known/oauth-protected-resource/api/mcp).
export const GET = () => oauthJson(protectedResource(appUrl()));
export const OPTIONS = preflight;
