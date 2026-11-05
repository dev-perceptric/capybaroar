// Agent tool tests. They prove: every tool schema is valid for strict tool use (objects list every property in
// required and allow nothing else), the media tools appear only when AI media is set up, generate_media's input is
// accepted by the same checks the app runs, and a post waiting for a file is saved as a draft with the done files in.
import { test } from "node:test";
import assert from "node:assert/strict";
import { filesFor, toolsFor } from "../src/lib/agentTools";
import { genRequest } from "../src/lib/genRules";

type Schema = { type?: string | string[]; properties?: Record<string, Schema>; required?: string[]; additionalProperties?: boolean; items?: Schema; anyOf?: Schema[] };

function strictOk(s: Schema, at: string) {
  if (s.anyOf) return s.anyOf.forEach((x, i) => strictOk(x, `${at}.anyOf[${i}]`));
  if (s.type === "object") {
    assert.equal(s.additionalProperties, false, `${at}: additionalProperties must be false`);
    assert.deepEqual([...(s.required ?? [])].sort(), Object.keys(s.properties ?? {}).sort(), `${at}: required must list every property`);
    for (const [k, v] of Object.entries(s.properties ?? {})) strictOk(v, `${at}.${k}`);
  }
  if (s.type === "array" && s.items) strictOk(s.items, `${at}[]`);
}

test("every agent tool is valid for strict tool use, with and without AI media", () => {
  for (const ai of [false, true]) {
    const tools = toolsFor(ai);
    const names = tools.map((t) => t.name);
    assert.equal(new Set(names).size, names.length);
    for (const t of tools) {
      assert.equal(t.strict, true, t.name);
      strictOk(t.input_schema as Schema, t.name);
    }
  }
  assert.deepEqual(toolsFor(false).map((t) => t.name).sort(), ["list_channels", "list_posts", "save_posts"]);
  assert.deepEqual(toolsFor(true).map((t) => t.name).sort(), ["check_media", "generate_media", "list_channels", "list_media", "list_posts", "save_posts"]);
  // Without AI media, save_posts keeps its old shape.
  const plain = toolsFor(false).find((t) => t.name === "save_posts")!.input_schema as Schema;
  assert.equal(plain.properties!.posts.items!.properties!.media_ids, undefined);
});

test("what the agent sends to generate_media passes the app's checks", () => {
  const pic = genRequest({ kind: "image", prompt: "A capybara reading on a beach at sunset", model: null, aspect: "1:1", seconds: null, source_media_id: null });
  assert.deepEqual(pic, { kind: "image", model: "flux-2-pro", prompt: "A capybara reading on a beach at sunset", aspect: "1:1", seconds: 5, sourceMediaId: null });
  const vid = genRequest({ kind: "video", prompt: "Slow push-in", model: "seedance-2-fast", aspect: "9:16", seconds: 10, source_media_id: null });
  assert.equal(vid.seconds, 10);
  assert.throws(() => genRequest({ kind: "image", prompt: "x", model: "kling-3-pro", aspect: "1:1", seconds: null, source_media_id: null }), /model must be/);
});

test("a post's files: done ones go in now, a post waiting for one is saved as a draft", () => {
  const gens = [
    { id: "g1", status: "done", media_id: "m1", error: null },
    { id: "g2", status: "running", media_id: null, error: null },
    { id: "g3", status: "failed", media_id: null, error: "Output didn't pass the safety check" },
  ];
  assert.deepEqual(filesFor({ media_ids: ["m0"], generation_ids: ["g1"], mode: "schedule" }, gens), { mediaIds: ["m0", "m1"], waiting: [], mode: "schedule" });
  assert.deepEqual(filesFor({ media_ids: [], generation_ids: ["g1", "g2"], mode: "schedule" }, gens), { mediaIds: ["m1"], waiting: ["g2"], mode: "draft" });
  assert.deepEqual(filesFor({ media_ids: ["m1"], generation_ids: ["g1", "g1"], mode: "draft" }, gens), { mediaIds: ["m1"], waiting: [], mode: "draft" });
  assert.deepEqual(filesFor({ mode: "schedule" }, gens), { mediaIds: [], waiting: [], mode: "schedule" });
  assert.throws(() => filesFor({ media_ids: [], generation_ids: ["g3"], mode: "draft" }, gens), /safety check/);
  assert.throws(() => filesFor({ media_ids: [], generation_ids: ["nope"], mode: "draft" }, gens), /isn't one of this workspace's/);
});
