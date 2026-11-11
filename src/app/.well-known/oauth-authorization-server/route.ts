import { appUrl } from "@/lib/channels";
import { authorizationServer } from "@/lib/oauth/rules";
import { oauthJson, preflight } from "@/lib/oauth/http";

export const dynamic = "force-dynamic";

// RFC 8414: where to register, sign in and get tokens for the MCP server.
export const GET = () => oauthJson(authorizationServer(appUrl()));
export const OPTIONS = preflight;
