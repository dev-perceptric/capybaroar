import { createHash } from "node:crypto";
import { AuthError, PostError, call, form, isVideo, qs, sleep, type Account, type MediaFile, type Provider, type Secret } from "./types";

// Mastodon: any server. The app is registered on that server the first time someone signs in with it.
const SCOPES = "read write:statuses write:media";
const VISIBILITY = new Set(["public", "unlisted", "private"]);

/** "https://Mastodon.social/", "@me@mastodon.social" or "mastodon.social" → "mastodon.social". */
function normalize(raw: string) {
  let h = (raw ?? "").trim().toLowerCase();
  h = h.replace(/^[a-z]+:\/\//, "");
  h = h.split(/[/?#]/)[0];
  if (h.includes("@")) h = h.slice(h.lastIndexOf("@") + 1);
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d{1,5})?$/.test(h)) throw new PostError("Enter a Mastodon server, like mastodon.social");
  return h;
}

const instanceOf = (s: Secret) => {
  const i = s.extra?.instance;
  if (typeof i !== "string" || !i) throw new AuthError("Mastodon server is missing; reconnect the channel");
  return i;
};

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

type Me = { id: string; username: string; display_name?: string; avatar?: string; followers_count?: number };
type MediaAttachment = { id: string; url: string | null };

async function upload(base: string, tok: string, m: MediaFile) {
  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(await m.bytes())], { type: m.mime }), m.name);
  if (m.alt?.trim()) fd.append("description", m.alt.trim().slice(0, 1500));
  const r = await call<MediaAttachment>(`${base}/api/v2/media`, { method: "POST", headers: bearer(tok), body: fd, signal: AbortSignal.timeout(180000) }, { what: "Mastodon upload" });
  // 202 means the server is still processing it (videos, large pictures): wait until it has a url.
  let att = r;
  for (let i = 0; !att.url; i++) {
    if (i >= 60) throw new Error("Mastodon media is still processing; will retry");
    await sleep(isVideo(m) ? 5000 : 2000);
    att = await call<MediaAttachment>(`${base}/api/v1/media/${encodeURIComponent(r.id)}`, { headers: bearer(tok) }, { what: "Mastodon media status" });
  }
  return att.id;
}

export const mastodon: Provider = {
  network: "mastodon",
  oauth: {
    configured: () => true,
    asks: [{ key: "instance", label: "Server", placeholder: "mastodon.social" }],
    authUrl: async ({ state, redirect, input }) => {
      const instance = normalize(input.instance);
      const app = await call<{ client_id: string; client_secret: string }>(
        `https://${instance}/api/v1/apps`,
        { method: "POST", body: form({ client_name: "Capybaroar", redirect_uris: redirect, scopes: SCOPES, website: "https://capybaroar.com" }) },
        { what: "Mastodon app" },
      );
      const url = `https://${instance}/oauth/authorize?${qs({ response_type: "code", client_id: app.client_id, redirect_uri: redirect, scope: SCOPES, state })}`;
      return { url, keep: { instance, client_id: app.client_id, client_secret: app.client_secret } };
    },
    exchange: async ({ code, redirect, input }): Promise<Account[]> => {
      const instance = normalize(input.instance);
      if (!input.client_id || !input.client_secret) throw new PostError("Mastodon sign-in expired; try again");
      const t = await call<{ access_token: string }>(
        `https://${instance}/oauth/token`,
        { method: "POST", body: form({ grant_type: "authorization_code", code, client_id: input.client_id, client_secret: input.client_secret, redirect_uri: redirect, scope: SCOPES }) },
        { what: "Mastodon sign-in" },
      );
      const me = await call<Me>(`https://${instance}/api/v1/accounts/verify_credentials`, { headers: bearer(t.access_token) }, { what: "Mastodon profile" });
      return [
        {
          accountId: `${me.id}@${instance}`,
          name: me.display_name || me.username,
          username: `${me.username}@${instance}`,
          avatar: me.avatar ?? null,
          accessToken: t.access_token,
          refreshToken: null,
          expiresAt: null,
          extra: { instance },
        },
      ];
    },
  },
  refreshable: () => false,
  // Verify: 500 characters and 4 attachments are the defaults; some servers allow more.
  check: (p) =>
    [...p.text].length > 500 ? "Mastodon posts are up to 500 characters" : p.media.length > 4 ? "Mastodon takes up to 4 files" : !p.text.trim() && !p.media.length ? "Mastodon posts need text or media" : null,
  publish: async (s, accountId, p) => {
    const base = `https://${instanceOf(s)}`;
    const tok = s.accessToken;
    const ids: string[] = [];
    for (const m of p.media.slice(0, 4)) ids.push(await upload(base, tok, m));
    const visibility = VISIBILITY.has(p.settings.visibility) ? p.settings.visibility : "public";
    const spoiler = p.settings.spoiler?.trim();
    // Mastodon drops a repeat with the same Idempotency-Key for an hour, so a retry after a lost response doesn't post twice.
    // Media urls are signed and change between tries, so the key uses the file names instead.
    const key = createHash("sha256")
      .update([accountId, p.text, visibility, spoiler ?? "", ...p.media.map((m) => m.name)].join("\n"))
      .digest("hex");
    const r = await call<{ id: string; url?: string | null; uri: string }>(
      `${base}/api/v1/statuses`,
      {
        method: "POST",
        headers: { ...bearer(tok), "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({ status: p.text, media_ids: ids, visibility, ...(spoiler ? { spoiler_text: spoiler } : {}) }),
      },
      { what: "Mastodon post" },
    );
    return { id: r.id, url: r.url ?? r.uri };
  },
  followers: async (s) => {
    const me = await call<Me>(`https://${instanceOf(s)}/api/v1/accounts/verify_credentials`, { headers: bearer(s.accessToken) }, { what: "Mastodon followers" });
    return me.followers_count ?? null;
  },
};
