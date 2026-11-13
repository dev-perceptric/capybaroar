import { AuthError, PostError, call, form, isVideo, qs, type Account, type Provider, type Secret } from "./types";

// Reddit: OAuth (permanent) + the oauth.reddit.com API. Reddit blocks requests without a descriptive User-Agent.
const API = "https://oauth.reddit.com";
const UA = "web:capybaroar:1.0 (by /u/capybaroar)";
const id = () => process.env.REDDIT_CLIENT_ID ?? "";
const secret = () => process.env.REDDIT_CLIENT_SECRET ?? "";
const basic = () => `Basic ${Buffer.from(`${id()}:${secret()}`).toString("base64")}`;
const auth = (token: string) => ({ Authorization: `Bearer ${token}`, "User-Agent": UA });

type Token = { access_token?: string; expires_in?: number; refresh_token?: string; scope?: string; error?: string; message?: string };
type Me = { name: string; icon_img?: string; subreddit?: { title?: string; subscribers?: number } | null };

// Reddit can answer a bad grant with 200 and { error }, so check for the token itself.
async function token(body: Record<string, string>, what: string) {
  const t = await call<Token>("https://www.reddit.com/api/v1/access_token", { method: "POST", headers: { Authorization: basic(), "User-Agent": UA }, body: form(body) }, { what });
  if (!t.access_token) throw new AuthError(`${what}: ${t.message ?? t.error ?? "no token"}`);
  return t as Token & { access_token: string };
}

const expires = (t: Token) => new Date(Date.now() + (t.expires_in ?? 3600) * 1000);
const strip = (u?: string | null) => (u ? u.split("?")[0].replace(/&amp;/g, "&") : null);
const sub = (s: string) => s.trim().replace(/^\/?r\//i, "");

type Errors = [string, string, string?][];

/** Reddit's api_type=json errors. RATELIMIT ("you are doing that too much") clears by itself, so it's retried. */
function refused(errors: Errors | undefined, what: string) {
  if (!errors?.length) return;
  const msg = errors.map((e) => e[1] || e[0]).join("; ");
  if (errors.some((e) => e[0] === "RATELIMIT")) throw new Error(`${what}: ${msg}`);
  throw new PostError(`${what}: ${msg}`);
}

const hasEdit = (s: Secret) => Array.isArray(s.extra.scopes) && (s.extra.scopes as unknown[]).includes("edit");

export const reddit: Provider = {
  network: "reddit",
  oauth: {
    configured: () => Boolean(id() && secret()),
    authUrl: ({ state, redirect }) =>
      `https://www.reddit.com/api/v1/authorize?${qs({ client_id: id(), response_type: "code", state, redirect_uri: redirect, duration: "permanent", scope: "identity submit read flair edit" })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const t = await token({ grant_type: "authorization_code", code, redirect_uri: redirect }, "Reddit sign-in");
      const me = await call<Me>(`${API}/api/v1/me`, { headers: auth(t.access_token) }, { what: "Reddit profile" });
      return [
        {
          accountId: me.name,
          name: me.name,
          username: me.name,
          avatar: strip(me.icon_img),
          accessToken: t.access_token,
          refreshToken: t.refresh_token ?? null,
          expiresAt: expires(t),
          // What was granted: deleting needs "edit", which channels connected before it was asked for don't have.
          extra: { scopes: (t.scope ?? "").split(/[\s,]+/).filter(Boolean) },
        },
      ];
    },
  },
  refresh: async (s: Secret) => {
    if (!s.refreshToken) throw new AuthError("Reddit sign-in expired");
    try {
      const t = await token({ grant_type: "refresh_token", refresh_token: s.refreshToken }, "Reddit refresh");
      return { accessToken: t.access_token, refreshToken: t.refresh_token ?? s.refreshToken, expiresAt: expires(t) };
    } catch (e) {
      if (e instanceof PostError) throw new AuthError(e.message);
      throw e;
    }
  },
  // POST /api/v1/revoke_token with the app's Basic auth. Ending the refresh token ends its access tokens too.
  revoke: async (s: Secret) => {
    const [tok, hint] = s.refreshToken ? [s.refreshToken, "refresh_token"] : [s.accessToken, "access_token"];
    await call("https://www.reddit.com/api/v1/revoke_token", { method: "POST", headers: { Authorization: basic(), "User-Agent": UA }, body: form({ token: tok, token_type_hint: hint }) }, { what: "Reddit disconnect" });
  },
  check: (p) => {
    if (!sub(p.settings.subreddit ?? "")) return "Reddit needs a subreddit";
    const title = (p.settings.title ?? "").trim();
    if (!title) return "Reddit needs a title";
    if (title.length > 300) return "Reddit titles are up to 300 characters";
    if (p.media.some(isVideo)) return "Reddit videos aren't supported yet";
    if (p.media.length > 1) return "Reddit takes at most one picture";
    return null;
  },
  publish: async (s, _name, p) => {
    const image = p.media[0];
    // A picture goes out as a link post to its address for now; native upload (/api/media/asset.json, kind=image)
    // is a later step. The signed link expires after an hour, so the picture stops loading after that.
    const body: Record<string, string> = {
      api_type: "json",
      sr: sub(p.settings.subreddit ?? ""),
      title: (p.settings.title ?? "").trim().slice(0, 300),
      resubmit: "true",
      ...(image ? { kind: "link", url: image.url } : { kind: "self", text: p.text }),
    };
    const r = await call<{ json: { errors?: Errors; data?: { id?: string; name?: string; url?: string } } }>(
      `${API}/api/submit`,
      { method: "POST", headers: auth(s.accessToken), body: form(body) },
      { what: "Reddit post" },
    );
    refused(r.json?.errors, "Reddit post");
    const d = r.json?.data;
    if (!d?.name) throw new Error("Reddit post: no post id in the answer");
    // Verify: data.url is the post's comments page for self posts; for link posts it may be the linked address.
    return { id: d.name, url: d.url ?? null };
  },
  followers: async (s) => (await call<Me>(`${API}/api/v1/me`, { headers: auth(s.accessToken) }, { what: "Reddit followers" })).subreddit?.subscribers ?? null,
  postStats: async (s, _accountId, remoteId) => {
    type Info = { data?: { children?: { data?: { score?: number; num_comments?: number } }[] } };
    const r = await call<Info>(`${API}/api/info?${qs({ id: remoteId })}`, { headers: auth(s.accessToken) }, { what: "Reddit post stats" });
    const d = r.data?.children?.[0]?.data;
    if (!d) return {};
    // score is upvotes minus downvotes (fuzzed by Reddit), not a raw like count.
    return { likes: d.score ?? null, comments: d.num_comments ?? null };
  },
  unpublishable: (s, r) => {
    if (!/^t3_\w+$/.test(r.id)) return "Capybaroar didn't keep this post's id";
    return hasEdit(s) ? null : "Reconnect Reddit to delete from here";
  },
  // POST /api/editusertext (scope "edit"): only a text (self) post's body. The title can't change, and a picture went
  // out as a link post, which has no text.
  edit: async (s, _name, r, p) => {
    if (!/^t3_\w+$/.test(r.id)) throw new PostError("Capybaroar didn't keep this post's id");
    if (!hasEdit(s)) throw new PostError("Reconnect Reddit to edit from here");
    if (r.media) throw new PostError("Reddit can't change the text of a link post");
    if (p.text.length > 40000) throw new PostError("Reddit posts are up to 40,000 characters");
    const res = await call<{ json?: { errors?: Errors } }>(`${API}/api/editusertext`, { method: "POST", headers: auth(s.accessToken), body: form({ api_type: "json", thing_id: r.id, text: p.text }) }, { what: "Reddit edit" });
    refused(res?.json?.errors, "Reddit edit");
  },
  // POST /api/del with the post's fullname (scope "edit"). A post that's already deleted answers 200 too.
  unpublish: async (s, _name, r) => {
    await call(`${API}/api/del`, { method: "POST", headers: auth(s.accessToken), body: form({ id: r.id }) }, { what: "Reddit delete" });
  },
};
