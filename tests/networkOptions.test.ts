// YouTube category, notify subscribers and the synthetic content label; Instagram Trial Reels; Pinterest board
// sections. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { PROVIDERS } from "../src/lib/providers";
import { videoResource } from "../src/lib/providers/youtube";
import { trialParams } from "../src/lib/providers/meta";
import { PostError, type MediaFile, type Secret } from "../src/lib/providers/types";

const secret: Secret = { accessToken: "tok", refreshToken: null, expiresAt: null, extra: {} };
const pic: MediaFile = { url: "https://cdn.example.com/a.jpg", mime: "image/jpeg", size: 10, name: "a.jpg", bytes: async () => Buffer.alloc(10) };
const vid: MediaFile = { url: "https://cdn.example.com/a.mp4", mime: "video/mp4", size: 10, name: "a.mp4", bytes: async () => Buffer.alloc(10) };

async function capture(run: () => Promise<unknown>, answer: (url: string, init: RequestInit) => Response) {
  const real = globalThis.fetch;
  const sent: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (u: string | URL | Request, init: RequestInit = {}) => {
    sent.push({ url: String(u), init });
    return answer(String(u), init);
  }) as typeof fetch;
  try {
    await run();
  } finally {
    globalThis.fetch = real;
  }
  return sent;
}

test("YouTube: category, made for kids and the synthetic label go in the video; unknown categories fall back to People and blogs", () => {
  const r = videoResource({ text: "d", settings: { title: " T ", category: "27", synthetic: "yes", for_kids: "no", privacy: "unlisted" } });
  assert.deepEqual(r.snippet, { title: "T", description: "d", tags: [], categoryId: "27" });
  assert.deepEqual(r.status, { privacyStatus: "unlisted", selfDeclaredMadeForKids: false, containsSyntheticMedia: true });
  assert.equal(videoResource({ text: "d", settings: { category: "999" } }).snippet.categoryId, "22");
  assert.equal(videoResource({ text: "d", settings: {} }).status.containsSyntheticMedia, false);
});

test("YouTube: subscribers are notified unless turned off", async () => {
  const upload = (notify?: string) =>
    capture(
      () => PROVIDERS.youtube.publish(secret, "ch", { text: "d", media: [vid], settings: { title: "T", ...(notify ? { notify } : {}) } }),
      (url, init) => (init.method === "PUT" ? Response.json({ id: "v1" }) : new Response(null, { status: 200, headers: { location: "https://upload.example.com/s" } })),
    );
  const on = await upload();
  assert.equal(new URL(on[0].url).searchParams.get("notifySubscribers"), "true");
  const off = await upload("no");
  assert.equal(new URL(off[0].url).searchParams.get("notifySubscribers"), "false");
});

test("Instagram: a Trial Reel goes to followers by hand or when it does well; only Reels can be trials", () => {
  assert.deepEqual(trialParams({ format: "reel", trial: "manual" }), { trial_params: '{"graduation_strategy":"MANUAL"}' });
  assert.deepEqual(trialParams({ format: "reel", trial: "auto" }), { trial_params: '{"graduation_strategy":"SS_PERFORMANCE"}' });
  assert.deepEqual(trialParams({ format: "reel", trial: "off" }), {});
  assert.deepEqual(trialParams({ format: "post", trial: "manual" }), {});
});

test("Pinterest: a board section is found by name and sent with the Pin", async () => {
  let pin: Record<string, unknown> | null = null;
  const answer = (url: string, init: RequestInit) => {
    if (url.includes("/sections")) return Response.json({ items: [{ id: "s1", name: "Breads" }, { id: "s2", name: "Cakes" }] });
    if (url.includes("/boards")) return Response.json({ items: [{ id: "b1", name: "Recipes" }] });
    if (url.endsWith("/pins")) {
      pin = JSON.parse(String(init.body));
      return Response.json({ id: "p1" });
    }
    return Response.json({});
  };
  await capture(() => PROVIDERS.pinterest.publish(secret, "u", { text: "Rye", media: [pic], settings: { board: "recipes", section: " cakes " } }), answer);
  assert.equal((pin as unknown as { board_section_id: string }).board_section_id, "s2");
  await capture(() => PROVIDERS.pinterest.publish(secret, "u", { text: "Rye", media: [pic], settings: { board: "recipes" } }), answer);
  assert.equal("board_section_id" in (pin as unknown as object), false);
  await assert.rejects(
    capture(() => PROVIDERS.pinterest.publish(secret, "u", { text: "Rye", media: [pic], settings: { board: "recipes", section: "Pies" } }), answer),
    (e: unknown) => e instanceof PostError && /section "Pies" wasn't found/.test((e as Error).message),
  );
});
