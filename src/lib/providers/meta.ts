import { PostError, call, form, isVideo, qs, sleep, type Account, type MediaFile, type Provider } from "./types";

// Facebook Pages and Instagram (through Facebook login, Instagram professional accounts linked to a Page),
// and Threads (its own sign-in on threads.net). One Meta app holds all three.
const V = () => process.env.META_GRAPH_VERSION || "v24.0";
const G = (path: string) => `https://graph.facebook.com/${V()}/${path}`;
const appId = () => process.env.FACEBOOK_APP_ID ?? "";
const appSecret = () => process.env.FACEBOOK_APP_SECRET ?? "";

async function userToken(code: string, redirect: string) {
  const short = await call<{ access_token: string }>(G(`oauth/access_token?${qs({ client_id: appId(), client_secret: appSecret(), redirect_uri: redirect, code })}`), {}, { what: "Facebook sign-in" });
  // A long-lived user token makes Page tokens that don't expire.
  const long = await call<{ access_token: string }>(
    G(`oauth/access_token?${qs({ grant_type: "fb_exchange_token", client_id: appId(), client_secret: appSecret(), fb_exchange_token: short.access_token })}`),
    {},
    { what: "Facebook sign-in" },
  );
  return long.access_token;
}

type Page = {
  id: string;
  name: string;
  access_token: string;
  username?: string;
  picture?: { data?: { url?: string } };
  instagram_business_account?: { id: string; username?: string; name?: string; profile_picture_url?: string };
};

async function pages(token: string, fields: string) {
  const out: Page[] = [];
  let next: string | null = G(`me/accounts?${qs({ fields, limit: "100", access_token: token })}`);
  while (next) {
    const r: { data: Page[]; paging?: { next?: string } } = await call(next, {}, { what: "Facebook Pages" });
    out.push(...r.data);
    next = r.paging?.next ?? null;
  }
  return out;
}

const metaConfigured = () => Boolean(appId() && appSecret());

export const facebook: Provider = {
  network: "facebook",
  oauth: {
    configured: metaConfigured,
    authUrl: ({ state, redirect }) =>
      `https://www.facebook.com/${V()}/dialog/oauth?${qs({
        client_id: appId(),
        redirect_uri: redirect,
        state,
        response_type: "code",
        scope: "pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_engagement,read_insights,business_management",
      })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const tok = await userToken(code, redirect);
      const list = await pages(tok, "id,name,access_token,username,picture{url}");
      if (!list.length) throw new PostError("No Facebook Pages were shared with Capybaroar");
      return list.map((p) => ({ accountId: p.id, name: p.name, username: p.username ?? null, avatar: p.picture?.data?.url ?? null, accessToken: p.access_token }));
    },
  },
  publish: async (s, pageId, p) => {
    const token = s.accessToken;
    const videos = p.media.filter(isVideo);
    if (videos.length > 1 || (videos.length && p.media.length > 1)) throw new PostError("Facebook takes one video, or pictures only");
    if (videos.length) {
      const r = await call<{ id: string }>(G(`${pageId}/videos`), { method: "POST", body: form({ file_url: videos[0].url, description: p.text, access_token: token }) }, { what: "Facebook video" });
      return { id: r.id, url: `https://www.facebook.com/${pageId}/videos/${r.id}` };
    }
    if (p.media.length === 1) {
      const r = await call<{ id: string; post_id?: string }>(G(`${pageId}/photos`), { method: "POST", body: form({ url: p.media[0].url, caption: p.text, access_token: token }) }, { what: "Facebook photo" });
      const id = r.post_id ?? r.id;
      return { id, url: `https://www.facebook.com/${id}` };
    }
    const attached: Record<string, string> = {};
    for (const [i, m] of p.media.entries()) {
      const r = await call<{ id: string }>(G(`${pageId}/photos`), { method: "POST", body: form({ url: m.url, published: "false", access_token: token }) }, { what: "Facebook photo" });
      attached[`attached_media[${i}]`] = JSON.stringify({ media_fbid: r.id });
    }
    const r = await call<{ id: string }>(G(`${pageId}/feed`), { method: "POST", body: form({ message: p.text, access_token: token, ...attached }) }, { what: "Facebook post" });
    return { id: r.id, url: `https://www.facebook.com/${r.id}` };
  },
  followers: async (s, pageId) => (await call<{ followers_count?: number }>(G(`${pageId}?${qs({ fields: "followers_count", access_token: s.accessToken })}`), {}, { what: "Facebook followers" })).followers_count ?? null,
};

/** Wait for Meta to finish a media container (videos take a while). */
async function ready(url: (id: string) => string, id: string, field: "status_code" | "status") {
  for (let i = 0; i < 60; i++) {
    const r = await call<Record<string, string>>(url(id), {}, { what: "Media processing" });
    const st = r[field];
    if (st === "FINISHED" || st === "PUBLISHED") return;
    if (st === "ERROR" || st === "EXPIRED") throw new PostError(`Media processing failed: ${r.error_message ?? st}`);
    await sleep(5000);
  }
  throw new Error("Media is still processing; will retry");
}

export const instagram: Provider = {
  network: "instagram",
  oauth: {
    configured: metaConfigured,
    authUrl: ({ state, redirect }) =>
      `https://www.facebook.com/${V()}/dialog/oauth?${qs({
        client_id: appId(),
        redirect_uri: redirect,
        state,
        response_type: "code",
        scope: "instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management",
      })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const tok = await userToken(code, redirect);
      const list = (await pages(tok, "id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}")).filter((p) => p.instagram_business_account);
      if (!list.length) throw new PostError("No Instagram professional account is linked to your Facebook Pages");
      return list.map((p) => {
        const ig = p.instagram_business_account!;
        return { accountId: ig.id, name: ig.name || ig.username || p.name, username: ig.username ?? null, avatar: ig.profile_picture_url ?? null, accessToken: p.access_token };
      });
    },
  },
  check: (p) => (!p.media.length ? "Instagram needs a picture or video" : p.media.length > 10 ? "Instagram takes up to 10 files" : null),
  publish: async (s, igId, p) => {
    const token = s.accessToken;
    const status = (id: string) => G(`${id}?${qs({ fields: "status_code", access_token: token })}`);
    const container = async (m: MediaFile, child: boolean) => {
      const body: Record<string, string> = { access_token: token };
      if (isVideo(m)) Object.assign(body, { media_type: child ? "VIDEO" : "REELS", video_url: m.url });
      else body.image_url = m.url;
      if (child) body.is_carousel_item = "true";
      else body.caption = p.text;
      const r = await call<{ id: string }>(G(`${igId}/media`), { method: "POST", body: form(body) }, { what: "Instagram media" });
      if (isVideo(m)) await ready(status, r.id, "status_code");
      return r.id;
    };
    let creation: string;
    if (p.media.length === 1) creation = await container(p.media[0], false);
    else {
      const children: string[] = [];
      for (const m of p.media) children.push(await container(m, true));
      const r = await call<{ id: string }>(G(`${igId}/media`), { method: "POST", body: form({ media_type: "CAROUSEL", children: children.join(","), caption: p.text, access_token: token }) }, { what: "Instagram carousel" });
      await ready(status, r.id, "status_code");
      creation = r.id;
    }
    const pub = await call<{ id: string }>(G(`${igId}/media_publish`), { method: "POST", body: form({ creation_id: creation, access_token: token }) }, { what: "Instagram publish" });
    const link = await call<{ permalink?: string }>(G(`${pub.id}?${qs({ fields: "permalink", access_token: token })}`), {}, { what: "Instagram link" }).catch(() => ({ permalink: undefined }));
    return { id: pub.id, url: link.permalink ?? null };
  },
  followers: async (s, igId) => (await call<{ followers_count?: number }>(G(`${igId}?${qs({ fields: "followers_count", access_token: s.accessToken })}`), {}, { what: "Instagram followers" })).followers_count ?? null,
};

const T = (path: string) => `https://graph.threads.net/v1.0/${path}`;
const thId = () => process.env.THREADS_APP_ID ?? "";
const thSecret = () => process.env.THREADS_APP_SECRET ?? "";

export const threads: Provider = {
  network: "threads",
  oauth: {
    configured: () => Boolean(thId() && thSecret()),
    authUrl: ({ state, redirect }) =>
      `https://threads.net/oauth/authorize?${qs({ client_id: thId(), redirect_uri: redirect, state, response_type: "code", scope: "threads_basic,threads_content_publish,threads_manage_replies,threads_manage_insights" })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const short = await call<{ access_token: string; user_id: string }>(
        "https://graph.threads.net/oauth/access_token",
        { method: "POST", body: form({ client_id: thId(), client_secret: thSecret(), grant_type: "authorization_code", redirect_uri: redirect, code }) },
        { what: "Threads sign-in" },
      );
      const long = await call<{ access_token: string; expires_in: number }>(
        `https://graph.threads.net/access_token?${qs({ grant_type: "th_exchange_token", client_secret: thSecret(), access_token: short.access_token })}`,
        {},
        { what: "Threads sign-in" },
      );
      const me = await call<{ id: string; username: string; name?: string; threads_profile_picture_url?: string }>(
        T(`me?${qs({ fields: "id,username,name,threads_profile_picture_url", access_token: long.access_token })}`),
        {},
        { what: "Threads profile" },
      );
      return [
        {
          accountId: me.id,
          name: me.name || me.username,
          username: me.username,
          avatar: me.threads_profile_picture_url ?? null,
          accessToken: long.access_token,
          expiresAt: new Date(Date.now() + long.expires_in * 1000),
        },
      ];
    },
  },
  // Threads long-lived tokens last 60 days and can be refreshed while still valid.
  refreshable: () => true,
  refresh: async (s) => {
    const r = await call<{ access_token: string; expires_in: number }>(`https://graph.threads.net/refresh_access_token?${qs({ grant_type: "th_refresh_token", access_token: s.accessToken })}`, {}, { what: "Threads refresh" });
    return { accessToken: r.access_token, refreshToken: null, expiresAt: new Date(Date.now() + r.expires_in * 1000) };
  },
  check: (p) => (p.text.length > 500 ? "Threads posts are up to 500 characters" : p.media.length > 20 ? "Threads takes up to 20 files" : null),
  publish: async (s, userId, p) => {
    const token = s.accessToken;
    const status = (id: string) => T(`${id}?${qs({ fields: "status,error_message", access_token: token })}`);
    const item = async (m: MediaFile, child: boolean) => {
      const body: Record<string, string> = { access_token: token, media_type: isVideo(m) ? "VIDEO" : "IMAGE", [isVideo(m) ? "video_url" : "image_url"]: m.url };
      if (child) body.is_carousel_item = "true";
      else body.text = p.text;
      const r = await call<{ id: string }>(T(`${userId}/threads`), { method: "POST", body: form(body) }, { what: "Threads media" });
      await ready(status, r.id, "status");
      return r.id;
    };
    let creation: string;
    if (!p.media.length) {
      const r = await call<{ id: string }>(T(`${userId}/threads`), { method: "POST", body: form({ media_type: "TEXT", text: p.text, access_token: token }) }, { what: "Threads post" });
      creation = r.id;
    } else if (p.media.length === 1) creation = await item(p.media[0], false);
    else {
      const children: string[] = [];
      for (const m of p.media) children.push(await item(m, true));
      const r = await call<{ id: string }>(T(`${userId}/threads`), { method: "POST", body: form({ media_type: "CAROUSEL", children: children.join(","), text: p.text, access_token: token }) }, { what: "Threads carousel" });
      await ready(status, r.id, "status");
      creation = r.id;
    }
    const pub = await call<{ id: string }>(T(`${userId}/threads_publish`), { method: "POST", body: form({ creation_id: creation, access_token: token }) }, { what: "Threads publish" });
    const link = await call<{ permalink?: string }>(T(`${pub.id}?${qs({ fields: "permalink", access_token: token })}`), {}, { what: "Threads link" }).catch(() => ({ permalink: undefined }));
    return { id: pub.id, url: link.permalink ?? null };
  },
  followers: async (s, userId) => {
    const r = await call<{ data?: { total_value?: { value?: number } }[] }>(T(`${userId}/threads_insights?${qs({ metric: "followers_count", access_token: s.accessToken })}`), {}, { what: "Threads followers" });
    return r.data?.[0]?.total_value?.value ?? null;
  },
};

