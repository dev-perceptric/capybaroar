// X: polls, who can reply, and the AI and paid partnership labels. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { PROVIDERS } from "../src/lib/providers";
import { pollOptions, xBody, xProblem } from "../src/lib/providers/x";
import { partSettings } from "../src/lib/thread";
import { PostError, type MediaFile, type Publishable, type Secret } from "../src/lib/providers/types";

const secret: Secret = { accessToken: "tok", refreshToken: null, expiresAt: null, extra: {} };
const pic: MediaFile = { url: "https://cdn.example.com/a.jpg", mime: "image/jpeg", size: 10, name: "a.jpg", bytes: async () => Buffer.alloc(10) };
const post = (settings: Record<string, string>, media: MediaFile[] = []): Publishable => ({ text: "Which bread?", media, settings });

test("poll options are one per line, blanks dropped", () => {
  assert.deepEqual(pollOptions({ poll: " Rye \n\nSourdough\r\n  " }), ["Rye", "Sourdough"]);
  assert.deepEqual(pollOptions({}), []);
});

test("a poll has 2 to 4 short options and no media", () => {
  assert.equal(xProblem(post({ poll: "Rye\nSourdough" })), null);
  assert.equal(xProblem(post({ poll: "Rye" })), "An X poll has 2 to 4 options");
  assert.equal(xProblem(post({ poll: "a\nb\nc\nd\ne" })), "An X poll has 2 to 4 options");
  assert.match(xProblem(post({ poll: `Rye\n${"x".repeat(26)}` }))!, /up to 25 characters/);
  assert.equal(xProblem(post({ poll: "Rye\nSourdough" }, [pic])), "An X poll can't have pictures or video");
  assert.equal(xProblem(post({}, [pic])), null);
});

test("the request carries the poll, who can reply and the labels", () => {
  const b = xBody(post({ poll: "Rye\nSourdough", poll_length: "4320", reply_settings: "following", made_with_ai: "yes", paid_partnership: "yes" }), []);
  assert.deepEqual(b, { text: "Which bread?", poll: { options: ["Rye", "Sourdough"], duration_minutes: 4320 }, reply_settings: "following", made_with_ai: true, paid_partnership: true });
  // Defaults leave X's own defaults: everyone can reply, no labels, a one-day poll.
  assert.deepEqual(xBody(post({ reply_settings: "everyone", made_with_ai: "no", paid_partnership: "no" }), ["9"]), { text: "Which bread?", media: { media_ids: ["9"] } });
  assert.deepEqual((xBody(post({ poll: "a\nb", poll_length: "99" }), []).poll as { duration_minutes: number }).duration_minutes, 1440);
});

test("a thread's later posts don't repeat the poll", () => {
  assert.deepEqual(partSettings({ poll: "a\nb", poll_length: "60", reply_settings: "verified" }), { reply_settings: "verified" });
});

test("a poll with a picture is refused before anything is uploaded", async () => {
  const real = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return Response.json({});
  }) as typeof fetch;
  try {
    await assert.rejects(PROVIDERS.x.publish(secret, "me", post({ poll: "a\nb" }, [pic])), PostError);
  } finally {
    globalThis.fetch = real;
  }
  assert.equal(calls, 0);
  assert.equal(PROVIDERS.x.check!(post({ poll: "a" })), "An X poll has 2 to 4 options");
});
