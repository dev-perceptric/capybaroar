// The SDK, the stdio MCP package and WordPress. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { Capybaroar, CapybaroarError } from "../packages/sdk/index.js";
import { forward } from "../packages/mcp/forward.js";
import { postBody, siteOf, toHtml, wordpress } from "../src/lib/providers/wordpress";
import type { MediaFile } from "../src/lib/providers/types";

function fakeFetch(answers: (() => Response)[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const f = (async (u: string | URL, init: RequestInit = {}) => {
    calls.push({ url: String(u), init });
    return (answers.shift() ?? (() => Response.json({})))();
  }) as unknown as typeof fetch;
  return { f, calls };
}

test("SDK: sends the key, the query and the body, and returns the field", async () => {
  const { f, calls } = fakeFetch([() => Response.json({ post: { id: "p1" } }, { status: 201 })]);
  const capy = new Capybaroar({ apiKey: "cbr_x", fetch: f, baseUrl: "https://example.com" });
  const p = await capy.createPost({ channel_ids: ["c1"], text: "Hi", publish_at: "best", mode: "schedule" });
  assert.equal(p.id, "p1");
  assert.equal(calls[0].url, "https://example.com/api/v1/posts");
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer cbr_x");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { channel_ids: ["c1"], text: "Hi", publish_at: "best", mode: "schedule" });
  const two = fakeFetch([() => Response.json({ deleted: true })]);
  await new Capybaroar({ apiKey: "k", fetch: two.f, baseUrl: "https://example.com" }).deletePost("p1", { everywhere: true, channelIds: ["a", "b"] });
  assert.equal(two.calls[0].url, "https://example.com/api/v1/posts/p1?everywhere=true&channel_ids=a%2Cb");
});

test("SDK: retries a busy server, then gives the API's own error", async () => {
  const busy = fakeFetch([() => new Response("", { status: 503 }), () => Response.json({ channels: [{ id: "c" }] })]);
  assert.equal((await new Capybaroar({ apiKey: "k", fetch: busy.f, retries: 2 }).channels()).length, 1);
  assert.equal(busy.calls.length, 2);
  const bad = fakeFetch([() => Response.json({ error: { code: "invalid_request", message: "Pick a channel" } }, { status: 400 })]);
  await assert.rejects(new Capybaroar({ apiKey: "k", fetch: bad.f }).posts(), (e: unknown) => e instanceof CapybaroarError && e.status === 400 && e.code === "invalid_request" && e.message === "Pick a channel");
});

test("MCP package: forwards a message, stays quiet for notifications, and answers when the server can't be reached", async () => {
  const ok = fakeFetch([() => Response.json({ jsonrpc: "2.0", id: 1, result: { tools: [] } })]);
  assert.deepEqual(await forward('{"jsonrpc":"2.0","id":1,"method":"tools/list"}', { key: "k", url: "https://x/api/mcp", fetchImpl: ok.f, waitMs: 0 }), { jsonrpc: "2.0", id: 1, result: { tools: [] } });
  const note = fakeFetch([() => new Response(null, { status: 202 })]);
  assert.equal(await forward('{"jsonrpc":"2.0","method":"notifications/initialized"}', { key: "k", url: "https://x", fetchImpl: note.f, waitMs: 0 }), null);
  const down = (async () => {
    throw new Error("ECONNREFUSED");
  }) as unknown as typeof fetch;
  const r = (await forward('{"jsonrpc":"2.0","id":7,"method":"tools/list"}', { key: "k", url: "https://x", fetchImpl: down, waitMs: 0 })) as { id: number; error: { message: string } };
  assert.equal(r.id, 7);
  assert.match(r.error.message, /Couldn't reach Capybaroar/);
  assert.deepEqual(await forward("not json", { key: "k", url: "https://x", waitMs: 0 }), { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
});

test("WordPress: site addresses are tidied to https, without wp-admin", () => {
  assert.equal(siteOf("example.com"), "https://example.com");
  assert.equal(siteOf("https://example.com/blog/wp-admin/"), "https://example.com/blog");
  assert.throws(() => siteOf("http://example.com"), /https:\/\//);
  assert.throws(() => siteOf("not a url at all"), /site's address/);
});

test("WordPress: text becomes paragraphs with links, and the post carries title, status and terms", () => {
  assert.equal(toHtml("Hello <b>\nworld\n\nSee https://a.com/x"), '<p>Hello &lt;b&gt;<br>world</p>\n<p>See <a href="https://a.com/x">https://a.com/x</a></p>');
  assert.deepEqual(postBody({ text: "Hi", settings: { title: " T ", status: "draft", excerpt: "E" } }, { featured: 9, categories: [1], tags: [] }), { title: "T", content: "<p>Hi</p>", status: "draft", excerpt: "E", featured_media: 9, categories: [1] });
  assert.equal(postBody({ text: "x", settings: { title: "T", status: "weird" } }).status, "publish");
});

test("WordPress: a post needs a title and takes one picture as its featured image", () => {
  const pic = { mime: "image/jpeg" } as MediaFile;
  assert.equal(wordpress.check!({ text: "x", media: [], settings: {} }), "WordPress posts need a title");
  assert.equal(wordpress.check!({ text: "x", media: [pic, pic], settings: { title: "T" } }), "WordPress takes one picture, as the featured image");
  assert.equal(wordpress.check!({ text: "x", media: [{ mime: "video/mp4" } as MediaFile], settings: { title: "T" } }), "WordPress takes pictures as the featured image only");
  assert.equal(wordpress.check!({ text: "x", media: [pic], settings: { title: "T" } }), null);
});
