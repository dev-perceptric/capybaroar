import { AuthError, PostError, call, form, isVideo, qs, type Account, type Provider, type Publishable, type Published, type Secret } from "./types";

// LinkedIn: Sign In with LinkedIn (OpenID) + Share on LinkedIn for people; Community Management API for Pages.
// Pages use their own app (LinkedIn wants that product alone on its app).
const VERSION = () => process.env.LINKEDIN_VERSION || "202607";
const rest = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "LinkedIn-Version": VERSION(),
  "X-Restli-Protocol-Version": "2.0.0",
  "Content-Type": "application/json",
});

// Post text uses LinkedIn's "little text" format, where these characters mean something and must be escaped.
const escape = (t: string) => t.replace(/[\\|{}@[\]()<>#*_~]/g, (c) => `\\${c}`);

async function token(code: string, redirect: string, id: string, secret: string) {
  return call<{ access_token: string; expires_in: number; refresh_token?: string; refresh_token_expires_in?: number }>(
    "https://www.linkedin.com/oauth/v2/accessToken",
    { method: "POST", body: form({ grant_type: "authorization_code", code, redirect_uri: redirect, client_id: id, client_secret: secret }) },
    { what: "LinkedIn sign-in" },
  );
}

async function refreshWith(s: Secret, id: string, secret: string) {
  if (!s.refreshToken) throw new AuthError("LinkedIn sign-in expired");
  const t = await call<{ access_token: string; expires_in: number; refresh_token?: string }>(
    "https://www.linkedin.com/oauth/v2/accessToken",
    { method: "POST", body: form({ grant_type: "refresh_token", refresh_token: s.refreshToken, client_id: id, client_secret: secret }) },
    { what: "LinkedIn refresh" },
  );
  return { accessToken: t.access_token, refreshToken: t.refresh_token ?? s.refreshToken, expiresAt: new Date(Date.now() + t.expires_in * 1000) };
}

async function uploadImage(tok: string, owner: string, bytes: Buffer) {
  const init = await call<{ value: { uploadUrl: string; image: string } }>(
    "https://api.linkedin.com/rest/images?action=initializeUpload",
    { method: "POST", headers: rest(tok), body: JSON.stringify({ initializeUploadRequest: { owner } }) },
    { what: "LinkedIn image upload" },
  );
  const put = await fetch(init.value.uploadUrl, { method: "PUT", headers: { Authorization: `Bearer ${tok}` }, body: new Uint8Array(bytes) });
  if (!put.ok) throw new Error(`LinkedIn image upload: ${put.status}`);
  return init.value.image;
}

async function uploadVideo(tok: string, owner: string, bytes: Buffer) {
  const init = await call<{ value: { video: string; uploadToken: string; uploadInstructions: { uploadUrl: string; firstByte: number; lastByte: number }[] } }>(
    "https://api.linkedin.com/rest/videos?action=initializeUpload",
    { method: "POST", headers: rest(tok), body: JSON.stringify({ initializeUploadRequest: { owner, fileSizeBytes: bytes.length, uploadCaptions: false, uploadThumbnail: false } }) },
    { what: "LinkedIn video upload" },
  );
  const parts: string[] = [];
  for (const ins of init.value.uploadInstructions) {
    const put = await fetch(ins.uploadUrl, { method: "PUT", headers: { "Content-Type": "application/octet-stream" }, body: new Uint8Array(bytes.subarray(ins.firstByte, ins.lastByte + 1)), signal: AbortSignal.timeout(300000) });
    if (!put.ok) throw new Error(`LinkedIn video upload: ${put.status}`);
    parts.push(put.headers.get("etag") ?? "");
  }
  await call(
    "https://api.linkedin.com/rest/videos?action=finalizeUpload",
    { method: "POST", headers: rest(tok), body: JSON.stringify({ finalizeUploadRequest: { video: init.value.video, uploadToken: init.value.uploadToken, uploadedPartIds: parts } }) },
    { what: "LinkedIn video upload" },
  );
  return init.value.video;
}

async function post(tok: string, author: string, p: Publishable): Promise<Published> {
  const videos = p.media.filter(isVideo);
  if (videos.length > 1 || (videos.length && p.media.length > 1)) throw new PostError("LinkedIn takes one video, or pictures only");
  let content: Record<string, unknown> | undefined;
  if (videos.length) content = { media: { id: await uploadVideo(tok, author, await videos[0].bytes()) } };
  else if (p.media.length) {
    const images: { id: string; altText?: string }[] = [];
    for (const m of p.media.slice(0, 20)) images.push({ id: await uploadImage(tok, author, await m.bytes()), ...(m.alt ? { altText: m.alt.slice(0, 4086) } : {}) });
    content = images.length === 1 ? { media: images[0] } : { multiImage: { images } };
  }
  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: rest(tok),
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({
      author,
      commentary: escape(p.text),
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
      ...(content ? { content } : {}),
    }),
  });
  if (!res.ok) {
    const msg = `LinkedIn post: ${res.status} ${(await res.text()).slice(0, 300)}`;
    if (res.status === 401) throw new AuthError(msg);
    if (res.status === 400 || res.status === 403 || res.status === 422) throw new PostError(msg);
    throw new Error(msg);
  }
  const id = res.headers.get("x-restli-id") ?? "";
  const out: Published = { id, url: id ? `https://www.linkedin.com/feed/update/${id}/` : null };
  // The post is live: from here on, problems go in the note, never a throw (a retry would post twice).
  const comment = p.settings.first_comment?.trim();
  if (comment && id) {
    try {
      await call(
        `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(id)}/comments`,
        { method: "POST", headers: rest(tok), body: JSON.stringify({ actor: author, object: id, message: { text: comment } }) },
        { what: "LinkedIn first comment" },
      );
    } catch (e) {
      out.note = e instanceof Error ? e.message : String(e);
    }
  }
  return out;
}

const personId = () => process.env.LINKEDIN_CLIENT_ID ?? "";
const personSecret = () => process.env.LINKEDIN_CLIENT_SECRET ?? "";
const pageId = () => process.env.LINKEDIN_PAGE_CLIENT_ID || personId();
const pageSecret = () => process.env.LINKEDIN_PAGE_CLIENT_SECRET || personSecret();

export const linkedin: Provider = {
  network: "linkedin",
  oauth: {
    configured: () => Boolean(personId() && personSecret()),
    authUrl: ({ state, redirect }) =>
      `https://www.linkedin.com/oauth/v2/authorization?${qs({ response_type: "code", client_id: personId(), redirect_uri: redirect, state, scope: "openid profile w_member_social" })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const t = await token(code, redirect, personId(), personSecret());
      const me = await call<{ sub: string; name: string; picture?: string }>("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${t.access_token}` } }, { what: "LinkedIn profile" });
      return [
        {
          accountId: me.sub,
          name: me.name,
          avatar: me.picture ?? null,
          accessToken: t.access_token,
          refreshToken: t.refresh_token ?? null,
          expiresAt: new Date(Date.now() + t.expires_in * 1000),
        },
      ];
    },
  },
  refresh: (s) => refreshWith(s, personId(), personSecret()),
  check: (p) => (p.media.filter(isVideo).length && p.media.length > 1 ? "LinkedIn takes one video, or pictures only" : null),
  publish: (s, accountId, p) => post(s.accessToken, `urn:li:person:${accountId}`, p),
};

export const linkedinPage: Provider = {
  network: "linkedin-page",
  oauth: {
    configured: () => Boolean(pageId() && pageSecret()),
    authUrl: ({ state, redirect }) =>
      `https://www.linkedin.com/oauth/v2/authorization?${qs({
        response_type: "code",
        client_id: pageId(),
        redirect_uri: redirect,
        state,
        scope: "r_basicprofile rw_organization_admin w_organization_social r_organization_social",
      })}`,
    exchange: async ({ code, redirect }): Promise<Account[]> => {
      const t = await token(code, redirect, pageId(), pageSecret());
      const acl = await call<{ elements: { organization: string }[] }>(
        `https://api.linkedin.com/rest/organizationAcls?${qs({ q: "roleAssignee", role: "ADMINISTRATOR", state: "APPROVED" })}`,
        { headers: rest(t.access_token) },
        { what: "LinkedIn Pages" },
      );
      const accounts: Account[] = [];
      for (const el of acl.elements ?? []) {
        const id = el.organization.split(":").pop()!;
        const org = await call<{ localizedName: string; vanityName?: string }>(`https://api.linkedin.com/rest/organizations/${id}`, { headers: rest(t.access_token) }, { what: "LinkedIn Page" });
        accounts.push({
          accountId: id,
          name: org.localizedName,
          username: org.vanityName ?? null,
          accessToken: t.access_token,
          refreshToken: t.refresh_token ?? null,
          expiresAt: new Date(Date.now() + t.expires_in * 1000),
        });
      }
      if (!accounts.length) throw new PostError("This LinkedIn account isn't an admin of any Page");
      return accounts;
    },
  },
  refresh: (s) => refreshWith(s, pageId(), pageSecret()),
  check: (p) => (p.media.filter(isVideo).length && p.media.length > 1 ? "LinkedIn takes one video, or pictures only" : null),
  publish: (s, accountId, p) => post(s.accessToken, `urn:li:organization:${accountId}`, p),
  followers: async (s, accountId) => {
    const r = await call<{ firstDegreeSize?: number }>(
      `https://api.linkedin.com/rest/networkSizes/${encodeURIComponent(`urn:li:organization:${accountId}`)}?edgeType=COMPANY_FOLLOWED_BY_MEMBER`,
      { headers: rest(s.accessToken) },
      { what: "LinkedIn followers" },
    );
    return r.firstDegreeSize ?? null;
  },
};
