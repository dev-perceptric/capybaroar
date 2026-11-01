import { createHash } from "node:crypto";
import { AuthError, PostError, call, form, isVideo, qs, sleep, type Account, type MediaFile, type Provider, type Secret } from "./types";

// X: OAuth 2.0 with PKCE (confidential client) and the v2 API for posts and media.
const API = "https://api.x.com/2";
const SCOPES = "tweet.read tweet.write users.read media.write offline.access";
const clientId = () => process.env.X_CLIENT_ID ?? "";
const clientSecret = () => process.env.X_CLIENT_SECRET ?? "";
const basic = () => `Basic ${Buffer.from(`${encodeURIComponent(clientId())}:${encodeURIComponent(clientSecret())}`).toString("base64")}`;
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const challenge = (verifier: string) => createHash("sha256").update(verifier).digest("base64url");

// Animated GIFs go through the chunked upload like videos, and count as the one video.
const isGif = (m: MediaFile) => m.mime === "image/gif";
const chunked = (m: MediaFile) => isVideo(m) || isGif(m);
const CHUNK = 4 * 1024 * 1024; // Verify: docs allow up to 5 MB per APPEND segment; 4 MB stays under it.

type Token = { access_token: string; expires_in: number; refresh_token?: string };

async function token(body: Record<string, string>, what: string) {
  return call<Token>(`${API}/oauth2/token`, { method: "POST", headers: { Authorization: basic() }, body: form(body) }, { what });
}

type Processing = { state: "pending" | "in_progress" | "succeeded" | "failed"; check_after_secs?: number; error?: { message?: string } };
type Media = { data: { id: string; processing_info?: Processing } };

async function uploadImage(tok: string, m: MediaFile) {
  const fd = new FormData();
  fd.append("media", new Blob([new Uint8Array(await m.bytes())], { type: m.mime }), m.name);
  fd.append("media_category", "tweet_image");
  // Verify: simple upload takes media_type alongside the file; sent for clarity.
  fd.append("media_type", m.mime);
  const r = await call<Media>(`${API}/media/upload`, { method: "POST", headers: bearer(tok), body: fd }, { what: "X image upload" });
  return r.data.id;
}

async function uploadChunked(tok: string, m: MediaFile) {
  const bytes = await m.bytes();
  const category = isGif(m) ? "tweet_gif" : "tweet_video";
  // Verify: dedicated initialize/append/finalize endpoints replaced the command= form of /2/media/upload in 2025.
  const init = await call<Media>(
    `${API}/media/upload/initialize`,
    { method: "POST", headers: { ...bearer(tok), "Content-Type": "application/json" }, body: JSON.stringify({ media_type: m.mime, total_bytes: bytes.length, media_category: category }) },
    { what: "X video upload" },
  );
  const id = init.data.id;
  for (let i = 0, seg = 0; i < bytes.length; i += CHUNK, seg++) {
    const fd = new FormData();
    fd.append("media", new Blob([new Uint8Array(bytes.subarray(i, i + CHUNK))], { type: "application/octet-stream" }), m.name);
    fd.append("segment_index", String(seg));
    await call(`${API}/media/upload/${id}/append`, { method: "POST", headers: bearer(tok), body: fd, signal: AbortSignal.timeout(120000) }, { what: "X video upload" });
  }
  const fin = await call<Media>(`${API}/media/upload/${id}/finalize`, { method: "POST", headers: bearer(tok) }, { what: "X video upload" });
  let info = fin.data.processing_info;
  for (let i = 0; info && info.state !== "succeeded"; i++) {
    if (info.state === "failed") throw new PostError(`X video processing failed: ${info.error?.message ?? "unknown error"}`);
    if (i >= 60) throw new Error("X video is still processing; will retry");
    await sleep(Math.min(Math.max(info.check_after_secs ?? 5, 1), 30) * 1000);
    const st = await call<Media>(`${API}/media/upload?${qs({ command: "STATUS", media_id: id })}`, { headers: bearer(tok) }, { what: "X video status" });
    info = st.data.processing_info;
  }
  return id;
}

/** Alt text is nice to have: a failure here leaves the picture without it. */
async function setAlt(tok: string, id: string, alt: string) {
  await call(
    `${API}/media/metadata`,
    { method: "POST", headers: { ...bearer(tok), "Content-Type": "application/json" }, body: JSON.stringify({ id, metadata: { alt_text: { text: alt.slice(0, 1000) } } }) },
    { what: "X alt text" },
  ).catch(() => null);
}

export const x: Provider = {
  network: "x",
  oauth: {
    configured: () => Boolean(clientId() && clientSecret()),
    // Verify: docs show both twitter.com and x.com for the authorize page; x.com is current.
    authUrl: ({ state, redirect, verifier }) =>
      `https://x.com/i/oauth2/authorize?${qs({
        response_type: "code",
        client_id: clientId(),
        redirect_uri: redirect,
        scope: SCOPES,
        state,
        code_challenge: challenge(verifier),
        code_challenge_method: "S256",
      })}`,
    exchange: async ({ code, redirect, verifier }): Promise<Account[]> => {
      const t = await token({ grant_type: "authorization_code", code, redirect_uri: redirect, code_verifier: verifier, client_id: clientId() }, "X sign-in");
      const me = await call<{ data: { id: string; name: string; username: string; profile_image_url?: string } }>(
        `${API}/users/me?${qs({ "user.fields": "profile_image_url" })}`,
        { headers: bearer(t.access_token) },
        { what: "X profile" },
      );
      return [
        {
          accountId: me.data.id,
          name: me.data.name,
          username: me.data.username,
          avatar: me.data.profile_image_url ?? null,
          accessToken: t.access_token,
          refreshToken: t.refresh_token ?? null,
          expiresAt: new Date(Date.now() + t.expires_in * 1000),
        },
      ];
    },
  },
  refresh: async (s: Secret) => {
    if (!s.refreshToken) throw new AuthError("X sign-in expired");
    // X rotates refresh tokens: the old one stops working once this succeeds.
    const t = await token({ grant_type: "refresh_token", refresh_token: s.refreshToken, client_id: clientId() }, "X refresh");
    return { accessToken: t.access_token, refreshToken: t.refresh_token ?? s.refreshToken, expiresAt: new Date(Date.now() + t.expires_in * 1000) };
  },
  check: (p) => {
    // Verify: X counts URLs as 23 and some scripts as 2; code points is the simple approximation.
    if ([...p.text].length > 280) return "X posts are up to 280 characters";
    const moving = p.media.filter(chunked);
    if (moving.length > 1 || (moving.length && p.media.length > 1)) return "X takes up to 4 pictures, or one video or GIF";
    if (p.media.length > 4) return "X takes up to 4 pictures";
    if (p.media.some((m) => !chunked(m) && m.size > 5 * 1024 * 1024)) return "X pictures must be under 5 MB";
    if (p.media.some((m) => isGif(m) && m.size > 15 * 1024 * 1024)) return "X GIFs must be under 15 MB";
    if (p.media.some((m) => isVideo(m) && m.size > 512 * 1024 * 1024)) return "X videos must be under 512 MB";
    if (!p.text.trim() && !p.media.length) return "X posts need text or media";
    return null;
  },
  publish: async (s, _accountId, p) => {
    const tok = s.accessToken;
    const ids: string[] = [];
    for (const m of p.media.slice(0, 4)) {
      const id = chunked(m) ? await uploadChunked(tok, m) : await uploadImage(tok, m);
      if (m.alt?.trim()) await setAlt(tok, id, m.alt.trim());
      ids.push(id);
    }
    const body: Record<string, unknown> = { text: p.text };
    if (ids.length) body.media = { media_ids: ids };
    const r = await call<{ data: { id: string } }>(`${API}/tweets`, { method: "POST", headers: { ...bearer(tok), "Content-Type": "application/json" }, body: JSON.stringify(body) }, { what: "X post" });
    return { id: r.data.id, url: `https://x.com/i/web/status/${r.data.id}` };
  },
  followers: async (s) => {
    const r = await call<{ data: { public_metrics?: { followers_count?: number } } }>(
      `${API}/users/me?${qs({ "user.fields": "public_metrics" })}`,
      { headers: bearer(s.accessToken) },
      { what: "X followers" },
    );
    return r.data.public_metrics?.followers_count ?? null;
  },
  postStats: async (s, _accountId, remoteId) => {
    type Metrics = { data?: { public_metrics?: Record<string, number>; non_public_metrics?: Record<string, number> }; errors?: unknown[] };
    const get = (fields: string) =>
      call<Metrics>(`${API}/tweets/${encodeURIComponent(remoteId)}?${qs({ "tweet.fields": fields })}`, { headers: bearer(s.accessToken) }, { what: "X post stats" });
    let r: Metrics;
    try {
      // non_public_metrics only works for the author's own recent posts (Verify: 30-day window).
      r = await get("public_metrics,non_public_metrics");
    } catch (e) {
      if (!(e instanceof PostError)) throw e;
      r = await get("public_metrics");
    }
    // A deleted post comes back as 200 with errors and no data.
    if (!r.data) return {};
    const pub = r.data.public_metrics ?? {};
    const priv = r.data.non_public_metrics ?? {};
    const n = (v: unknown) => (typeof v === "number" ? v : null);
    const sum = (a: unknown, b: unknown) => (n(a) == null && n(b) == null ? null : (n(a) ?? 0) + (n(b) ?? 0));
    return {
      impressions: n(pub.impression_count) ?? n(priv.impression_count),
      likes: n(pub.like_count),
      comments: n(pub.reply_count),
      shares: sum(pub.retweet_count, pub.quote_count),
      saves: n(pub.bookmark_count),
      clicks: sum(priv.url_link_clicks, priv.user_profile_clicks),
    };
  },
};
