import { AuthError, PostError, call, form, isVideo, qs, sleep, type Account, type PostStats, type Provider } from "./types";

// TikTok: Login Kit + Content Posting API (Direct Post), video upload from our server.
// Who can watch is the person's choice (TikTok requires it); until TikTok audits the app only "Only me" is offered.
const API = "https://open.tiktokapis.com/v2";
const key = () => process.env.TIKTOK_CLIENT_ID ?? "";
const secret = () => process.env.TIKTOK_CLIENT_SECRET ?? "";
const json = (token: string) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" });

type TT<T> = { data: T; error: { code: string; message: string } };
async function tt<T>(url: string, init: RequestInit, what: string): Promise<T> {
  const r = await call<TT<T>>(url, init, { what });
  if (r.error && r.error.code !== "ok") {
    if (r.error.code === "access_token_invalid" || r.error.code === "scope_not_authorized") throw new AuthError(`${what}: ${r.error.message}`);
    throw new PostError(`${what}: ${r.error.message}`);
  }
  return r.data;
}

const CHUNK = 10 * 1024 * 1024;

export const tiktok: Provider = {
  network: "tiktok",
  oauth: {
    configured: () => Boolean(key() && secret()),
    authUrl: ({ state, redirect }) =>
      `https://www.tiktok.com/v2/auth/authorize/?${qs({ client_key: key(), response_type: "code", scope: "user.info.basic,user.info.profile,user.info.stats,video.list,video.upload,video.publish", redirect_uri: redirect, state })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const t = await call<{ access_token: string; expires_in: number; refresh_token: string; open_id: string }>(
        `${API}/oauth/token/`,
        { method: "POST", body: form({ client_key: key(), client_secret: secret(), code, grant_type: "authorization_code", redirect_uri: redirect }) },
        { what: "TikTok sign-in" },
      );
      const u = await tt<{ user: { open_id: string; display_name: string; username?: string; avatar_url?: string } }>(
        `${API}/user/info/?fields=open_id,display_name,username,avatar_url`,
        { headers: { Authorization: `Bearer ${t.access_token}` } },
        "TikTok profile",
      );
      return [
        {
          accountId: t.open_id,
          name: u.user.display_name,
          username: u.user.username ?? null,
          avatar: u.user.avatar_url ?? null,
          accessToken: t.access_token,
          refreshToken: t.refresh_token,
          expiresAt: new Date(Date.now() + t.expires_in * 1000),
        },
      ];
    },
  },
  refresh: async (s) => {
    if (!s.refreshToken) throw new AuthError("TikTok sign-in expired");
    const t = await call<{ access_token?: string; expires_in?: number; refresh_token?: string; error?: string; error_description?: string }>(
      `${API}/oauth/token/`,
      { method: "POST", body: form({ client_key: key(), client_secret: secret(), grant_type: "refresh_token", refresh_token: s.refreshToken }) },
      { what: "TikTok refresh" },
    );
    if (!t.access_token) throw new AuthError(`TikTok refresh: ${t.error_description ?? t.error}`);
    return { accessToken: t.access_token, refreshToken: t.refresh_token ?? s.refreshToken, expiresAt: new Date(Date.now() + (t.expires_in ?? 86400) * 1000) };
  },
  check: (p) => (p.media.length !== 1 || !isVideo(p.media[0]) ? "TikTok needs exactly one video" : p.text.length > 2200 ? "TikTok captions are up to 2,200 characters" : null),
  publish: async (s, _openId, p) => {
    const token = s.accessToken;
    const video = p.media[0];
    const creator = await tt<{ privacy_level_options: string[] }>(`${API}/post/publish/creator_info/query/`, { method: "POST", headers: json(token) }, "TikTok account");
    const privacy = p.settings.privacy;
    if (!privacy) throw new PostError("Choose who can watch this TikTok");
    if (!creator.privacy_level_options.includes(privacy)) throw new PostError(`This TikTok account can only post as: ${creator.privacy_level_options.join(", ")}`);
    const bytes = await video.bytes();
    const size = bytes.length;
    const chunk = size <= CHUNK * 2 ? size : CHUNK;
    const count = Math.floor(size / chunk);
    const init = await tt<{ publish_id: string; upload_url: string }>(
      `${API}/post/publish/video/init/`,
      {
        method: "POST",
        headers: json(token),
        body: JSON.stringify({
          post_info: { title: p.text, privacy_level: privacy, disable_comment: p.settings.comments === "off", disable_duet: false, disable_stitch: false },
          source_info: { source: "FILE_UPLOAD", video_size: size, chunk_size: chunk, total_chunk_count: count },
        }),
      },
      "TikTok upload",
    );
    for (let i = 0; i < count; i++) {
      const start = i * chunk;
      const end = i === count - 1 ? size : start + chunk;
      const put = await fetch(init.upload_url, {
        method: "PUT",
        headers: { "Content-Type": video.mime, "Content-Length": String(end - start), "Content-Range": `bytes ${start}-${end - 1}/${size}` },
        body: new Uint8Array(bytes.subarray(start, end)),
        signal: AbortSignal.timeout(300000),
      });
      if (!put.ok) throw new Error(`TikTok upload: ${put.status}`);
    }
    for (let i = 0; i < 60; i++) {
      const st = await tt<{ status: string; fail_reason?: string; publicaly_available_post_id?: (string | number)[] }>(
        `${API}/post/publish/status/fetch/`,
        { method: "POST", headers: json(token), body: JSON.stringify({ publish_id: init.publish_id }) },
        "TikTok status",
      );
      if (st.status === "PUBLISH_COMPLETE") {
        const postId = st.publicaly_available_post_id?.[0];
        return { id: postId ? String(postId) : init.publish_id, url: null };
      }
      if (st.status === "FAILED") throw new PostError(`TikTok: ${st.fail_reason ?? "publish failed"}`);
      await sleep(5000);
    }
    // Uploaded and processing: TikTok finishes on its side, so don't upload again.
    return { id: init.publish_id, url: null };
  },
  followers: async (s) => {
    const u = await tt<{ user: { follower_count?: number } }>(`${API}/user/info/?fields=follower_count`, { headers: { Authorization: `Bearer ${s.accessToken}` } }, "TikTok followers");
    return u.user.follower_count ?? null;
  },
  postStats: async (s, _openId, remoteId) => {
    type Video = { id: string; view_count?: number; like_count?: number; comment_count?: number; share_count?: number };
    try {
      // A publish_id (when TikTok gave no post id) matches no video, so it comes back empty: {}.
      const r = await tt<{ videos?: Video[] }>(
        `${API}/video/query/?fields=id,view_count,like_count,comment_count,share_count`,
        { method: "POST", headers: json(s.accessToken), body: JSON.stringify({ filters: { video_ids: [remoteId] } }) },
        "TikTok post stats",
      );
      const v = r.videos?.find((x) => String(x.id) === remoteId) ?? r.videos?.[0];
      if (!v) return {};
      const out: PostStats = { views: v.view_count, likes: v.like_count, comments: v.comment_count, shares: v.share_count };
      return Object.fromEntries(Object.entries(out).filter(([, x]) => typeof x === "number")) as PostStats;
    } catch (e) {
      if (e instanceof PostError || (e instanceof Error && /not found|404/i.test(e.message) && !(e instanceof AuthError))) return {};
      throw e;
    }
  },
};
