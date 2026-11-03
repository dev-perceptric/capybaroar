import { AuthError, PostError, call, isVideo, type InboxItem, type Provider, type Secret } from "./types";

// Bluesky: connected with the handle and an app password (Settings, App passwords), no app review.
const PDS = "https://bsky.social/xrpc";

export async function blueskyLogin(identifier: string, password: string) {
  const r = await fetch(`${PDS}/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
    signal: AbortSignal.timeout(30000),
  });
  if (r.status === 401) throw new AuthError("Wrong handle or app password");
  if (!r.ok) throw new Error(`Bluesky sign-in: ${r.status}`);
  return (await r.json()) as { did: string; handle: string; accessJwt: string };
}

const session = (s: Secret) => blueskyLogin(String(s.extra.handle), s.accessToken);

// The Inbox reads every 10 minutes, and Bluesky allows few sign-ins a day, so it keeps a session for up to an hour.
// A kept session that stopped working is dropped and signed in again once, so a stale one never marks a reconnect.
const kept = new Map<string, { jwt: string; handle: string; at: number }>();
async function withSession<T>(s: Secret, run: (jwt: string, handle: string) => Promise<T>): Promise<T> {
  const key = `${String(s.extra.handle)}:${s.accessToken}`;
  const k = kept.get(key);
  if (k && Date.now() - k.at < 3600000) {
    try {
      return await run(k.jwt, k.handle);
    } catch (e) {
      if (!(e instanceof AuthError) && !(e instanceof PostError && /expired|token/i.test(e.message))) throw e;
      kept.delete(key);
    }
  }
  const sess = await session(s);
  kept.set(key, { jwt: sess.accessJwt, handle: sess.handle, at: Date.now() });
  return run(sess.accessJwt, sess.handle);
}

type Ref = { uri: string; cid: string };
type Note = {
  uri: string;
  cid: string;
  reason: string;
  indexedAt: string;
  author: { did: string; handle: string; displayName?: string; avatar?: string };
  record: { text?: string; createdAt?: string; reply?: { root: Ref; parent: Ref } };
};

/** at://did/app.bsky.feed.post/rkey → the repo and rkey to delete. */
const postKey = (uri: string) => {
  const m = uri.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.post\/([^/]+)$/);
  return m ? { repo: m[1], rkey: m[2] } : null;
};

/** at://did/app.bsky.feed.post/rkey → https://bsky.app/profile/did/post/rkey */
const postLink = (uri: string) => {
  const m = uri.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.post\/([^/]+)$/);
  return m ? `https://bsky.app/profile/${m[1]}/post/${m[2]}` : null;
};

/** Links in the text, as Bluesky facets (byte offsets in UTF-8). */
function linkFacets(text: string) {
  const enc = new TextEncoder();
  const out: object[] = [];
  for (const m of text.matchAll(/https?:\/\/[^\s)]+/g)) {
    const start = enc.encode(text.slice(0, m.index)).length;
    out.push({ index: { byteStart: start, byteEnd: start + enc.encode(m[0]).length }, features: [{ $type: "app.bsky.richtext.facet#link", uri: m[0] }] });
  }
  return out;
}

export const bluesky: Provider = {
  network: "bluesky",
  form: {
    configured: () => true,
    fields: [
      { key: "handle", label: "Handle", placeholder: "you.bsky.social" },
      { key: "password", label: "App password", placeholder: "xxxx-xxxx-xxxx-xxxx", secret: true },
    ],
    connect: async (v) => {
      const handle = v.handle.replace(/^@/, "");
      const s = await blueskyLogin(handle, v.password);
      const prof = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(s.did)}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      return [{ accountId: s.did, name: prof?.displayName || s.handle, username: s.handle, avatar: prof?.avatar ?? null, accessToken: v.password, extra: { handle: s.handle } }];
    },
  },
  check: (p) =>
    [...p.text].length > 300 ? "Bluesky posts are up to 300 characters" : p.media.some(isVideo) ? "Bluesky videos aren't supported yet" : p.media.length > 4 ? "Bluesky takes up to 4 pictures" : p.media.some((m) => m.size > 1_000_000) ? "Bluesky pictures must be under 1 MB" : null,
  publish: async (s, did, p) => {
    const sess = await session(s);
    const auth = { Authorization: `Bearer ${sess.accessJwt}` };
    const images = [];
    for (const m of p.media) {
      const r = await call<{ blob: unknown }>(`${PDS}/com.atproto.repo.uploadBlob`, { method: "POST", headers: { ...auth, "Content-Type": m.mime }, body: new Uint8Array(await m.bytes()) }, { what: "Bluesky upload" });
      images.push({ alt: m.alt ?? "", image: r.blob });
    }
    const record: Record<string, unknown> = { $type: "app.bsky.feed.post", text: p.text, createdAt: new Date().toISOString() };
    const facets = linkFacets(p.text);
    if (facets.length) record.facets = facets;
    if (images.length) record.embed = { $type: "app.bsky.embed.images", images };
    const r = await call<{ uri: string }>(`${PDS}/com.atproto.repo.createRecord`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ repo: did, collection: "app.bsky.feed.post", record }) }, { what: "Bluesky post" });
    const rkey = r.uri.split("/").pop();
    return { id: r.uri, url: `https://bsky.app/profile/${sess.handle}/post/${rkey}` };
  },
  unpublishable: (_s, r) => (postKey(r.id) ? null : "Capybaroar didn't keep this post's id"),
  // com.atproto.repo.deleteRecord for the post's rkey. A record that's already gone deletes fine.
  unpublish: async (s, _did, r) => {
    const k = postKey(r.id)!;
    await withSession(s, (jwt) =>
      call(`${PDS}/com.atproto.repo.deleteRecord`, { method: "POST", headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }, body: JSON.stringify({ repo: k.repo, collection: "app.bsky.feed.post", rkey: k.rkey }) }, { what: "Bluesky delete" }),
    );
  },
  followers: async (s, did) => {
    const sess = await session(s);
    const r = await call<{ followersCount?: number }>(`${PDS}/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`, { headers: { Authorization: `Bearer ${sess.accessJwt}` } }, { what: "Bluesky followers" });
    return r.followersCount ?? null;
  },
  postStats: async (_s, _did, remoteId) => {
    // Public AppView: counts are public, no sign-in needed.
    const r = await call<{ posts?: { likeCount?: number; replyCount?: number; repostCount?: number; quoteCount?: number }[] }>(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?uris=${encodeURIComponent(remoteId)}`,
      {},
      { what: "Bluesky post stats" },
    );
    const p = r.posts?.[0];
    if (!p) return {};
    const shares = p.repostCount == null && p.quoteCount == null ? null : (p.repostCount ?? 0) + (p.quoteCount ?? 0);
    return { likes: p.likeCount ?? null, comments: p.replyCount ?? null, shares };
  },
  inbox: {
    // Notifications are newest first: read pages until they're older than `since` (at most 4 pages of 50).
    fetch: (s, did, q) =>
      withSession(s, async (jwt) => {
        const items: InboxItem[] = [];
        let cursor: string | undefined;
        for (let page = 0; page < 4; page++) {
          const params = new URLSearchParams({ limit: "50" });
          for (const r of ["reply", "mention", "quote"]) params.append("reasons", r);
          if (cursor) params.set("cursor", cursor);
          const r = await call<{ notifications?: Note[]; cursor?: string }>(`${PDS}/app.bsky.notification.listNotifications?${params}`, { headers: { Authorization: `Bearer ${jwt}` } }, { what: "Bluesky notifications" });
          let older = false;
          for (const n of r.notifications ?? []) {
            const at = new Date(n.record.createdAt ?? n.indexedAt);
            if (new Date(n.indexedAt) < q.since) {
              older = true;
              continue;
            }
            if (!["reply", "mention", "quote"].includes(n.reason)) continue;
            const reply = n.record.reply;
            // A reply straight under the post starts a thread; deeper ones join their parent's.
            const top = !reply || reply.parent.uri === reply.root.uri;
            items.push({
              networkId: n.uri,
              kind: n.reason === "reply" ? (top && reply?.root.uri.startsWith(`at://${did}/`) ? "comment" : "reply") : "mention",
              threadId: top ? n.uri : null,
              parentId: top ? null : reply!.parent.uri,
              postRemoteId: reply?.root.uri ?? null,
              postUrl: reply ? postLink(reply.root.uri) : null,
              url: postLink(n.uri),
              authorId: n.author.did,
              authorName: n.author.displayName || n.author.handle,
              authorHandle: n.author.handle,
              authorAvatar: n.author.avatar ?? null,
              text: n.record.text ?? "",
              createdAt: Number.isNaN(at.getTime()) ? new Date(n.indexedAt) : at,
              mine: n.author.did === did,
              extra: { cid: n.cid, rootUri: reply?.root.uri ?? n.uri, rootCid: reply?.root.cid ?? n.cid },
            });
          }
          cursor = r.cursor;
          if (older || !cursor || !(r.notifications ?? []).length) break;
        }
        return { items, cursor: null };
      }),
    reply: (s, did, to, text) =>
      withSession(s, async (jwt, handle) => {
        if (!to.extra.cid) throw new PostError("This Bluesky post can't be answered from here");
        const parent = { uri: to.networkId, cid: to.extra.cid };
        const root = to.extra.rootUri && to.extra.rootCid ? { uri: to.extra.rootUri, cid: to.extra.rootCid } : parent;
        const record: Record<string, unknown> = { $type: "app.bsky.feed.post", text, createdAt: new Date().toISOString(), reply: { root, parent } };
        const facets = linkFacets(text);
        if (facets.length) record.facets = facets;
        const r = await call<{ uri: string }>(
          `${PDS}/com.atproto.repo.createRecord`,
          { method: "POST", headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }, body: JSON.stringify({ repo: did, collection: "app.bsky.feed.post", record }) },
          { what: "Bluesky reply" },
        );
        return { id: r.uri, url: `https://bsky.app/profile/${handle}/post/${r.uri.split("/").pop()}` };
      }),
    // A like is its own record: its uri comes back so it can be removed.
    like: (s, did, to, on) =>
      withSession(s, async (jwt) => {
        const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
        if (on) {
          if (!to.extra.cid) throw new PostError("This Bluesky post can't be liked from here");
          const r = await call<{ uri: string }>(
            `${PDS}/com.atproto.repo.createRecord`,
            { method: "POST", headers, body: JSON.stringify({ repo: did, collection: "app.bsky.feed.like", record: { $type: "app.bsky.feed.like", subject: { uri: to.networkId, cid: to.extra.cid }, createdAt: new Date().toISOString() } }) },
            { what: "Bluesky like" },
          );
          return r.uri;
        }
        const rkey = to.likeRef?.split("/").pop();
        if (rkey) await call(`${PDS}/com.atproto.repo.deleteRecord`, { method: "POST", headers, body: JSON.stringify({ repo: did, collection: "app.bsky.feed.like", rkey }) }, { what: "Bluesky like" });
        return null;
      }),
  },
};

