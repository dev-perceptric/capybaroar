// Link in bio templates and Build with AI: every template is a valid page that draws, placeholders are found and stop a
// save, Claude's answer is checked (bad links dropped, links it made up turned into placeholders, caps kept), and a
// website's links are read the way the builder expects. Fixtures only: no network, no Claude.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MAX_BLOCKS,
  PLACEHOLDER_EMAIL,
  PLACEHOLDER_VIDEO,
  buildView,
  cleanBlocks,
  isPlaceholder,
  isPlaceholderEmail,
  placeholderProblem,
  placeholdersIn,
  placeholderUrl,
  readAppearance,
  type Block,
  type Resolver,
  type SocialItem,
} from "../src/lib/bioBlocks";
import { BIO_TEMPLATES, applyTemplate, catalogText } from "../src/lib/bioTemplates";
import { SYSTEM, allowedFrom, answerSchema, buildPrompt, cleanInput, cleanResult, extractSite, type BuildContext } from "../src/lib/bioAi";
import { BioCard } from "../src/components/BioCard";

const resolver: Resolver = { media: () => null, link: (u) => u, posts: (b) => Array.from({ length: b.count }, (_, i) => ({ href: `https://example.org/p/${i}`, thumb: null, alt: "" })), video: () => null };
const mine: SocialItem[] = [
  { network: "instagram", url: "https://www.instagram.com/acme" },
  { network: "youtube", url: "https://www.youtube.com/@acme" },
];

// Templates

test("bio templates: 12 to 16, unique ids, names and lines short, tags set", () => {
  assert.ok(BIO_TEMPLATES.length >= 12 && BIO_TEMPLATES.length <= 16, String(BIO_TEMPLATES.length));
  assert.equal(new Set(BIO_TEMPLATES.map((t) => t.id)).size, BIO_TEMPLATES.length);
  for (const t of BIO_TEMPLATES) {
    assert.ok(t.name.length <= 24 && t.line.length <= 48, t.id);
    assert.ok(t.tags.length > 0, t.id);
    assert.deepEqual(readAppearance(t.appearance), t.appearance, `${t.id}: look uses allowed values`);
    assert.ok(t.blocks.length >= 3 && t.blocks.length <= 12, t.id);
  }
});

test("bio templates: every template passes the block checks, with and without connected channels", () => {
  for (const t of BIO_TEMPLATES)
    for (const social of [mine, []]) {
      const { blocks } = applyTemplate(t, social);
      const clean = cleanBlocks(blocks);
      assert.equal(clean.length, blocks.length, t.id);
      assert.equal(new Set(clean.map((b) => b.id)).size, clean.length, `${t.id}: ids are unique`);
    }
});

test("bio templates: social icons fill from the brand's channels, else wait as placeholders", () => {
  const withChannels = applyTemplate(BIO_TEMPLATES.find((t) => t.id === "creator")!, mine).blocks.find((b) => b.type === "social");
  assert.deepEqual(withChannels?.type === "social" && withChannels.items, mine);
  assert.deepEqual(withChannels && placeholdersIn(withChannels), []);
  const without = applyTemplate(BIO_TEMPLATES.find((t) => t.id === "creator")!, []).blocks.find((b) => b.type === "social");
  assert.ok(without?.type === "social" && without.items.length && without.items.every((i) => isPlaceholder(i.url)));
  assert.deepEqual(without && placeholdersIn(without), ["Instagram", "TikTok", "YouTube"]);
});

test("bio templates: every link, video and email starts as a placeholder, and a save is refused until replaced", () => {
  for (const t of BIO_TEMPLATES) {
    const { blocks } = applyTemplate(t, mine);
    for (const b of blocks) {
      if (b.type === "link" || b.type === "video") assert.ok(isPlaceholder(b.url), `${t.id}: ${b.url}`);
      if (b.type === "link") assert.match(b.url, /^https:\/\/example\.com\/[a-z0-9-]+$/);
      if (b.type === "email") assert.ok(isPlaceholderEmail(b.email));
    }
    const problem = placeholderProblem(blocks);
    assert.match(problem ?? "", /^Add your own links before saving: /, t.id);
    // Each placeholder replaced: nothing left to fill.
    const filled = blocks.map((b): Block => (b.type === "link" ? { ...b, url: "https://acme.test/x" } : b.type === "video" ? { ...b, url: "https://youtu.be/dQw4w9WgXcQ" } : b.type === "email" ? { ...b, email: "hi@acme.test" } : b));
    assert.equal(placeholderProblem(filled), null, t.id);
  }
});

test("bio templates: a scheduled link ends the given days after it's applied", () => {
  const now = new Date("2026-11-04T10:00:00Z");
  const early = applyTemplate(BIO_TEMPLATES.find((t) => t.id === "event")!, [], now).blocks.find((b) => b.type === "link" && b.label === "Early bird tickets");
  assert.equal(early?.type === "link" && early.end, "2026-11-18T10:00:00.000Z");
});

test("bio templates: every template draws, with its labels and no placeholder links counted as the brand's", () => {
  for (const t of BIO_TEMPLATES) {
    const { blocks, appearance } = applyTemplate(t, mine);
    const view = buildView({ title: "Acme", bio: "", avatar: null, appearance, badge: false, blocks }, new Date(), resolver);
    assert.equal(view.blocks.length, blocks.length, t.id);
    const html = renderToStaticMarkup(createElement(BioCard, { view, frame: true }));
    for (const b of t.blocks) if (b.type === "link") assert.ok(html.includes(b.label.replace(/'/g, "&#x27;")), `${t.id}: ${b.label}`);
    assert.ok(!/javascript:/i.test(html));
  }
});

test("bio placeholders: example.com and the empty video only", () => {
  for (const p of ["https://example.com/menu", "https://www.example.com/", "http://shop.example.org/a", PLACEHOLDER_VIDEO, "https://youtu.be/00000000000", placeholderUrl("Book a table")]) assert.ok(isPlaceholder(p), p);
  for (const p of ["https://acme.com/menu", "https://example.co/", "https://notexample.com/", "https://youtu.be/dQw4w9WgXcQ", "", "javascript:alert(1)"]) assert.ok(!isPlaceholder(p), p);
  assert.equal(placeholderUrl("Book a table"), "https://example.com/book-a-table");
  assert.equal(placeholderUrl("Café & Bar!"), "https://example.com/cafe-bar");
  assert.equal(placeholderUrl("???"), "https://example.com/link");
  assert.ok(isPlaceholderEmail(PLACEHOLDER_EMAIL) && !isPlaceholderEmail("hi@acme.com"));
  const many = Array.from({ length: 5 }, (_, i): Block => ({ id: `abcd000${i}`, type: "link", label: `L${i}`, url: placeholderUrl(`l${i}`) }));
  assert.equal(placeholderProblem(many), 'Add your own links before saving: "L0", "L1", "L2" and 2 more');
});

// Websites

const SITE = `<!doctype html><html><head>
<title>Acme Coffee &amp; Bakery</title>
<meta content="Coffee and bakes in Leeds." name="description">
<meta property="og:title" content="Not this one">
<script>document.write('<a href="/from-script">x</a>')</script>
<style>a[href="/from-style"]{}</style>
</head><body>
<!-- <a href="/commented">old</a> -->
<a href="/menu">Our <b>menu</b></a>
<a href='https://www.acme.coffee/book'>Book a table</a>
<a href="/menu#drinks">Drinks</a>
<a href="https://acme.coffee/menu">Menu again</a>
<a href="javascript:alert(1)">Bad</a>
<a href="JavaScript:alert(1)">Bad</a>
<a href="data:text/html,hi">Data</a>
<a href="tel:+441234">Call</a>
<a href="mailto:Hello@Acme.Coffee?subject=Hi">Email us</a>
<a href="https://evil.example.net/phish">Elsewhere</a>
<a href="https://www.instagram.com/acme">Instagram</a>
<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Our video</a>
<a href="/logo.png">Logo</a>
<a aria-label="Find us" href="/visit"><svg><path d="M0"/></svg></a>
<a href="//acme.coffee/gift">Gift cards</a>
<a href="https://user:pw@acme.coffee/x">Hidden login</a>
</body></html>`;

test("bio site: title, description, same-site links with text, no javascript:, deduped", () => {
  const s = extractSite(SITE, new URL("https://acme.coffee/"));
  assert.equal(s.title, "Acme Coffee & Bakery");
  assert.equal(s.description, "Coffee and bakes in Leeds.");
  assert.deepEqual(s.links, [
    { url: "https://acme.coffee/menu", text: "Our menu" },
    { url: "https://www.acme.coffee/book", text: "Book a table" },
    { url: "https://acme.coffee/visit", text: "Find us" },
    { url: "https://acme.coffee/gift", text: "Gift cards" },
  ]);
  assert.deepEqual(s.emails, ["hello@acme.coffee"]);
  assert.deepEqual(s.videos, ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"]);
});

test("bio site: at most 30 links, text clipped, entities decoded, og:title when there's no title", () => {
  const html = `<meta property="og:title" content="Shop &#8211; Home"><meta property="og:description" content="Things.">${Array.from({ length: 50 }, (_, i) => `<a href="/p/${i}">${"Item ".repeat(30)}${i}</a>`).join("")}`;
  const s = extractSite(html, new URL("https://shop.test/"));
  assert.equal(s.title, "Shop – Home");
  assert.equal(s.description, "Things.");
  assert.equal(s.links.length, 30);
  assert.ok(s.links.every((l) => l.text.length <= 80 && l.url.startsWith("https://shop.test/p/")));
});

// Build with AI

const ctx = (over: Partial<BuildContext> = {}): BuildContext => ({
  brand: "Acme Coffee",
  input: { about: "A coffee shop in Leeds", website: "https://acme.coffee/", include: ["booking"] },
  channels: [{ network: "Instagram", handle: "@acme", url: "https://www.instagram.com/acme" }],
  posts: [{ network: "YouTube", text: "Latte art", url: "https://www.youtube.com/watch?v=abcdefghijk" }],
  site: extractSite(SITE, new URL("https://acme.coffee/")),
  ...over,
});
const answer = (blocks: unknown[], over: Record<string, unknown> = {}) => ({ template: "cafe", title: "Acme Coffee", bio: "Coffee and bakes in Leeds.", appearance: { theme: "paper", shape: "rounded", fill: "solid", size: "normal" }, blocks, ...over });
const blk = (type: string, f: Record<string, string> = {}) => ({ type, label: "", url: "", text: "", email: "", ...f });

test("bio ai: links from the context are kept, made-up ones become placeholders, bad ones are dropped", () => {
  const r = cleanResult(
    answer([
      blk("link", { label: "See the menu", url: "https://acme.coffee/menu/" }),
      blk("link", { label: "Book a table", url: "acme.coffee/book" }),
      blk("link", { label: "Order online", url: "https://acme-orders.com/start" }),
      blk("link", { label: "Gift cards", url: "https://example.com/gift-cards" }),
      blk("link", { label: "Run me", url: "javascript:alert(1)" }),
      blk("link", { label: "Data", url: "data:text/html,hi" }),
      blk("link", { label: "Nothing yet", url: "" }),
      blk("link", { label: "", url: "https://acme.coffee/menu" }),
      blk("link", { label: "Instagram", url: "https://instagram.com/acme/" }),
    ]),
    ctx(),
    mine,
  );
  const links = r.blocks.map((b) => (b.type === "link" ? [b.label, b.url] : null));
  assert.deepEqual(links, [
    ["See the menu", "https://acme.coffee/menu"],
    ["Book a table", "https://www.acme.coffee/book"],
    ["Order online", "https://example.com/order-online"],
    ["Gift cards", "https://example.com/gift-cards"],
    ["Nothing yet", "https://example.com/nothing-yet"],
    ["Instagram", "https://www.instagram.com/acme"],
  ]);
  assert.match(placeholderProblem(r.blocks) ?? "", /"Order online", "Gift cards", "Nothing yet"/);
});

test("bio ai: videos and emails only from the context; social and posts from the app, once each", () => {
  const r = cleanResult(
    answer([
      blk("video", { label: "Our video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }),
      blk("video", { label: "Latte art", url: "https://youtu.be/abcdefghijk" }),
      blk("video", { label: "Made up", url: "https://www.youtube.com/watch?v=zzzzzzzzzzz" }),
      blk("video", { label: "Bad", url: "javascript:alert(1)" }),
      blk("email", { label: "Email us", email: "HELLO@acme.coffee" }),
      blk("email", { label: "Press", email: "press@acme.coffee" }),
      blk("social"),
      blk("social"),
      blk("posts"),
      blk("posts"),
      blk("header", { text: "Visit us" }),
      blk("text", { text: "   " }),
      blk("unknown", { text: "x" }),
    ]),
    ctx(),
    mine,
  );
  assert.deepEqual(
    r.blocks.map((b) => [b.type, b.type === "video" ? b.url : b.type === "email" ? b.email : b.type === "social" ? b.items.length : b.type === "header" ? b.text : ""]),
    [
      ["video", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
      ["video", "https://www.youtube.com/watch?v=abcdefghijk"],
      ["video", PLACEHOLDER_VIDEO],
      ["email", "hello@acme.coffee"],
      ["email", PLACEHOLDER_EMAIL],
      ["social", 2],
      ["posts", ""],
      ["header", "Visit us"],
    ],
  );
  // No channels: no social row at all.
  assert.ok(!cleanResult(answer([blk("social"), blk("header", { text: "Hi" })]), ctx({ channels: [] }), []).blocks.some((b) => b.type === "social"));
});

test("bio ai: caps and fixes: 50 blocks, long labels and bio clipped, unknown look and template replaced, every block valid", () => {
  const r = cleanResult(
    answer(
      Array.from({ length: 80 }, (_, i) => blk("link", { label: `${"Long label ".repeat(12)}${i}`, url: "https://acme.coffee/menu" })),
      { template: "nope", title: "T".repeat(200), bio: "B".repeat(600), appearance: { theme: "neon", shape: "blob", fill: "solid", size: "huge" } },
    ),
    ctx(),
    mine,
  );
  assert.equal(r.blocks.length, MAX_BLOCKS);
  assert.ok(r.blocks.every((b) => b.type === "link" && b.label.length <= 80));
  assert.equal(r.title.length, 80);
  assert.equal(r.bio.length, 300);
  assert.equal(r.template, BIO_TEMPLATES[0].id);
  assert.deepEqual(r.appearance, { theme: "light", shape: "pill", fill: "solid", size: "normal" });
  assert.equal(cleanBlocks(r.blocks).length, MAX_BLOCKS);
  assert.throws(() => cleanResult({ blocks: "nope" }, ctx(), mine), /didn't build a page/);
  assert.throws(() => cleanResult(answer([blk("link", { label: "x", url: "javascript:1" })]), ctx(), mine), /didn't build a page/);
});

test("bio ai: allowed links come only from the site, channels and posts", () => {
  const { urls, emails } = allowedFrom(ctx());
  const all = [...urls.values()];
  assert.ok(all.includes("https://www.instagram.com/acme") && all.includes("https://acme.coffee/menu") && all.includes("https://www.youtube.com/watch?v=abcdefghijk"));
  assert.ok(!all.some((u) => u.includes("evil.example") || u.includes("javascript")));
  assert.deepEqual([...emails], ["hello@acme.coffee"]);
  assert.equal(allowedFrom(ctx({ site: null, channels: [], posts: [] })).urls.size, 0);
});

test("bio ai: input is checked; the prompt stays small and carries the rules and the catalog", () => {
  assert.throws(() => cleanInput({ about: " " }), /Say what the page is for/);
  assert.throws(() => cleanInput({ about: "x".repeat(401) }), /one or two sentences/);
  assert.throws(() => cleanInput({ about: "Shop", website: "javascript:alert(1)" }), /website address/);
  assert.deepEqual(cleanInput({ about: " Shop ", website: "acme.com", include: ["shop", "shop", "hack"] }), { about: "Shop", website: "https://acme.com/", include: ["shop"] });
  const prompt = buildPrompt(ctx());
  for (const t of BIO_TEMPLATES) assert.ok(prompt.includes(`- ${t.id}:`), t.id);
  assert.ok(prompt.includes("https://acme.coffee/menu") && prompt.includes("@acme"));
  assert.match(SYSTEM, /Never invent a URL/);
  assert.match(SYSTEM, /Never invent facts/);
  // About 4 characters a token: the system, the prompt and the schema stay under ~4,000 tokens with a full website.
  const chars = SYSTEM.length + prompt.length + JSON.stringify(answerSchema()).length;
  assert.ok(chars < 16000, String(chars));
  assert.ok(catalogText().split("\n").length === BIO_TEMPLATES.length);
});
