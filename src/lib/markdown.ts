// A small, safe reader for the Markdown the agent writes: paragraphs, bullet and numbered lists, headings,
// **bold**, *italic*, `code` and links. It returns plain data; the page draws it as React elements, so nothing
// from the text is ever run as HTML. Pure, so tests cover it.

export type Inline = { kind: "text" | "bold" | "italic" | "code"; text: string } | { kind: "link"; text: string; href: string };
export type Block = { kind: "p" | "h"; lines: Inline[][] } | { kind: "ul" | "ol"; items: Inline[][] };

const INLINE = /(\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*([^*\s][^*]*?)\*|(?<![\w])_([^_\s][^_]*?)_(?![\w])|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]))/g;

export function inline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    if (m[2] ?? m[3]) out.push({ kind: "bold", text: (m[2] ?? m[3])! });
    else if (m[4]) out.push({ kind: "code", text: m[4] });
    else if (m[5] && m[6]) out.push({ kind: "link", text: m[5], href: m[6] });
    else if (m[7] ?? m[8]) out.push({ kind: "italic", text: (m[7] ?? m[8])! });
    else if (m[9]) out.push({ kind: "link", text: m[9], href: m[9] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

export function blocks(md: string): Block[] {
  const out: Block[] = [];
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const flush = () => {
    if (para.length) out.push({ kind: "p", lines: para.map(inline) });
    if (list) out.push({ kind: list.kind, items: list.items.map(inline) });
    para = [];
    list = null;
  };
  for (const raw of md.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const num = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const head = /^#{1,6}\s+(.*)$/.exec(line);
    if (!line.trim()) flush();
    else if (head) {
      flush();
      out.push({ kind: "h", lines: [inline(head[1])] });
    } else if (bullet || num) {
      const kind = bullet ? "ul" : "ol";
      if (para.length || (list && list.kind !== kind)) flush();
      list ??= { kind, items: [] };
      list.items.push((bullet ?? num)![1]);
    } else if (list && /^\s{2,}\S/.test(raw)) list.items[list.items.length - 1] += ` ${line.trim()}`;
    else {
      if (list) flush();
      para.push(line);
    }
  }
  flush();
  return out;
}
