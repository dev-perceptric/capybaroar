import { AuthError, PostError, call, form, isVideo, qs, type Account, type InboxItem, type PostStats, type Provider, type Publishable, type Secret } from "./types";

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
  // Answering and removing comments (Inbox).
  "https://www.googleapis.com/auth/youtube.force-ssl",
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

type YtComment = { id: string; snippet: { authorDisplayName?: string; authorProfileImageUrl?: string; authorChannelUrl?: string; authorChannelId?: { value?: string }; textOriginal?: string; publishedAt: string; parentId?: string } };
type YtThread = { id: string; snippet: { videoId?: string; topLevelComment: YtComment }; replies?: { comments?: YtComment[] } };

const tags = (s: string | undefined) =>
  (s ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

const CATEGORIES = new Set(["1", "2", "10", "15", "17", "19", "20", "22", "23", "24", "25", "26", "27", "28", "29"]);

/** The video's snippet and status: title, description, tags, category, visibility, made for kids and the synthetic content label. */
export function videoResource(p: Pick<Publishable, "text" | "settings">) {
  return {
    snippet: { title: (p.settings.title ?? "").trim().slice(0, 100), description: p.text, tags: tags(p.settings.tags), categoryId: CATEGORIES.has(p.settings.category) ? p.settings.category : "22" },
    status: { privacyStatus: p.settings.privacy || "public", selfDeclaredMadeForKids: p.settings.for_kids === "yes", containsSyntheticMedia: p.settings.synthetic === "yes" },
  };
}

/** The title and description rules, for a new video and for a change to one. */
export function youtubeTextProblem(p: Pick<Publishable, "text" | "settings">): string | null {
  const title = (p.settings.title ?? "").trim();
  if (!title) return "YouTube needs a title";
  if (title.length > 100) return "YouTube titles are up to 100 characters";
  if (/[<>]/.test(title) || /[<>]/.test(p.text)) return "YouTube titles and descriptions can't contain < or >";
  if (Buffer.byteLength(p.text, "utf8") > 5000) return "YouTube descriptions are up to 5,000 characters";
  return null;
}

/** The fields of `o` named in `keys` that have a value. */
const pick = (o: Record<string, unknown> | undefined, keys: string[]) => Object.fromEntries(keys.filter((k) => o?.[k] !== undefined && o?.[k] !== null).map((k) => [k, o![k]]));

/** A 403 for a missing scope: channels connected before youtube.force-ssl was asked for. */
const reconnectFor = (what: string) => (e: unknown) => {
  if (e instanceof PostError && /scope|insufficient/i.test(e.message)) throw new PostError(`Reconnect YouTube to ${what} from here`);
  throw e;
};

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
  check: (p) => (p.media.length !== 1 || !isVideo(p.media[0]) ? "YouTube needs exactly one video" : youtubeTextProblem(p)),
  publish: async (s, _channelId, p) => {
    const token = s.accessToken;
    const video = p.media[0];
    const bytes = await video.bytes();
    const init = await send(
      `${UPLOAD}/videos?${qs({ uploadType: "resumable", part: "snippet,status", notifySubscribers: p.settings.notify === "no" ? "false" : "true" })}`,
      {
        method: "POST",
        headers: { ...auth(token), "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Length": String(bytes.length), "X-Upload-Content-Type": video.mime },
        body: JSON.stringify(videoResource(p)),
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
  // videos.delete takes youtube.force-ssl, asked for since the Inbox; a channel connected before that answers 403.
  unpublish: async (s, _channelId, r) => {
    await call(`${API}/videos?${qs({ id: r.id })}`, { method: "DELETE", headers: auth(s.accessToken) }, { what: "YouTube delete" }).catch(reconnectFor("delete"));
  },
  // videos.update (youtube.force-ssl, 50 quota units + 1 for the read). It replaces the whole snippet and status:
  // a writable field left out is wiped, so the video is read first and the fields Capybaroar doesn't set are sent
  // back as they are (default language, embedding, license, public stats; a scheduled time only while private).
  edit: async (s, _channelId, r, p) => {
    const problem = youtubeTextProblem(p);
    if (problem) throw new PostError(problem);
    const token = s.accessToken;
    type Video = { snippet?: Record<string, unknown>; status?: Record<string, unknown> };
    const cur = await call<{ items?: Video[] }>(`${API}/videos?${qs({ part: "snippet,status", id: r.id })}`, { headers: auth(token) }, { what: "YouTube video" });
    const v = cur.items?.[0];
    if (!v) throw new PostError("This video is no longer on YouTube");
    const next = videoResource(p);
    const keep = ["embeddable", "license", "publicStatsViewable", ...(next.status.privacyStatus === "private" ? ["publishAt"] : [])];
    const body = { id: r.id, snippet: { ...pick(v.snippet, ["defaultLanguage"]), ...next.snippet }, status: { ...pick(v.status, keep), ...next.status } };
    await call(
      `${API}/videos?${qs({ part: "snippet,status" })}`,
      { method: "PUT", headers: { ...auth(token), "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify(body) },
      { what: "YouTube edit" },
    ).catch(reconnectFor("edit"));
  },
  followers: async (s, channelId) => {
    const r = await call<{ items?: Channel[] }>(`${API}/channels?${qs({ part: "statistics", id: channelId })}`, { headers: auth(s.accessToken) }, { what: "YouTube subscribers" });
    const st = r.items?.[0]?.statistics;
    return st && !st.hiddenSubscriberCount && st.subscriberCount ? Number(st.subscriberCount) : null;
  },
  postStats: async (s, _channelId, videoId) => {
    try {
      // A deleted video is simply missing from items.
      const r = await call<{ items?: { statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }[] }>(
        `${API}/videos?${qs({ part: "statistics", id: videoId })}`,
        { headers: auth(s.accessToken) },
        { what: "YouTube video stats" },
      );
      const st = r.items?.[0]?.statistics;
      if (!st) return {};
      // likeCount and commentCount are left out when hidden or comments are off.
      const n = (v?: string) => (v === undefined || v === "" ? undefined : Number(v));
      const out: PostStats = { views: n(st.viewCount), likes: n(st.likeCount), comments: n(st.commentCount) };
      return Object.fromEntries(Object.entries(out).filter(([, x]) => typeof x === "number" && Number.isFinite(x))) as PostStats;
    } catch (e) {
      if (e instanceof PostError || (e instanceof Error && !(e instanceof AuthError) && /not found|404/i.test(e.message))) return {};
      throw e;
    }
  },
  inbox: {
    // Every read costs 1 unit of the project's daily quota (10,000 by default), shared by all channels.
    every: 30,
    // Newest comment threads on the channel's videos, with up to 5 replies each: 1 quota unit a call.
    fetch: async (s, channelId, q) => {
      const r = await call<{ items?: YtThread[] }>(
        `${API}/commentThreads?${qs({ part: "snippet,replies", allThreadsRelatedToChannelId: channelId, order: "time", maxResults: "50", textFormat: "plainText" })}`,
        { headers: auth(s.accessToken) },
        { what: "YouTube comments" },
      );
      const items: InboxItem[] = [];
      const add = (t: YtThread, c: YtComment, top: boolean) => {
        const at = new Date(c.snippet.publishedAt);
        if (at < q.since) return;
        const video = t.snippet.videoId ?? null;
        items.push({
          networkId: c.id,
          kind: top ? "comment" : "reply",
          threadId: t.id,
          parentId: top ? null : t.id,
          postRemoteId: video,
          postUrl: video ? `https://www.youtube.com/watch?v=${video}` : null,
          url: video ? `https://www.youtube.com/watch?v=${video}&lc=${c.id}` : null,
          authorId: c.snippet.authorChannelId?.value ?? null,
          authorName: c.snippet.authorDisplayName || "YouTube user",
          authorHandle: c.snippet.authorChannelUrl?.split("/").pop()?.replace(/^@/, "") ?? null,
          authorAvatar: c.snippet.authorProfileImageUrl ?? null,
          text: c.snippet.textOriginal ?? "",
          createdAt: at,
          mine: c.snippet.authorChannelId?.value === channelId,
        });
      };
      for (const t of r.items ?? []) {
        add(t, t.snippet.topLevelComment, true);
        for (const c of t.replies?.comments ?? []) add(t, c, false);
      }
      return { items, cursor: null };
    },
    // comments.insert: 50 quota units. Replies always go under the top-level comment.
    reply: async (s, _channelId, to, text) => {
      const r = await call<{ id: string }>(
        `${API}/comments?${qs({ part: "snippet" })}`,
        { method: "POST", headers: { ...auth(s.accessToken), "Content-Type": "application/json" }, body: JSON.stringify({ snippet: { parentId: to.threadId || to.networkId, textOriginal: text } }) },
        { what: "YouTube reply" },
      );
      return { id: r.id };
    },
    // Rejecting removes the comment from the channel for good; YouTube can't show it again (50 quota units).
    hide: async (s, _channelId, to, on) => {
      if (!on) throw new PostError("YouTube can't show a removed comment again");
      await send(`${API}/comments/setModerationStatus?${qs({ id: to.networkId, moderationStatus: "rejected" })}`, { method: "POST", headers: auth(s.accessToken) }, "YouTube hide");
    },
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
