// Delete everywhere, against fake networks and an in-memory store. They prove: each channel asked gets exactly one
// result even when networks fail, hang or throw at random; a 404 counts as deleted; networks without a delete API are
// "manual" with the post's link and never count as deleted; a channel already deleted is never asked again, and one
// post never runs twice at once; the post is "deleted" exactly when every channel it went out on is; AuthError marks
// the channel for reconnect; only writers with the brand may delete; and the real providers send the documented
// requests and read their answers right (fetch is faked: no network is called).
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkUnpublish, planOf, unpublishTargets, UnpublishError, type UnpublishStore, type UnpublishTarget } from "../src/lib/unpublisher";
import { AuthError, NotFound, PostError, call, type Provider, type Secret } from "../src/lib/providers/types";
import { PROVIDERS } from "../src/lib/providers";

const secret: Secret = { accessToken: "tok", refreshToken: null, expiresAt: null, extra: {} };

class Memory implements UnpublishStore {
  deletedIds = new Map<string, Date>();
  reconnected: string[] = [];
  postsDeleted: string[] = [];
  failSaves = 0;
  async secret() {
    return secret;
  }
  async deleted(targetId: string, at: Date) {
    if (this.failSaves > 0) {
      this.failSaves--;
      throw new Error("db down");
    }
    this.deletedIds.set(targetId, at);
  }
  async reconnect(channelId: string) {
    this.reconnected.push(channelId);
  }
  async postDeleted(postId: string) {
    this.postsDeleted.push(postId);
  }
  /** The rows as the next run loads them. */
  reload(ts: UnpublishTarget[]) {
    return ts.map((t) => ({ ...t, deletedAt: t.deletedAt ?? this.deletedIds.get(t.id) ?? null }));
  }
}

const target = (i: number, network: string, over: Partial<UnpublishTarget> = {}): UnpublishTarget => ({
  id: `t${i}`,
  postId: "p1",
  channelId: `c${i}`,
  channelName: `Channel ${i}`,
  channelStatus: "active",
  network,
  accountId: "acct",
  status: "published",
  remoteId: `r${i}`,
  url: `https://example.com/${i}`,
  publishedAt: new Date(),
  deletedAt: null,
  text: "hello",
  media: 0,
  ...over,
});

/** A fake network: each delete does what `next` says, and every call is counted by remote id. */
function fakeNetwork(next: (remoteId: string) => "ok" | "404" | "auth" | "error" | "post" | "hang") {
  const calls: string[] = [];
  const p: Provider = {
    network: "x",
    publish: async () => ({ id: "x" }),
    unpublish: async (_s, _a, r) => {
      calls.push(r.id);
      const what = next(r.id);
      if (what === "404") throw new NotFound("gone");
      if (what === "auth") throw new AuthError("token revoked");
      if (what === "error") throw new Error("503 try later");
      if (what === "post") throw new PostError("not allowed");
      if (what === "hang") await new Promise(() => {});
    },
  };
  return { p, calls };
}

const providersWith = (fake: Provider) => (network: string) => (network === "fake" ? fake : (PROVIDERS as Record<string, Provider>)[network] ?? null);

test("partial failures: each channel gets one result, only successes are saved, and a second run asks only the rest", async () => {
  const outcome: Record<string, "ok" | "error" | "post"> = { r1: "ok", r2: "error", r3: "post" };
  const net = fakeNetwork((id) => outcome[id]);
  const store = new Memory();
  let ts = [target(1, "fake"), target(2, "fake"), target(3, "fake")];
  const a = await unpublishTargets(store, providersWith(net.p), ts, "all");
  assert.deepEqual(a.results.map((r) => [r.channelId, r.result]), [["c1", "deleted"], ["c2", "failed"], ["c3", "failed"]]);
  assert.equal(a.results[1].error, "503 try later");
  assert.equal(a.postDeleted, false);
  assert.deepEqual([...store.deletedIds.keys()], ["t1"]);
  assert.deepEqual(store.postsDeleted, []);

  outcome.r2 = "ok";
  outcome.r3 = "ok";
  ts = store.reload(ts);
  net.calls.length = 0;
  const b = await unpublishTargets(store, providersWith(net.p), ts, "all");
  assert.deepEqual(net.calls.sort(), ["r2", "r3"], "the channel already deleted is not asked again");
  assert.ok(b.results.every((r) => r.result === "deleted"));
  assert.equal(b.postDeleted, true);
  assert.deepEqual(store.postsDeleted, ["p1"]);
});

test("a 404 from the network counts as deleted", async () => {
  const net = fakeNetwork(() => "404");
  const store = new Memory();
  const r = await unpublishTargets(store, providersWith(net.p), [target(1, "fake")], "all");
  assert.equal(r.results[0].result, "deleted");
  assert.ok(store.deletedIds.has("t1"));
  assert.equal(r.postDeleted, true);
});

test("call() turns a 404 into NotFound and keeps the other errors as they were", async () => {
  const real = globalThis.fetch;
  const answers = [404, 401, 403, 500];
  try {
    globalThis.fetch = (async () => new Response(JSON.stringify({ error: "nope" }), { status: answers.shift()! })) as typeof fetch;
    await assert.rejects(call("https://n.test/a"), (e) => e instanceof NotFound);
    await assert.rejects(call("https://n.test/a"), (e) => e instanceof AuthError);
    await assert.rejects(call("https://n.test/a"), (e) => e instanceof PostError);
    await assert.rejects(call("https://n.test/a"), (e) => e instanceof Error && !(e instanceof NotFound) && !(e instanceof PostError) && !(e instanceof AuthError));
  } finally {
    globalThis.fetch = real;
  }
});

test("networks without a delete API are manual with the link, and the post isn't deleted while they're live", async () => {
  const net = fakeNetwork(() => "ok");
  const store = new Memory();
  const ts = [target(1, "fake"), target(2, "instagram"), target(3, "tiktok", { url: null })];
  const r = await unpublishTargets(store, providersWith(net.p), ts, "all");
  assert.deepEqual(r.results.map((x) => x.result), ["deleted", "manual", "manual"]);
  assert.equal(r.results[1].error, "Delete it in the Instagram app");
  assert.equal(r.results[1].url, "https://example.com/2");
  assert.equal(r.results[2].error, "Delete it in the TikTok app");
  assert.equal(r.postDeleted, false);
  assert.deepEqual(store.postsDeleted, []);
  const plan = planOf(ts, providersWith(net.p), () => secret);
  assert.deepEqual(plan.map((p) => [p.manual, p.reason]), [[false, null], [true, "Delete it in the Instagram app"], [true, "Delete it in the TikTok app"]]);
});

test("only channels the post went out on are asked; a channel named that didn't go out is skipped", async () => {
  const net = fakeNetwork(() => "ok");
  const store = new Memory();
  const ts = [target(1, "fake"), target(2, "fake", { status: "failed", remoteId: null })];
  const all = await unpublishTargets(store, providersWith(net.p), ts, "all");
  assert.deepEqual(all.results.map((r) => r.channelId), ["c1"]);
  assert.equal(all.postDeleted, true, "a channel that never went out doesn't keep the post");
  const named = await unpublishTargets(new Memory(), providersWith(net.p), ts, ["c2"]);
  assert.deepEqual(named.results.map((r) => r.result), ["skipped"]);
  assert.deepEqual(net.calls, ["r1"]);
  assert.deepEqual(planOf(ts, providersWith(net.p), () => secret).map((p) => p.channelId), ["c1"]);
});

test("no double calls: picked ids are asked once, and a second run of the same post at once is refused", async () => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const calls: string[] = [];
  const slow: Provider = {
    network: "x",
    publish: async () => ({ id: "x" }),
    unpublish: async (_s, _a, r) => {
      calls.push(r.id);
      await gate;
    },
  };
  const store = new Memory();
  const ts = [target(1, "fake"), target(2, "fake")];
  const first = unpublishTargets(store, providersWith(slow), ts, ["c1", "c1", "c2"]);
  await assert.rejects(unpublishTargets(store, providersWith(slow), ts, "all"), (e) => e instanceof UnpublishError && e.code === "conflict");
  release();
  const r = await first;
  assert.equal(r.results.length, 2);
  assert.deepEqual(calls.sort(), ["r1", "r2"]);
  // Free again once it's done.
  const again = await unpublishTargets(store, providersWith(slow), store.reload(ts), "all");
  assert.deepEqual(calls.length, 2);
  assert.ok(again.results.every((x) => x.result === "deleted"));
});

test("AuthError marks the channel for reconnect and fails it; a reconnect channel isn't asked at all", async () => {
  const net = fakeNetwork((id) => (id === "r1" ? "auth" : "ok"));
  const store = new Memory();
  const r = await unpublishTargets(store, providersWith(net.p), [target(1, "fake"), target(2, "fake"), target(3, "fake", { channelStatus: "reconnect" })], "all");
  assert.deepEqual(r.results.map((x) => x.result), ["failed", "deleted", "failed"]);
  assert.equal(r.results[0].error, "token revoked");
  assert.equal(r.results[2].error, "Reconnect Channel 3 first");
  assert.deepEqual(store.reconnected, ["c1"]);
  assert.deepEqual(net.calls.sort(), ["r1", "r2"]);
});

test("a network that never answers times out on its own; the others finish", async () => {
  const net = fakeNetwork((id) => (id === "r1" ? "hang" : "ok"));
  const store = new Memory();
  const started = Date.now();
  const r = await unpublishTargets(store, providersWith(net.p), [target(1, "fake"), target(2, "fake")], "all", 50);
  assert.ok(Date.now() - started < 2000);
  assert.equal(r.results[0].result, "failed");
  assert.match(r.results[0].error!, /didn't answer in time/);
  assert.equal(r.results[1].result, "deleted");
});

test("a delete that can't be saved is retried, then shown as failed; the next run's 404 finishes it", async () => {
  let gone = false;
  const net = fakeNetwork(() => (gone ? "404" : ((gone = true), "ok")));
  const store = new Memory();
  store.failSaves = 2;
  const ok = await unpublishTargets(store, providersWith(net.p), [target(1, "fake")], "all");
  assert.equal(ok.results[0].result, "deleted", "two failed saves, the third holds");
  const store2 = new Memory();
  store2.failSaves = 10;
  gone = false;
  const ts = [target(1, "fake")];
  const bad = await unpublishTargets(store2, providersWith(net.p), ts, "all");
  assert.equal(bad.results[0].result, "failed");
  assert.match(bad.results[0].error!, /not saved here/);
  store2.failSaves = 0;
  const next = await unpublishTargets(store2, providersWith(net.p), ts, "all");
  assert.equal(next.results[0].result, "deleted");
  assert.equal(next.postDeleted, true);
});

test("random failures: one result per channel, one call per channel per run, the post deleted exactly when all are", async () => {
  let seed = 11;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const kinds = ["ok", "404", "auth", "error", "post"] as const;
  for (let round = 0; round < 100; round++) {
    const net = fakeNetwork(() => kinds[Math.floor(rand() * kinds.length)]);
    const store = new Memory();
    const n = 1 + Math.floor(rand() * 6);
    let ts = Array.from({ length: n }, (_, i) => target(i, rand() < 0.15 ? "instagram" : "fake", rand() < 0.2 ? { deletedAt: new Date() } : {}));
    for (let run = 0; run < 4; run++) {
      net.calls.length = 0;
      const before = ts.filter((t) => t.deletedAt).map((t) => t.remoteId);
      const r = await unpublishTargets(store, providersWith(net.p), ts, "all");
      assert.equal(r.results.length, n);
      assert.equal(new Set(net.calls).size, net.calls.length, "no channel asked twice in a run");
      for (const id of before) assert.ok(!net.calls.includes(id!), "a deleted channel is never asked again");
      ts = store.reload(ts);
      const allGone = ts.every((t) => t.deletedAt);
      assert.equal(r.postDeleted, allGone);
      for (const x of r.results) assert.equal(x.result === "deleted", !!ts.find((t) => t.channelId === x.channelId)!.deletedAt);
    }
  }
});

test("permission: writers with the brand, on a post that went out; approval doesn't matter", () => {
  const code = (fn: () => void) => {
    try {
      fn();
      return "ok";
    } catch (e) {
      return e instanceof UnpublishError ? e.code : "other";
    }
  };
  const out = { status: "published", brandId: "b1" };
  assert.equal(code(() => checkUnpublish(out, { role: "editor", brandIds: ["b1"] })), "ok");
  assert.equal(code(() => checkUnpublish({ status: "partial", brandId: null }, { role: "owner", brandIds: null })), "ok");
  assert.equal(code(() => checkUnpublish({ status: "deleted", brandId: "b1" }, { role: "admin", brandIds: null })), "ok");
  assert.equal(code(() => checkUnpublish(out, { role: "client", brandIds: ["b1"] })), "forbidden");
  assert.equal(code(() => checkUnpublish(out, { role: "editor", brandIds: ["b2"] })), "not_found");
  assert.equal(code(() => checkUnpublish({ status: "published", brandId: null }, { role: "editor", brandIds: ["b1"] })), "not_found");
  assert.equal(code(() => checkUnpublish(null, { role: "owner", brandIds: null })), "not_found");
  assert.equal(code(() => checkUnpublish({ status: "publishing", brandId: null }, { role: "owner", brandIds: null })), "conflict");
  for (const s of ["draft", "review", "scheduled", "failed"]) assert.equal(code(() => checkUnpublish({ status: s, brandId: null }, { role: "owner", brandIds: null })), "conflict");
});

// The real providers, with fetch faked.

type Seen = { url: string; method: string; headers: Record<string, string>; body: string };
async function withFetch(answer: (s: Seen) => Response, run: () => Promise<unknown>) {
  const real = globalThis.fetch;
  const seen: Seen[] = [];
  globalThis.fetch = (async (u: string | URL | Request, init: RequestInit = {}) => {
    const s = { url: String(u), method: init.method ?? "GET", headers: Object.fromEntries(new Headers(init.headers).entries()), body: init.body ? String(init.body) : "" };
    seen.push(s);
    return answer(s);
  }) as typeof fetch;
  try {
    await run();
  } finally {
    globalThis.fetch = real;
  }
  return seen;
}
const remote = (id: string, over: Partial<{ at: Date | null; media: number; text: string }> = {}) => ({ id, url: null, at: new Date(), media: 0, text: "hi", ...over });

test("X, Mastodon, Pinterest, YouTube, Google Business, Facebook: the documented delete, and 404 as gone", async () => {
  const cases: [string, Secret, string, string, string][] = [
    ["x", secret, "123", "DELETE", "https://api.x.com/2/tweets/123"],
    ["mastodon", { ...secret, extra: { instance: "m.social" } }, "99", "DELETE", "https://m.social/api/v1/statuses/99"],
    ["pinterest", secret, "55", "DELETE", "https://api.pinterest.com/v5/pins/55"],
    ["youtube", secret, "vid", "DELETE", "https://www.googleapis.com/youtube/v3/videos?id=vid"],
    ["gbp", secret, "accounts/1/locations/2/localPosts/3", "DELETE", "https://mybusiness.googleapis.com/v4/accounts/1/locations/2/localPosts/3"],
  ];
  for (const [n, s, id, method, url] of cases) {
    const p = PROVIDERS[n as keyof typeof PROVIDERS];
    assert.equal(p.unpublishable?.(s, remote(id)) ?? null, null, n);
    const seen = await withFetch(() => new Response(null, { status: 204 }), () => p.unpublish!(s, "acct", remote(id)));
    assert.equal(seen[0].method, method, n);
    assert.equal(seen[0].url, url, n);
    assert.equal(seen[0].headers.authorization, "Bearer tok", n);
    await withFetch(() => new Response("{}", { status: 404 }), () => assert.rejects(p.unpublish!(s, "acct", remote(id)), (e) => e instanceof NotFound));
  }
  const fb = await withFetch(() => Response.json({ success: true }), () => PROVIDERS.facebook.unpublish!(secret, "page", remote("1_2")));
  assert.equal(fb[0].method, "DELETE");
  assert.match(fb[0].url, /^https:\/\/graph\.facebook\.com\/v\d+\.\d\/1_2\?access_token=tok$/);
});

test("LinkedIn: DELETE /rest/posts/{encoded urn} with the versioned headers", async () => {
  for (const n of ["linkedin", "linkedin-page"] as const) {
    const p = PROVIDERS[n];
    assert.equal(p.unpublishable!(secret, remote("")), "Capybaroar didn't keep this post's id");
    const seen = await withFetch(() => new Response(null, { status: 204 }), () => p.unpublish!(secret, "acct", remote("urn:li:share:7")));
    assert.equal(seen[0].url, "https://api.linkedin.com/rest/posts/urn%3Ali%3Ashare%3A7");
    assert.equal(seen[0].method, "DELETE");
    assert.equal(seen[0].headers["x-restli-method"], "DELETE");
    assert.equal(seen[0].headers["x-restli-protocol-version"], "2.0.0");
    assert.match(seen[0].headers["linkedin-version"], /^\d{6}$/);
  }
});

test("Reddit needs the edit scope; channels connected before it was asked for delete in the app", async () => {
  const p = PROVIDERS.reddit;
  assert.equal(p.unpublishable!(secret, remote("t3_abc")), "Reconnect Reddit to delete from here");
  const ok = { ...secret, extra: { scopes: ["identity", "submit", "edit"] } };
  assert.equal(p.unpublishable!(ok, remote("t3_abc")), null);
  assert.equal(p.unpublishable!(ok, remote("abc")), "Capybaroar didn't keep this post's id");
  const seen = await withFetch(() => Response.json({}), () => p.unpublish!(ok, "me", remote("t3_abc")));
  assert.equal(seen[0].url, "https://oauth.reddit.com/api/del");
  assert.equal(seen[0].method, "POST");
  assert.equal(seen[0].body, "id=t3_abc");
});

test("Bluesky deletes the post's record by its rkey", async () => {
  const p = PROVIDERS.bluesky;
  assert.equal(p.unpublishable!(secret, remote("nope")), "Capybaroar didn't keep this post's id");
  const s = { ...secret, extra: { handle: "me.bsky.social" } };
  const seen = await withFetch(
    (q) => (q.url.endsWith("createSession") ? Response.json({ did: "did:plc:me", handle: "me.bsky.social", accessJwt: "jwt" }) : Response.json({})),
    () => p.unpublish!(s, "did:plc:me", remote("at://did:plc:me/app.bsky.feed.post/3kabc")),
  );
  const del = seen.find((x) => x.url.endsWith("com.atproto.repo.deleteRecord"))!;
  assert.deepEqual(JSON.parse(del.body), { repo: "did:plc:me", collection: "app.bsky.feed.post", rkey: "3kabc" });
  assert.equal(del.headers.authorization, "Bearer jwt");
});

test("Discord: an unknown message is already deleted, an unknown webhook means reconnect", async () => {
  const p = PROVIDERS.discord;
  const s = { ...secret, accessToken: "https://discord.com/api/webhooks/1/abc/" };
  assert.equal(p.unpublishable!(s, remote("chan:1700000000")), "Discord didn't return this message's id");
  const seen = await withFetch(() => new Response(null, { status: 204 }), () => p.unpublish!(s, "1", remote("42")));
  assert.equal(seen[0].url, "https://discord.com/api/webhooks/1/abc/messages/42");
  assert.equal(seen[0].method, "DELETE");
  await withFetch(() => Response.json({ code: 10008, message: "Unknown Message" }, { status: 404 }), () => p.unpublish!(s, "1", remote("42")));
  await withFetch(() => Response.json({ code: 10015, message: "Unknown Webhook" }, { status: 404 }), () => assert.rejects(p.unpublish!(s, "1", remote("42")), (e) => e instanceof AuthError));
});

test("Telegram: deleteMessage, a message already gone is fine, 48 hours in groups, albums leave a note", async () => {
  process.env.TELEGRAM_BOT_TOKEN = "bot1";
  const p = PROVIDERS.telegram;
  const old = new Date(Date.now() - 49 * 3600000);
  assert.equal(p.unpublishable!({ ...secret, extra: { type: "group" } }, remote("5", { at: old })), "Delete it in Telegram");
  assert.equal(p.unpublishable!({ ...secret, extra: { type: "group" } }, remote("5")), null);
  assert.equal(p.unpublishable!({ ...secret, extra: { type: "channel" } }, remote("5", { at: old })), null);
  const seen = await withFetch(() => Response.json({ ok: true, result: true }), () => p.unpublish!(secret, "-1001", remote("5")));
  assert.equal(seen[0].url, "https://api.telegram.org/botbot1/deleteMessage");
  assert.deepEqual(JSON.parse(seen[0].body), { chat_id: "-1001", message_id: 5 });
  await withFetch(() => Response.json({ ok: false, description: "Bad Request: message to delete not found" }, { status: 400 }), () => p.unpublish!(secret, "-1001", remote("5")));
  await withFetch(
    () => Response.json({ ok: false, description: "Bad Request: message can't be deleted" }, { status: 400 }),
    () => assert.rejects(p.unpublish!(secret, "-1001", remote("5")), /Delete it in Telegram/),
  );
  let out: unknown;
  await withFetch(() => Response.json({ ok: true, result: true }), async () => (out = await p.unpublish!(secret, "-1001", remote("5", { media: 3 }))));
  assert.deepEqual(out, { note: "Only the first message was deleted. Delete the rest in Telegram." });
});

test("Threads deletes only behind META_THREADS_DELETE, and only on channels signed in with it", async () => {
  const p = PROVIDERS.threads;
  delete process.env.META_THREADS_DELETE;
  assert.equal(p.unpublishable!(secret, remote("1")), "Delete it in the Threads app");
  process.env.META_THREADS_DELETE = "1";
  try {
    assert.equal(p.unpublishable!(secret, remote("1")), "Reconnect Threads to delete from here");
    const s = { ...secret, extra: { threads_delete: true } };
    assert.equal(p.unpublishable!(s, remote("1")), null);
    const seen = await withFetch(() => Response.json({ success: true, deleted_id: "1" }), () => p.unpublish!(s, "me", remote("1")));
    assert.equal(seen[0].method, "DELETE");
    assert.equal(seen[0].url, "https://graph.threads.net/v1.0/1?access_token=tok");
    assert.match(p.oauth!.authUrl({ state: "s", redirect: "https://r", verifier: "v", input: {} }) as string, /threads_delete/);
  } finally {
    delete process.env.META_THREADS_DELETE;
  }
  assert.doesNotMatch(p.oauth!.authUrl({ state: "s", redirect: "https://r", verifier: "v", input: {} }) as string, /threads_delete/);
});

test("Instagram and TikTok have no delete", () => {
  assert.equal(PROVIDERS.instagram.unpublish, undefined);
  assert.equal(PROVIDERS.tiktok.unpublish, undefined);
});

test("a thread's later posts are deleted first, last one first; a failure keeps the first post for the retry", async () => {
  const store = new Memory();
  const parts = [{ id: "p2", url: null }, { id: "p3", url: null }];
  const ok = fakeNetwork((id) => (id === "p3" ? "404" : "ok"));
  const r = await unpublishTargets(store, providersWith(ok.p), [target(1, "fake", { parts })], "all");
  assert.deepEqual(ok.calls, ["p3", "p2", "r1"]);
  assert.equal(r.results[0].result, "deleted");
  const bad = fakeNetwork((id) => (id === "p2" ? "error" : "ok"));
  const r2 = await unpublishTargets(new Memory(), providersWith(bad.p), [target(1, "fake", { parts })], "all");
  assert.deepEqual(bad.calls, ["p3", "p2"]);
  assert.equal(r2.results[0].result, "failed");
});
