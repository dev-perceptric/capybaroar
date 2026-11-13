// Rate limits for the API and MCP, the pure parts. They prove: a batch of MCP messages counts once per message, a batch
// over the cap is refused before any tool runs, a weighted take can't go past the limit, and the webhook tools are
// marked so clients ask before running them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_RPC_BATCH, RateLimit } from "../src/lib/api/limit";
import { TOOLS, handleMcp, rpcCount } from "../src/lib/api/mcp";
import type { Ops } from "../src/lib/api/types";

test("a batch counts once per message; a single message or an over-cap batch counts once", () => {
  assert.equal(rpcCount({ jsonrpc: "2.0", id: 1, method: "ping" }), 1);
  assert.equal(rpcCount([]), 1);
  assert.equal(rpcCount([{}, {}, {}]), 3);
  assert.equal(rpcCount(Array.from({ length: MAX_RPC_BATCH }, () => ({}))), MAX_RPC_BATCH);
  // Refused whole (below), so it costs only the request itself.
  assert.equal(rpcCount(Array.from({ length: MAX_RPC_BATCH + 1 }, () => ({}))), 1);
  assert.equal(MAX_RPC_BATCH, 25);
});

test("a batch over the cap is refused and runs nothing", async () => {
  let ran = 0;
  const ops = new Proxy({} as Ops, {
    get: () => async () => {
      ran++;
      return [];
    },
  });
  const call = (id: number) => ({ jsonrpc: "2.0", id, method: "tools/call", params: { name: "list_brands", arguments: {} } });
  const over = (await handleMcp(Array.from({ length: MAX_RPC_BATCH + 1 }, (_, i) => call(i)), ops, "UTC")) as { error: { code: number; message: string } };
  assert.equal(over.error.code, -32600);
  assert.match(over.error.message, /up to 25/);
  assert.equal(ran, 0);
  const full = (await handleMcp(Array.from({ length: MAX_RPC_BATCH }, (_, i) => call(i)), ops, "UTC")) as unknown[];
  assert.equal(full.length, MAX_RPC_BATCH);
  assert.equal(ran, MAX_RPC_BATCH);
});

test("a weighted take never goes past the limit, and the window resets", () => {
  const l = new RateLimit(120, 60000);
  assert.equal(l.take("k", 0, 100), 0);
  assert.equal(l.take("k", 1, 25), 60);
  assert.equal(l.take("k", 2, 20), 0);
  assert.equal(l.take("k", 3, 1), 60);
  assert.equal(l.take("k", 60000, 25), 0);
});

test("webhook tools are marked so clients ask first", () => {
  const hints = (n: string) => TOOLS.find((t) => t.name === n)!.annotations;
  for (const n of ["create_webhook", "set_webhook", "delete_webhook"]) assert.equal(hints(n).destructiveHint, true, n);
  assert.equal(hints("create_webhook").openWorldHint, true);
  assert.equal(hints("set_webhook").openWorldHint, true);
  assert.equal(hints("upload_media").openWorldHint, true);
});
