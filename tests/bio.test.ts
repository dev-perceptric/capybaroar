// Link in bio: block checks, scheduled links, addresses, the visit counting rules, pages from before blocks, and that
// a hidden or expired block never reaches a visitor. No database: the SQL side is checked against the same rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DEFAULT_APPEARANCE,
  MAX_BLOCKS,
  buildView,
  cleanBlock,
  cleanBlocks,
  countedLinks,
  fromLegacy,
  httpUrl,
  inWindow,
  liveBlocks,
  profileUrl,
  readAppearance,
  readBlocks,
  scheduleState,
  slugFrom,
  slugProblem,
  socialHref,
  toLegacy,
  videoSource,
  withCodes,
  type Block,
  type Resolver,
} from "../src/lib/bioBlocks";
import { VIEW_GAP_MS, clientIp, countsAsView, isBot, refHost, sumStats, visitorKey } from "../src/lib/bioViews";
import { BioCard } from "../src/components/BioCard";

const link = (over: Record<string, unknown> = {}) => ({ id: "abcd1234", type: "link", label: "Shop", url: "https://example.com/shop", ...over });

// Block checks

test("bio blocks: links are http or https only, never javascript:, data: or a hidden user@", () => {
  for (const bad of [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    " javascript:alert(document.cookie)",
    "java\tscript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://example.com/a",
    "mailto:a@b.co",
    "//example.com",
    "https://bank.com@evil.example/login",
    "https://user:pass@example.com",
    "https:// example.com",
    "not a link",
    "",
    `https://example.com/${"a".repeat(2000)}`,
  ])
    assert.equal(httpUrl(bad), null, bad);
  assert.equal(httpUrl("https://example.com/a?b=1#c"), "https://example.com/a?b=1#c");
  assert.equal(httpUrl("http://example.com"), "http://example.com/");
  // A bare address gets https:// in front.
  assert.equal(httpUrl("example.com/shop"), "https://example.com/shop");
  assert.equal(httpUrl("shop.example.co.uk"), "https://shop.example.co.uk/");

  assert.throws(() => cleanBlock(link({ url: "javascript:alert(1)" }), 1), /"Shop": use an http or https link/);
  assert.throws(() => cleanBlock(link({ label: "" }), 3), /Link 3: add a label/);
  assert.throws(() => cleanBlock(link({ thumb: "javascript:x" }), 1), /pick a picture/);
  assert.throws(() => cleanBlock({ id: "x", type: "link", label: "a", url: "https://a.co" }, 1), /bad id/);
  assert.throws(() => cleanBlock({ id: "abcd1234", type: "script" }, 1), /unknown type/);
  // Custom post links and social links go through the same check.
  assert.throws(() => cleanBlock({ id: "post1234", type: "posts", count: 6, links: { "6f1b4b8e-1c2d-4e5f-8a9b-0c1d2e3f4a5b": "javascript:alert(1)" } }, 1), /http or https/);
  assert.throws(() => cleanBlock({ id: "soc12345", type: "social", items: [{ network: "instagram", url: "javascript:alert(1)" }] }, 1), /Instagram needs/);
  assert.throws(() => cleanBlock({ id: "vid12345", type: "video", url: "https://vimeo.com/123", title: "" }, 1), /YouTube or TikTok/);
  assert.throws(() => cleanBlock({ id: "mail1234", type: "email", label: "Write", email: "a@b.co?bcc=x@y.co" }, 1), /email address/);
});

test("bio blocks: each type is trimmed to what is stored", () => {
  assert.deepEqual(cleanBlock(link({ label: "  Shop  ", url: "example.com", extra: "dropped" }), 1), { id: "abcd1234", type: "link", label: "Shop", url: "https://example.com/", thumb: null, start: null, end: null });
  assert.deepEqual(cleanBlock({ id: "head1234", type: "header", text: " New " , hidden: true }, 1), { id: "head1234", hidden: true, type: "header", text: "New" });
  assert.deepEqual(cleanBlock({ id: "soc12345", type: "social", items: [{ network: "tiktok", url: "@acme" }, { network: "mastodon", url: "acme@mastodon.social" }, { network: "whatsapp", url: "+1 (555) 010-9999" }] }, 1), {
    id: "soc12345",
    type: "social",
    items: [
      { network: "tiktok", url: "https://www.tiktok.com/@acme" },
      { network: "mastodon", url: "https://mastodon.social/@acme" },
      { network: "whatsapp", url: "https://wa.me/15550109999" },
    ],
  });
  assert.throws(() => cleanBlock({ id: "soc12345", type: "social", items: [{ network: "x", url: "a" }, { network: "x", url: "b" }] }, 1), /twice/);
  assert.equal(cleanBlock({ id: "post1234", type: "posts", count: 7, links: { "6f1b4b8e-1c2d-4e5f-8a9b-0c1d2e3f4a5b": "" } }, 1).type, "posts");
  assert.deepEqual(cleanBlock({ id: "post1234", type: "posts", count: 7, links: {} }, 1), { id: "post1234", type: "posts", count: 6, links: {} });
  assert.deepEqual(cleanBlock({ id: "mail1234", type: "email", label: "", email: "hi@acme.co", subject: "Hello" }, 1), { id: "mail1234", type: "email", label: "Email", email: "hi@acme.co", subject: "Hello" });
  // Up to 50 blocks, each id once.
  const many = Array.from({ length: MAX_BLOCKS + 1 }, (_, i) => ({ id: `hd${String(i).padStart(4, "0")}`, type: "header", text: "x" }));
  assert.throws(() => cleanBlocks(many), /Up to 50/);
  assert.equal(cleanBlocks(many.slice(0, MAX_BLOCKS)).length, MAX_BLOCKS);
  assert.throws(() => cleanBlocks([link(), link()]), /share an id/);
});

test("bio blocks: videos are YouTube or TikTok, and social rows start from connected channels", () => {
  assert.deepEqual(videoSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10"), { kind: "youtube", id: "dQw4w9WgXcQ" });
  assert.deepEqual(videoSource("https://youtu.be/dQw4w9WgXcQ"), { kind: "youtube", id: "dQw4w9WgXcQ" });
  assert.deepEqual(videoSource("https://youtube.com/shorts/dQw4w9WgXcQ"), { kind: "youtube", id: "dQw4w9WgXcQ" });
  assert.deepEqual(videoSource("https://www.tiktok.com/@acme/video/7300000000000000000"), { kind: "tiktok" });
  assert.deepEqual(videoSource("https://vm.tiktok.com/ZMabc123/"), { kind: "tiktok" });
  for (const no of ["https://www.youtube.com/@acme", "https://www.tiktok.com/@acme", "https://evil.example/youtube.com/watch?v=dQw4w9WgXcQ", "javascript:alert(1)"]) assert.equal(videoSource(no), null, no);

  assert.equal(socialHref("instagram", "@acme.co"), "https://www.instagram.com/acme.co");
  assert.equal(socialHref("instagram", "https://instagram.com/acme"), "https://instagram.com/acme");
  assert.equal(socialHref("spotify", "acme"), null);
  assert.equal(socialHref("x", "acme<script>"), null);
  assert.deepEqual(profileUrl({ network: "youtube", username: "@acme", account_id: "UCxxxxxxxxxxxxxxxxxxxxxx" }), { network: "youtube", url: "https://www.youtube.com/@acme" });
  assert.deepEqual(profileUrl({ network: "linkedin-page", username: "acme-inc", account_id: "123" }), { network: "linkedin", url: "https://www.linkedin.com/company/acme-inc" });
  assert.equal(profileUrl({ network: "linkedin", username: null, account_id: "abc" }), null);
  assert.equal(profileUrl({ network: "x", username: null, account_id: "1" }), null);
});

// Scheduled links

test("bio schedule: a link shows from its start until (not at) its end", () => {
  const b = { start: "2026-11-10T09:00:00.000Z", end: "2026-11-12T09:00:00.000Z" };
  assert.equal(inWindow(b, new Date("2026-11-10T08:59:59Z")), false);
  assert.equal(inWindow(b, new Date("2026-11-10T09:00:00Z")), true);
  assert.equal(inWindow(b, new Date("2026-11-12T08:59:59Z")), true);
  assert.equal(inWindow(b, new Date("2026-11-12T09:00:00Z")), false);
  assert.equal(inWindow({ start: null, end: "2026-11-12T09:00:00.000Z" }, new Date("2020-01-01T00:00:00Z")), true);
  assert.equal(inWindow({ start: "2026-11-10T09:00:00.000Z" }, new Date("2030-01-01T00:00:00Z")), true);
  assert.equal(inWindow({}, new Date()), true);

  const blocks = cleanBlocks([link({ id: "waiting1", ...b }), link({ id: "always11" })]);
  assert.equal(scheduleState(blocks[0], new Date("2026-11-01T00:00:00Z")), "waiting");
  assert.equal(scheduleState(blocks[0], new Date("2026-11-11T00:00:00Z")), "live");
  assert.equal(scheduleState(blocks[0], new Date("2026-11-13T00:00:00Z")), "ended");
  assert.equal(scheduleState(blocks[1], new Date()), null);
  // Times are stored as UTC instants, and an end before the start is refused.
  assert.equal((cleanBlock(link({ start: "2026-11-10T10:00:00+01:00" }), 1) as { start: string }).start, "2026-11-10T09:00:00.000Z");
  assert.throws(() => cleanBlock(link({ start: "2026-11-12T00:00:00Z", end: "2026-11-11T00:00:00Z" }), 1), /end comes after the start/);
  assert.throws(() => cleanBlock(link({ start: "next tuesday" }), 1), /valid date/);
});

// Addresses

test("bio slugs: 3 to 40 safe characters, no reserved words, the current one always allowed", () => {
  for (const ok of ["acme", "acme-co", "a1b", "my-brand-2026", "x".repeat(40)]) assert.equal(slugProblem(ok), null, ok);
  assert.match(slugProblem("ab")!, /3 to 40/);
  assert.match(slugProblem("x".repeat(41))!, /3 to 40/);
  for (const bad of ["Acme", "-acme", "acme-", "ac_me", "ac.me", "../admin", "acme co", "ácme", "acme%2f"]) assert.match(slugProblem(bad)!, /lowercase letters/, bad);
  assert.match(slugProblem("ac--me")!, /one dash/);
  for (const reserved of ["admin", "api", "login", "settings", "support", "www", "capybaroar", "capybaroar-help"]) assert.match(slugProblem(reserved)!, /reserved/, reserved);
  // A page that already has an address keeps it, even one that is reserved now.
  assert.equal(slugProblem("support", "support"), null);
  assert.match(slugProblem("support", "acme")!, /reserved/);

  assert.equal(slugFrom("Acme & Co."), "acme-co");
  assert.equal(slugFrom("Café Olé!"), "cafe-ole");
  assert.equal(slugFrom("AB"), "ab-bio");
  assert.equal(slugFrom("!!!"), "page-bio");
  assert.equal(slugFrom("A".repeat(60)).length, 40);
  for (const name of ["Acme & Co.", "Café Olé!", "AB", "!!!", "The  Very -- Long_Name Of A Brand That Keeps Going On"]) assert.equal(slugProblem(slugFrom(name)), null, name);
});

// Views

test("bio views: one per visitor per page per 30 minutes, keyed by a salted hash that changes daily", () => {
  const t = new Date("2026-11-04T10:00:00Z");
  assert.equal(countsAsView(null, t), true);
  assert.equal(countsAsView(new Date(t.getTime() - VIEW_GAP_MS + 1000), t), false);
  assert.equal(countsAsView(new Date(t.getTime() - VIEW_GAP_MS), t), true);
  assert.equal(countsAsView(new Date(t.getTime() - 5 * 60000), t), false);

  const ip = "203.0.113.7";
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Instagram 350.0";
  const key = visitorKey("salt", "page-1", ip, ua, "2026-11-04");
  assert.equal(key, visitorKey("salt", "page-1", ip, ua, "2026-11-04"));
  assert.ok(key.length >= 16 && key.length <= 64);
  assert.ok(!key.includes(ip) && !key.includes("203"));
  for (const other of [
    visitorKey("salt", "page-1", ip, ua, "2026-11-05"),
    visitorKey("salt", "page-2", ip, ua, "2026-11-04"),
    visitorKey("salt", "page-1", "203.0.113.8", ua, "2026-11-04"),
    visitorKey("salt", "page-1", ip, `${ua} x`, "2026-11-04"),
    visitorKey("other", "page-1", ip, ua, "2026-11-04"),
  ])
    assert.notEqual(other, key);

  // The SQL that decides in the database uses the same 30 minutes.
  const sql = readFileSync(new URL("../supabase/migrations/014_bio.sql", import.meta.url), "utf8");
  assert.match(sql, /where s\.seen_at <= now\(\) - interval '30 minutes'/);
  assert.match(sql, /get diagnostics n = row_count;\s+if n = 0 then\s+return false;/);
});

test("bio views: crawlers and previews aren't visitors; referrers are hosts only", () => {
  for (const bot of [null, "", "curl/8.4.0", "facebookexternalhit/1.1", "Twitterbot/1.0", "Mozilla/5.0 (compatible; Googlebot/2.1)", "WhatsApp/2.23.20.0", "Slackbot-LinkExpanding 1.0", "Mozilla/5.0 HeadlessChrome/120", "python-requests/2.31"])
    assert.equal(isBot(bot), true, String(bot));
  for (const person of [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0",
    "Mozilla/5.0 (Linux; Android 14; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) [FBAN/FBIOS;FBAV/450.0]",
  ])
    assert.equal(isBot(person), false, person);

  assert.equal(refHost("https://l.instagram.com/?u=https%3A%2F%2Fapp.capybaroar.com%2Fb%2Facme&e=abc", "app.capybaroar.com"), "instagram.com");
  assert.equal(refHost("https://www.google.com/search?q=acme", "app.capybaroar.com"), "google.com");
  assert.equal(refHost("https://t.co/abc", "app.capybaroar.com"), "x.com");
  assert.equal(refHost("https://app.capybaroar.com/bio", "app.capybaroar.com"), "");
  assert.equal(refHost("android-app://com.slack", "app.capybaroar.com"), "");
  assert.equal(refHost(null, "app.capybaroar.com"), "");

  const h = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null });
  assert.equal(clientIp(h({ "fly-client-ip": "198.51.100.1", "x-forwarded-for": "10.0.0.1, 198.51.100.9" })), "198.51.100.1");
  assert.equal(clientIp(h({ "x-forwarded-for": "198.51.100.9, 10.0.0.1" })), "198.51.100.9");
});

test("bio views: a period's numbers have every day, direct visits and items added up", () => {
  const s = sumStats(
    [
      { day: "2026-11-02", views: 10, clicks: 4, referrers: { "instagram.com": 6 }, items: { abcd1234: 3, "soc12345.x": 1 } },
      { day: "2026-11-04", views: 5, clicks: 1, referrers: { "instagram.com": 1, "google.com": 2 }, items: { abcd1234: 1 } },
      { day: "2026-10-01", views: 99, clicks: 99, referrers: {}, items: {} },
    ],
    7,
    "2026-11-04",
  );
  assert.equal(s.daily.length, 7);
  assert.equal(s.daily[0].day, "2026-10-29");
  assert.equal(s.daily.at(-1)!.day, "2026-11-04");
  assert.deepEqual([s.views, s.clicks], [15, 5]);
  assert.equal(s.rate, 5 / 15);
  assert.deepEqual(s.items, [{ item: "abcd1234", clicks: 4 }, { item: "soc12345.x", clicks: 1 }]);
  assert.deepEqual(s.referrers, [{ host: "instagram.com", views: 7 }, { host: "", views: 6 }, { host: "google.com", views: 2 }]);
  assert.equal(sumStats([], 30, "2026-11-04").rate, null);
});

// Pages from before blocks

test("bio migration: old links become link blocks that keep their codes, the posts switch a posts block", () => {
  const legacy = {
    links: [
      { label: "Shop", url: "https://acme.co/shop", code: "Ab3dEf9" },
      { label: "", url: "https://acme.co/blank", code: "Zz9yXx8" },
      { label: "Old", url: "javascript:alert(1)", code: "Qq1wEe2" },
      { label: "Blog", url: "https://acme.co/blog", code: "Rt5yUi7" },
    ],
    show_posts: true,
    theme: "dark",
  };
  const blocks = readBlocks({ blocks: null, ...legacy });
  assert.deepEqual(blocks, [
    { id: "m001", type: "link", label: "Shop", url: "https://acme.co/shop", thumb: null, start: null, end: null, code: "Ab3dEf9" },
    { id: "m004", type: "link", label: "Blog", url: "https://acme.co/blog", thumb: null, start: null, end: null, code: "Rt5yUi7" },
    { id: "mposts", type: "posts", count: 6, links: {} },
  ]);
  assert.deepEqual(fromLegacy([], false), []);
  assert.equal(readAppearance({}, legacy.theme).theme, "dark");
  assert.deepEqual(readAppearance({ theme: "sage", shape: "square", fill: "outline", size: "large" }), { theme: "sage", shape: "square", fill: "outline", size: "large", font: "inter" });
  assert.deepEqual(readAppearance({ theme: "midnight", shape: "rounded", fill: "glass", size: "normal", font: "serif" }), { theme: "midnight", shape: "rounded", fill: "glass", size: "normal", font: "serif" });
  assert.equal(readAppearance({ fill: "hard", font: "comic" }).fill, "hard");
  assert.equal(readAppearance({ fill: "hard", font: "comic" }).font, "inter");
  assert.deepEqual(readAppearance({ theme: "neon", shape: "blob" }), DEFAULT_APPEARANCE);
  // What the SQL migration writes reads back as the same blocks: same ids, same fields.
  const sql = readFileSync(new URL("../supabase/migrations/014_bio.sql", import.meta.url), "utf8");
  assert.match(sql, /'id', 'm' \|\| lpad\(t\.n::text, 3, '0'\), 'type', 'link'/);
  assert.match(sql, /'thumb', null, 'start', null, 'end', null, 'code', t\.l ->> 'code'/);
  assert.match(sql, /\[\{"id": "mposts", "type": "posts", "count": 6, "links": \{\}\}\]/);
  const asSql = { v: 1, items: [{ id: "m001", type: "link", label: "Shop", url: "https://acme.co/shop", thumb: null, start: null, end: null, code: "Ab3dEf9" }, { id: "mposts", type: "posts", count: 6, links: {} }] };
  assert.deepEqual(readBlocks({ blocks: asSql, links: [], show_posts: false }), [blocks[0], blocks[2]]);
  // A stored block that no longer passes the checks is left out instead of breaking the page.
  assert.deepEqual(readBlocks({ blocks: { v: 1, items: [link({ url: "javascript:alert(1)" }), { id: "head1234", type: "header", text: "Hi" }] } }), [{ id: "head1234", type: "header", text: "Hi" }]);
  // And an older server still finds the page's links, the posts switch and the theme.
  assert.deepEqual(toLegacy(blocks, readAppearance({ theme: "dark" })), { links: [{ label: "Shop", url: "https://acme.co/shop", code: "Ab3dEf9" }, { label: "Blog", url: "https://acme.co/blog", code: "Rt5yUi7" }], show_posts: true, theme: "dark" });
});

test("bio codes: links, videos and each social icon get the page's own short link; old codes are replaced", () => {
  const blocks = cleanBlocks([
    link({ code: "OldCode1" }),
    { id: "vid12345", type: "video", url: "https://youtu.be/dQw4w9WgXcQ", title: "Launch" },
    { id: "soc12345", type: "social", items: [{ network: "x", url: "@acme" }, { network: "github", url: "acme" }] },
    { id: "mail1234", type: "email", label: "Mail", email: "hi@acme.co" },
  ]);
  assert.deepEqual(countedLinks(blocks).map((c) => c.item), ["abcd1234", "vid12345", "soc12345.x", "soc12345.github"]);
  const coded = withCodes(blocks, new Map([["abcd1234", "NewCode1"], ["vid12345", "VidCode1"], ["soc12345.x", "XCode123"]]));
  assert.equal((coded[0] as { code?: string }).code, "NewCode1");
  assert.equal((coded[1] as { code?: string }).code, "VidCode1");
  const social = coded[2] as Extract<Block, { type: "social" }>;
  assert.deepEqual(social.items.map((i) => i.code), ["XCode123", undefined]);
});

// What a visitor gets

const resolver: Resolver = {
  media: (id) => `/b/acme/media/${id}`,
  link: (url, code) => (code ? `/l/${code}` : url),
  posts: () => [],
  video: (_b, src) => (src.kind === "youtube" ? `https://i.ytimg.com/vi/${src.id}/hqdefault.jpg` : null),
};

test("bio view: hidden blocks and links outside their window never render", () => {
  const now = new Date("2026-11-04T12:00:00Z");
  const blocks = cleanBlocks([
    link({ id: "visible1", label: "Visible link", code: "Vis1234" }),
    link({ id: "hidden11", label: "Hidden link", url: "https://secret.example/hidden", hidden: true }),
    link({ id: "expired1", label: "Expired sale", url: "https://acme.co/old-sale", end: "2026-11-01T00:00:00Z" }),
    link({ id: "future11", label: "Future drop", url: "https://acme.co/next-drop", start: "2026-12-01T00:00:00Z" }),
    link({ id: "running1", label: "Running promo", start: "2026-11-01T00:00:00Z", end: "2026-11-30T00:00:00Z" }),
    { id: "hidhead1", type: "header", text: "Hidden header", hidden: true },
    { id: "hidtext1", type: "text", text: "Hidden words", hidden: true },
    { id: "hidsoc11", type: "social", items: [{ network: "pinterest", url: "@hiddenacme" }], hidden: true },
    { id: "hidvid11", type: "video", url: "https://youtu.be/aaaaaaaaaaa", title: "Hidden video", hidden: true },
    { id: "hidmail1", type: "email", label: "Hidden mail", email: "hidden@acme.co", hidden: true },
    { id: "vid12345", type: "video", url: "https://youtu.be/dQw4w9WgXcQ", title: "Launch film" },
    { id: "mail1234", type: "email", label: "Write to us", email: "hi@acme.co", subject: "Hello there" },
  ]);
  assert.deepEqual(liveBlocks(blocks, now).map((b) => b.id), ["visible1", "running1", "vid12345", "mail1234"]);
  const view = buildView({ title: "Acme", bio: "We make things", avatar: null, appearance: DEFAULT_APPEARANCE, badge: true, blocks }, now, resolver);
  assert.deepEqual(view.blocks.map((b) => b.id), ["visible1", "running1", "vid12345", "mail1234"]);

  const html = renderToStaticMarkup(createElement(BioCard, { view }));
  for (const shown of ["Visible link", "/l/Vis1234", "Running promo", "Launch film", "mailto:hi@acme.co?subject=Hello%20there", "Made with Capybaroar"]) assert.ok(html.includes(shown), shown);
  for (const gone of ["Hidden link", "secret.example", "Expired sale", "old-sale", "Future drop", "next-drop", "Hidden header", "Hidden words", "hiddenacme", "Hidden video", "aaaaaaaaaaa", "hidden@acme.co", "javascript:"]) assert.ok(!html.includes(gone), gone);

  // The same page a minute after the sale ends, and with the badge off.
  const later = buildView({ title: "Acme", bio: "", avatar: null, appearance: DEFAULT_APPEARANCE, badge: false, blocks }, new Date("2026-11-30T00:00:00Z"), resolver);
  assert.ok(!later.blocks.some((b) => b.id === "running1"));
  assert.ok(!renderToStaticMarkup(createElement(BioCard, { view: later })).includes("Made with Capybaroar"));
});

test("bio view: a posts block with nothing to show and an empty social row are left out", () => {
  const blocks: Block[] = [
    { id: "post1234", type: "posts", count: 3, links: {} },
    { id: "soc12345", type: "social", items: [] },
    { id: "head1234", type: "header", text: "Links" },
  ];
  const view = buildView({ title: "", bio: "", avatar: null, appearance: DEFAULT_APPEARANCE, badge: true, blocks }, new Date(), resolver);
  assert.deepEqual(view.blocks.map((b) => b.id), ["head1234"]);
  const withPosts = buildView({ title: "", bio: "", avatar: null, appearance: DEFAULT_APPEARANCE, badge: true, blocks }, new Date(), {
    ...resolver,
    posts: (b) => Array.from({ length: 12 }, (_, i) => ({ href: `/b/acme/p/${b.id}/${i}`, thumb: null, alt: `Post ${i}` })),
  });
  const grid = withPosts.blocks.find((b) => b.type === "posts");
  assert.equal(grid?.type === "posts" ? grid.posts.length : 0, 3);
});

test("addresses the homepage uses are reserved, since bio pages share capybaroar.com", () => {
  for (const s of ["pricing", "privacy", "terms", "data-deletion", "brand", "img", "api", "blog", "templates"]) assert.equal(slugProblem(s), "That address is reserved", s);
  assert.equal(slugProblem("perceptric"), null);
});
