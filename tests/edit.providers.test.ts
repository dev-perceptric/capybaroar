// Changing a published post on each network, against faked networks (fetch, and https for WordPress): the documented
// request for a change, the fields that must not be wiped, refusals before anything is sent, and 401 as AuthError,
// 400 as PostError. Run with: npm test
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import https from "node:https";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { PROVIDERS } from "../src/lib/providers";
import { NETWORKS, type NetworkId } from "../src/lib/networks";
import { AuthError, PostError, type Publishable, type Remote, type Secret } from "../src/lib/providers/types";

const secret: Secret = { accessToken: "tok", refreshToken: null, expiresAt: null, extra: {} };
const remote = (id: string, over: Partial<Remote> = {}): Remote => ({ id, url: null, at: new Date(), media: 0, text: "old", ...over });
const change = (text: string, settings: Record<string, string> = {}): Publishable => ({ text, media: [], settings });

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
const status = (code: number, body: unknown = { error: { message: "nope" } }) => () => new Response(JSON.stringify(body), { status: code });
const edit = (n: NetworkId, s: Secret, accountId: string, r: Remote, p: Publishable) => PROVIDERS[n].edit!(s, accountId, r, p);

/** 401 means reconnect, 400 means the change is wrong; nothing else is asked once the network says no. */
async function mapsErrors(n: NetworkId, s: Secret, accountId: string, r: Remote, p: Publishable) {
  await withFetch(status(401), () => assert.rejects(edit(n, s, accountId, r, p), (e) => e instanceof AuthError, `${n} 401`));
  await withFetch(status(400), () => assert.rejects(edit(n, s, accountId, r, p), (e) => e instanceof PostError, `${n} 400`));
}

test("every network marked editable has an edit, lists only its own settings, and the rest have none", () => {
  for (const n of NETWORKS) {
    const p = PROVIDERS[n.id];
    assert.equal(Boolean(n.edit), Boolean(p.edit), n.id);
    const keys = new Set((n.fields ?? []).map((f) => f.key));
    for (const k of n.edit?.settings ?? []) assert.ok(keys.has(k), `${n.id}: ${k}`);
  }
  for (const n of ["x", "threads", "instagram", "tiktok", "bluesky"] as const) assert.equal(PROVIDERS[n].edit, undefined, n);
  assert.deepEqual(NETWORKS.find((n) => n.id === "youtube")!.edit!.settings, ["title", "tags", "category", "privacy", "for_kids", "synthetic"]);
});

test("YouTube: reads the video, sends back the fields it doesn't set, and replaces snippet and status", async () => {
  const video = {
    id: "vid",
    snippet: { title: "Old", description: "old", tags: ["a"], categoryId: "22", defaultLanguage: "en", channelId: "UC1", thumbnails: {} },
    status: { privacyStatus: "private", embeddable: false, license: "creativeCommon", publicStatsViewable: true, publishAt: "2030-01-01T00:00:00Z", uploadStatus: "processed" },
  };
  const p = change("New description", { title: " New title ", tags: "bread, rye", category: "27", privacy: "public", for_kids: "no", synthetic: "yes" });
  const seen = await withFetch((s) => Response.json(s.method === "GET" ? { items: [video] } : { id: "vid" }), () => edit("youtube", secret, "UC1", remote("vid"), p));
  assert.equal(seen[0].url, "https://www.googleapis.com/youtube/v3/videos?part=snippet%2Cstatus&id=vid");
  assert.equal(seen[1].method, "PUT");
  assert.equal(seen[1].url, "https://www.googleapis.com/youtube/v3/videos?part=snippet%2Cstatus");
  assert.equal(seen[1].headers.authorization, "Bearer tok");
  assert.deepEqual(JSON.parse(seen[1].body), {
    id: "vid",
    snippet: { defaultLanguage: "en", title: "New title", description: "New description", tags: ["bread", "rye"], categoryId: "27" },
    // A scheduled time is only kept while the video stays private.
    status: { embeddable: false, license: "creativeCommon", publicStatsViewable: true, privacyStatus: "public", selfDeclaredMadeForKids: false, containsSyntheticMedia: true },
  });
  const priv = await withFetch((s) => Response.json(s.method === "GET" ? { items: [video] } : {}), () => edit("youtube", secret, "UC1", remote("vid"), { ...p, settings: { ...p.settings, privacy: "private" } }));
  assert.equal(JSON.parse(priv[1].body).status.publishAt, "2030-01-01T00:00:00Z");
});

test("YouTube: a bad title is refused before any call; a video that's gone, 401 and 400 are mapped", async () => {
  const none = await withFetch(() => Response.json({}), () => assert.rejects(edit("youtube", secret, "UC1", remote("vid"), change("x", {})), /needs a title/));
  assert.equal(none.length, 0);
  await withFetch(() => Response.json({ items: [] }), () => assert.rejects(edit("youtube", secret, "UC1", remote("vid"), change("x", { title: "T" })), (e) => e instanceof PostError && /no longer/.test((e as Error).message)));
  await mapsErrors("youtube", secret, "UC1", remote("vid"), change("x", { title: "T" }));
  // The read works, the write is refused.
  await withFetch(
    (s) => (s.method === "GET" ? Response.json({ items: [{ snippet: {}, status: {} }] }) : new Response(JSON.stringify({ error: { message: "invalidTitle" } }), { status: 400 })),
    () => assert.rejects(edit("youtube", secret, "UC1", remote("vid"), change("x", { title: "T" })), PostError),
  );
});

test("Mastodon: PUT the status with its files sent back, the content warning and the language kept", async () => {
  const s = { ...secret, extra: { instance: "m.social" } };
  const seen = await withFetch(
    (q) => Response.json(q.method === "GET" ? { id: "99", media_attachments: [{ id: "m1" }, { id: "m2" }], sensitive: false, spoiler_text: "", language: "de" } : { id: "99" }),
    () => edit("mastodon", s, "1@m.social", remote("99", { media: 2 }), change("New text", { spoiler: " Spoilers ", visibility: "public" })),
  );
  assert.equal(seen[0].url, "https://m.social/api/v1/statuses/99");
  assert.equal(seen[1].method, "PUT");
  assert.equal(seen[1].url, "https://m.social/api/v1/statuses/99");
  assert.equal(seen[1].headers.authorization, "Bearer tok");
  assert.deepEqual(JSON.parse(seen[1].body), { status: "New text", spoiler_text: "Spoilers", sensitive: true, media_ids: ["m1", "m2"], language: "de" });
  // Taking the warning off shows the files again.
  const off = await withFetch((q) => Response.json(q.method === "GET" ? { media_attachments: [], sensitive: true, spoiler_text: "CW" } : {}), () => edit("mastodon", s, "1@m.social", remote("99"), change("x")));
  assert.deepEqual(JSON.parse(off[1].body), { status: "x", spoiler_text: "", sensitive: false, media_ids: [] });
  const long = await withFetch(() => Response.json({}), () => assert.rejects(edit("mastodon", s, "1@m.social", remote("99"), change("a".repeat(501))), PostError));
  assert.equal(long.length, 0);
  await mapsErrors("mastodon", s, "1@m.social", remote("99"), change("x"));
});

test("Pinterest: PATCH the pin's description, title and link; an empty one is cleared", async () => {
  const seen = await withFetch(() => Response.json({ id: "55" }), () => edit("pinterest", secret, "me", remote("55", { media: 1 }), change("Bake this", { board: "Bread", title: " Rye ", link: "" })));
  assert.equal(seen.length, 1);
  assert.equal(seen[0].method, "PATCH");
  assert.equal(seen[0].url, "https://api.pinterest.com/v5/pins/55");
  assert.equal(seen[0].headers.authorization, "Bearer tok");
  assert.deepEqual(JSON.parse(seen[0].body), { description: "Bake this", title: "Rye", link: null });
  const long = await withFetch(() => Response.json({}), () => assert.rejects(edit("pinterest", secret, "me", remote("55"), change("a".repeat(801))), /800/));
  assert.equal(long.length, 0);
  await mapsErrors("pinterest", secret, "me", remote("55"), change("x"));
});

test("LinkedIn: a PARTIAL_UPDATE of the commentary only, in little text", async () => {
  for (const n of ["linkedin", "linkedin-page"] as const) {
    const seen = await withFetch(() => new Response(null, { status: 204 }), () => edit(n, secret, "abc", remote("urn:li:share:7"), change("New (text) #1", { visibility: "CONNECTIONS", reshare: "off" })));
    assert.equal(seen.length, 1);
    assert.equal(seen[0].method, "POST");
    assert.equal(seen[0].url, "https://api.linkedin.com/rest/posts/urn%3Ali%3Ashare%3A7");
    assert.equal(seen[0].headers["x-restli-method"], "PARTIAL_UPDATE");
    assert.equal(seen[0].headers["x-restli-protocol-version"], "2.0.0");
    assert.match(seen[0].headers["linkedin-version"], /^\d{6}$/);
    assert.deepEqual(JSON.parse(seen[0].body), { patch: { $set: { commentary: "New \\(text\\) \\#1" } } });
    await withFetch(() => new Response(null, { status: 204 }), () => assert.rejects(edit(n, secret, "abc", remote(""), change("x")), /didn't keep/));
    await mapsErrors(n, secret, "abc", remote("urn:li:ugcPost:9"), change("x"));
  }
});

test("Facebook: POST the Page post's new message; videos, Reels and Stories are refused before any call", async () => {
  const seen = await withFetch(() => Response.json({ success: true }), () => edit("facebook", secret, "1", remote("1_2"), change("New text", { format: "post" })));
  assert.equal(seen.length, 1);
  assert.equal(seen[0].method, "POST");
  assert.match(seen[0].url, /^https:\/\/graph\.facebook\.com\/v\d+\.\d\/1_2$/);
  assert.equal(seen[0].body, "message=New+text&access_token=tok");
  const refused = await withFetch(() => Response.json({ success: true }), async () => {
    await assert.rejects(edit("facebook", secret, "1", remote("123456"), change("x", { format: "reel" })), (e) => e instanceof PostError && /video/.test((e as Error).message));
    await assert.rejects(edit("facebook", secret, "1", remote("story:777"), change("x", { format: "story" })), (e) => e instanceof PostError && /Story/.test((e as Error).message));
  });
  assert.equal(refused.length, 0);
  await withFetch(() => Response.json({ success: false }), () => assert.rejects(edit("facebook", secret, "1", remote("1_2"), change("x")), (e) => !(e instanceof PostError) && !(e instanceof AuthError)));
  // An expired Page token is code 190, whatever the status.
  await withFetch(status(400, { error: { message: "Session expired", code: 190 } }), () => assert.rejects(edit("facebook", secret, "1", remote("1_2"), change("x")), AuthError));
  await mapsErrors("facebook", secret, "1", remote("1_2"), change("x"));
});

test("Telegram: editMessageText for text, editMessageCaption for media, and an unchanged text is fine", async () => {
  process.env.TELEGRAM_BOT_TOKEN = "bot1";
  const ok = () => Response.json({ ok: true, result: { message_id: 5 } });
  const text = await withFetch(ok, () => edit("telegram", secret, "-1001", remote("5"), change("New")));
  assert.equal(text[0].url, "https://api.telegram.org/botbot1/editMessageText");
  assert.deepEqual(JSON.parse(text[0].body), { chat_id: "-1001", message_id: 5, text: "New", link_preview_options: { is_disabled: false } });
  const cap = await withFetch(ok, () => edit("telegram", secret, "-1001", remote("5", { media: 3, text: "" }), change("Caption")));
  assert.equal(cap[0].url, "https://api.telegram.org/botbot1/editMessageCaption");
  assert.deepEqual(JSON.parse(cap[0].body), { chat_id: "-1001", message_id: 5, caption: "Caption" });
  // A long text went out as its own message, and a caption has 1024 characters: both refused before any call.
  const refused = await withFetch(ok, async () => {
    await assert.rejects(edit("telegram", secret, "-1001", remote("5", { media: 1, text: "a".repeat(1025) }), change("short")), (e) => e instanceof PostError && /own message/.test((e as Error).message));
    await assert.rejects(edit("telegram", secret, "-1001", remote("5", { media: 1 }), change("a".repeat(1025))), (e) => e instanceof PostError && /1024/.test((e as Error).message));
    await assert.rejects(edit("telegram", secret, "-1001", remote("5"), change(" ")), PostError);
    await assert.rejects(edit("telegram", secret, "-1001", remote("chan:1"), change("x")), /didn't keep/);
  });
  assert.equal(refused.length, 0);
  await withFetch(status(400, { ok: false, description: "Bad Request: message is not modified" }), () => edit("telegram", secret, "-1001", remote("5"), change("old")));
  await withFetch(status(400, { ok: false, description: "Bad Request: message to edit not found" }), () => assert.rejects(edit("telegram", secret, "-1001", remote("5"), change("x")), PostError));
  await mapsErrors("telegram", secret, "-1001", remote("5"), change("x"));
});

test("Discord: PATCH the webhook message's content; an unknown webhook means reconnect", async () => {
  const s = { ...secret, accessToken: "https://discord.com/api/webhooks/1/abc/" };
  const seen = await withFetch(() => Response.json({ id: "42" }), () => edit("discord", s, "1", remote("42", { media: 1 }), change("New")));
  assert.equal(seen[0].method, "PATCH");
  assert.equal(seen[0].url, "https://discord.com/api/webhooks/1/abc/messages/42");
  assert.equal(seen[0].headers["content-type"], "application/json");
  // No attachments field: the files stay on the message.
  assert.deepEqual(JSON.parse(seen[0].body), { content: "New" });
  await withFetch(status(404, { code: 10015, message: "Unknown Webhook" }), () => assert.rejects(edit("discord", s, "1", remote("42"), change("x")), AuthError));
  await withFetch(status(404, { code: 10008, message: "Unknown Message" }), () => assert.rejects(edit("discord", s, "1", remote("42"), change("x")), (e) => e instanceof PostError && /no longer/.test((e as Error).message)));
  await withFetch(status(500, { message: "oops" }), () => assert.rejects(edit("discord", s, "1", remote("42"), change("x")), (e) => !(e instanceof PostError) && !(e instanceof AuthError)));
  const none = await withFetch(() => Response.json({}), () => assert.rejects(edit("discord", s, "1", remote("chan:1700000000"), change("x")), PostError));
  assert.equal(none.length, 0);
  await mapsErrors("discord", s, "1", remote("42"), change("x"));
});

test("Reddit: editusertext for a text post; link posts and channels without the edit scope are refused", async () => {
  const s = { ...secret, extra: { scopes: ["identity", "submit", "edit"] } };
  const seen = await withFetch(() => Response.json({ json: { errors: [] } }), () => edit("reddit", s, "me", remote("t3_abc"), change("New body", { subreddit: "r/bread", title: "T" })));
  assert.equal(seen[0].method, "POST");
  assert.equal(seen[0].url, "https://oauth.reddit.com/api/editusertext");
  assert.equal(seen[0].body, "api_type=json&thing_id=t3_abc&text=New+body");
  assert.equal(seen[0].headers.authorization, "Bearer tok");
  assert.match(seen[0].headers["user-agent"], /capybaroar/);
  const refused = await withFetch(() => Response.json({}), async () => {
    await assert.rejects(edit("reddit", secret, "me", remote("t3_abc"), change("x")), /Reconnect Reddit to edit/);
    await assert.rejects(edit("reddit", s, "me", remote("t3_abc", { media: 1 }), change("x")), /link post/);
    await assert.rejects(edit("reddit", s, "me", remote("abc"), change("x")), /didn't keep/);
  });
  assert.equal(refused.length, 0);
  await withFetch(() => Response.json({ json: { errors: [["TOO_LONG", "this is too long", "text"]] } }), () => assert.rejects(edit("reddit", s, "me", remote("t3_abc"), change("x")), PostError));
  await withFetch(() => Response.json({ json: { errors: [["RATELIMIT", "you are doing that too much"]] } }), () => assert.rejects(edit("reddit", s, "me", remote("t3_abc"), change("x")), (e) => !(e instanceof PostError)));
  await mapsErrors("reddit", s, "me", remote("t3_abc"), change("x"));
});

test("Google Business: PATCH the local post's summary, named in the update mask", async () => {
  const name = "accounts/1/locations/2/localPosts/3";
  const seen = await withFetch(() => Response.json({ name }), () => edit("gbp", secret, "accounts/1/locations/2", remote(name), change("New offer")));
  assert.equal(seen[0].method, "PATCH");
  assert.equal(seen[0].url, `https://mybusiness.googleapis.com/v4/${name}?updateMask=summary`);
  assert.deepEqual(JSON.parse(seen[0].body), { summary: "New offer" });
  const long = await withFetch(() => Response.json({}), () => assert.rejects(edit("gbp", secret, "a", remote(name), change("a".repeat(1501))), PostError));
  assert.equal(long.length, 0);
  await mapsErrors("gbp", secret, "accounts/1/locations/2", remote(name), change("x"));
});

// WordPress goes through safeRequest (node:https), so https.request is faked.
type WpSeen = { url: string; method: string; headers: Record<string, string>; body: string };
async function withWordPress(answer: (s: WpSeen) => [number, unknown], run: () => Promise<unknown>) {
  const seen: WpSeen[] = [];
  const fake = mock.method(https, "request", ((url: URL, opts: { method?: string; headers?: Record<string, string> }, cb: (res: unknown) => void) => {
    const req = new EventEmitter() as EventEmitter & { write: (c: string | Buffer) => void; end: () => void; destroy: (e: Error) => void };
    const chunks: string[] = [];
    req.write = (c) => void chunks.push(String(c));
    req.destroy = (e) => void req.emit("error", e);
    req.end = () => {
      const s = { url: String(url), method: opts.method ?? "GET", headers: opts.headers ?? {}, body: chunks.join("") };
      seen.push(s);
      const [code, body] = answer(s);
      const res = Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), { statusCode: code, headers: {} });
      setImmediate(() => cb(res));
    };
    return req;
  }) as never);
  try {
    await run();
  } finally {
    fake.mock.restore();
  }
  return seen;
}

test("WordPress: POST the post with its title, text, status, excerpt and terms; the featured picture stays", async () => {
  const s = { ...secret, accessToken: "app pass", extra: { site: "https://blog.example.com", user: "ann" } };
  const seen = await withWordPress(
    (q) => (q.url.includes("/categories?") ? [200, [{ id: 3, name: "News" }]] : [200, { id: 5, link: "https://blog.example.com/p/5" }]),
    () => edit("wordpress", s, "blog.example.com:1", remote("5", { media: 1 }), change("Para one\n\nPara two", { title: " New title ", status: "draft", categories: "news" })),
  );
  assert.equal(seen.length, 2);
  assert.equal(seen[0].url, "https://blog.example.com/wp-json/wp/v2/categories?search=news&per_page=20");
  const put = seen[1];
  assert.equal(put.method, "POST");
  assert.equal(put.url, "https://blog.example.com/wp-json/wp/v2/posts/5");
  assert.equal(put.headers.Authorization, `Basic ${Buffer.from("ann:apppass").toString("base64")}`);
  // An emptied excerpt and tag list are cleared; featured_media isn't sent, so the picture stays.
  assert.deepEqual(JSON.parse(put.body), { title: "New title", content: "<p>Para one</p>\n<p>Para two</p>", status: "draft", excerpt: "", categories: [3], tags: [] });
  const none = await withWordPress(() => [200, {}], () => assert.rejects(edit("wordpress", s, "a", remote("5"), change("x", {})), /need a title/));
  assert.equal(none.length, 0);
  await withWordPress(() => [401, { code: "rest_not_logged_in", message: "Sorry" }], () => assert.rejects(edit("wordpress", s, "a", remote("5"), change("x", { title: "T" })), AuthError));
  await withWordPress(() => [400, { code: "rest_invalid_param", message: "Invalid parameter(s): status" }], () => assert.rejects(edit("wordpress", s, "a", remote("5"), change("x", { title: "T" })), PostError));
});
