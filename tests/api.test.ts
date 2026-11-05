// API and MCP tests. The input rules and the MCP protocol are pure, so they run against fake actions.
// They prove: bad input is refused with a message before anything is saved, times need an offset, a batch of posts
// gets exactly one answer per post in order even when saving fails at random, tool errors come back as results the
// model can read (never a crash), the protocol answers initialize, list, call, notifications and batches, and one key
// can't go over its rate limit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ApiError, MAX_BATCH, days, deleteArgs, postFields, range } from "../src/lib/api/input";
import { RateLimit } from "../src/lib/api/limit";
import { TOOLS, VERSIONS, handleMcp } from "../src/lib/api/mcp";
import type { ApiPost, Ops } from "../src/lib/api/types";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const AT = "2030-01-02T09:00:00-05:00";

const throwsBad = (fn: () => unknown, re: RegExp) =>
  assert.throws(fn, (e: unknown) => e instanceof ApiError && e.status === 400 && re.test(e.message));

test("a new post needs channels, and a time when it's a draft or scheduled", () => {
  throwsBad(() => postFields({ text: "hi" }, false), /channel_ids is required/);
  throwsBad(() => postFields({ channel_ids: [A], text: "hi" }, false), /publish_at is required when mode is draft/);
  throwsBad(() => postFields({ channel_ids: [A], text: "hi", mode: "schedule" }, false), /publish_at is required when mode is schedule/);
  assert.equal(postFields({ channel_ids: [A], text: "hi", publish_at: AT }, false).mode, "draft");
  assert.equal(postFields({ channel_ids: [A], text: "hi", mode: "queue" }, false).publishAt, undefined);
  assert.equal(postFields({ channel_ids: [A], text: "hi", mode: "now" }, false).mode, "now");
});

test("times need an offset so they mean one moment", () => {
  throwsBad(() => postFields({ channel_ids: [A], publish_at: "2030-01-02T09:00:00" }, false), /offset/);
  throwsBad(() => postFields({ channel_ids: [A], publish_at: "tomorrow 9am" }, false), /offset/);
  assert.equal(postFields({ channel_ids: [A], publish_at: AT }, false).publishAt, "2030-01-02T14:00:00.000Z");
  assert.equal(postFields({ channel_ids: [A], publish_at: "2030-01-02T14:00:00Z" }, false).publishAt, "2030-01-02T14:00:00.000Z");
});

test("ids, fields, text and settings are checked before saving", () => {
  throwsBad(() => postFields({ channel_ids: ["abc"], publish_at: AT }, false), /channel_ids must be an id/);
  throwsBad(() => postFields({ channel_ids: [], publish_at: AT }, false), /at least one channel/);
  throwsBad(() => postFields({ channel_ids: [A], publish_at: AT, title: "x" }, false), /Unknown field "title"/);
  throwsBad(() => postFields({ channel_ids: [A], publish_at: AT, mode: "later" }, false), /mode must be one of/);
  throwsBad(() => postFields({ channel_ids: [A], publish_at: AT, text: 5 }, false), /text must be a string/);
  throwsBad(() => postFields({ channel_ids: [A], publish_at: AT, text: "x".repeat(70001) }, false), /too long/);
  throwsBad(() => postFields({ channel_ids: [A], publish_at: AT, channel_text: { [B]: "x" } }, false), /isn't in channel_ids/);
  throwsBad(() => postFields({ channel_ids: [A], publish_at: AT, settings: { [A]: { "First Comment": "x" } } }, false), /unknown setting/);
  throwsBad(() => postFields({ channel_ids: [A], publish_at: AT, settings: { [A]: { first_comment: 1 } } }, false), /must be a string/);
  throwsBad(() => postFields([], false), /JSON object/);
  const f = postFields({ channel_ids: [A, A.toUpperCase(), B], publish_at: AT, channel_text: { [B]: "own" }, settings: { [A]: { first_comment: "c" } } }, false);
  assert.deepEqual(f.channelIds, [A, B]);
  assert.deepEqual(f.channelText, { [B]: "own" });
});

test("an update sends only what changes, and at least one field", () => {
  throwsBad(() => postFields({}, true), /at least one field/);
  assert.deepEqual(postFields({ text: "new" }, true), { text: "new" });
  assert.equal(postFields({ publish_at: null }, true).publishAt, null);
});

test("ranges and days", () => {
  const now = new Date("2030-01-01T00:00:00Z");
  const r = range(null, null, now);
  assert.equal(r.from.getTime(), now.getTime());
  assert.equal(r.to.getTime() - r.from.getTime(), 30 * 86400000);
  throwsBad(() => range("2030-01-02T00:00:00Z", "2030-01-01T00:00:00Z"), /after from/);
  throwsBad(() => range("2030-01-01T00:00:00Z", "2030-06-01T00:00:00Z"), /up to 92 days/);
  assert.equal(days(undefined), 30);
  assert.equal(days("7"), 7);
  throwsBad(() => days(14), /7, 30 or 90/);
});

test("one key can't go over its rate limit, and the window resets", () => {
  const l = new RateLimit(3, 60000);
  assert.equal(l.take("k", 0), 0);
  assert.equal(l.take("k", 1), 0);
  assert.equal(l.take("k", 2), 0);
  assert.equal(l.take("k", 3), 60);
  assert.equal(l.take("other", 3), 0);
  assert.equal(l.take("k", 30000), 30);
  assert.equal(l.take("k", 60000), 0);
});

const post = (id: string): ApiPost => ({ id, status: "draft", text: "t", publish_at: AT, brand_id: null, media_ids: [], channels: [] });

function fakeOps(over: Partial<Ops> = {}): Ops & { created: string[]; calls: string[] } {
  const created: string[] = [];
  const calls: string[] = [];
  let n = 0;
  return {
    created,
    calls,
    brands: async () => [{ id: A, name: "Brand", needs_approval: false }],
    channels: async () => [],
    posts: async () => [],
    post: async (id) => post(id),
    create: async (f) => {
      const id = `p${++n}`;
      created.push(`${id}:${f.text}`);
      return post(id);
    },
    update: async (id) => post(id),
    remove: async (id) => {
      calls.push(`remove:${id}`);
    },
    unpublish: async (id, channelIds) => {
      calls.push(`unpublish:${id}:${channelIds ? channelIds.join(",") : "all"}`);
      return { deleted: !channelIds, channels: [{ channel_id: B, name: "Page", network: "instagram", result: "manual", error: "Delete it in the Instagram app", note: null, url: "https://instagram.com/p/x" }] };
    },
    media: async () => [],
    nextSlot: async () => AT,
    analytics: async () => {
      throw new Error("no data");
    },
    uploadFromLink: async (url) => ({ id: "m1", name: url.pathname, mime: "image/png", size: 1, alt: null, created_at: AT, preview_url: null }),
    generate: async (r) => {
      calls.push(`generate:${r.kind}:${r.model}:${r.aspect}:${r.seconds}:${r.sourceMediaId ?? "-"}`);
      return { id: "g1", kind: r.kind, model: r.model, prompt: r.prompt, status: "running", error: null, media: null, created_at: AT };
    },
    generation: async (id) => ({ id, kind: "image", model: "flux-2-pro", prompt: "x", status: "done", error: null, media: { id: "m1", name: "x.jpg", mime: "image/jpeg", size: 1, alt: null, created_at: AT, preview_url: null }, created_at: AT }),
    webhooks: async () => [],
    createWebhook: async (url, events) => ({ webhook: { id: "h1", url: url.toString(), events, enabled: true, failures: 0, last_status: null, last_error: null, last_delivered_at: null, created_at: AT }, secret: "whsec_x" }),
    setWebhook: async (id, enabled) => ({ id, url: "https://x.test/", events: [], enabled, failures: 0, last_status: null, last_error: null, last_delivered_at: null, created_at: AT }),
    deleteWebhook: async () => undefined,
    testWebhook: async () => undefined,
    ...over,
  };
}

const call = (ops: Ops, name: string, args: unknown, id = 1) => handleMcp({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } }, ops, "America/New_York") as Promise<{ result: { content: { text: string }[]; isError: boolean } }>;

test("MCP: initialize picks a version both sides know, and says how to use the tools", async () => {
  const r = (await handleMcp({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } }, fakeOps(), "Asia/Ho_Chi_Minh")) as { result: { protocolVersion: string; capabilities: object; instructions: string } };
  assert.equal(r.result.protocolVersion, "2025-06-18");
  assert.deepEqual(r.result.capabilities, { tools: { listChanged: false } });
  assert.match(r.result.instructions, /Asia\/Ho_Chi_Minh/);
  const old = (await handleMcp({ jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "1999-01-01" } }, fakeOps(), "UTC")) as { result: { protocolVersion: string } };
  assert.equal(old.result.protocolVersion, VERSIONS[0]);
});

test("MCP: tools are listed once each with an object schema", async () => {
  const r = (await handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/list" }, fakeOps(), "UTC")) as { result: { tools: { name: string; inputSchema: { type: string } }[] } };
  const names = r.result.tools.map((t) => t.name);
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual(names.sort(), TOOLS.map((t) => t.name).sort());
  for (const t of r.result.tools) assert.equal(t.inputSchema.type, "object");
});

test("MCP: notifications get no answer, batches answer only requests, bad messages get JSON-RPC errors", async () => {
  assert.equal(await handleMcp({ jsonrpc: "2.0", method: "notifications/initialized" }, fakeOps(), "UTC"), null);
  const batch = (await handleMcp([{ jsonrpc: "2.0", method: "notifications/initialized" }, { jsonrpc: "2.0", id: 7, method: "ping" }], fakeOps(), "UTC")) as { id: number; result: object }[];
  assert.deepEqual(batch, [{ jsonrpc: "2.0", id: 7, result: {} }]);
  const unknown = (await handleMcp({ jsonrpc: "2.0", id: 3, method: "sing" }, fakeOps(), "UTC")) as { error: { code: number } };
  assert.equal(unknown.error.code, -32601);
  const invalid = (await handleMcp("hello", fakeOps(), "UTC")) as { error: { code: number } };
  assert.equal(invalid.error.code, -32600);
  const noTool = (await call(fakeOps(), "make_coffee", {})) as unknown as { error: { code: number } };
  assert.equal(noTool.error.code, -32602);
});

test("MCP: tool errors come back as results the model can read", async () => {
  const bad = await call(fakeOps(), "get_post", { id: "nope" });
  assert.equal(bad.result.isError, true);
  assert.match(bad.result.content[0].text, /id must be an id/);
  const broken = await call(fakeOps(), "get_analytics", { days: 30 });
  assert.equal(broken.result.isError, true);
  assert.equal(broken.result.content[0].text, "no data");
  const ok = await call(fakeOps(), "next_queue_slot", {});
  assert.equal(ok.result.isError, false);
  assert.deepEqual(JSON.parse(ok.result.content[0].text), { publish_at: AT });
});

test("MCP: a batch of posts gets one answer per post, in order, when saving fails at random", async () => {
  let seed = 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let round = 0; round < 50; round++) {
    const ops = fakeOps();
    const flaky = fakeOps({
      create: async (f) => {
        if (rand() < 0.4) throw new Error("Network hiccup");
        return ops.create(f);
      },
    });
    const posts = Array.from({ length: 1 + Math.floor(rand() * MAX_BATCH) }, (_, i) => (i % 5 === 4 ? { channel_ids: ["bad"], text: `post ${i}` } : { channel_ids: [A], text: `post ${i}`, publish_at: AT }));
    const r = await call(flaky, "create_posts", { posts });
    assert.equal(r.result.isError, false);
    const { results } = JSON.parse(r.result.content[0].text) as { results: { ok: boolean; error?: string }[] };
    assert.equal(results.length, posts.length);
    results.forEach((x, i) => {
      if (i % 5 === 4) assert.deepEqual(x, { ok: false, error: "channel_ids must be an id from this API" });
      else if (!x.ok) assert.equal(x.error, "Network hiccup");
    });
    // Each saved post was saved once, and only posts that said ok were saved.
    assert.equal(ops.created.length, results.filter((x) => x.ok).length);
    assert.equal(new Set(ops.created).size, ops.created.length);
  }
});

test("MCP: too many posts at once is refused before any is saved", async () => {
  const ops = fakeOps();
  const r = await call(ops, "create_posts", { posts: Array.from({ length: MAX_BATCH + 1 }, () => ({ channel_ids: [A], text: "x", publish_at: AT })) });
  assert.equal(r.result.isError, true);
  assert.equal(ops.created.length, 0);
});

test("deleting: record only by default, everywhere only when asked, channels only with everywhere", () => {
  assert.deepEqual(deleteArgs(undefined, undefined), { everywhere: false, channelIds: null });
  assert.deepEqual(deleteArgs(null, null), { everywhere: false, channelIds: null });
  assert.deepEqual(deleteArgs("false", ""), { everywhere: false, channelIds: null });
  assert.deepEqual(deleteArgs(true, undefined), { everywhere: true, channelIds: null });
  assert.deepEqual(deleteArgs("true", null), { everywhere: true, channelIds: null });
  // REST sends a comma list, MCP a list; both are checked as ids and deduplicated.
  assert.deepEqual(deleteArgs("true", `${A}, ${B},${A.toUpperCase()}`), { everywhere: true, channelIds: [A, B] });
  assert.deepEqual(deleteArgs(true, [B]), { everywhere: true, channelIds: [B] });
  throwsBad(() => deleteArgs("yes", undefined), /everywhere must be true or false/);
  throwsBad(() => deleteArgs(1, undefined), /everywhere must be true or false/);
  throwsBad(() => deleteArgs(false, [A]), /only goes with everywhere/);
  throwsBad(() => deleteArgs(undefined, A), /only goes with everywhere/);
  throwsBad(() => deleteArgs(true, ["abc"]), /channel_ids must be an id/);
  throwsBad(() => deleteArgs(true, []), /at least one channel/);
  throwsBad(() => deleteArgs(true, ","), /at least one channel/);
});

test("MCP: delete_post keeps removing only the record unless everywhere is true, and lists each channel's result", async () => {
  const ops = fakeOps();
  const plain = await call(ops, "delete_post", { id: A });
  assert.deepEqual(JSON.parse(plain.result.content[0].text), { deleted: true });
  const all = await call(ops, "delete_post", { id: A, everywhere: true });
  const out = JSON.parse(all.result.content[0].text) as { deleted: boolean; channels: { result: string; url: string }[] };
  assert.equal(out.deleted, true);
  assert.equal(out.channels[0].result, "manual");
  assert.equal(out.channels[0].url, "https://instagram.com/p/x");
  await call(ops, "delete_post", { id: A, everywhere: true, channel_ids: [B] });
  const bad = await call(ops, "delete_post", { id: A, channel_ids: [B] });
  assert.equal(bad.result.isError, true);
  // A refused call never reached the actions.
  assert.deepEqual(ops.calls, [`remove:${A}`, `unpublish:${A}:all`, `unpublish:${A}:${B}`]);
  const tool = TOOLS.find((t) => t.name === "delete_post")!;
  assert.deepEqual(Object.keys((tool.inputSchema as { properties: object }).properties).sort(), ["channel_ids", "everywhere", "id"]);
});
