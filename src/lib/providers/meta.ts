import { AuthError, PostError, call, form, isVideo, qs, sleep, type Account, type InboxBatch, type InboxItem, type InboxQuery, type InboxRef, type MediaFile, type PostStats, type Provider, type Publishable, type Published, type Secret } from "./types";

/** Inbox permissions are asked for only once they are added to the Meta app (META_INBOX=1), so sign-in never breaks. */
const inboxScopes = () => process.env.META_INBOX === "1";
/** threads_delete, the same way: asked for once the Meta app has it (META_THREADS_DELETE=1). */
const threadsDelete = () => process.env.META_THREADS_DELETE === "1";

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

async function facebookPost(token: string, pageId: string, p: Publishable): Promise<Published> {
  const videos = p.media.filter(isVideo);
  if (p.settings.format === "reel") {
    // Reels: start, upload by URL to rupload, then finish to publish.
    const start = await call<{ video_id: string; upload_url: string }>(G(`${pageId}/video_reels`), { method: "POST", body: form({ upload_phase: "start", access_token: token }) }, { what: "Facebook Reel" });
    await call(start.upload_url, { method: "POST", headers: { Authorization: `OAuth ${token}`, file_url: videos[0].url } }, { what: "Facebook Reel upload" });
    await call(G(`${pageId}/video_reels`), { method: "POST", body: form({ upload_phase: "finish", video_id: start.video_id, video_state: "PUBLISHED", description: p.text, access_token: token }) }, { what: "Facebook Reel" });
    return { id: start.video_id, url: `https://www.facebook.com/reel/${start.video_id}` };
  }
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
}

/** A post that was deleted (Meta answers 400 "does not exist") or a stats call this media can't take: no numbers, never a throw. */
const gone = (e: unknown) => !(e instanceof AuthError) && (e instanceof PostError || (e instanceof Error && /not found|404|does not exist|unsupported get request/i.test(e.message)));
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : undefined);
/** Drop the fields the network didn't give. */
const clean = (o: PostStats): PostStats => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null)) as PostStats;
type Insights = { data?: { name: string; values?: { value?: unknown }[]; total_value?: { value?: unknown } }[] };
const metric = (r: Insights, name: string) => {
  const m = r.data?.find((d) => d.name === name);
  return m ? num(m.total_value?.value ?? m.values?.[0]?.value) : undefined;
};

async function facebookStats(token: string, remoteId: string): Promise<PostStats> {
  // Feed and photo posts come back as "{page}_{post}"; videos and Reels as a bare video id.
  if (!remoteId.includes("_")) {
    const v = await call<{ likes?: { summary?: { total_count?: number } }; comments?: { summary?: { total_count?: number } } }>(
      G(`${remoteId}?${qs({ fields: "likes.summary(true).limit(0),comments.summary(true).limit(0)", access_token: token })}`),
      {},
      { what: "Facebook video stats" },
    );
    const out: PostStats = { likes: num(v.likes?.summary?.total_count), comments: num(v.comments?.summary?.total_count) };
    try {
      // Verify: total_video_views is still offered on video_insights for Reels in the current Graph version.
      const ins = await call<Insights>(G(`${remoteId}/video_insights?${qs({ metric: "total_video_views,total_video_impressions_unique", access_token: token })}`), {}, { what: "Facebook video insights" });
      Object.assign(out, { views: metric(ins, "total_video_views"), reach: metric(ins, "total_video_impressions_unique") });
    } catch (e) {
      if (e instanceof AuthError) throw e;
    }
    return clean(out);
  }
  const p = await call<{ reactions?: { summary?: { total_count?: number } }; comments?: { summary?: { total_count?: number } }; shares?: { count?: number } }>(
    G(`${remoteId}?${qs({ fields: "reactions.summary(true).limit(0),comments.summary(true).limit(0),shares", access_token: token })}`),
    {},
    { what: "Facebook post stats" },
  );
  const out: PostStats = { likes: num(p.reactions?.summary?.total_count), comments: num(p.comments?.summary?.total_count), shares: num(p.shares?.count) };
  try {
    // Verify: Meta keeps retiring post insights metrics; post_impressions_unique may need replacing with a "views" metric.
    const ins = await call<Insights>(G(`${remoteId}/insights?${qs({ metric: "post_impressions_unique,post_clicks", access_token: token })}`), {}, { what: "Facebook post insights" });
    Object.assign(out, { reach: metric(ins, "post_impressions_unique"), clicks: metric(ins, "post_clicks") });
  } catch (e) {
    if (e instanceof AuthError) throw e;
  }
  return clean(out);
}

async function instagramStats(token: string, mediaId: string): Promise<PostStats> {
  try {
    // Verify: Stories reject likes/comments/saved, which lands in the fallback below (fields only).
    const r = await call<Insights>(G(`${mediaId}/insights?${qs({ metric: "reach,likes,comments,shares,saved,views", access_token: token })}`), {}, { what: "Instagram insights" });
    return clean({ reach: metric(r, "reach"), likes: metric(r, "likes"), comments: metric(r, "comments"), shares: metric(r, "shares"), saves: metric(r, "saved"), views: metric(r, "views") });
  } catch (e) {
    if (!gone(e)) throw e;
  }
  const m = await call<{ like_count?: number; comments_count?: number }>(G(`${mediaId}?${qs({ fields: "like_count,comments_count", access_token: token })}`), {}, { what: "Instagram post stats" });
  return clean({ likes: num(m.like_count), comments: num(m.comments_count) });
}

async function threadsStats(token: string, mediaId: string): Promise<PostStats> {
  const r = await call<Insights>(T(`${mediaId}/insights?${qs({ metric: "views,likes,replies,reposts,quotes,shares", access_token: token })}`), {}, { what: "Threads insights" });
  const parts = [metric(r, "reposts"), metric(r, "quotes"), metric(r, "shares")].filter((v): v is number => v !== undefined);
  return clean({ views: metric(r, "views"), likes: metric(r, "likes"), comments: metric(r, "replies"), shares: parts.length ? parts.reduce((a, b) => a + b, 0) : undefined });
}

/** Run a stats call; a post that's gone (or numbers this post can't have) is {}. Bad tokens still throw AuthError. */
async function stats(run: () => Promise<PostStats>): Promise<PostStats> {
  try {
    return await run();
  } catch (e) {
    if (gone(e)) return {};
    throw e;
  }
}

// Inbox: comments on the Page's or account's latest posts in one call each, and DMs when their permission was granted.
// DMs need Meta's app review, so their permissions are asked for only when META_MESSAGING=1.
const messaging = () => process.env.META_MESSAGING === "1";

/** The permissions the person granted, kept on the channel so DMs are read only where they're allowed. */
async function granted(token: string): Promise<string[]> {
  try {
    const r = await call<{ data?: { permission: string; status: string }[] }>(G(`me/permissions?${qs({ access_token: token })}`), {}, { what: "Facebook permissions" });
    return (r.data ?? []).filter((p) => p.status === "granted").map((p) => p.permission);
  } catch {
    return [];
  }
}
const allowed = (s: Secret, scope: string) => Array.isArray(s.extra.scopes) && (s.extra.scopes as unknown[]).includes(scope);

type Msg = { id: string; message?: string; from?: { id: string; name?: string; username?: string }; created_time: string };

/** Messenger or Instagram conversations through the Page token ("me" is the Page). */
async function conversations(token: string, platform: "messenger" | "instagram", ownId: string, since: Date): Promise<InboxItem[]> {
  const r = await call<{ data?: { id: string; updated_time: string; messages?: { data?: Msg[] } }[] }>(
    G(`me/conversations?${qs({ platform, fields: "id,updated_time,messages.limit(10){id,message,from,created_time}", limit: "20", access_token: token })}`),
    {},
    { what: platform === "instagram" ? "Instagram messages" : "Messenger" },
  );
  const out: InboxItem[] = [];
  for (const c of r.data ?? []) {
    if (new Date(c.updated_time) < since) continue;
    for (const m of c.messages?.data ?? []) {
      const at = new Date(m.created_time);
      if (at < since) continue;
      out.push({ networkId: m.id, kind: "dm", threadId: c.id, parentId: null, authorId: m.from?.id ?? null, authorName: m.from?.name || m.from?.username || "Someone", authorHandle: m.from?.username ?? null, text: m.message ?? "", createdAt: at, mine: m.from?.id === ownId });
    }
  }
  return out;
}

/** Answer a DM. Meta only allows it within 24 hours of the person's last message (outside that it answers 400). */
async function sendMessage(token: string, to: InboxRef, text: string, what: string) {
  if (!to.authorId) throw new PostError(`${what}: no one to answer`);
  const r = await call<{ message_id: string }>(
    G(`me/messages?${qs({ access_token: token })}`),
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient: { id: to.authorId }, messaging_type: "RESPONSE", message: { text } }) },
    { what },
  );
  return { id: r.message_id };
}

const noDm = (to: InboxRef, what: string) => {
  if (to.kind === "dm") throw new PostError(`${what} isn't possible on a message`);
};

type FbComment = { id: string; message?: string; from?: { id: string; name?: string }; created_time: string; parent?: { id: string }; permalink_url?: string; is_hidden?: boolean; user_likes?: boolean };

async function facebookInbox(s: Secret, pageId: string, q: InboxQuery): Promise<InboxBatch> {
  const token = s.accessToken;
  // filter(stream) returns replies too, each with its parent. Verify: order() on the nested comments edge.
  const fields = `id,message,permalink_url,comments.filter(stream).order(reverse_chronological).limit(50){id,message,from{id,name},created_time,parent{id},permalink_url,is_hidden,user_likes}`;
  const r = await call<{ data?: { id: string; message?: string; permalink_url?: string; comments?: { data?: FbComment[] } }[] }>(G(`${pageId}/posts?${qs({ fields, limit: "15", access_token: token })}`), {}, { what: "Facebook comments" });
  const items: InboxItem[] = [];
  for (const p of r.data ?? [])
    for (const c of p.comments?.data ?? []) {
      const at = new Date(c.created_time);
      if (at < q.since) continue;
      items.push({
        networkId: c.id,
        kind: c.parent ? "reply" : "comment",
        threadId: c.parent?.id ?? c.id,
        parentId: c.parent?.id ?? null,
        postRemoteId: p.id,
        postUrl: p.permalink_url ?? null,
        postText: p.message ?? null,
        url: c.permalink_url ?? null,
        authorId: c.from?.id ?? null,
        authorName: c.from?.name || "Facebook user",
        text: c.message ?? "",
        createdAt: at,
        mine: c.from?.id === pageId,
        liked: Boolean(c.user_likes),
        hidden: Boolean(c.is_hidden),
      });
    }
  if (messaging() && allowed(s, "pages_messaging")) items.push(...(await conversations(token, "messenger", pageId, q.since)));
  return { items, cursor: null };
}

type IgComment = { id: string; text?: string; username?: string; timestamp: string; from?: { id: string; username?: string }; parent_id?: string; hidden?: boolean; replies?: { data?: IgComment[] } };

async function instagramInbox(s: Secret, igId: string, q: InboxQuery): Promise<InboxBatch> {
  const token = s.accessToken;
  const one = "id,text,username,timestamp,from{id,username},hidden";
  // Verify: the order nested comments come back in; 50 per post covers a 10-minute window for nearly every account.
  const fields = `id,caption,permalink,comments.limit(50){${one},replies{${one},parent_id}}`;
  const r = await call<{ data?: { id: string; caption?: string; permalink?: string; comments?: { data?: IgComment[] } }[] }>(G(`${igId}/media?${qs({ fields, limit: "15", access_token: token })}`), {}, { what: "Instagram comments" });
  const items: InboxItem[] = [];
  const add = (m: { id: string; caption?: string; permalink?: string }, c: IgComment, parent: string | null) => {
    const at = new Date(c.timestamp);
    if (at < q.since) return;
    const name = c.username || c.from?.username || "Instagram user";
    items.push({
      networkId: c.id,
      kind: parent ? "reply" : "comment",
      threadId: parent ?? c.id,
      parentId: parent,
      postRemoteId: m.id,
      postUrl: m.permalink ?? null,
      postText: m.caption ?? null,
      url: m.permalink ?? null,
      authorId: c.from?.id ?? null,
      authorName: name,
      authorHandle: c.username || c.from?.username || null,
      text: c.text ?? "",
      createdAt: at,
      mine: c.from?.id === igId,
      hidden: Boolean(c.hidden),
    });
  };
  for (const m of r.data ?? [])
    for (const c of m.comments?.data ?? []) {
      add(m, c, null);
      for (const rep of c.replies?.data ?? []) add(m, rep, rep.parent_id ?? c.id);
    }
  if (messaging() && allowed(s, "instagram_manage_messages")) items.push(...(await conversations(token, "instagram", igId, q.since)));
  return { items, cursor: null };
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
        scope: ["pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_engagement,read_insights,business_management", inboxScopes() ? "pages_read_user_content" : "", messaging() ? "pages_messaging" : ""].filter(Boolean).join(","),
      })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const tok = await userToken(code, redirect);
      const list = await pages(tok, "id,name,access_token,username,picture{url}");
      if (!list.length) throw new PostError("No Facebook Pages were shared with Capybaroar");
      const scopes = await granted(tok);
      return list.map((p) => ({ accountId: p.id, name: p.name, username: p.username ?? null, avatar: p.picture?.data?.url ?? null, accessToken: p.access_token, extra: { scopes } }));
    },
  },
  check: (p) => {
    const videos = p.media.filter(isVideo);
    if (p.settings.format === "reel") return videos.length === 1 && p.media.length === 1 ? null : "A Facebook Reel is one video";
    return videos.length > 1 || (videos.length && p.media.length > 1) ? "Facebook takes one video, or pictures only" : null;
  },
  publish: async (s, pageId, p) => {
    const token = s.accessToken;
    const out = await facebookPost(token, pageId, p);
    // The post is live: from here on, problems go in the note, never a throw (a retry would post twice).
    const comment = p.settings.first_comment?.trim();
    if (comment) {
      try {
        await call(G(`${out.id}/comments`), { method: "POST", body: form({ message: comment, access_token: token }) }, { what: "Facebook first comment" });
      } catch (e) {
        out.note = e instanceof Error ? e.message : String(e);
      }
    }
    return out;
  },
  // DELETE /{post-id} with the Page token (pages_manage_posts). Feed and photo posts are "{page}_{post}", videos and
  // Reels a video id; both delete the same way. Verify: a post that's gone answers 400 "does not exist", not 404, so it
  // shows as failed with Meta's message.
  unpublish: async (s, _pageId, r) => {
    await call(G(`${r.id}?${qs({ access_token: s.accessToken })}`), { method: "DELETE" }, { what: "Facebook delete" });
  },
  followers: async (s, pageId) => (await call<{ followers_count?: number }>(G(`${pageId}?${qs({ fields: "followers_count", access_token: s.accessToken })}`), {}, { what: "Facebook followers" })).followers_count ?? null,
  postStats: (s, _pageId, remoteId) => stats(() => facebookStats(s.accessToken, remoteId)),
  inbox: {
    fetch: facebookInbox,
    reply: async (s, _pageId, to, text) => {
      if (to.kind === "dm") return sendMessage(s.accessToken, to, text, "Messenger reply");
      // Facebook keeps two levels: an answer to a reply goes under its top-level comment.
      const r = await call<{ id: string }>(G(`${to.threadId || to.networkId}/comments`), { method: "POST", body: form({ message: text, access_token: s.accessToken }) }, { what: "Facebook reply" });
      return { id: r.id };
    },
    like: async (s, _pageId, to, on) => {
      noDm(to, "Liking");
      await call(G(`${to.networkId}/likes?${qs({ access_token: s.accessToken })}`), { method: on ? "POST" : "DELETE" }, { what: "Facebook like" });
      return null;
    },
    hide: async (s, _pageId, to, on) => {
      noDm(to, "Hiding");
      await call(G(to.networkId), { method: "POST", body: form({ is_hidden: String(on), access_token: s.accessToken }) }, { what: "Facebook hide" });
    },
  },
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
        scope: ["instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management", messaging() ? "instagram_manage_messages,pages_manage_metadata" : ""].filter(Boolean).join(","),
      })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const tok = await userToken(code, redirect);
      const list = (await pages(tok, "id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}")).filter((p) => p.instagram_business_account);
      if (!list.length) throw new PostError("No Instagram professional account is linked to your Facebook Pages");
      const scopes = await granted(tok);
      return list.map((p) => {
        const ig = p.instagram_business_account!;
        return { accountId: ig.id, name: ig.name || ig.username || p.name, username: ig.username ?? null, avatar: ig.profile_picture_url ?? null, accessToken: p.access_token, extra: { scopes } };
      });
    },
  },
  check: (p) => {
    if (!p.media.length) return "Instagram needs a picture or video";
    if (p.settings.format === "story") return p.media.length === 1 ? null : "An Instagram Story is one picture or video";
    if (p.settings.format === "reel") return p.media.length === 1 && isVideo(p.media[0]) ? null : "An Instagram Reel is one video";
    return p.media.length > 10 ? "Instagram takes up to 10 files" : null;
  },
  publish: async (s, igId, p) => {
    const token = s.accessToken;
    const status = (id: string) => G(`${id}?${qs({ fields: "status_code", access_token: token })}`);
    const format = p.settings.format || "post";
    const container = async (m: MediaFile, child: boolean) => {
      const body: Record<string, string> = { access_token: token };
      if (format === "story") Object.assign(body, { media_type: "STORIES", [isVideo(m) ? "video_url" : "image_url"]: m.url });
      else if (isVideo(m)) Object.assign(body, { media_type: child ? "VIDEO" : "REELS", video_url: m.url }, !child && p.cover ? { cover_url: p.cover.url } : {});
      else Object.assign(body, { image_url: m.url }, m.alt ? { alt_text: m.alt } : {});
      if (child) body.is_carousel_item = "true";
      else if (format !== "story") body.caption = p.text;
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
    // The post is live: from here on, problems go in the note, never a throw (a retry would post twice).
    const out: Published = { id: pub.id, url: null };
    try {
      out.url = (await call<{ permalink?: string }>(G(`${pub.id}?${qs({ fields: "permalink", access_token: token })}`), {}, { what: "Instagram link" })).permalink ?? null;
    } catch {
      // no link, the post is still out
    }
    const comment = p.settings.first_comment?.trim();
    if (comment && format !== "story") {
      try {
        await call(G(`${pub.id}/comments`), { method: "POST", body: form({ message: comment, access_token: token }) }, { what: "Instagram first comment" });
      } catch (e) {
        out.note = e instanceof Error ? e.message : String(e);
      }
    }
    return out;
  },
  followers: async (s, igId) => (await call<{ followers_count?: number }>(G(`${igId}?${qs({ fields: "followers_count", access_token: s.accessToken })}`), {}, { what: "Instagram followers" })).followers_count ?? null,
  postStats: (s, _igId, remoteId) => stats(() => instagramStats(s.accessToken, remoteId)),
  inbox: {
    fetch: instagramInbox,
    reply: async (s, _igId, to, text) => {
      if (to.kind === "dm") return sendMessage(s.accessToken, to, text, "Instagram message");
      // Instagram keeps two levels: an answer to a reply goes under its top-level comment.
      const r = await call<{ id: string }>(G(`${to.threadId || to.networkId}/replies`), { method: "POST", body: form({ message: text, access_token: s.accessToken }) }, { what: "Instagram reply" });
      return { id: r.id };
    },
    hide: async (s, _igId, to, on) => {
      noDm(to, "Hiding");
      await call(G(to.networkId), { method: "POST", body: form({ hide: String(on), access_token: s.accessToken }) }, { what: "Instagram hide" });
    },
  },
};

const T = (path: string) => `https://graph.threads.net/v1.0/${path}`;
const thId = () => process.env.THREADS_APP_ID ?? "";
const thSecret = () => process.env.THREADS_APP_SECRET ?? "";

export const threads: Provider = {
  network: "threads",
  oauth: {
    configured: () => Boolean(thId() && thSecret()),
    authUrl: ({ state, redirect }) =>
      `https://threads.net/oauth/authorize?${qs({ client_id: thId(), redirect_uri: redirect, state, response_type: "code", scope: `threads_basic,threads_content_publish,threads_manage_replies,threads_manage_insights${inboxScopes() ? ",threads_read_replies" : ""}${threadsDelete() ? ",threads_delete" : ""}` })}`,
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
          // Channels signed in while threads_delete was asked for can delete; older ones reconnect first.
          extra: threadsDelete() ? { threads_delete: true } : {},
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
  postStats: (s, _userId, remoteId) => stats(() => threadsStats(s.accessToken, remoteId)),
  // DELETE /{threads-media-id} needs threads_delete, 100 deletes a day per account.
  unpublishable: (s) => (!threadsDelete() ? "Delete it in the Threads app" : s.extra.threads_delete !== true ? "Reconnect Threads to delete from here" : null),
  unpublish: async (s, _userId, r) => {
    await call(T(`${encodeURIComponent(r.id)}?${qs({ access_token: s.accessToken })}`), { method: "DELETE" }, { what: "Threads delete" });
  },
  inbox: {
    fetch: threadsInbox,
    reply: async (s, userId, to, text) => {
      const token = s.accessToken;
      const c = await call<{ id: string }>(T(`${userId}/threads`), { method: "POST", body: form({ media_type: "TEXT", text, reply_to_id: to.networkId, access_token: token }) }, { what: "Threads reply" });
      const r = await call<{ id: string }>(T(`${userId}/threads_publish`), { method: "POST", body: form({ creation_id: c.id, access_token: token }) }, { what: "Threads reply" });
      return { id: r.id };
    },
    // Only replies straight under a post can be hidden (that hides the ones under it too).
    hide: async (s, _userId, to, on) => {
      await call(T(`${to.networkId}/manage_reply`), { method: "POST", body: form({ hide: String(on), access_token: s.accessToken }) }, { what: "Threads hide" });
    },
  },
};

type ThreadsReply = { id: string; text?: string; username?: string; permalink?: string; timestamp: string; replied_to?: { id: string }; is_reply_owned_by_me?: boolean; hide_status?: string; profile_picture_url?: string };

/** Replies under the account's posts from the last 14 days: one call for the posts, one per post for its replies. */
async function threadsInbox(s: Secret, userId: string, q: InboxQuery): Promise<InboxBatch> {
  const token = s.accessToken;
  const posts = await call<{ data?: { id: string; text?: string; permalink?: string; timestamp: string }[] }>(T(`${userId}/threads?${qs({ fields: "id,text,permalink,timestamp", limit: "10", access_token: token })}`), {}, { what: "Threads posts" });
  const items: InboxItem[] = [];
  const recent = Date.now() - 14 * 86400000;
  for (const p of posts.data ?? []) {
    if (new Date(p.timestamp).getTime() < recent) continue;
    let r: { data?: ThreadsReply[] };
    try {
      r = await call(T(`${p.id}/conversation?${qs({ fields: "id,text,username,permalink,timestamp,replied_to,is_reply_owned_by_me,hide_status,profile_picture_url", reverse: "true", access_token: token })}`), {}, { what: "Threads replies" });
    } catch (e) {
      if (gone(e) && !/permission/i.test((e as Error).message)) continue;
      throw e;
    }
    for (const c of r.data ?? []) {
      const at = new Date(c.timestamp);
      if (at < q.since) continue;
      const top = !c.replied_to || c.replied_to.id === p.id;
      items.push({
        networkId: c.id,
        kind: top ? "comment" : "reply",
        threadId: top ? c.id : null,
        parentId: top ? null : c.replied_to!.id,
        postRemoteId: p.id,
        postUrl: p.permalink ?? null,
        postText: p.text ?? null,
        url: c.permalink ?? null,
        authorName: c.username || "Threads user",
        authorHandle: c.username ?? null,
        authorAvatar: c.profile_picture_url ?? null,
        text: c.text ?? "",
        createdAt: at,
        mine: Boolean(c.is_reply_owned_by_me),
        hidden: c.hide_status === "HIDDEN",
      });
    }
  }
  return { items, cursor: null };
}

