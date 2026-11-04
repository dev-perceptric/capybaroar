import { test } from "node:test";
import assert from "node:assert/strict";
import { blocks, inline } from "../src/lib/markdown";

test("bold, italic, code and links become parts, never raw marks", () => {
  assert.deepEqual(inline("Saved **five drafts** for *Monday*, see `queue` at https://capybaroar.com."), [
    { kind: "text", text: "Saved " },
    { kind: "bold", text: "five drafts" },
    { kind: "text", text: " for " },
    { kind: "italic", text: "Monday" },
    { kind: "text", text: ", see " },
    { kind: "code", text: "queue" },
    { kind: "text", text: " at " },
    { kind: "link", text: "https://capybaroar.com", href: "https://capybaroar.com" },
    { kind: "text", text: "." },
  ]);
  assert.deepEqual(inline("[docs](https://capybaroar.com/api)"), [{ kind: "link", text: "docs", href: "https://capybaroar.com/api" }]);
});

test("only http and https links are links", () => {
  assert.equal(inline("[x](javascript:alert(1))").some((p) => p.kind === "link"), false);
});

test("snake_case and lone stars stay text", () => {
  assert.deepEqual(inline("use next_queue_slot * 2"), [{ kind: "text", text: "use next_queue_slot * 2" }]);
});

test("paragraphs, lists and headings", () => {
  const b = blocks("## Plan\nHere it is:\n\n- **Mon** launch\n- Tue recap\n1. one\n2. two\n\nDone.");
  assert.deepEqual(
    b.map((x) => x.kind),
    ["h", "p", "ul", "ol", "p"],
  );
  const ul = b[2] as { kind: "ul"; items: { kind: string; text: string }[][] };
  assert.equal(ul.items.length, 2);
  assert.deepEqual(ul.items[0][0], { kind: "bold", text: "Mon" });
});
