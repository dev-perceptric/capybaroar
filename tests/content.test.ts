// Phase 6 tests: the CSV reader, bulk rows, feed parsing, evergreen claims and the guarded fetcher. No real feeds or
// sites are fetched: the fetcher is only pointed at a local server it must refuse.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { csvField, parseCsv } from "../src/lib/csv";
import { dailyTimes, matchChannels, parseBulk, queueTimes, readWhen, settingsFor, type BulkChannel } from "../src/lib/bulk";
import { decodeEntities, fillTemplate, newItems, parseFeed, type FeedItem } from "../src/lib/rss";
import { nextEvergreenAt, runEvergreen, WEEK_MS, type EvergreenRow, type EvergreenStore } from "../src/lib/evergreen";
import { checkUrl, isPrivateAddress, safeGet, sniffMedia } from "../src/lib/safefetch";

// CSV

test("csv: plain rows, quotes, escaped quotes, line breaks in quotes, CRLF, BOM", () => {
  const text = '﻿a,b,c\r\n1,"two, with comma","say ""hi"""\r\n"multi\nline",,x\n';
  assert.deepEqual(parseCsv(text), [
    ["a", "b", "c"],
    ["1", "two, with comma", 'say "hi"'],
    ["multi\nline", "", "x"],
  ]);
});

test("csv: blank lines are skipped, a last line without a break is kept, empty trailing fields stay", () => {
  assert.deepEqual(parseCsv("a,b\n\n1,\n2,3"), [["a", "b"], ["1", ""], ["2", "3"]]);
  assert.deepEqual(parseCsv(""), []);
  assert.deepEqual(parseCsv("only"), [["only"]]);
});

test("csv: semicolons separate fields when the header uses them (Excel in Europe)", () => {
  assert.deepEqual(parseCsv('date;text\n2026-01-01;"a; b, c"'), [["date", "text"], ["2026-01-01", "a; b, c"]]);
  // A comma file whose text has semicolons stays a comma file.
  assert.deepEqual(parseCsv("date,text\n2026-01-01,a;b;c;d"), [["date", "text"], ["2026-01-01", "a;b;c;d"]]);
});

test("csv: a quote in the middle of a field is kept as text", () => {
  assert.deepEqual(parseCsv('a,5" screen\n'), [["a", '5" screen']]);
});

test("csv: fields written with csvField read back the same", () => {
  const values = ["plain", "with, comma", 'with "quote"', "line\nbreak", "semi;colon", ""];
  assert.deepEqual(parseCsv(values.map(csvField).join(",")), [values]);
});

// Bulk rows

const CH: BulkChannel[] = [
  { id: "li", name: "Acme LinkedIn", network: "linkedin", brand_id: "b1", status: "active" },
  { id: "x1", name: "Acme on X", username: "acme", network: "x", brand_id: "b1", status: "active" },
  { id: "x2", name: "Other X", network: "x", brand_id: "b2", status: "active" },
  { id: "yt", name: "Acme Videos", network: "youtube", brand_id: "b1", status: "active" },
  { id: "bs", name: "Acme Sky", network: "bluesky", brand_id: "b1", status: "reconnect" },
];
const NOW = new Date("2026-11-03T12:00:00Z");

test("bulk: dates and times read in the workspace zone, in several spellings", () => {
  assert.equal(readWhen("2026-12-01", "09:30", "UTC")?.toISOString(), "2026-12-01T09:30:00.000Z");
  assert.equal(readWhen("2026/12/01", "9:30 PM", "UTC")?.toISOString(), "2026-12-01T21:30:00.000Z");
  assert.equal(readWhen("2026-12-01", "12:15 am", "UTC")?.toISOString(), "2026-12-01T00:15:00.000Z");
  assert.equal(readWhen("2026-12-01 08:00", "", "UTC")?.toISOString(), "2026-12-01T08:00:00.000Z");
  assert.equal(readWhen("2026-07-01", "09:00", "America/New_York")?.toISOString(), "2026-07-01T13:00:00.000Z");
  assert.equal(readWhen("2026-12-01", "09:00", "America/New_York")?.toISOString(), "2026-12-01T14:00:00.000Z");
  for (const [d, t] of [["2026-02-30", "09:00"], ["12/01/2026", "09:00"], ["2026-12-01", "25:00"], ["2026-12-01", "13:00 pm"], ["", ""]]) assert.equal(readWhen(d, t, "UTC"), null, `${d} ${t}`);
});

test("bulk: channels match by name, @username or network, without duplicates", () => {
  assert.deepEqual(matchChannels("Acme LinkedIn | @acme", CH).ids, ["li", "x1"]);
  assert.deepEqual(matchChannels("x; linkedin, X", CH).ids, ["x1", "x2", "li"]);
  assert.deepEqual(matchChannels("Nope | LinkedIn", CH), { ids: ["li"], unknown: ["Nope"] });
});

test("bulk: every problem shows on its row before anything is saved", () => {
  const csv = [
    "Date,Time,Channels,Text,Media URL,First comment,Title",
    "2026-12-01,09:30,Acme LinkedIn,Hello,,Read more below,",
    "2026-12-01,09:30,Acme on X," + "y".repeat(281) + ",,,",
    "2020-01-01,09:30,Acme LinkedIn,Old,,,",
    "2026-12-01,09:30,Nobody,Hi,,,",
    "2026-12-01,09:30,Acme on X | Other X,Two brands,,,",
    "2026-12-01,09:30,Acme Videos,No video,,,",
    "2026-12-01,09:30,Acme Videos,With video,https://cdn.example.com/a.mp4,,",
    "2026-12-01,09:30,Acme Videos,Titled,https://cdn.example.com/a.mp4,,Launch",
    "2026-12-01,09:30,Acme Sky,Hi,,,",
    "2026-12-01,09:30,Acme on X,Hi,ftp://x/a.png,,",
    "2026-12-01,09:30,Acme on X,Hi,,A comment,",
    "2026-12-01,09:30,Acme on X,,,,",
  ].join("\n");
  const { rows, error } = parseBulk(csv, CH, "UTC", NOW);
  assert.equal(error, null);
  assert.equal(rows.length, 12);
  const [ok, long, past, unknown, brands, noVideo, video, titled, reconnect, ftp, comment, empty] = rows;
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.line, 2);
  assert.equal(ok.at, "2026-12-01T09:30:00.000Z");
  assert.equal(ok.firstComment, "Read more below");
  assert.match(long.errors.join(), /up to 280 characters/);
  assert.match(past.errors.join(), /future/);
  assert.match(unknown.errors.join(), /No channel called "Nobody"/);
  assert.match(brands.errors.join(), /one brand/);
  assert.match(noVideo.errors.join(), /needs a picture or video/);
  assert.deepEqual(video.errors, []);
  assert.deepEqual(video.holds, ["Acme Videos: Title is required"]);
  assert.deepEqual(titled.holds, []);
  assert.match(reconnect.errors.join(), /Reconnect Acme Sky/);
  assert.match(ftp.errors.join(), /http/);
  assert.match(comment.errors.join(), /first comment/);
  assert.match(empty.errors.join(), /Write something/);
});

test("bulk: the file needs the main columns and a row limit", () => {
  assert.match(parseBulk("text\nhello", CH, "UTC", NOW).error ?? "", /columns/);
  assert.match(parseBulk("", CH, "UTC", NOW).error ?? "", /empty/);
  const many = ["date,time,channels,text", ...Array.from({ length: 501 }, () => "2026-12-01,09:00,x,hi")].join("\n");
  assert.match(parseBulk(many, CH, "UTC", NOW).error ?? "", /500/);
});

test("bulk: settings start from each network's defaults, with the first comment and title where they fit", () => {
  assert.deepEqual(settingsFor("youtube", { title: "T", firstComment: "c" }), { privacy: "public", for_kids: "no", category: "22", notify: "yes", synthetic: "no", title: "T" });
  assert.deepEqual(settingsFor("linkedin", { firstComment: "c" }), { visibility: "PUBLIC", reshare: "on", first_comment: "c" });
  assert.deepEqual(settingsFor("x", { firstComment: "c", title: "T" }), { reply_settings: "everyone", poll_length: "1440", made_with_ai: "no", paid_partnership: "no" });
});

test("bulk: daily times start today when the time is still ahead, else tomorrow", () => {
  assert.deepEqual(dailyTimes(2, "15:00", "UTC", NOW).map((d) => d.toISOString()), ["2026-11-03T15:00:00.000Z", "2026-11-04T15:00:00.000Z"]);
  assert.deepEqual(dailyTimes(2, "09:00", "UTC", NOW).map((d) => d.toISOString()), ["2026-11-04T09:00:00.000Z", "2026-11-05T09:00:00.000Z"]);
  assert.deepEqual(dailyTimes(1, "nope", "UTC", NOW), []);
});

test("bulk: queue times take each free slot once, skipping ones already taken", () => {
  // Tuesday 2026-11-03; slots Tue and Thu at 15:00.
  const slots = [{ day: 2, time: "15:00" }, { day: 4, time: "15:00" }];
  const taken = new Set([Date.parse("2026-11-05T15:00:00Z")]);
  assert.deepEqual(queueTimes(3, slots, "UTC", taken, NOW)?.map((d) => d.toISOString()), ["2026-11-03T15:00:00.000Z", "2026-11-10T15:00:00.000Z", "2026-11-12T15:00:00.000Z"]);
  assert.equal(queueTimes(1, [], "UTC", new Set(), NOW), null);
  // 8 weeks of one slot a week hold 8 posts at most.
  assert.equal(queueTimes(9, [{ day: 2, time: "15:00" }], "UTC", new Set(), NOW), null);
});

// Feeds

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Acme &amp; Co blog</title>
  <atom:link href="https://acme.example/feed" rel="self"/>
  <!-- <item><title>commented out</title></item> -->
  <item>
    <title><![CDATA[Winter launch: 5 things & more]]></title>
    <media:title>Not this one</media:title>
    <link>https://acme.example/winter?a=1&amp;b=2</link>
    <guid isPermaLink="false">post-2</guid>
    <pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate>
    <description>&lt;p&gt;Our &lt;b&gt;biggest&lt;/b&gt; release &amp;amp; more&lt;/p&gt;</description>
  </item>
  <item>
    <title>Autumn notes</title>
    <link>https://acme.example/autumn</link>
    <pubDate>Sun, 01 Nov 2026 10:00:00 GMT</pubDate>
    <description><![CDATA[<p>Short &amp; sweet</p>]]></description>
  </item>
</channel>
</rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="text">Example Atom</title>
  <link href="https://example.org/"/>
  <entry>
    <title>Atom &#8220;one&#8221;</title>
    <link rel="alternate" href="https://example.org/one"/>
    <link rel="enclosure" href="https://example.org/one.mp3"/>
    <id>urn:uuid:1</id>
    <updated>2026-11-02T09:00:00Z</updated>
    <summary type="html">&lt;em&gt;First&lt;/em&gt; entry</summary>
  </entry>
  <entry>
    <title>Atom two</title>
    <link href="https://example.org/two"/>
    <id>urn:uuid:2</id>
    <published>2026-11-03T09:00:00Z</published>
    <content type="html">Second</content>
  </entry>
</feed>`;

const RDF = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel rdf:about="https://old.example/"><title>Old school</title></channel>
  <item rdf:about="https://old.example/1"><title>First</title><link>https://old.example/1</link><dc:date>2026-11-01T00:00:00Z</dc:date></item>
</rdf:RDF>`;

test("feeds: RSS 2.0 with CDATA, entities, escaped HTML, comments and namespaced tags", () => {
  const f = parseFeed(RSS);
  assert.equal(f.title, "Acme & Co blog");
  assert.equal(f.items.length, 2);
  assert.deepEqual(f.items[0], {
    guid: "post-2",
    title: "Winter launch: 5 things & more",
    link: "https://acme.example/winter?a=1&b=2",
    summary: "Our biggest release & more",
    published: "2026-11-02T10:00:00.000Z",
  });
  // No guid: the link stands in.
  assert.equal(f.items[1].guid, "https://acme.example/autumn");
  assert.equal(f.items[1].summary, "Short & sweet");
});

test("feeds: Atom picks the alternate link, id, and published or updated", () => {
  const f = parseFeed(ATOM);
  assert.equal(f.title, "Example Atom");
  assert.deepEqual(
    f.items.map((i) => [i.guid, i.title, i.link, i.summary, i.published]),
    [
      ["urn:uuid:1", "Atom “one”", "https://example.org/one", "First entry", "2026-11-02T09:00:00.000Z"],
      ["urn:uuid:2", "Atom two", "https://example.org/two", "Second", "2026-11-03T09:00:00.000Z"],
    ],
  );
});

test("feeds: RSS 1.0 (RDF) items use rdf:about as their id", () => {
  const f = parseFeed(RDF);
  assert.equal(f.title, "Old school");
  assert.deepEqual(f.items.map((i) => [i.guid, i.link, i.published]), [["https://old.example/1", "https://old.example/1", "2026-11-01T00:00:00.000Z"]]);
});

test("feeds: a web page or JSON is not a feed", () => {
  assert.throws(() => parseFeed("<!doctype html><html><body>hi</body></html>"), /RSS or Atom/);
  assert.throws(() => parseFeed('{"items":[]}'), /RSS or Atom/);
});

test("feeds: entities", () => {
  assert.equal(decodeEntities("a &amp; b &lt;c&gt; &#39;d&#x27; &rsquo; &unknown;"), "a & b <c> 'd' ’ &unknown;");
});

test("feeds: the template fits the network's limit and never cuts the link", () => {
  const item = { title: "A".repeat(300), summary: "S".repeat(500) };
  const link = "https://cb.example/l/Abc1234";
  const x = fillTemplate("{title} {link}", item, link, 280);
  assert.equal([...x].length, 280);
  assert.ok(x.endsWith(` ${link}`));
  const y = fillTemplate("{title}\n\n{summary}\n\n{link}", item, link, 500);
  assert.ok([...y].length <= 500);
  assert.ok(y.startsWith("A".repeat(300)));
  assert.ok(y.endsWith(link));
  assert.equal(fillTemplate("New: {title} {link}", { title: "Hi", summary: "" }, link, 280), `New: Hi ${link}`);
});

test("feeds: new items are the unseen ones, oldest first, newest kept when capped", () => {
  const it = (guid: string, published: string | null): FeedItem => ({ guid, title: guid, link: "", summary: "", published });
  const items = [it("d", "2026-11-04T00:00:00Z"), it("c", "2026-11-03T00:00:00Z"), it("b", "2026-11-02T00:00:00Z"), it("a", "2026-11-01T00:00:00Z")];
  assert.deepEqual(newItems(items, new Set(["a"]), 2).map((i) => i.guid), ["c", "d"]);
  assert.deepEqual(newItems(items, new Set(["a", "b", "c", "d"]), 3), []);
  // Without dates the feed's own order (newest first) is used.
  const undated = [it("z", null), it("y", null), it("x", null)];
  assert.deepEqual(newItems(undated, new Set(["x"]), 5).map((i) => i.guid), ["y", "z"]);
});

// Evergreen

class Memory implements EvergreenStore {
  rows = new Map<string, EvergreenRow & { error: string | null }>();
  copies: string[] = [];
  failNext = 0;
  async due(now: Date) {
    return [...this.rows.values()].filter((r) => Date.parse(r.nextAt) <= now.getTime()).map((r) => ({ ...r }));
  }
  async claim(postId: string, from: string, to: string) {
    // Let other callers run between reading and writing, like a real round trip.
    await new Promise((r) => setTimeout(r, Math.random() * 3));
    const r = this.rows.get(postId);
    if (!r || r.nextAt !== from) return false;
    r.nextAt = to;
    return true;
  }
  async repost(row: EvergreenRow) {
    if (this.failNext > 0) {
      this.failNext--;
      throw new Error("No free slot in the next 8 weeks");
    }
    this.copies.push(row.postId);
    return `copy-${this.copies.length}`;
  }
  async done(postId: string, _copy: string | null, error: string | null) {
    this.rows.get(postId)!.error = error;
  }
}

test("evergreen: the next copy is a period later, or a full period from now after downtime", () => {
  const start = new Date("2026-11-01T09:00:00Z");
  assert.equal(nextEvergreenAt(start, 2, new Date("2026-11-01T09:10:00Z")).toISOString(), "2026-11-15T09:00:00.000Z");
  const late = new Date("2026-12-20T00:00:00Z");
  assert.equal(nextEvergreenAt(start, 2, late).getTime(), late.getTime() + 2 * WEEK_MS);
});

test("evergreen: many servers running at once make exactly one copy per period", async () => {
  const m = new Memory();
  for (let i = 0; i < 20; i++) m.rows.set(`p${i}`, { postId: `p${i}`, workspaceId: "w", everyWeeks: 4, nextAt: "2026-11-01T09:00:00.000Z", createdBy: "u", error: null });
  const now = new Date("2026-11-03T12:00:00Z");
  const made = await Promise.all(Array.from({ length: 6 }, () => runEvergreen(m, now)));
  assert.equal(made.reduce((a, b) => a + b, 0), 20);
  assert.equal(m.copies.length, 20);
  assert.equal(new Set(m.copies).size, 20);
  // Running again in the same period makes nothing.
  assert.equal(await runEvergreen(m, new Date("2026-11-20T00:00:00Z")), 0);
  // The next period makes one more each.
  assert.equal(await runEvergreen(m, new Date("2026-11-29T09:30:00Z")), 20);
  assert.equal(m.copies.length, 40);
});

test("evergreen: a failed copy is recorded and its period skipped, not retried in a loop", async () => {
  const m = new Memory();
  m.rows.set("p", { postId: "p", workspaceId: "w", everyWeeks: 1, nextAt: "2026-11-01T09:00:00.000Z", createdBy: "u", error: null });
  m.failNext = 1;
  const now = new Date("2026-11-03T12:00:00Z");
  assert.equal(await runEvergreen(m, now), 0);
  assert.match(m.rows.get("p")!.error ?? "", /No free slot/);
  assert.equal(await runEvergreen(m, now), 0);
  assert.equal(m.copies.length, 0);
  assert.equal(m.rows.get("p")!.nextAt, "2026-11-08T09:00:00.000Z");
  assert.equal(await runEvergreen(m, new Date("2026-11-08T09:00:00Z")), 1);
  assert.equal(m.rows.get("p")!.error, null);
});

// Guarded fetching

test("fetch: private, loopback, link-local, Fly-internal and mapped addresses are refused", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fdaa:0:1::3", "fe80::1", "::ffff:127.0.0.1", "::ffff:a00:1", "[::1]", "not-an-ip"])
    assert.equal(isPrivateAddress(ip), true, ip);
  for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) assert.equal(isPrivateAddress(ip), false, ip);
});

test("fetch: only http and https links to outside hosts", () => {
  assert.throws(() => checkUrl("file:///etc/passwd"), /http/);
  assert.throws(() => checkUrl("ftp://example.com/a"), /http/);
  assert.throws(() => checkUrl("http://127.0.0.1/"), /reachable/);
  assert.throws(() => checkUrl("http://[::1]:3000/"), /reachable/);
  assert.throws(() => checkUrl("http://localhost:3000/"), /reachable/);
  assert.throws(() => checkUrl("http://user:pw@example.com/"), /password/);
  assert.throws(() => checkUrl("nonsense"), /isn't a link/);
  assert.equal(checkUrl(" https://example.com/feed ").hostname, "example.com");
});

test("fetch: a local server is refused even when reached by a name that resolves to it", async () => {
  const server = createServer((_req, res) => res.end("secret"));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const port = (server.address() as { port: number }).port;
  try {
    await assert.rejects(safeGet(`http://127.0.0.1:${port}/`, { maxBytes: 1000, timeoutMs: 2000 }), /reachable/);
    // localtest.me-style names are caught at connect time by the guarded lookup; "localhost" by name.
    await assert.rejects(safeGet(`http://localhost:${port}/`, { maxBytes: 1000, timeoutMs: 2000 }), /reachable/);
  } finally {
    server.close();
  }
});

test("fetch: file types come from their first bytes", () => {
  assert.equal(sniffMedia(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(sniffMedia(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), "image/png");
  assert.equal(sniffMedia(Buffer.from("GIF89a....")), "image/gif");
  assert.equal(sniffMedia(Buffer.from("RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
  assert.equal(sniffMedia(Buffer.from("\0\0\0\x18ftypisom\0\0")), "video/mp4");
  assert.equal(sniffMedia(Buffer.from("\0\0\0\x14ftypqt  \0\0")), "video/quicktime");
  assert.equal(sniffMedia(Buffer.from("<html>")), null);
});
