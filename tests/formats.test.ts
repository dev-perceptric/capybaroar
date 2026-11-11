// AI formats: reading Claude's threads, polls and slides, and drawing slides into a PDF and JPEGs. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { CAROUSEL, SLIDESHOW, jsonOf, parsePoll, parseSlides, parseThread, slideSvg, wrap } from "../src/lib/formatRules";
import { slidesJpeg, slidesPdf } from "../src/lib/slides";
import { PDFDocument } from "pdf-lib";

test("JSON is found inside a code fence, and junk is refused", () => {
  assert.deepEqual(jsonOf('```json\n{"posts": ["a"]}\n```'), { posts: ["a"] });
  assert.throws(() => jsonOf("no json here"), /usable answer/);
  assert.throws(() => jsonOf("{not json}"), /usable answer/);
});

test("a thread keeps 2 to 10 posts, each within the limit", () => {
  const t = parseThread({ posts: ["one", "x".repeat(300), "", 5, "three"] }, 280);
  assert.equal(t.length, 3);
  assert.equal([...t[1]].length, 280);
  assert.equal(parseThread({ posts: Array.from({ length: 14 }, (_, i) => `p${i}`) }, 280).length, 10);
  assert.throws(() => parseThread({ posts: ["only one"] }, 280), /fewer than 2/);
});

test("a poll has a question and 2 to 4 options of 25 characters", () => {
  const p = parsePoll({ question: "Which bread?", options: ["Rye", "Sourdough with walnuts and figs, warm", "Brioche", "Spelt", "Extra"] }, 280);
  assert.equal(p.options.length, 4);
  assert.ok(p.options.every((o) => [...o].length <= 25));
  assert.throws(() => parsePoll({ question: "Q", options: ["only"] }, 280), /usable poll/);
});

test("slides keep a short title and body, between the minimum and maximum", () => {
  const s = parseSlides({ slides: [{ title: "A", body: "b" }, { title: "", body: "" }, { title: "C" }, { body: "d" }, { title: "E", body: "e" }] }, 3, 10);
  assert.equal(s.length, 4);
  assert.throws(() => parseSlides({ slides: [{ title: "A" }] }, 4, 12), /fewer than 4 slides/);
});

test("lines wrap on words, and a long word is split", () => {
  assert.deepEqual(wrap("one two three four", 9), ["one two", "three", "four"]);
  assert.deepEqual(wrap("abcdefghij", 4), ["abcd", "efgh", "ij"]);
});

test("a slide is SVG with the brand, the number and escaped text", () => {
  const svg = slideSvg({ title: "Fish & <chips>", body: "Tasty" }, 2, 5, { ...CAROUSEL, brand: "Crumb & Co.", accent: "#0C8C5E" });
  assert.match(svg, /width="1080" height="1350"/);
  assert.match(svg, /2\/5/);
  assert.match(svg, /Fish &amp; &lt;chips&gt;/);
  assert.match(svg, /Crumb &amp; Co\./);
});

test("slides become a PDF with one page each, and JPEG pictures", async () => {
  const slides = [{ title: "How we bake", body: "Four steps from flour to loaf." }, { title: "Feed the starter", body: "Every morning at 6." }, { title: "Shape and rest", body: "Overnight in the cold." }];
  const pdf = await slidesPdf(slides, { ...CAROUSEL, brand: "Crumb", accent: "#0C8C5E" });
  assert.equal(pdf.subarray(0, 5).toString("latin1"), "%PDF-");
  assert.equal((await PDFDocument.load(pdf)).getPageCount(), 3);
  const jpegs = await slidesJpeg(slides, { ...SLIDESHOW, brand: "Crumb", accent: "#0C8C5E" });
  assert.equal(jpegs.length, 3);
  assert.ok(jpegs.every((j) => j[0] === 0xff && j[1] === 0xd8));
});
