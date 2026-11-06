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
