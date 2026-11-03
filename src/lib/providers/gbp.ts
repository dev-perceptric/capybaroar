import { PostError, call, form, isVideo, qs, type Account, type Provider } from "./types";
import { googleRefresh } from "./youtube";

// Google Business Profile: Google sign-in + Account Management / Business Information APIs to list locations,
// and the v4 localPosts API to post. Google must approve the project for Business Profile API access first.
const id = () => process.env.GOOGLE_GMB_CLIENT_ID ?? "";
const secret = () => process.env.GOOGLE_GMB_CLIENT_SECRET ?? "";
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

type Paged<K extends string, T> = { [k in K]?: T[] } & { nextPageToken?: string };

async function all<K extends string, T>(base: string, key: K, token: string, params: Record<string, string>, what: string) {
  const out: T[] = [];
  let page = "";
  do {
    const r = await call<Paged<K, T>>(`${base}?${qs({ ...params, ...(page ? { pageToken: page } : {}) })}`, { headers: auth(token) }, { what });
    out.push(...((r[key] as T[] | undefined) ?? []));
    page = r.nextPageToken ?? "";
  } while (page);
  return out;
}

export const gbp: Provider = {
  network: "gbp",
  oauth: {
    configured: () => Boolean(id() && secret()),
    authUrl: ({ state, redirect }) =>
      `https://accounts.google.com/o/oauth2/v2/auth?${qs({
        client_id: id(),
        redirect_uri: redirect,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.profile",
        access_type: "offline",
        prompt: "consent",
        state,
      })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const t = await call<{ access_token: string; expires_in: number; refresh_token?: string }>(
        "https://oauth2.googleapis.com/token",
        { method: "POST", body: form({ grant_type: "authorization_code", code, redirect_uri: redirect, client_id: id(), client_secret: secret() }) },
        { what: "Google Business sign-in" },
      );
      const accounts = await all<"accounts", { name: string; accountName?: string }>(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        "accounts",
        t.access_token,
        { pageSize: "20" },
        "Google Business accounts",
      );
      const out: Account[] = [];
      for (const a of accounts) {
        const locations = await all<"locations", { name: string; title?: string }>(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${a.name}/locations`,
          "locations",
          t.access_token,
          { readMask: "name,title", pageSize: "100" },
          "Google Business locations",
        );
        for (const l of locations) {
          // a.name is "accounts/{a}", l.name is "locations/{l}"; the v4 localPosts parent needs both.
          out.push({
            accountId: `${a.name}/${l.name}`,
            name: l.title || a.accountName || l.name,
            accessToken: t.access_token,
            refreshToken: t.refresh_token ?? null,
            expiresAt: new Date(Date.now() + t.expires_in * 1000),
          });
        }
      }
      if (!out.length) throw new PostError("This Google account doesn't manage any Business Profile");
      return out;
    },
  },
  refresh: (s) => googleRefresh(s, id(), secret(), "Google Business"),
  check: (p) => (p.text.length > 1500 ? "Google Business posts are up to 1,500 characters" : p.media.some(isVideo) ? "Google Business posts take pictures only" : null),
  publish: async (s, accountId, p) => {
    const image = p.media.find((m) => !isVideo(m));
    // Google fetches sourceUrl when the post is created, so the 1-hour signed link is enough.
    const r = await call<{ name: string; searchUrl?: string }>(
      `https://mybusiness.googleapis.com/v4/${accountId}/localPosts`,
      {
        method: "POST",
        headers: { ...auth(s.accessToken), "Content-Type": "application/json" },
        body: JSON.stringify({
          languageCode: "en",
          summary: p.text,
          topicType: "STANDARD",
          ...(image ? { media: [{ mediaFormat: "PHOTO", sourceUrl: image.url }] } : {}),
        }),
      },
      { what: "Google Business post" },
    );
    return { id: r.name, url: r.searchUrl ?? null };
  },
  unpublishable: (_s, r) => (/^accounts\/[^/]+\/locations\/[^/]+\/localPosts\/[^/]+$/.test(r.id) ? null : "Capybaroar didn't keep this post's id"),
  unpublish: async (s, _accountId, r) => {
    // The name keeps its slashes: it is the path.
    await call(`https://mybusiness.googleapis.com/v4/${r.id}`, { method: "DELETE", headers: auth(s.accessToken) }, { what: "Google Business delete" });
  },
};
