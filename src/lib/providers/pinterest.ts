import { AuthError, PostError, call, form, isVideo, qs, sleep, type Account, type MediaFile, type Provider } from "./types";

// Pinterest: OAuth + API v5. Image pins from a link; video pins uploaded through Pinterest's media upload.
const API = "https://api.pinterest.com/v5";
const id = () => process.env.PINTEREST_CLIENT_ID ?? "";
const secret = () => process.env.PINTEREST_CLIENT_SECRET ?? "";
const basic = () => `Basic ${Buffer.from(`${id()}:${secret()}`).toString("base64")}`;
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const json = (token: string) => ({ ...auth(token), "Content-Type": "application/json" });

type Token = { access_token: string; expires_in: number; refresh_token?: string };
type User = { id?: string; username: string; business_name?: string | null; profile_image?: string | null; follower_count?: number };

const token = (body: Record<string, string>, what: string) =>
  call<Token>(`${API}/oauth/token`, { method: "POST", headers: { Authorization: basic(), "Content-Type": "application/x-www-form-urlencoded" }, body: form(body) }, { what });

async function boardId(tok: string, name: string) {
  const want = name.trim().toLowerCase();
  let bookmark = "";
  do {
    const r = await call<{ items: { id: string; name: string }[]; bookmark?: string | null }>(
      `${API}/boards?${qs({ page_size: "250", ...(bookmark ? { bookmark } : {}) })}`,
      { headers: auth(tok) },
      { what: "Pinterest boards" },
    );
    const hit = r.items.find((b) => b.name.trim().toLowerCase() === want);
    if (hit) return hit.id;
    bookmark = r.bookmark ?? "";
  } while (bookmark);
  throw new PostError(`Pinterest board "${name}" wasn't found`);
}

async function uploadVideo(tok: string, video: MediaFile) {
  const reg = await call<{ media_id: string; upload_url: string; upload_parameters: Record<string, string> }>(
    `${API}/media`,
    { method: "POST", headers: json(tok), body: JSON.stringify({ media_type: "video" }) },
    { what: "Pinterest video upload" },
  );
  // upload_url is a presigned S3 form: every upload_parameters field first, the file last.
  const body = new FormData();
  for (const [k, v] of Object.entries(reg.upload_parameters)) body.append(k, v);
  body.append("file", new Blob([new Uint8Array(await video.bytes())], { type: video.mime }), video.name);
  const up = await fetch(reg.upload_url, { method: "POST", body, signal: AbortSignal.timeout(30 * 60000) });
  if (!up.ok) throw new Error(`Pinterest video upload: ${up.status} ${(await up.text()).slice(0, 300)}`);
  for (let i = 0; i < 60; i++) {
    const st = await call<{ status: "registered" | "processing" | "succeeded" | "failed" }>(`${API}/media/${reg.media_id}`, { headers: auth(tok) }, { what: "Pinterest video processing" });
    if (st.status === "succeeded") return reg.media_id;
    if (st.status === "failed") throw new PostError("Pinterest couldn't process this video");
    await sleep(5000);
  }
  throw new Error("Pinterest video is still processing; will retry");
}

/** A 404 from call() comes back as a plain Error; the post was deleted. */
const gone = (e: unknown) => e instanceof Error && !(e instanceof AuthError) && !(e instanceof PostError) && /\b404\b|not found/i.test(e.message);

export const pinterest: Provider = {
  network: "pinterest",
  oauth: {
    configured: () => Boolean(id() && secret()),
    authUrl: ({ state, redirect }) =>
      `https://www.pinterest.com/oauth/?${qs({
        client_id: id(),
        redirect_uri: redirect,
        response_type: "code",
        scope: "boards:read,boards:write,pins:read,pins:write,user_accounts:read",
        state,
      })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const t = await token({ grant_type: "authorization_code", code, redirect_uri: redirect }, "Pinterest sign-in");
      const u = await call<User>(`${API}/user_account`, { headers: auth(t.access_token) }, { what: "Pinterest profile" });
      return [
        {
          accountId: u.id ?? u.username,
          name: u.business_name || u.username,
          username: u.username,
          avatar: u.profile_image ?? null,
          accessToken: t.access_token,
          refreshToken: t.refresh_token ?? null,
          expiresAt: new Date(Date.now() + t.expires_in * 1000),
        },
      ];
    },
  },
  refresh: async (s) => {
    if (!s.refreshToken) throw new AuthError("Pinterest sign-in expired");
    try {
      // Verify: apps on continuous refresh get a new refresh_token each time; older apps keep the old one.
      const t = await token({ grant_type: "refresh_token", refresh_token: s.refreshToken }, "Pinterest refresh");
      return { accessToken: t.access_token, refreshToken: t.refresh_token ?? s.refreshToken, expiresAt: new Date(Date.now() + t.expires_in * 1000) };
    } catch (e) {
      if (e instanceof PostError) throw new AuthError(e.message);
      throw e;
    }
  },
  check: (p) => {
    if (p.media.length !== 1) return "Pinterest needs one picture or one video";
    if (!(p.settings.board ?? "").trim()) return "Pinterest needs a board";
    if ((p.settings.title ?? "").length > 100) return "Pinterest titles are up to 100 characters";
    if (p.text.length > 800) return "Pinterest descriptions are up to 800 characters";
    return null;
  },
  publish: async (s, _accountId, p) => {
    const tok = s.accessToken;
    const m = p.media[0];
    const board_id = await boardId(tok, p.settings.board ?? "");
    const media_source = isVideo(m)
      ? {
          source_type: "video_id",
          media_id: await uploadVideo(tok, m),
          // Pinterest needs a cover: the chosen picture, or the first frame.
          ...(p.cover ? { cover_image_url: p.cover.url } : { cover_image_key_frame_time: 0 }),
        }
      : { source_type: "image_url", url: m.url };
    const title = (p.settings.title ?? "").trim().slice(0, 100);
    const link = (p.settings.link ?? "").trim();
    const r = await call<{ id: string }>(
      `${API}/pins`,
      {
        method: "POST",
        headers: json(tok),
        body: JSON.stringify({
          board_id,
          description: p.text,
          media_source,
          ...(title ? { title } : {}),
          ...(link ? { link } : {}),
          ...(m.alt ? { alt_text: m.alt.slice(0, 500) } : {}),
        }),
      },
      { what: "Pinterest pin" },
    );
    return { id: r.id, url: `https://www.pinterest.com/pin/${r.id}/` };
  },
  unpublish: async (s, _accountId, r) => {
    await call(`${API}/pins/${encodeURIComponent(r.id)}`, { method: "DELETE", headers: auth(s.accessToken) }, { what: "Pinterest delete" });
  },
  followers: async (s) => (await call<User>(`${API}/user_account`, { headers: auth(s.accessToken) }, { what: "Pinterest followers" })).follower_count ?? null,
  postStats: async (s, _accountId, remoteId) => {
    const day = (d: Date) => d.toISOString().slice(0, 10);
    const end = new Date();
    // Pinterest allows up to 90 days back.
    const start = new Date(end.getTime() - 89 * 86400000);
    // Verify: metric names and the summary_metrics shape against the v5 pin analytics docs.
    type Analytics = { all?: { summary_metrics?: Record<string, number> } };
    const r = await call<Analytics>(
      `${API}/pins/${encodeURIComponent(remoteId)}/analytics?${qs({ start_date: day(start), end_date: day(end), metric_types: "IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK,VIDEO_MRC_VIEW" })}`,
      { headers: auth(s.accessToken) },
      { what: "Pinterest post stats" },
    ).catch((e) => {
      // Gone, or analytics not available for this pin or account.
      if (gone(e) || e instanceof PostError) return null;
      throw e;
    });
    const m = r?.all?.summary_metrics;
    if (!m) return {};
    const n = (v: unknown) => (typeof v === "number" ? v : null);
    const clicks = n(m.PIN_CLICK) == null && n(m.OUTBOUND_CLICK) == null ? null : (n(m.PIN_CLICK) ?? 0) + (n(m.OUTBOUND_CLICK) ?? 0);
    return { impressions: n(m.IMPRESSION), saves: n(m.SAVE), clicks, views: n(m.VIDEO_MRC_VIEW) };
  },
};
