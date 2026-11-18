// The app's reads over GET (src/lib/readRules.ts, src/lib/appReads.ts). It proves: arguments travel as a JSON array
// and anything else is refused; oversized arguments are refused; the address round-trips; and only reads are on the
// list, so nothing that changes data can be called over GET.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MAX_ARGS, readArgs, readUrl } from "../src/lib/readRules";

test("arguments are a JSON array; anything else is refused", () => {
  assert.deepEqual(readArgs(null), []);
  assert.deepEqual(readArgs(""), []);
  assert.deepEqual(readArgs('["2026-11-01T00:00:00.000Z","2026-11-17T00:00:00.000Z"]'), ["2026-11-01T00:00:00.000Z", "2026-11-17T00:00:00.000Z"]);
  assert.deepEqual(readArgs('[{"status":"open","channelId":null}]'), [{ status: "open", channelId: null }]);
  assert.equal(readArgs('{"a":1}'), null);
  assert.equal(readArgs("not json"), null);
  assert.equal(readArgs(`["${"x".repeat(MAX_ARGS)}"]`), null);
});

test("the address carries the arguments and reads back the same", () => {
  assert.equal(readUrl("recentChats", []), "/api/app/recentChats");
  const url = new URL(readUrl("loadThread", ["ch 1", "t/2"]), "https://app.capybaroar.com");
  assert.equal(url.pathname, "/api/app/loadThread");
  assert.deepEqual(readArgs(url.searchParams.get("a")), ["ch 1", "t/2"]);
});

test("only reads are on the list", () => {
  const src = readFileSync(new URL("../src/lib/appReads.ts", import.meta.url), "utf8");
  const list = /export const READS = \{([^}]*)\}/.exec(src)?.[1].split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  assert.ok(list.length >= 5);
  for (const name of list) assert.match(name, /^(load|composerData|channelGroups|generationsStatus|recentChats)/, name);
});
