// TikTok Direct Post follows TikTok's content sharing rules: comments, Duet and Stitch stay off unless the person turns
// them on (and the account allows them), promotional content sets TikTok's brand flags, and branded content can't be
// private. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { PROVIDERS } from "../src/lib/providers";
import type { MediaFile, Publishable, Secret } from "../src/lib/providers/types";

const secret: Secret = { accessToken: "tok", refreshToken: null, expiresAt: null, extra: {} };
const tt = PROVIDERS.tiktok;
const video = { url: "https://cdn.example.com/a.mp4", name: "a.mp4", mime: "video/mp4", size: 1000, bytes: async () => new Uint8Array(1000) } as unknown as MediaFile;
const post = (settings: Record<string, string>): Publishable => ({ text: "Fresh loaves", media: [video], settings: { privacy: "PUBLIC_TO_EVERYONE", ...settings } });

async function initBody(p: Publishable, creator: Record<string, unknown> = {}) {
  const real = globalThis.fetch;
  let body: Record<string, any> | null = null;
  globalThis.fetch = (async (u: string | URL | Request, init: RequestInit = {}) => {
    const url = String(u);
    if (url.includes("creator_info")) return Response.json({ data: { privacy_level_options: ["PUBLIC_TO_EVERYONE", "SELF_ONLY"], ...creator }, error: { code: "ok" } });
    if (url.includes("/video/init/")) {
      body = JSON.parse(String(init.body));
      return Response.json({ data: { publish_id: "p1", upload_url: "https://upload.example.com/x" }, error: { code: "ok" } });
    }
    if (url.startsWith("https://upload.example.com")) return new Response(null, { status: 201 });
    return Response.json({ data: { status: "PUBLISH_COMPLETE", publicaly_available_post_id: [42] }, error: { code: "ok" } });
  }) as typeof fetch;
  try {
    await tt.publish(secret, "open1", p);
  } finally {
    globalThis.fetch = real;
  }
  return body!.post_info;
}

test("comments, Duet and Stitch stay off unless turned on", async () => {
  const off = await initBody(post({}));
  assert.equal(off.disable_comment, true);
  assert.equal(off.disable_duet, true);
  assert.equal(off.disable_stitch, true);
  const on = await initBody(post({ comments: "on", duet: "on", stitch: "on" }));
  assert.equal(on.disable_comment, false);
  assert.equal(on.disable_duet, false);
  assert.equal(on.disable_stitch, false);
});

test("the account's own TikTok settings win over the post's", async () => {
  const p = await initBody(post({ comments: "on", duet: "on", stitch: "on" }), { comment_disabled: true, duet_disabled: true, stitch_disabled: false });
  assert.equal(p.disable_comment, true);
  assert.equal(p.disable_duet, true);
  assert.equal(p.disable_stitch, false);
});

test("promotional content sets TikTok's brand flags", async () => {
  const none = await initBody(post({ brand: "off" }));
  assert.equal(none.brand_organic_toggle, false);
  assert.equal(none.brand_content_toggle, false);
  const own = await initBody(post({ brand: "own" }));
  assert.equal(own.brand_organic_toggle, true);
  assert.equal(own.brand_content_toggle, false);
  const paid = await initBody(post({ brand: "branded" }));
  assert.equal(paid.brand_content_toggle, true);
});

test("branded content can't be private", () => {
  assert.equal(tt.check!(post({ brand: "branded", privacy: "SELF_ONLY" })), "Branded content can't be set to Only me on TikTok");
  assert.equal(tt.check!(post({ brand: "branded" })), null);
  assert.equal(tt.check!(post({ brand: "own", privacy: "SELF_ONLY" })), null);
});

test("a failed sign-in says TikTok's reason instead of calling on with no token", async () => {
  const real = globalThis.fetch;
  const urls: string[] = [];
  const types: string[] = [];
  globalThis.fetch = (async (u: string | URL | Request, init: RequestInit = {}) => {
    urls.push(String(u));
    types.push(new Headers(init.headers).get("content-type") ?? "");
    assert.equal(typeof init.body, "string", "the body goes as a string so fetch adds no charset");
    return Response.json({ error: "invalid_client", error_description: "Client key or secret is incorrect.", log_id: "x" });
  }) as typeof fetch;
  try {
    await assert.rejects(tt.oauth!.exchange({ code: "c", redirect: "https://app.example.com/cb", verifier: "v", input: {} }), /TikTok sign-in: Client key or secret is incorrect\./);
  } finally {
    globalThis.fetch = real;
  }
  assert.equal(urls.length, 1, "no profile call without a token");
  assert.deepEqual(types, ["application/x-www-form-urlencoded"], "TikTok rejects the type with ;charset=UTF-8");
});

test("TikTok error codes come out in plain words", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = (async () =>
    Response.json({ data: {}, error: { code: "unaudited_client_can_only_post_to_private_accounts", message: "Please review our integration guidelines at https://developers.tiktok.com/doc/content-sharing-guidelines/" } })) as typeof fetch;
  try {
    await assert.rejects(tt.publish(secret, "open1", post({ privacy: "SELF_ONLY" })), /set the TikTok account to private and post as Only me/);
  } finally {
    globalThis.fetch = real;
  }
});

test("sign-in always shows TikTok's approval page, and disconnect revokes the token", async () => {
  const url = String(await tt.oauth!.authUrl({ state: "s", redirect: "https://app.example.com/cb", verifier: "v", input: {} }));
  assert.equal(new URL(url).searchParams.get("disable_auto_auth"), "1");
  assert.equal(new URL(url).searchParams.get("scope"), "user.info.basic,user.info.profile,video.publish");
  const real = globalThis.fetch;
  const seen: { url: string; body: string }[] = [];
  globalThis.fetch = (async (u: string | URL | Request, init: RequestInit = {}) => {
    seen.push({ url: String(u), body: String(init.body) });
    return Response.json({});
  }) as typeof fetch;
  try {
    await tt.revoke!(secret);
  } finally {
    globalThis.fetch = real;
  }
  assert.match(seen[0].url, /\/v2\/oauth\/revoke\/$/);
  assert.equal(new URLSearchParams(seen[0].body).get("token"), "tok");
});

test("a published TikTok links to the video, or to the profile when TikTok gives no id (private posts)", async () => {
  const run = async (ids: number[]) => {
    const real = globalThis.fetch;
    globalThis.fetch = (async (u: string | URL | Request) => {
      const url = String(u);
      if (url.includes("creator_info")) return Response.json({ data: { privacy_level_options: ["SELF_ONLY", "PUBLIC_TO_EVERYONE"] }, error: { code: "ok" } });
      if (url.includes("/video/init/")) return Response.json({ data: { publish_id: "p1", upload_url: "https://upload.example.com/x" }, error: { code: "ok" } });
      if (url.startsWith("https://upload.example.com")) return new Response(null, { status: 201 });
      if (url.includes("/user/info/")) return Response.json({ data: { user: { username: "crumbandco" } }, error: { code: "ok" } });
      return Response.json({ data: { status: "PUBLISH_COMPLETE", publicaly_available_post_id: ids }, error: { code: "ok" } });
    }) as typeof fetch;
    try {
      return await tt.publish(secret, "open1", post({ privacy: "SELF_ONLY" }));
    } finally {
      globalThis.fetch = real;
    }
  };
  assert.equal((await run([42])).url, "https://www.tiktok.com/@crumbandco/video/42");
  assert.equal((await run([])).url, "https://www.tiktok.com/@crumbandco");
});

// Photo posts: 1 to 35 JPG or WebP pictures, pulled by TikTok from their links.
import { photoBody, setStatusWait, tiktokProblem } from "../src/lib/providers/tiktok";
import { PostError as PhotoPostError } from "../src/lib/providers/types";

setStatusWait(3, 0);
const jpg = (n = 1) => Array.from({ length: n }, (_, i) => ({ url: `https://db.example.com/p${i}.jpg`, name: `p${i}.jpg`, mime: "image/jpeg", size: 1000, bytes: async () => Buffer.alloc(1) }) as unknown as MediaFile);

test("photo posts: 1 to 35 JPG or WebP pictures, never mixed with a video", () => {
  const p = (media: MediaFile[], settings: Record<string, string> = {}) => ({ text: "Fresh loaves", media, settings: { privacy: "PUBLIC_TO_EVERYONE", ...settings } });
  assert.equal(tiktokProblem(p(jpg(1))), null);
  assert.equal(tiktokProblem(p(jpg(35))), null);
  assert.equal(tiktokProblem(p(jpg(36))), "TikTok photo posts take up to 35 pictures");
  assert.equal(tiktokProblem(p([...jpg(1), video])), "TikTok takes one video, or pictures only");
  assert.equal(tiktokProblem(p([{ ...jpg(1)[0], mime: "image/png" } as MediaFile])), "TikTok photo posts take JPG or WebP pictures");
  assert.equal(tiktokProblem(p([{ ...jpg(1)[0], size: 21 * 1024 * 1024 } as MediaFile])), "TikTok pictures must be under 20 MB");
  assert.equal(tiktokProblem(p(jpg(2), { title: "x".repeat(91) })), "TikTok photo titles are up to 90 characters");
  assert.equal(tiktokProblem(p([])), "TikTok needs one video, or 1 to 35 pictures");
  assert.equal(tiktokProblem(p([video])), null);
});

test("a photo post sends the picture links, the caption as description, and keeps comments off unless turned on", () => {
  const b = photoBody({ text: "Fresh loaves", settings: { title: " Bake day ", brand: "own" } }, jpg(2), "SELF_ONLY", { commentOff: false });
  assert.deepEqual(b.source_info, { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: ["https://db.example.com/p0.jpg", "https://db.example.com/p1.jpg"] });
  assert.equal(b.media_type, "PHOTO");
  assert.equal(b.post_mode, "DIRECT_POST");
  assert.deepEqual(b.post_info, { title: "Bake day", description: "Fresh loaves", privacy_level: "SELF_ONLY", disable_comment: true, auto_add_music: true, brand_organic_toggle: true, brand_content_toggle: false });
  assert.equal(photoBody({ text: "x", settings: { comments: "on" } }, jpg(1), "SELF_ONLY", { commentOff: false }).post_info.disable_comment, false);
  assert.equal(photoBody({ text: "x", settings: { comments: "on" } }, jpg(1), "SELF_ONLY", { commentOff: true }).post_info.disable_comment, true);
  assert.equal("title" in photoBody({ text: "x", settings: {} }, jpg(1), "SELF_ONLY", { commentOff: false }).post_info, false);
});

async function photoRun(status: Record<string, unknown>) {
  const real = globalThis.fetch;
  const sent: string[] = [];
  globalThis.fetch = (async (u: string | URL | Request) => {
    const url = String(u);
    sent.push(url);
    if (url.includes("creator_info")) return Response.json({ data: { privacy_level_options: ["PUBLIC_TO_EVERYONE", "SELF_ONLY"] }, error: { code: "ok" } });
    if (url.includes("/content/init/")) return Response.json({ data: { publish_id: "ph1" }, error: { code: "ok" } });
    if (url.includes("status/fetch")) return Response.json({ data: status, error: { code: "ok" } });
    return Response.json({ data: { user: { username: "crumb" } }, error: { code: "ok" } });
  }) as typeof fetch;
  try {
    return { out: await tt.publish(secret, "open1", { text: "Fresh loaves", media: jpg(3), settings: { privacy: "PUBLIC_TO_EVERYONE" } }), sent };
  } finally {
    globalThis.fetch = real;
  }
}

test("a photo post goes through content/init, never the video upload, and waits for TikTok", async () => {
  const { out, sent } = await photoRun({ status: "PUBLISH_COMPLETE", publicaly_available_post_id: [77] });
  assert.equal(out.id, "77");
  assert.ok(sent.some((u) => u.includes("/post/publish/content/init/")));
  assert.ok(!sent.some((u) => u.includes("/video/init/")));
});

test("an unverified media domain fails for good with what to do", async () => {
  await assert.rejects(photoRun({ status: "FAILED", fail_reason: "url_ownership_unverified" }), (e: unknown) => e instanceof PhotoPostError && /verify Capybaroar's media domain/.test((e as Error).message));
});
