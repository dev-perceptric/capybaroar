// Reading RSS 2.0, RSS 1.0 (RDF) and Atom feeds without an XML library, and filling a post template from an item.
// Kept free of Supabase so tests run it on sample feeds.

export type FeedItem = { guid: string; title: string; link: string; summary: string; published: string | null };
export type Feed = { title: string; items: FeedItem[] };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };

/** Turn &amp; &#39; &#x2019; and the common named entities into their characters. */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : all;
    }
    return ENTITIES[e.toLowerCase()] ?? all;
  });
}

/** Text of an element's content: CDATA kept as is, entities decoded, tags and extra spaces removed. */
function textOf(raw: string | undefined): string {
  if (!raw) return "";
  let s = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, c: string) => c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
  // Content that is itself escaped HTML (most RSS descriptions): decode once to get the tags, then drop them.
  s = s.replace(/<[^>]*>/g, " ");
  s = decodeEntities(s);
  if (/<[a-z/!]/i.test(s)) s = decodeEntities(s.replace(/<[^>]*>/g, " "));
  return s.replace(/\s+/g, " ").trim();
}

const esc = (name: string) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The inner XML of the first `<name>` (with any namespace prefix allowed when `name` has none). */
function inner(xml: string, name: string, prefixed = true): string | undefined {
  const find = (tag: string) => {
    const m = new RegExp(`<${tag}(?:\\s[^>]*?)?(?:/>|>([\\s\\S]*?)</${tag}\\s*>)`, "i").exec(xml);
    return m ? (m[1] ?? "") : undefined;
  };
  // The plain name wins over a namespaced one (<title> before <media:title>).
  return find(esc(name)) ?? (prefixed && !name.includes(":") ? find(`[\\w-]+:${esc(name)}`) : undefined);
}

/** Attributes of every `<name ...>` tag. */
function tags(xml: string, name: string): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  const re = new RegExp(`<(?:[\\w-]+:)?${esc(name)}(\\s[^>]*?)?/?>`, "gi");
  for (let m = re.exec(xml); m; m = re.exec(xml)) {
    const attrs: Record<string, string> = {};
    for (const a of (m[1] ?? "").matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) attrs[a[1].toLowerCase()] = decodeEntities(a[3] ?? a[4] ?? "");
    out.push(attrs);
  }
  return out;
}

/** Every `<name>...</name>` block in order, with the opening tag (for its attributes). */
function blocks(xml: string, name: string): { open: string; body: string }[] {
  const re = new RegExp(`(<(?:[\\w-]+:)?${esc(name)}(?:\\s[^>]*)?>)([\\s\\S]*?)</(?:[\\w-]+:)?${esc(name)}\\s*>`, "gi");
  return [...xml.matchAll(re)].map((m) => ({ open: m[1], body: m[2] }));
}

const isoOf = (s: string) => {
  const t = Date.parse(s.trim());
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

/** Read a feed. Throws when the text isn't RSS or Atom. Items keep the feed's order (newest first in most feeds). */
export function parseFeed(xml: string): Feed {
  // Comments can hold anything, including tags.
  const doc = xml.replace(/<!--[\s\S]*?-->/g, "");
  const atom = /<(?:[\w-]+:)?feed[\s>]/i.test(doc) && !/<(?:[\w-]+:)?(rss|RDF)[\s>]/i.test(doc);
  const rss = /<(?:[\w-]+:)?(rss|RDF)[\s>]/i.test(doc) || /<channel[\s>]/i.test(doc);
  if (!atom && !rss) throw new Error("That address isn't an RSS or Atom feed");
  if (atom) {
    const head = doc.split(/<(?:[\w-]+:)?entry[\s>]/i)[0];
    const items = blocks(doc, "entry").map(({ body: e }): FeedItem => {
      const links = tags(e, "link");
      const link = (links.find((l) => !l.rel || l.rel === "alternate") ?? links[0])?.href ?? "";
      const id = textOf(inner(e, "id"));
      return {
        guid: id || link,
        title: textOf(inner(e, "title")),
        link: link.trim(),
        summary: textOf(inner(e, "summary") ?? inner(e, "content")),
        published: isoOf(textOf(inner(e, "published") ?? inner(e, "updated"))),
      };
    });
    return { title: textOf(inner(head, "title")), items: items.filter((i) => i.guid) };
  }
  const head = doc.split(/<(?:[\w-]+:)?item[\s>]/i)[0];
  const items = blocks(doc, "item").map(({ open, body: e }): FeedItem => {
    // <link> in RSS is text; some feeds carry <atom:link href> instead. RSS 1.0 names the item in rdf:about.
    const link = textOf(inner(e, "link", false)) || tags(e, "link").find((l) => l.href)?.href || "";
    const guid = textOf(inner(e, "guid")) || tags(open, "item")[0]?.["rdf:about"] || link;
    return {
      guid,
      title: textOf(inner(e, "title")),
      link: link.trim(),
      summary: textOf(inner(e, "description") ?? inner(e, "content:encoded") ?? inner(e, "summary")),
      published: isoOf(textOf(inner(e, "pubDate") ?? inner(e, "dc:date") ?? inner(e, "date"))),
    };
  });
  return { title: textOf(inner(head, "title")), items: items.filter((i) => i.guid || i.title).map((i) => ({ ...i, guid: i.guid || i.title })) };
}

export const TOKENS = ["{title}", "{link}", "{summary}"] as const;

const cut = (s: string, n: number) => {
  const chars = [...s];
  if (chars.length <= n) return s;
  if (n <= 1) return chars.slice(0, Math.max(0, n)).join("");
  return `${chars.slice(0, n - 1).join("").trimEnd()}…`;
};

/**
 * A post from the template ("{title} {link}"), at most `limit` characters. The link is never cut: the summary
 * shortens first, then the title.
 */
export function fillTemplate(template: string, item: Pick<FeedItem, "title" | "summary">, link: string, limit: number): string {
  const fill = (title: string, summary: string) => template.replace(/\{title\}/g, title).replace(/\{summary\}/g, summary).replace(/\{link\}/g, link).trim();
  const len = (s: string) => [...s].length;
  let title = item.title;
  let summary = item.summary;
  const over = () => len(fill(title, summary)) - limit;
  if (over() > 0 && template.includes("{summary}")) summary = cut(summary, Math.max(0, len(summary) - over()));
  if (over() > 0 && template.includes("{title}")) title = cut(title, Math.max(0, len(title) - over()));
  const out = fill(title, summary);
  return len(out) > limit ? cut(out, limit) : out;
}

/** The items to post this round: ones not seen before, oldest first, at most `max` (the newest ones). */
export function newItems(items: FeedItem[], seen: Set<string>, max: number): FeedItem[] {
  const fresh = items.filter((i) => !seen.has(i.guid));
  const sorted = fresh.every((i) => i.published) ? [...fresh].sort((a, b) => a.published!.localeCompare(b.published!)) : [...fresh].reverse();
  return sorted.slice(-max);
}
