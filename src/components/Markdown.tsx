import { blocks, type Inline } from "@/lib/markdown";

function Line({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.kind === "bold" ? (
          <strong key={i} className="font-semibold">
            {p.text}
          </strong>
        ) : p.kind === "italic" ? (
          <em key={i}>{p.text}</em>
        ) : p.kind === "code" ? (
          <code key={i} className="rounded-xs bg-paper px-1 font-mono text-[12px]">
            {p.text}
          </code>
        ) : p.kind === "link" ? (
          <a key={i} href={p.href} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-ink">
            {p.text}
          </a>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

/** The agent's Markdown as text people read: lists, bold and links, never raw ** marks. */
export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {blocks(text).map((b, i) =>
        "items" in b ? (
          <ul key={i} className={`flex flex-col gap-1 pl-5 ${b.kind === "ul" ? "list-disc" : "list-decimal"}`}>
            {b.items.map((it, j) => (
              <li key={j}>
                <Line parts={it} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className={b.kind === "h" ? "font-semibold" : ""}>
            {b.lines.map((l, j) => (
              <span key={j}>
                {j ? <br /> : null}
                <Line parts={l} />
              </span>
            ))}
          </p>
        ),
      )}
    </div>
  );
}
