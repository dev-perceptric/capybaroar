// Webhook and upload-by-link tests. They prove: the server only calls the public internet (private, loopback,
// metadata and IPv6 forms of them are refused, at connect time too), files are judged by their bytes, links and
// webhooks are checked before saving, signatures can be checked by the receiver, and a delivery under random
// failures ends exactly once, never tries more than allowed, and turns a webhook off only after 5 failed deliveries
// in a row.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createHmac } from "node:crypto";
import { isPublicAddress, nameFromUrl, sniffMime } from "../src/lib/api/net";
import { BlockedAddress, safeGet, safeRequest } from "../src/lib/api/fetchSafe";
import { ApiError, mediaLink, webhookInput } from "../src/lib/api/input";
import { EVENTS, HOOK_TRIES, OFF_AFTER, afterDelivery, afterTry, sign } from "../src/lib/api/hookRules";
import { TOOLS, handleMcp } from "../src/lib/api/mcp";

test("only public internet addresses count as public", () => {
  for (const ip of ["8.8.8.8", "1.1.1.1", "151.101.1.69", "2606:4700:4700::1111", "2a00:1450:4001:80b::200e", "::ffff:8.8.8.8"]) assert.equal(isPublicAddress(ip), true, ip);
  for (const ip of [
    "0.0.0.0", "10.1.2.3", "100.64.0.1", "127.0.0.1", "169.254.169.254", "172.16.0.1", "172.31.255.255", "192.168.1.1",
    "192.0.2.10", "198.18.0.1", "203.0.113.5", "224.0.0.1", "255.255.255.255",
    "::", "::1", "fc00::1", "fdaa:0:1::3", "fe80::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "::ffff:169.254.169.254",
    "64:ff9b::7f00:1", "64:ff9b::a9fe:a9fe", "2001:db8::1", "2001::1", "2002:7f00:1::1",
    "localhost", "1.2.3", "999.1.1.1", "", "not an ip",
  ])
    assert.equal(isPublicAddress(ip), false, ip);
  assert.equal(isPublicAddress("64:ff9b::808:808"), true, "NAT64 of a public address");
});

test("files are judged by their first bytes", () => {
  const b = (...x: number[]) => new Uint8Array([...x, ...Array(16).fill(0)]);
  assert.equal(sniffMime(b(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
  assert.equal(sniffMime(b(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "image/png");
  assert.equal(sniffMime(b(0x47, 0x49, 0x46, 0x38, 0x39, 0x61)), "image/gif");
  assert.equal(sniffMime(b(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50)), "image/webp");
  assert.equal(sniffMime(b(0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d)), "video/mp4");
  assert.equal(sniffMime(b(0, 0, 0, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20)), "video/quicktime");
  assert.equal(sniffMime(b(0x49, 0x44, 0x33, 4)), "audio/mpeg");
  assert.equal(sniffMime(b(0xff, 0xfb, 0x90)), "audio/mpeg");
  assert.equal(sniffMime(b(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45)), "audio/wav");
  assert.equal(sniffMime(b(0x4f, 0x67, 0x67, 0x53)), "audio/ogg");
  assert.equal(sniffMime(new TextEncoder().encode("<!doctype html><html>")), null);
  assert.equal(nameFromUrl(new URL("https://cdn.test/a/My%20Photo.jpeg?x=1"), "image/jpeg"), "My-Photo.jpg");
  assert.equal(nameFromUrl(new URL("https://cdn.test/"), "image/png"), "file.png");
  assert.equal(nameFromUrl(new URL("https://cdn.test/clip.php"), "video/mp4"), "clip.mp4");
});

const throwsBad = (fn: () => unknown, re: RegExp) => assert.throws(fn, (e: unknown) => e instanceof ApiError && e.status === 400 && re.test(e.message));

test("links to upload from and webhook URLs are checked before saving", () => {
  throwsBad(() => mediaLink({}), /url is required/);
  throwsBad(() => mediaLink({ url: "ftp://x.test/a.png" }), /must start with http/);
  throwsBad(() => mediaLink({ url: "file:///etc/passwd" }), /must start with http/);
  throwsBad(() => mediaLink({ url: "javascript:alert(1)" }), /must start with http/);
  throwsBad(() => mediaLink({ url: "https://me:pw@x.test/a.png" }), /user name or password/);
  throwsBad(() => mediaLink({ url: "https://x.test/a.png", size: 1 }), /Unknown field/);
  assert.deepEqual({ ...mediaLink({ url: " https://x.test/a.png ", alt: "  A dog " }), url: undefined }, { url: undefined, alt: "A dog" });
  throwsBad(() => webhookInput({ url: "http://x.test/hook", events: ["post.published"] }, EVENTS), /must start with https/);
  throwsBad(() => webhookInput({ url: "https://x.test/hook", events: [] }, EVENTS), /events must be a list/);
  throwsBad(() => webhookInput({ url: "https://x.test/hook", events: ["post.deleted"] }, EVENTS), /Unknown event "post.deleted"/);
  assert.deepEqual(webhookInput({ url: "https://x.test/hook", events: ["post.failed", "post.failed"] }, EVENTS).events, ["post.failed"]);
});

test("the receiver can check a signature, and a changed body fails it", () => {
  const body = JSON.stringify({ id: "evt_1", type: "post.published" });
  const header = sign("whsec_test", body, 1793700000);
  const [t, v1] = header.split(",").map((p) => p.split("=")[1]);
  assert.equal(t, "1793700000");
  assert.equal(v1, createHmac("sha256", "whsec_test").update(`${t}.${body}`).digest("hex"));
  assert.notEqual(sign("whsec_test", body + " ", 1793700000), header);
});

test("delivery rules: 2xx ends it, anything else waits longer each time, then it stops", () => {
  assert.deepEqual(afterTry(1, 200), { done: true, ok: true });
  assert.deepEqual(afterTry(3, 204), { done: true, ok: true });
  assert.deepEqual(afterTry(1, 500), { done: false, waitMs: 60000 });
  assert.deepEqual(afterTry(2, null), { done: false, waitMs: 5 * 60000 });
  assert.deepEqual(afterTry(1, 301), { done: false, waitMs: 60000 });
  assert.deepEqual(afterTry(HOOK_TRIES, 500), { done: true, ok: false });
  assert.deepEqual(afterDelivery(3, true), { failures: 0, off: false });
  assert.deepEqual(afterDelivery(OFF_AFTER - 2, false), { failures: OFF_AFTER - 1, off: false });
  assert.deepEqual(afterDelivery(OFF_AFTER - 1, false), { failures: OFF_AFTER, off: true });
});

test("under random failures each delivery ends once, within its tries, and only 5 failed in a row turn it off", () => {
  let seed = 9;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (const failRate of [0.2, 0.6, 0.95]) {
    let failures = 0;
    let off = false;
    let streak = 0;
    for (let d = 0; d < 300 && !off; d++) {
      let attempts = 0;
      let ended: boolean | null = null;
      while (ended === null) {
        attempts++;
        const r = afterTry(attempts, rand() < failRate ? (rand() < 0.5 ? 500 : null) : 200);
        if (r.done) ended = r.ok;
        else assert.ok(r.waitMs >= 60000);
      }
      assert.ok(attempts <= HOOK_TRIES, "never more tries than allowed");
      streak = ended ? 0 : streak + 1;
      ({ failures, off } = afterDelivery(failures, ended));
      assert.equal(failures, streak, "the count is the failed deliveries in a row");
      assert.equal(off, streak >= OFF_AFTER);
    }
  }
});

test("the server refuses to call this machine, by IP or by a name that points to it", async () => {
  let hits = 0;
  const server = http.createServer((_, res) => {
    hits++;
    res.end("hi");
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  try {
    await assert.rejects(safeRequest(new URL(`http://127.0.0.1:${port}/`), { timeoutMs: 2000 }), BlockedAddress);
    await assert.rejects(safeRequest(new URL(`http://[::ffff:127.0.0.1]:${port}/`), { timeoutMs: 2000 }), BlockedAddress);
    await assert.rejects(safeRequest(new URL(`http://localhost:${port}/`), { timeoutMs: 2000 }), BlockedAddress);
    await assert.rejects(safeGet(new URL(`http://localhost:${port}/a.png`), 2000), BlockedAddress);
    assert.equal(hits, 0, "nothing reached the local server");
  } finally {
    server.close();
  }
});

test("MCP: the new tools are listed, and bad links and webhooks come back as tool errors", async () => {
  for (const n of ["upload_media", "list_webhooks", "create_webhook", "set_webhook", "test_webhook", "delete_webhook"]) assert.ok(TOOLS.some((t) => t.name === n), n);
  const ops = {} as never;
  const call = async (name: string, args: unknown) => (await handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }, ops, "UTC")) as { result: { isError: boolean; content: { text: string }[] } };
  const a = await call("upload_media", { url: "ftp://x.test/a.png" });
  assert.equal(a.result.isError, true);
  assert.match(a.result.content[0].text, /must start with http/);
  const b = await call("create_webhook", { url: "http://x.test/hook", events: ["post.published"] });
  assert.equal(b.result.isError, true);
  assert.match(b.result.content[0].text, /must start with https/);
  const c = await call("set_webhook", { id: "11111111-1111-4111-8111-111111111111", enabled: "yes" });
  assert.equal(c.result.isError, true);
});

test("a webhook to a private address or a local name is refused when it's added", () => {
  const ev = ["post.published"];
  for (const url of ["https://127.0.0.1/hook", "https://10.0.0.5/x", "https://[::1]/x", "https://169.254.169.254/", "https://localhost/x", "https://db.internal/x"]) {
    assert.throws(() => webhookInput({ url, events: ev }, ev), /public internet/, url);
  }
  assert.equal(webhookInput({ url: "https://hooks.example.com/x", events: ev }, ev).url.hostname, "hooks.example.com");
});
