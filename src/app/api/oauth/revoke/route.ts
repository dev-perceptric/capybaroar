import { revokeToken } from "@/lib/oauth/store";
import { formOf, oauthJson, preflight } from "@/lib/oauth/http";

export const dynamic = "force-dynamic";

// RFC 7009: an app signing out. Always 200, even for tokens we don't know.
export async function POST(req: Request) {
  const f = await formOf(req);
  try {
    await revokeToken(f.token ?? "");
  } catch {
    // Revoking is best effort for the caller; the person can also remove the app in Settings.
  }
  return oauthJson({});
}
export const OPTIONS = preflight;
