import { AuthError, call, isVideo, type Provider, type Secret } from "./types";

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
  check: (p) =>
    [...p.text].length > 300 ? "Bluesky posts are up to 300 characters" : p.media.some(isVideo) ? "Bluesky videos aren't supported yet" : p.media.length > 4 ? "Bluesky takes up to 4 pictures" : p.media.some((m) => m.size > 1_000_000) ? "Bluesky pictures must be under 1 MB" : null,
  publish: async (s, did, p) => {
    const sess = await session(s);
    const auth = { Authorization: `Bearer ${sess.accessJwt}` };
    const images = [];
    for (const m of p.media) {
      const r = await call<{ blob: unknown }>(`${PDS}/com.atproto.repo.uploadBlob`, { method: "POST", headers: { ...auth, "Content-Type": m.mime }, body: new Uint8Array(await m.bytes()) }, { what: "Bluesky upload" });
      images.push({ alt: "", image: r.blob });
    }
    const record: Record<string, unknown> = { $type: "app.bsky.feed.post", text: p.text, createdAt: new Date().toISOString() };
    const facets = linkFacets(p.text);
    if (facets.length) record.facets = facets;
    if (images.length) record.embed = { $type: "app.bsky.embed.images", images };
    const r = await call<{ uri: string }>(`${PDS}/com.atproto.repo.createRecord`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ repo: did, collection: "app.bsky.feed.post", record }) }, { what: "Bluesky post" });
    const rkey = r.uri.split("/").pop();
    return { id: r.uri, url: `https://bsky.app/profile/${sess.handle}/post/${rkey}` };
  },
  followers: async (s, did) => {
    const sess = await session(s);
    const r = await call<{ followersCount?: number }>(`${PDS}/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`, { headers: { Authorization: `Bearer ${sess.accessJwt}` } }, { what: "Bluesky followers" });
    return r.followersCount ?? null;
  },
};

