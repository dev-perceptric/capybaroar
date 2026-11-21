// Moving between posts in the post editor. Proves: posts go in time order, posts with no time are left out,
// the first has no previous and the last no next, posts at the same time keep one order, and a post that isn't
// on screen gets no arrows.
import { test } from "node:test";
import assert from "node:assert/strict";
import { neighbors } from "../src/lib/postNav";

const p = (id: string, at: string | null) => ({ id, publish_at: at });
const posts = [p("c", "2026-11-23T09:00:00Z"), p("a", "2026-11-21T09:00:00Z"), p("draft", null), p("b", "2026-11-22T09:00:00+02:00")];

test("posts go in the order they go out", () => {
  const n = neighbors(posts, "b")!;
  assert.equal(n.index, 1);
  assert.equal(n.total, 3);
  assert.equal(n.prev?.id, "a");
  assert.equal(n.next?.id, "c");
});

test("the ends have nothing on the far side", () => {
  assert.equal(neighbors(posts, "a")!.prev, null);
  assert.equal(neighbors(posts, "c")!.next, null);
});

test("posts with no time are left out", () => {
  assert.equal(neighbors(posts, "draft"), null);
});

test("posts at the same time keep one order", () => {
  const same = [p("y", "2026-11-21T09:00:00Z"), p("x", "2026-11-21T09:00:00Z"), p("z", "2026-11-21T09:00:00Z")];
  assert.equal(neighbors(same, "x")!.next?.id, "y");
  assert.equal(neighbors(same, "y")!.next?.id, "z");
  assert.equal(neighbors(same, "y")!.prev?.id, "x");
});

test("a post that isn't on screen gets no arrows", () => {
  assert.equal(neighbors(posts, "gone"), null);
});
