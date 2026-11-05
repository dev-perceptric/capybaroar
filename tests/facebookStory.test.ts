// Facebook Page Stories: the documented calls (Page Stories API), no first comment, and Story ids that stats and delete
// recognise. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { PROVIDERS } from "../src/lib/providers";
import type { MediaFile, Publishable, Secret } from "../src/lib/providers/types";

const secret: Secret = { accessToken: "tok", refreshToken: null, expiresAt: null, extra: {} };
const fb = PROVIDERS.facebook;

type Seen = { url: string; method: string; headers: Record<string, string>; body: string };
async function withFetch(answer: (s: Seen, i: number) => Response, run: () => Promise<unknown>) {
  const real = globalThis.fetch;
  const seen: Seen[] = [];
  globalThis.fetch = (async (u: string | URL | Request, init: RequestInit = {}) => {
    const s = { url: String(u), method: init.method ?? "GET", headers: Object.fromEntries(new Headers(init.headers).entries()), body: init.body ? String(init.body) : "" };
    seen.push(s);
    return answer(s, seen.length - 1);
  }) as typeof fetch;
  try {
    await run();
  } finally {
    globalThis.fetch = real;
  }
  return seen;
}

const file = (name: string, mime: string): MediaFile => ({ url: `https://cdn.example.com/${name}`, name, mime, size: 1000, bytes: async () => new Uint8Array(1000) }) as unknown as MediaFile;
const photo = file("a.jpg", "image/jpeg");
const video = file("a.mp4", "video/mp4");
const story = (media: MediaFile[], settings: Record<string, string> = {}): Publishable => ({ text: "Croissant day", media, settings: { format: "story", ...settings } });
const params = (body: string) => Object.fromEntries(new URLSearchParams(body));

test("a Facebook Story is exactly one picture or one video", () => {
  assert.equal(fb.check!(story([photo])), null);
  assert.equal(fb.check!(story([video])), null);
  assert.equal(fb.check!(story([])), "A Facebook Story is one picture or video");
  assert.equal(fb.check!(story([photo, photo])), "A Facebook Story is one picture or video");
  // Posts and Reels keep their rules.
  assert.equal(fb.check!({ text: "hi", media: [photo, photo], settings: { format: "post" } }), null);
  assert.equal(fb.check!({ text: "hi", media: [photo], settings: { format: "reel" } }), "A Facebook Reel is one video");
});

test("photo Story: unpublished upload to /photos, then /photo_stories with its photo_id, and no first comment", async () => {
  let out: { id: string; url?: string | null } | undefined;
  const seen = await withFetch(
    (s) => (s.url.includes("/photos") ? Response.json({ id: "ph1" }) : Response.json({ success: true, post_id: "777" })),
    async () => {
      out = await fb.publish(secret, "page1", story([photo], { first_comment: "Order here" }));
    },
  );
  assert.equal(seen.length, 2);
  assert.match(seen[0].url, /\/page1\/photos$/);
  assert.equal(seen[0].method, "POST");
  assert.deepEqual(params(seen[0].body), { url: photo.url, published: "false", access_token: "tok" });
  assert.match(seen[1].url, /\/page1\/photo_stories$/);
  assert.deepEqual(params(seen[1].body), { photo_id: "ph1", access_token: "tok" });
  assert.equal(out?.id, "story:777");
  assert.ok(!seen.some((s) => s.url.includes("/comments")), "Stories never get a first comment");
});

test("video Story: start, upload by file_url to rupload, finish with the video_id", async () => {
  let out: { id: string } | undefined;
  const seen = await withFetch(
    (s, i) =>
      i === 0
        ? Response.json({ video_id: "v9", upload_url: "https://rupload.facebook.com/video-upload/v24.0/v9" })
        : i === 1
          ? Response.json({ success: true })
          : Response.json({ success: true, post_id: 4242 }),
    async () => {
      out = await fb.publish(secret, "page1", story([video]));
    },
  );
  assert.equal(seen.length, 3);
  assert.match(seen[0].url, /\/page1\/video_stories$/);
  assert.deepEqual(params(seen[0].body), { upload_phase: "start", access_token: "tok" });
  assert.equal(seen[1].url, "https://rupload.facebook.com/video-upload/v24.0/v9");
  assert.equal(seen[1].headers.file_url, video.url);
  assert.equal(seen[1].headers.authorization, "OAuth tok");
  assert.match(seen[2].url, /\/page1\/video_stories$/);
  assert.deepEqual(params(seen[2].body), { upload_phase: "finish", video_id: "v9", access_token: "tok" });
  assert.equal(out?.id, "story:4242");
});

test("a Story Facebook didn't confirm fails the post instead of saving a wrong id", async () => {
  await withFetch(
    (s) => (s.url.includes("/photos") ? Response.json({ id: "ph1" }) : Response.json({ success: false })),
    () => assert.rejects(fb.publish(secret, "page1", story([photo])), /didn't publish the Story/),
  );
});

test("Story stats ask nothing; Story delete uses the bare post id", async () => {
  const stats = await withFetch(() => Response.json({}), async () => assert.deepEqual(await fb.postStats!(secret, "page1", "story:777"), {}));
  assert.equal(stats.length, 0);
  const del = await withFetch(() => Response.json({ success: true }), () => fb.unpublish!(secret, "page1", { id: "story:777", url: null, at: new Date(), media: 1, text: "" }));
  assert.equal(del[0].method, "DELETE");
  assert.match(del[0].url, /\/777\?access_token=tok$/);
});
