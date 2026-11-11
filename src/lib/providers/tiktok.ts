import { AuthError, PostError, call, isVideo, qs, sleep, type Account, type MediaFile, type Provider, type Publishable } from "./types";

// TikTok: Login Kit + Content Posting API (Direct Post), video upload from our server. Scopes stay at what the
// composer and publisher use (user.info.basic, user.info.profile for the username and post links, video.publish)
// until TikTok audits the app.
// Who can watch is the person's choice (TikTok requires it); until TikTok audits the app only "Only me" is offered.
const API = "https://open.tiktokapis.com/v2";
const key = () => process.env.TIKTOK_CLIENT_ID ?? "";
const secret = () => process.env.TIKTOK_CLIENT_SECRET ?? "";
const json = (token: string) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" });

type TT<T> = { data: T; error: { code: string; message: string } };
// TikTok's own message for these is a link to its guidelines, so say what to do instead.
const PLAIN: Record<string, string> = {
  unaudited_client_can_only_post_to_private_accounts: "Until TikTok approves Capybaroar, set the TikTok account to private and post as Only me",
  privacy_level_option_mismatch: "This TikTok account can't post with that Who can watch choice. Pick another",
  spam_risk_too_many_posts: "TikTok's daily post limit for this account is reached. Try again tomorrow",
  spam_risk_user_banned_from_posting: "TikTok has blocked this account from posting for now",
  reached_active_user_cap: "TikTok's daily limit for apps like Capybaroar is reached. Try again later",
  url_ownership_unverified: "TikTok needs the media website verified first",
};
async function tt<T>(url: string, init: RequestInit, what: string): Promise<T> {
  const r = await call<TT<T>>(url, init, { what });
  if (r.error && r.error.code !== "ok") {
    if (r.error.code === "access_token_invalid" || r.error.code === "scope_not_authorized") throw new AuthError(`${what}: ${r.error.message}`);
    throw new PostError(`${what}: ${PLAIN[r.error.code] ?? `${r.error.message} (${r.error.code})`}`);
  }
  return r.data;
}

const CHUNK = 10 * 1024 * 1024;
// TikTok's token endpoint rejects "application/x-www-form-urlencoded;charset=UTF-8" (what fetch sends for a
// URLSearchParams body) as malformed, so the type is set exactly and the body sent as a string.
const tokenRequest = (o: Record<string, string>): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" }, body: qs(o) });

/** What TikTok lets this account post right now (Direct Post creator_info). The composer shows it before posting. */
export type CreatorInfo = {
  nickname: string;
  avatar: string | null;
  privacy: string[];
  commentOff: boolean;
  duetOff: boolean;
  stitchOff: boolean;
  maxSeconds: number | null;
};
export async function creatorInfo(token: string): Promise<CreatorInfo> {
  const c = await tt<{
    creator_nickname?: string;
    creator_avatar_url?: string;
    privacy_level_options: string[];
    comment_disabled?: boolean;
    duet_disabled?: boolean;
    stitch_disabled?: boolean;
    max_video_post_duration_sec?: number;
  }>(`${API}/post/publish/creator_info/query/`, { method: "POST", headers: json(token) }, "TikTok account");
  return {
    nickname: c.creator_nickname ?? "",
    avatar: c.creator_avatar_url ?? null,
    privacy: c.privacy_level_options ?? [],
    commentOff: Boolean(c.comment_disabled),
    duetOff: Boolean(c.duet_disabled),
    stitchOff: Boolean(c.stitch_disabled),
    maxSeconds: c.max_video_post_duration_sec ?? null,
  };
}

/** The post's address: the video when TikTok gives its id (public posts), else the profile, where private posts show
 *  for their owner. Never throws: the post is already live. */
async function postLink(token: string, postId: string | null): Promise<string | null> {
  try {
    const u = await tt<{ user: { username?: string } }>(`${API}/user/info/?fields=username`, { headers: { Authorization: `Bearer ${token}` } }, "TikTok profile");
    const name = u.user.username;
    if (!name) return null;
    return postId ? `https://www.tiktok.com/@${name}/video/${postId}` : `https://www.tiktok.com/@${name}`;
  } catch {
    return null;
  }
}

export const tiktok: Provider = {
  network: "tiktok",
  oauth: {
    configured: () => Boolean(key() && secret()),
    authUrl: ({ state, redirect }) =>
      `https://www.tiktok.com/v2/auth/authorize/?${qs({ client_key: key(), response_type: "code", scope: "user.info.basic,user.info.profile,video.publish", redirect_uri: redirect, state, disable_auto_auth: "1" })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const t = await call<{ access_token?: string; expires_in: number; refresh_token: string; open_id: string; error?: string; error_description?: string }>(
        `${API}/oauth/token/`,
        tokenRequest({ client_key: key(), client_secret: secret(), code, grant_type: "authorization_code", redirect_uri: redirect }),
        { what: "TikTok sign-in" },
      );
      // TikTok answers a failed exchange with 200 and an error body; say why instead of calling on with no token.
      if (!t.access_token) throw new AuthError(`TikTok sign-in: ${t.error_description || t.error || "no access token returned"}`);
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
      tokenRequest({ client_key: key(), client_secret: secret(), grant_type: "refresh_token", refresh_token: s.refreshToken }),
      { what: "TikTok refresh" },
    );
    if (!t.access_token) throw new AuthError(`TikTok refresh: ${t.error_description ?? t.error}`);
    return { accessToken: t.access_token, refreshToken: t.refresh_token ?? s.refreshToken, expiresAt: new Date(Date.now() + (t.expires_in ?? 86400) * 1000) };
  },
  revoke: async (s) => {
    await call(`${API}/oauth/revoke/`, tokenRequest({ client_key: key(), client_secret: secret(), token: s.accessToken }), { what: "TikTok disconnect" });
  },
  check: tiktokProblem,
  publish: async (s, _openId, p) => {
    const problem = tiktokProblem(p);
    if (problem) throw new PostError(problem);
    const token = s.accessToken;
    const video = p.media[0];
    const creator = await creatorInfo(token);
    const privacy = p.settings.privacy;
    if (!privacy) throw new PostError("Choose who can watch this TikTok");
    if (!creator.privacy.includes(privacy)) throw new PostError(`This TikTok account can only post as: ${creator.privacy.join(", ")}`);
    if (!isVideo(video)) return publishPhotos(token, p, privacy, creator);
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
          post_info: {
            title: p.text,
            privacy_level: privacy,
            // Off unless the person turned it on, and off when the account's own TikTok settings turn it off.
            disable_comment: p.settings.comments !== "on" || creator.commentOff,
            disable_duet: p.settings.duet !== "on" || creator.duetOff,
            disable_stitch: p.settings.stitch !== "on" || creator.stitchOff,
            brand_organic_toggle: p.settings.brand === "own",
            brand_content_toggle: p.settings.brand === "branded",
          },
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
    return waitPublished(token, init.publish_id);
  },
};

/** Polls the publish status. Once TikTok has the post it finishes on its side, so a slow one is never sent again. */
async function waitPublished(token: string, publishId: string) {
  for (let i = 0; i < STATUS_TRIES; i++) {
    const st = await tt<{ status: string; fail_reason?: string; publicaly_available_post_id?: (string | number)[] }>(
      `${API}/post/publish/status/fetch/`,
      { method: "POST", headers: json(token), body: JSON.stringify({ publish_id: publishId }) },
      "TikTok status",
    );
    if (st.status === "PUBLISH_COMPLETE") {
      const postId = st.publicaly_available_post_id?.[0];
      return { id: postId ? String(postId) : publishId, url: await postLink(token, postId ? String(postId) : null) };
    }
    if (st.status === "FAILED") throw new PostError(`TikTok: ${PLAIN_FAIL[st.fail_reason ?? ""] ?? st.fail_reason ?? "publish failed"}`);
    await sleep(STATUS_WAIT_MS);
  }
  return { id: publishId, url: await postLink(token, null) };
}

let STATUS_TRIES = 60;
let STATUS_WAIT_MS = 5000;
export const setStatusWait = (tries: number, ms: number) => {
  STATUS_TRIES = tries;
  STATUS_WAIT_MS = ms;
};

/** Photo posts' failure reasons, in plain words. */
const PLAIN_FAIL: Record<string, string> = {
  url_ownership_unverified: "TikTok can't fetch the pictures: verify Capybaroar's media domain in the TikTok developer portal",
  picture_size_check_failed: "A picture is too big for TikTok. Use pictures up to 1080 pixels on the long side.",
};

const PHOTO = /^image\/(jpeg|webp)$/;

/** One video, or 1 to 35 JPG or WebP pictures up to 20 MB each, plus TikTok's caption and branded content rules. */
export function tiktokProblem(p: Pick<Publishable, "media" | "text" | "settings">): string | null {
  const videos = p.media.filter(isVideo);
  if (!p.media.length) return "TikTok needs one video, or 1 to 35 pictures";
  if (videos.length && p.media.length > 1) return "TikTok takes one video, or pictures only";
  if (!videos.length) {
    if (p.media.length > 35) return "TikTok photo posts take up to 35 pictures";
    if (p.media.some((m) => !PHOTO.test(m.mime))) return "TikTok photo posts take JPG or WebP pictures";
    if (p.media.some((m) => m.size > 20 * 1024 * 1024)) return "TikTok pictures must be under 20 MB";
    if ([...(p.settings.title ?? "")].length > 90) return "TikTok photo titles are up to 90 characters";
  }
  if (p.text.length > 2200) return "TikTok captions are up to 2,200 characters";
  if (p.settings.brand === "branded" && p.settings.privacy === "SELF_ONLY") return "Branded content can't be set to Only me on TikTok";
  return null;
}

/** The photo post TikTok gets: it pulls each picture from its link, which must be on a verified domain. */
export function photoBody(p: Pick<Publishable, "text" | "settings">, media: Pick<MediaFile, "url">[], privacy: string, creator: Pick<CreatorInfo, "commentOff">) {
  const title = p.settings.title?.trim();
  return {
    post_info: {
      ...(title ? { title } : {}),
      description: p.text,
      privacy_level: privacy,
      disable_comment: p.settings.comments !== "on" || creator.commentOff,
      auto_add_music: true,
      brand_organic_toggle: p.settings.brand === "own",
      brand_content_toggle: p.settings.brand === "branded",
    },
    source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: media.map((m) => m.url) },
    post_mode: "DIRECT_POST",
    media_type: "PHOTO",
  };
}

async function publishPhotos(token: string, p: Publishable, privacy: string, creator: CreatorInfo) {
  const init = await tt<{ publish_id: string }>(`${API}/post/publish/content/init/`, { method: "POST", headers: json(token), body: JSON.stringify(photoBody(p, p.media, privacy, creator)) }, "TikTok photo post");
  return waitPublished(token, init.publish_id);
}
