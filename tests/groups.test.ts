// Channel group and Select all tests. They prove: Select all picks every working channel of one brand and never mixes
// brands, a group must be one brand's channels from this workspace, a group skips channels removed since, and names
// are checked. The MCP tool lists groups.
import { test } from "node:test";
import assert from "node:assert/strict";
import { groupBrand, groupChannels, groupName, isGroup, selectAll } from "../src/lib/groupRules";
import { handleMcp } from "../src/lib/api/mcp";
import type { Ops } from "../src/lib/api/types";

const ch = (id: string, brand_id: string | null, status = "active") => ({ id, brand_id, status });
const one = [ch("a", "b1"), ch("b", "b1"), ch("c", "b1", "reconnect")];
const two = [...one, ch("d", "b2"), ch("e", "b2")];

test("Select all picks every working channel of one brand", () => {
  assert.deepEqual(selectAll(one, []), ["a", "b"]);
  assert.deepEqual(selectAll(two, ["d"]), ["d", "e"]);
  assert.deepEqual(selectAll(two, ["a"]), ["a", "b"]);
  assert.equal(selectAll(two, []), null, "across brands it waits for a first pick");
  assert.deepEqual(selectAll([ch("x", null), ch("y", null)], []), ["x", "y"]);
});

test("a group is one brand's channels from this workspace", () => {
  assert.equal(groupBrand(["a", "b"], two), "b1");
  assert.throws(() => groupBrand(["a", "d"], two), /one brand/);
  assert.throws(() => groupBrand(["a", "zz"], two), /removed/);
  assert.throws(() => groupBrand([], two), /at least one/);
  assert.equal(groupName("  All   socials "), "All socials");
  assert.throws(() => groupName("  "), /Name the group/);
  assert.throws(() => groupName("x".repeat(61)), /under 60/);
});

test("a group skips channels removed since, and knows when it's what's picked", () => {
  const g = { id: "g", name: "All", brand_id: "b1", channel_ids: ["a", "gone", "b"] };
  assert.deepEqual(groupChannels(g, two), ["a", "b"]);
  assert.equal(isGroup(g, ["b", "a"], two), true);
  assert.equal(isGroup(g, ["a"], two), false);
  assert.equal(isGroup({ ...g, channel_ids: ["gone"] }, [], two), false);
});

test("MCP: list_channel_groups returns the groups", async () => {
  const ops = { channelGroups: async () => [{ id: "g1", name: "All socials", brand_id: "b1", channel_ids: ["a", "b"] }] } as Partial<Ops> as Ops;
  const r = (await handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_channel_groups", arguments: {} } }, ops, "UTC")) as { result: { content: { text: string }[]; isError: boolean } };
  assert.equal(r.result.isError, false);
  assert.deepEqual(JSON.parse(r.result.content[0].text).groups[0].channel_ids, ["a", "b"]);
});
