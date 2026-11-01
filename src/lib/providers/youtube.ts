import { AuthError, PostError, call, form, isVideo, qs, type Account, type Provider, type Secret } from "./types";

// YouTube: Google sign-in (offline access) + YouTube Data API v3, resumable video upload from our server.
// Until Google audits the app, uploads from an unverified API project are locked to private.
const API = "https://www.googleapis.com/youtube/v3";
const UPLOAD = "https://www.googleapis.com/upload/youtube/v3";
const TOKEN = "https://oauth2.googleapis.com/token";
const id = () => process.env.YOUTUBE_CLIENT_ID ?? "";
const secret = () => process.env.YOUTUBE_CLIENT_SECRET ?? "";
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

type Channel = {
  id: string;
  snippet: { title: string; customUrl?: string; thumbnails?: { default?: { url?: string }; medium?: { url?: string } } };
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
};

/** Raw fetch for the upload steps (call() hides headers), with the same error mapping. */
async function send(url: string, init: RequestInit, what: string, timeout = 60000) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeout) });
  if (res.ok) return res;
  const msg = `${what}: ${res.status} ${(await res.text()).slice(0, 300)}`;
  if (res.status === 401) throw new AuthError(msg);
  if (res.status === 400 || res.status === 403 || res.status === 422) throw new PostError(msg);
  throw new Error(msg);
}

const tags = (s: string | undefined) =>
  (s ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

export const youtube: Provider = {
  network: "youtube",
  oauth: {
    configured: () => Boolean(id() && secret()),
    authUrl: ({ state, redirect }) =>
      `https://accounts.google.com/o/oauth2/v2/auth?${qs({
        client_id: id(),
        redirect_uri: redirect,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        state,
      })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const t = await call<{ access_token: string; expires_in: number; refresh_token?: string }>(
        TOKEN,
        { method: "POST", body: form({ grant_type: "authorization_code", code, redirect_uri: redirect, client_id: id(), client_secret: secret() }) },
        { what: "YouTube sign-in" },
      );
      const r = await call<{ items?: Channel[] }>(`${API}/channels?${qs({ part: "snippet,statistics", mine: "true" })}`, { headers: auth(t.access_token) }, { what: "YouTube channel" });
      if (!r.items?.length) throw new PostError("This Google account has no YouTube channel");
      return r.items.map((c) => ({
        accountId: c.id,
        name: c.snippet.title,
        username: c.snippet.customUrl ?? null,
        avatar: c.snippet.thumbnails?.medium?.url ?? c.snippet.thumbnails?.default?.url ?? null,
        accessToken: t.access_token,
        refreshToken: t.refresh_token ?? null,
        expiresAt: new Date(Date.now() + t.expires_in * 1000),
      }));
    },
  },
  refresh: (s) => googleRefresh(s, id(), secret(), "YouTube"),
  check: (p) => {
    if (p.media.length !== 1 || !isVideo(p.media[0])) return "YouTube needs exactly one video";
    const title = (p.settings.title ?? "").trim();
    if (!title) return "YouTube needs a title";
    if (title.length > 100) return "YouTube titles are up to 100 characters";
    if (/[<>]/.test(title) || /[<>]/.test(p.text)) return "YouTube titles and descriptions can't contain < or >";
    if (Buffer.byteLength(p.text, "utf8") > 5000) return "YouTube descriptions are up to 5,000 characters";
    return null;
  },
  publish: async (s, _channelId, p) => {
    const token = s.accessToken;
    const video = p.media[0];
    const bytes = await video.bytes();
    const init = await send(
      `${UPLOAD}/videos?${qs({ uploadType: "resumable", part: "snippet,status" })}`,
      {
        method: "POST",
        headers: { ...auth(token), "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Length": String(bytes.length), "X-Upload-Content-Type": video.mime },
        body: JSON.stringify({
          snippet: { title: (p.settings.title ?? "").trim().slice(0, 100), description: p.text, tags: tags(p.settings.tags) },
          status: { privacyStatus: p.settings.privacy || "public", selfDeclaredMadeForKids: p.settings.for_kids === "yes" },
        }),
      },
      "YouTube upload",
    );
    const location = init.headers.get("location");
    if (!location) throw new Error("YouTube upload: no upload address");
    // One PUT of the whole file; a failed upload restarts on retry (nothing is live until this returns).
    const put = await send(location, { method: "PUT", headers: { "Content-Type": video.mime, "Content-Length": String(bytes.length) }, body: new Uint8Array(bytes) }, "YouTube upload", 30 * 60000);
    const v = (await put.json()) as { id: string };
    // The video is live from here: report problems in `note`, never throw.
    // Shorts also open at /watch?v=, and the API doesn't say whether an upload became a Short.
    const out = { id: v.id, url: `https://www.youtube.com/watch?v=${v.id}`, note: null as string | null };
    if (p.cover) {
      try {
        const img = await p.cover.bytes();
        await send(`${UPLOAD}/thumbnails/set?${qs({ videoId: v.id })}`, { method: "POST", headers: { ...auth(token), "Content-Type": p.cover.mime }, body: new Uint8Array(img) }, "YouTube thumbnail");
      } catch (e) {
        out.note = `Thumbnail not set: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
    return out;
  },
  followers: async (s, channelId) => {
    const r = await call<{ items?: Channel[] }>(`${API}/channels?${qs({ part: "statistics", id: channelId })}`, { headers: auth(s.accessToken) }, { what: "YouTube subscribers" });
    const st = r.items?.[0]?.statistics;
    return st && !st.hiddenSubscriberCount && st.subscriberCount ? Number(st.subscriberCount) : null;
  },
};

/** Google's refresh: keeps the old refresh token (Google rarely sends a new one); a revoked grant means reconnect. */
export async function googleRefresh(s: Secret, clientId: string, clientSecret: string, name: string) {
  if (!s.refreshToken) throw new AuthError(`${name} sign-in expired`);
  try {
    const t = await call<{ access_token: string; expires_in: number; refresh_token?: string }>(
      TOKEN,
      { method: "POST", body: form({ grant_type: "refresh_token", refresh_token: s.refreshToken, client_id: clientId, client_secret: clientSecret }) },
      { what: `${name} refresh` },
    );
    return { accessToken: t.access_token, refreshToken: t.refresh_token ?? s.refreshToken, expiresAt: new Date(Date.now() + t.expires_in * 1000) };
  } catch (e) {
    // invalid_grant comes back as 400: the person revoked access or the token expired (7 days for apps in testing).
    if (e instanceof PostError) throw new AuthError(e.message);
    throw e;
  }
}
