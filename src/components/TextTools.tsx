"use client";

import { useRef, useState } from "react";
import { AtSign, Bold, Bookmark, Hash, Italic, Link2, Redo2, Trash2, Undo2, WandSparkles } from "lucide-react";
import { Chip, IconButton } from "./ui";
import { Floating } from "./Floating";
import { Loader } from "./Loader";
import { askConfirm, askText } from "./Dialogs";
import { aiRewrite, loadSnippets, newSnippet, removeSnippet, shortLink } from "@/app/(app)/calendar/actions";

type Area = React.RefObject<HTMLTextAreaElement | null>;
type Snippet = { id: string; name: string; body: string };

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const mod = () => (isMac() ? "⌘" : "Ctrl+");

/** Replace a range of the box's text so the browser's own undo (Cmd+Z) can take it back. */
export function replaceRange(area: HTMLTextAreaElement, start: number, end: number, text: string, select = false) {
  area.focus();
  area.setSelectionRange(start, end);
  const ok = document.execCommand("insertText", false, text);
  if (!ok) {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    setter.call(area, area.value.slice(0, start) + text + area.value.slice(end));
    area.dispatchEvent(new Event("input", { bubbles: true }));
  }
  if (select) area.setSelectionRange(start, start + text.length);
  else area.setSelectionRange(start + text.length, start + text.length);
}

// Bold and italic for networks without formatting: Unicode sans-serif letters, which show everywhere.
const BOLD = { A: 0x1d5d4, a: 0x1d5ee, d: 0x1d7ec };
const ITALIC = { A: 0x1d608, a: 0x1d622 };
const style = (s: string, kind: "bold" | "italic") => {
  const map = kind === "bold" ? BOLD : ITALIC;
  return [...s]
    .map((ch) => {
      const c = ch.codePointAt(0)!;
      if (c >= 65 && c <= 90) return String.fromCodePoint(map.A + c - 65);
      if (c >= 97 && c <= 122) return String.fromCodePoint(map.a + c - 97);
      if (kind === "bold" && c >= 48 && c <= 57) return String.fromCodePoint(BOLD.d + c - 48);
      return ch;
    })
    .join("");
};
const plain = (s: string) =>
  [...s]
    .map((ch) => {
      const c = ch.codePointAt(0)!;
      for (const base of [BOLD.A, ITALIC.A]) if (c >= base && c < base + 26) return String.fromCharCode(65 + c - base);
      for (const base of [BOLD.a, ITALIC.a]) if (c >= base && c < base + 26) return String.fromCharCode(97 + c - base);
      if (c >= BOLD.d && c < BOLD.d + 10) return String.fromCharCode(48 + c - BOLD.d);
      return ch;
    })
    .join("");
const isStyled = (s: string, kind: "bold" | "italic") => {
  const letters = [...s].filter((ch) => /\S/.test(ch));
  return letters.length > 0 && style(plain(s), kind) === s && plain(s) !== s;
};

/** Turn the selected text bold or italic, or back to plain if it already is. */
export function toggleStyle(area: HTMLTextAreaElement, kind: "bold" | "italic") {
  const { selectionStart: s, selectionEnd: e, value } = area;
  if (s === e) return;
  const part = value.slice(s, e);
  replaceRange(area, s, e, isStyled(part, kind) ? plain(part) : style(plain(part), kind), true);
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;

const AI: { how: string; label: string }[] = [
  { how: "improve", label: "Improve" },
  { how: "fit", label: "Fit to this network" },
  { how: "hook", label: "Stronger first line" },
  { how: "shorter", label: "Shorter" },
  { how: "longer", label: "Longer" },
  { how: "casual", label: "More casual" },
  { how: "professional", label: "More professional" },
  { how: "hashtags", label: "Add hashtags" },
  { how: "fix", label: "Fix spelling and grammar" },
];

const MENU = "min-w-60 rounded-lg bg-panel p-1.5 text-[13px] shadow-menu";
const ROW = "flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left hover:bg-hover disabled:text-faint";

/** The bar over a post's text, inside the text's box (`boxClass`): undo, formatting, hashtags, mentions, short links,
 *  snippets and Claude. */
export function TextTools({ area, network, onError, aiOpen, setAiOpen }: { area: Area; network: string | null; onError: (m: string) => void; aiOpen: boolean; setAiOpen: (v: boolean) => void }) {
  const aiBtn = useRef<HTMLSpanElement>(null);
  const snipBtn = useRef<HTMLSpanElement>(null);
  const [snips, setSnips] = useState<Snippet[] | null>(null);
  const [snipOpen, setSnipOpen] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const k = mod();

  const box = () => area.current;
  const insertAtCursor = (str: string) => {
    const a = box();
    if (!a) return;
    const before = a.value.slice(0, a.selectionStart);
    const pre = before && !/\s$/.test(before) && /^[#@]/.test(str) ? " " : "";
    replaceRange(a, a.selectionStart, a.selectionEnd, pre + str);
  };
  const exec = (cmd: "undo" | "redo") => {
    box()?.focus();
    document.execCommand(cmd);
  };

  const shortenAll = async () => {
    const a = box();
    if (!a) return;
    const sel = a.value.slice(a.selectionStart, a.selectionEnd).trim();
    if (sel && !/^https?:\/\//.test(sel)) {
      onError("Select a link, or leave nothing selected to shorten every link");
      return;
    }
    const found = [...a.value.matchAll(URL_RE)].filter((m) => !m[0].includes("/l/")).filter((m) => !sel || m[0] === sel);
    if (!found.length) {
      onError("No links to shorten");
      return;
    }
    setWorking("link");
    for (const m of found.reverse()) {
      const r = await shortLink(m[0]);
      if (r.error || !r.url) {
        onError(r.error ?? "Couldn't shorten a link");
        break;
      }
      const at = a.value.indexOf(m[0]);
      if (at >= 0) replaceRange(a, at, at + m[0].length, r.url);
    }
    setWorking(null);
  };

  const rewrite = async (how: string) => {
    const a = box();
    setAiOpen(false);
    if (!a) return;
    const s = a.selectionStart;
    const e = a.selectionEnd;
    const whole = s === e;
    const from = whole ? 0 : s;
    const to = whole ? a.value.length : e;
    const part = a.value.slice(from, to);
    if (!part.trim()) {
      onError("Write something first");
      return;
    }
    setWorking("ai");
    const r = await aiRewrite(part, how, network);
    setWorking(null);
    if (r.error || r.text == null) onError(r.error ?? "Claude didn't answer, try again");
    else replaceRange(a, from, to, r.text, true);
  };

  const openSnips = () => {
    setSnipOpen((v) => !v);
    if (!snips) loadSnippets().then((s) => setSnips(s), () => setSnips([]));
  };
  const saveSnip = async () => {
    const a = box();
    if (!a) return;
    const body = a.value.slice(a.selectionStart, a.selectionEnd) || a.value;
    if (!body.trim()) {
      onError("Select the text to save");
      return;
    }
    setSnipOpen(false);
    const name = await askText("Save as snippet", { placeholder: "Name, like Brand hashtags", ok: "Save" });
    if (!name?.trim()) return;
    const r = await newSnippet(name, body);
    if (r.error || !r.snippet) onError(r.error ?? "Couldn't save");
    else setSnips((s) => [r.snippet!, ...(s ?? [])]);
  };
  const delSnip = async (s: Snippet) => {
    setSnipOpen(false);
    if (!(await askConfirm(`Delete "${s.name}"?`, { ok: "Delete", danger: true }))) return;
    const r = await removeSnippet(s.id);
    if (r.error) onError(r.error);
    else setSnips((all) => (all ?? []).filter((x) => x.id !== s.id));
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-paper px-1.5 py-1">
      <IconButton label={`Undo (${k}Z)`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("undo")}>
        <Undo2 />
      </IconButton>
      <IconButton label={`Redo (${k}${isMac() ? "⇧Z" : "Y"})`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("redo")}>
        <Redo2 />
      </IconButton>
      <Sep />
      <IconButton label={`Bold (${k}B)`} onMouseDown={(e) => e.preventDefault()} onClick={() => box() && toggleStyle(box()!, "bold")}>
        <Bold />
      </IconButton>
      <IconButton label={`Italic (${k}I)`} onMouseDown={(e) => e.preventDefault()} onClick={() => box() && toggleStyle(box()!, "italic")}>
        <Italic />
      </IconButton>
      <Sep />
      <IconButton label="Hashtag" onMouseDown={(e) => e.preventDefault()} onClick={() => insertAtCursor("#")}>
        <Hash />
      </IconButton>
      <IconButton label="Mention" onMouseDown={(e) => e.preventDefault()} onClick={() => insertAtCursor("@")}>
        <AtSign />
      </IconButton>
      <IconButton label="Shorten links" onMouseDown={(e) => e.preventDefault()} onClick={shortenAll} disabled={working === "link"}>
        {working === "link" ? <Loader /> : <Link2 />}
      </IconButton>
      <span ref={snipBtn} className="inline-flex">
        <IconButton label="Snippets" aria-expanded={snipOpen} onMouseDown={(e) => e.preventDefault()} onClick={openSnips}>
          <Bookmark />
        </IconButton>
      </span>
      <span className="flex-1" />
      <span ref={aiBtn} className="inline-flex">
        <Chip size="sm" on={aiOpen} aria-expanded={aiOpen} disabled={working === "ai"} onMouseDown={(e) => e.preventDefault()} onClick={() => setAiOpen(!aiOpen)} className="font-medium">
          {working === "ai" ? <Loader /> : <WandSparkles size={14} />}
          Rewrite
          <span className="text-[11px] font-normal text-muted">{k}J</span>
        </Chip>
      </span>

      {aiOpen ? (
        <Floating anchor={aiBtn} placement="bottom-end" onClose={() => setAiOpen(false)} role="menu" className={MENU}>
          {AI.filter((x) => x.how !== "fit" || network).map((x) => (
            <button key={x.how} type="button" role="menuitem" className={ROW} onMouseDown={(e) => e.preventDefault()} onClick={() => rewrite(x.how)}>
              {x.label}
            </button>
          ))}
        </Floating>
      ) : null}

      {snipOpen ? (
        <Floating anchor={snipBtn} placement="bottom-start" onClose={() => setSnipOpen(false)} role="menu" className={`${MENU} max-w-80`}>
          {snips === null ? (
            <div className="px-3 py-2">
              <Loader />
            </div>
          ) : (
            snips.map((s) => (
              <div key={s.id} className="group/snip flex items-center rounded-sm hover:bg-hover">
                <button type="button" role="menuitem" title={s.body} className="flex min-w-0 flex-1 flex-col px-2.5 py-1.5 text-left" onMouseDown={(e) => e.preventDefault()} onClick={() => (setSnipOpen(false), insertAtCursor(s.body))}>
                  <span className="truncate font-medium">{s.name}</span>
                  <span className="truncate text-[12px] text-muted">{s.body}</span>
                </button>
                <IconButton label="Delete snippet" className="mr-0.5 opacity-0 group-focus-within/snip:opacity-100 group-hover/snip:opacity-100" onClick={() => delSnip(s)}>
                  <Trash2 />
                </IconButton>
              </div>
            ))
          )}
          <div className="my-1 -mx-1.5 border-t border-line" />
          <button type="button" role="menuitem" className={ROW} onMouseDown={(e) => e.preventDefault()} onClick={saveSnip}>
            Save selection as snippet
          </button>
        </Floating>
      ) : null}
    </div>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-line" />;
}
