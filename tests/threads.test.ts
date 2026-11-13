// Threads: parts after the first go out as replies to the part before. These cover the pure rules (thread.ts), the API
// input, and the reply each network gets (X, Bluesky, Threads, Mastodon). The publisher's retry rules for threads are
// in publisher.test.ts. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanThread, partProblem, partSettings, splitThread, storedThread, threadOf } from "../src/lib/thread";
import { NETWORKS, THREAD_MAX, takesThread } from "../src/lib/networks";
import { ApiError, postFields } from "../src/lib/api/input";
import { PROVIDERS } from "../src/lib/providers";
import { mastodonNet } from "../src/lib/providers/mastodon";
import type { Publishable, Secret } from "../src/lib/providers/types";
// Mastodon calls go through the safe fetch in the app; here they go to the faked global fetch.
mastodonNet.fetch = (u, init) => globalThis.fetch(u, init);

test("only X, Bluesky, Threads and Mastodon post threads", () => {
  assert.deepEqual(NETWORKS.filter((n) => n.thread).map((n) => n.id).sort(), ["bluesky", "mastodon", "threads", "x"]);
  assert.equal(takesThread("linkedin"), false);
  assert.equal(takesThread("x"), true);
});

test("parts are stored and read back, and malformed rows are skipped", () => {
  const parts = [{ text: "two", mediaIds: ["m1"] }];
  assert.deepEqual(threadOf(storedThread(parts)), parts);
  assert.deepEqual(threadOf([{ text: "ok" }, null, { media_ids: ["x"] }, "nope"]), [{ text: "ok", mediaIds: [] }]);
  assert.deepEqual(threadOf(null), []);
});

test("cleaning trims parts, drops empty ones and caps the count", () => {
  assert.deepEqual(cleanThread([{ text: "  a  ", mediaIds: [] }, { text: " ", mediaIds: [] }, { text: "", mediaIds: ["m", "m"] }]), [
    { text: "a", mediaIds: [] },
    { text: "", mediaIds: ["m"] },
  ]);
  assert.throws(() => cleanThread(Array.from({ length: THREAD_MAX + 1 }, () => ({ text: "x", mediaIds: [] }))), /up to 25 posts/);
});

test("a part over the network's limit is named by its place", () => {
  assert.equal(partProblem({ text: "x".repeat(281), mediaIds: [] }, 3, 280, "X"), "Post 3 of the thread is over X's 280 characters");
  assert.equal(partProblem({ text: "😀".repeat(280), mediaIds: [] }, 2, 280, "X"), null);
});

test("--- on its own line starts the next post", () => {
  assert.deepEqual(splitThread("one\n---\ntwo\n  ---  \nthree\n---\n"), { text: "one", thread: [{ text: "two", mediaIds: [] }, { text: "three", mediaIds: [] }] });
  assert.deepEqual(splitThread("a --- b"), { text: "a --- b", thread: [] });
});

test("later parts keep visibility but not the first comment or cover", () => {
  assert.deepEqual(partSettings({ visibility: "unlisted", first_comment: "hi", cover: "m1" }), { visibility: "unlisted" });
});

test("the API takes a thread as objects or strings, and checks it", () => {
  const A = "11111111-1111-4111-8111-111111111111";
  const f = postFields({ channel_ids: [A], mode: "now", text: "one", thread: ["two", { text: "three", media_ids: [A] }] }, false);
  assert.deepEqual(f.thread, [{ text: "two", mediaIds: [] }, { text: "three", mediaIds: [A] }]);
  const bad = (body: unknown, re: RegExp) => assert.throws(() => postFields(body, false), (e: unknown) => e instanceof ApiError && re.test(e.message));
  bad({ channel_ids: [A], mode: "now", thread: "nope" }, /thread must be a list/);
  bad({ channel_ids: [A], mode: "now", thread: [{ txt: "x" }] }, /unknown field "txt"/);
  bad({ channel_ids: [A], mode: "now", thread: Array.from({ length: 25 }, () => "x") }, /up to 24 posts after the first/);
});

// Each network's reply, read from the request it sends.
const secret = (extra: Record<string, unknown> = {}): Secret => ({ accessToken: "tok", refreshToken: null, expiresAt: null, extra });
const part: Publishable = { text: "part two", media: [], settings: {}, reply: { parent: "P1", root: "R1" } };

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

test("X: a part replies to the part before", async () => {
  const sent = await capture(() => PROVIDERS.x.publish(secret(), "me", part), () => Response.json({ data: { id: "2" } }));
  const body = JSON.parse(String(sent.find((s) => s.url.endsWith("/tweets"))!.init.body));
  assert.deepEqual(body.reply, { in_reply_to_tweet_id: "P1" });
  const first = await capture(() => PROVIDERS.x.publish(secret(), "me", { ...part, reply: undefined }), () => Response.json({ data: { id: "1" } }));
  assert.equal(JSON.parse(String(first[0].init.body)).reply, undefined);
});

test("Mastodon: a part replies to the part before, and its retry key differs from the first post's", async () => {
  const s = secret({ instance: "mastodon.social" });
  const a = await capture(() => PROVIDERS.mastodon.publish(s, "me", part), () => Response.json({ id: "2", uri: "u" }));
  const b = await capture(() => PROVIDERS.mastodon.publish(s, "me", { ...part, reply: undefined }), () => Response.json({ id: "1", uri: "u" }));
  assert.equal(JSON.parse(String(a[0].init.body)).in_reply_to_id, "P1");
  const key = (x: typeof a) => (x[0].init.headers as Record<string, string>)["Idempotency-Key"];
  assert.notEqual(key(a), key(b));
});

test("Threads: a text part and a picture part both carry reply_to_id", async () => {
  const answer = (url: string) => (url.includes("fields=status") ? Response.json({ status: "FINISHED" }) : url.includes("permalink") ? Response.json({ permalink: "https://threads.com/p" }) : Response.json({ id: "c1" }));
  const text = await capture(() => PROVIDERS.threads.publish(secret(), "u1", part), answer);
  assert.equal(new URLSearchParams(String(text[0].init.body)).get("reply_to_id"), "P1");
  const pic = { url: "https://cdn.example.com/a.jpg", name: "a.jpg", mime: "image/jpeg", size: 10, bytes: async () => Buffer.alloc(10) };
  const one = await capture(() => PROVIDERS.threads.publish(secret(), "u1", { ...part, media: [pic] }), answer);
  assert.equal(new URLSearchParams(String(one[0].init.body)).get("reply_to_id"), "P1");
});

test("Bluesky: a part names the thread's first post as root and the part before as parent", async () => {
  const root = "at://did:plc:me/app.bsky.feed.post/aaa";
  const parent = "at://did:plc:me/app.bsky.feed.post/bbb";
  let record: Record<string, unknown> | null = null;
  await capture(
    () => PROVIDERS.bluesky.publish(secret({ handle: "me.bsky.social" }), "did:plc:me", { ...part, reply: { parent, root } }),
    (url, init) => {
      if (url.includes("createSession")) return Response.json({ accessJwt: "j", refreshJwt: "r", handle: "me.bsky.social", did: "did:plc:me" });
      if (url.includes("getRecord")) {
        const rkey = new URL(url).searchParams.get("rkey");
        return Response.json({ uri: `at://did:plc:me/app.bsky.feed.post/${rkey}`, cid: `cid-${rkey}` });
      }
      if (url.includes("createRecord")) {
        record = JSON.parse(String(init.body)).record;
        return Response.json({ uri: "at://did:plc:me/app.bsky.feed.post/ccc", cid: "cid-ccc" });
      }
      return Response.json({});
    },
  );
  assert.deepEqual((record as unknown as { reply: unknown }).reply, { root: { uri: root, cid: "cid-aaa" }, parent: { uri: parent, cid: "cid-bbb" } });
});
