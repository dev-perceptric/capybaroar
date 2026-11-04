"use client";

import { useRef, useState } from "react";
import { AtSign, CalendarClock, ChevronDown, GripVertical, Heading, ImagePlus, LayoutGrid, Link2, Mail, Pilcrow, Plus, Trash2, Video, X } from "lucide-react";
import { Badge, Button, Field, IconButton, Input, Segmented, Switch, TextArea, inputLook } from "./ui";
import { Floating } from "./Floating";
import { askConfirm } from "./Dialogs";
import { SocialIcon } from "./BioIcons";
import {
  BLOCK_NAMES,
  MAX_BLOCKS,
  POST_COUNTS,
  SOCIALS,
  httpUrl,
  newBlockId,
  scheduleState,
  socialHref,
  socialOf,
  type Block,
  type BlockType,
  type SocialItem,
} from "@/lib/bioBlocks";

// The Blocks tab: the page's blocks as cards. Drag a card by its handle (or press the arrow keys on it) to move it,
// open it to edit in place, switch it off to hide it without losing it.

export type Img = { id: string; name: string; thumb: string | null };
export type EditorPost = { id: string; text: string; url: string; thumb: string | null };
export type PickPicture = (title: string, onPick: (id: string) => void) => void;

const ICONS: Record<BlockType, React.ReactNode> = {
  link: <Link2 />,
  header: <Heading />,
  text: <Pilcrow />,
  social: <AtSign />,
  posts: <LayoutGrid />,
  video: <Video />,
  email: <Mail />,
};
const ORDER: BlockType[] = ["link", "header", "text", "social", "posts", "video", "email"];

const pad = (n: number) => String(n).padStart(2, "0");
/** An ISO time as the value of a datetime-local box, in this browser's time zone. */
const localValue = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);
const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

function fresh(type: BlockType, social: SocialItem[]): Block {
  const id = newBlockId();
  switch (type) {
    case "link":
      return { id, type, label: "", url: "" };
    case "header":
    case "text":
      return { id, type, text: "" };
    case "social":
      return { id, type, items: social.map(({ network, url }) => ({ network, url })) };
    case "posts":
      return { id, type, count: 6, links: {} };
    case "video":
      return { id, type, url: "", title: "" };
    case "email":
      return { id, type, label: "Email", email: "" };
  }
}

function summary(b: Block): { title: string; sub: string } {
  switch (b.type) {
    case "link":
      return { title: b.label || BLOCK_NAMES.link, sub: b.url ? host(b.url) : "" };
    case "header":
      return { title: b.text || BLOCK_NAMES.header, sub: BLOCK_NAMES.header };
    case "text":
      return { title: b.text.split("\n")[0] || BLOCK_NAMES.text, sub: BLOCK_NAMES.text };
    case "social":
      return { title: BLOCK_NAMES.social, sub: b.items.map((i) => socialOf(i.network)?.name).join(", ") };
    case "posts":
      return { title: BLOCK_NAMES.posts, sub: `${b.count} posts` };
    case "video":
      return { title: b.title || BLOCK_NAMES.video, sub: b.url ? host(b.url) : "" };
    case "email":
      return { title: b.label || BLOCK_NAMES.email, sub: b.email };
  }
}

export function BioBlocks({
  blocks,
  setBlocks,
  images,
  posts,
  social,
  pick,
}: {
  blocks: Block[];
  setBlocks: (fn: (b: Block[]) => Block[]) => void;
  images: Img[];
  posts: EditorPost[];
  social: SocialItem[];
  pick: PickPicture;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const addButton = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const now = new Date();

  const update = (id: string, patch: Partial<Block>) => setBlocks((all) => all.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
  const move = (from: number, to: number) =>
    setBlocks((all) => {
      if (to < 0 || to >= all.length || from === to) return all;
      const next = [...all];
      const [b] = next.splice(from, 1);
      next.splice(to, 0, b);
      return next;
    });
  const add = (type: BlockType) => {
    setAdding(false);
    const b = fresh(type, social);
    setBlocks((all) => [b, ...all]);
    setOpen(b.id);
  };
  const remove = async (b: Block) => {
    if (!(await askConfirm(`Delete this ${BLOCK_NAMES[b.type].toLowerCase()} block?`, { ok: "Delete", danger: true }))) return;
    setBlocks((all) => all.filter((x) => x.id !== b.id));
  };

  // Dragging by the handle: the card under the pointer's middle swaps places as it passes. Works with a mouse, a pen
  // or a finger (pointer events), so the page never scrolls instead.
  const grab = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    setDragging(id);
    const over = (ev: PointerEvent) => {
      const rows = [...(list.current?.querySelectorAll<HTMLElement>("[data-block]") ?? [])];
      const from = rows.findIndex((r) => r.dataset.block === id);
      let to = from;
      rows.forEach((r, i) => {
        const box = r.getBoundingClientRect();
        const mid = box.top + box.height / 2;
        if (i < from && ev.clientY < mid) to = Math.min(to, i);
        if (i > from && ev.clientY > mid) to = Math.max(to, i);
      });
      if (from >= 0 && to !== from) move(from, to);
    };
    const done = () => {
      handle.removeEventListener("pointermove", over);
      handle.removeEventListener("pointerup", done);
      handle.removeEventListener("pointercancel", done);
      setDragging(null);
    };
    handle.addEventListener("pointermove", over);
    handle.addEventListener("pointerup", done);
    handle.addEventListener("pointercancel", done);
  };
  const keys = (i: number) => (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    move(i, e.key === "ArrowUp" ? i - 1 : i + 1);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span ref={addButton} className="inline-flex">
          <Button variant="ghost" onClick={() => setAdding(!adding)} disabled={blocks.length >= MAX_BLOCKS} aria-haspopup="menu" aria-expanded={adding}>
            <Plus /> Add block
          </Button>
        </span>
        <span className="text-[12px] text-faint tabular-nums">
          {blocks.length}/{MAX_BLOCKS}
        </span>
        {adding ? (
          <Floating anchor={addButton} placement="bottom-start" onClose={() => setAdding(false)} role="menu" className="min-w-52 rounded-lg bg-panel p-1.5 text-[13px] shadow-menu">
            {ORDER.map((t) => (
              <button key={t} type="button" role="menuitem" onClick={() => add(t)} className="flex h-8 w-full items-center gap-2.5 rounded-sm px-2.5 text-left hover:bg-hover [&_svg]:size-4 [&_svg]:text-muted">
                {ICONS[t]}
                {BLOCK_NAMES[t]}
              </button>
            ))}
          </Floating>
        ) : null}
      </div>
      {blocks.length ? (
        <ul ref={list} className="flex flex-col gap-2" aria-label="Blocks">
          {blocks.map((b, i) => {
            const s = summary(b);
            const state = scheduleState(b, now);
            const isOpen = open === b.id;
            const tag = b.hidden ? <Badge>Hidden</Badge> : state === "waiting" ? <Badge tone="amber">Scheduled</Badge> : state === "ended" ? <Badge>Ended</Badge> : state === "live" ? <Badge tone="green">Live</Badge> : null;
            return (
              <li key={b.id} data-block={b.id} className={`rounded-lg bg-panel transition-shadow duration-[var(--duration-fast)] ${dragging === b.id ? "relative z-10 shadow-hover" : "shadow-card"}`}>
                <div className="flex min-h-14 items-center gap-1.5 py-2 pr-2 pl-1">
                  <button
                    type="button"
                    aria-label={`Move ${s.title}`}
                    onPointerDown={grab(b.id)}
                    onKeyDown={keys(i)}
                    className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-faint transition-colors hover:bg-hover hover:text-ink active:cursor-grabbing"
                  >
                    <GripVertical size={16} />
                  </button>
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-md bg-paper text-muted shadow-track [&_svg]:size-3.5 ${b.hidden ? "opacity-50" : ""}`}>{ICONS[b.type]}</span>
                  <button type="button" onClick={() => setOpen(isOpen ? null : b.id)} aria-expanded={isOpen} className={`min-w-0 flex-1 px-1.5 text-left ${b.hidden ? "opacity-50" : ""}`}>
                    <span className="block truncate text-[13px] font-medium">{s.title}</span>
                    {s.sub ? <span className="block truncate text-[12px] text-muted">{s.sub}</span> : null}
                    {tag ? <span className="mt-1 flex sm:hidden">{tag}</span> : null}
                  </button>
                  {tag ? <span className="hidden sm:contents">{tag}</span> : null}
                  <Switch on={!b.hidden} label={b.hidden ? "Show" : "Hide"} onChange={(on) => update(b.id, { hidden: !on || undefined })} />
                  <IconButton label="Delete" onClick={() => void remove(b)}>
                    <Trash2 />
                  </IconButton>
                  <IconButton label={isOpen ? "Close" : "Edit"} align="end" onClick={() => setOpen(isOpen ? null : b.id)}>
                    <ChevronDown className={`transition-transform duration-[var(--duration-fast)] ${isOpen ? "rotate-180" : ""}`} />
                  </IconButton>
                </div>
                {isOpen ? (
                  <div className="flex flex-col gap-4 border-t border-line px-4 py-4">
                    <BlockFields b={b} update={(p) => update(b.id, p)} images={images} posts={posts} pick={pick} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** A picture from Media: a small preview, choose, remove. */
export function Picture({ id, images, title, pick, onChange }: { id: string | null | undefined; images: Img[]; title: string; pick: PickPicture; onChange: (id: string | null) => void }) {
  const thumb = images.find((m) => m.id === id)?.thumb;
  return (
    <div className="flex items-center gap-2">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="size-10 rounded-md object-cover shadow-chip" />
      ) : null}
      <Button variant="ghost" size="sm" onClick={() => pick(title, onChange)}>
        <ImagePlus /> {id ? "Change" : "Choose"}
      </Button>
      {id ? (
        <IconButton label="Remove picture" onClick={() => onChange(null)}>
          <X />
        </IconButton>
      ) : null}
    </div>
  );
}

function BlockFields({ b, update, images, posts, pick }: { b: Block; update: (p: Partial<Block>) => void; images: Img[]; posts: EditorPost[]; pick: PickPicture }) {
  // Links typed without https:// get it when the box is left, so the preview and the save agree.
  const tidy = (v: string) => httpUrl(v) ?? v.trim();
  switch (b.type) {
    case "link":
      return (
        <>
          <Field label="Label">
            <Input aria-label="Label" value={b.label} maxLength={80} onChange={(e) => update({ label: e.target.value })} />
          </Field>
          <Field label="Link">
            <Input aria-label="Link" value={b.url} inputMode="url" placeholder="https://" onChange={(e) => update({ url: e.target.value })} onBlur={(e) => update({ url: tidy(e.target.value) })} />
          </Field>
          <Field label="Picture">
            <Picture id={b.thumb} images={images} title="Choose a picture" pick={pick} onChange={(thumb) => update({ thumb })} />
          </Field>
          <Field label="Show only between" aside={b.start || b.end ? <CalendarClock size={14} className="text-muted" /> : null}>
            <div className="flex flex-wrap items-center gap-2">
              <input type="datetime-local" aria-label="Start" value={localValue(b.start)} onChange={(e) => update({ start: fromLocal(e.target.value) })} className={`${inputLook} w-[210px] max-w-full`} />
              <span className="text-[12px] text-muted">and</span>
              <input type="datetime-local" aria-label="End" value={localValue(b.end)} onChange={(e) => update({ end: fromLocal(e.target.value) })} className={`${inputLook} w-[210px] max-w-full`} />
              {b.start || b.end ? (
                <IconButton label="Always show" onClick={() => update({ start: null, end: null })}>
                  <X />
                </IconButton>
              ) : null}
            </div>
          </Field>
        </>
      );
    case "header":
      return (
        <Field label="Text">
          <Input aria-label="Text" value={b.text} maxLength={80} onChange={(e) => update({ text: e.target.value })} />
        </Field>
      );
    case "text":
      return (
        <Field label="Text" aside={<span className="text-[11px] text-faint tabular-nums">{b.text.length}/500</span>}>
          <TextArea aria-label="Text" rows={3} value={b.text} maxLength={500} onChange={(e) => update({ text: e.target.value })} />
        </Field>
      );
    case "social":
      return <SocialFields items={b.items} onChange={(items) => update({ items })} />;
    case "posts":
      return (
        <>
          <Field label="Posts" row>
            <Segmented label="Posts" size="sm" value={String(b.count)} onChange={(v) => update({ count: Number(v) })} options={POST_COUNTS.map((n) => ({ value: String(n), label: String(n) }))} />
          </Field>
          {posts.length ? (
            <div className="divide-y divide-line overflow-hidden rounded-lg shadow-track">
              {posts.slice(0, b.count).map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                  {p.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumb} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                  ) : (
                    <span className="size-10 shrink-0 rounded-md bg-paper" />
                  )}
                  <span className="min-w-[8rem] flex-1 truncate text-[12.5px] text-body">{p.text || host(p.url)}</span>
                  <Input
                    aria-label="Link for this post"
                    className="sm:!w-64"
                    inputMode="url"
                    placeholder={host(p.url)}
                    value={b.links[p.id] ?? ""}
                    onChange={(e) => update({ links: { ...b.links, [p.id]: e.target.value } })}
                    onBlur={(e) => update({ links: { ...b.links, [p.id]: e.target.value ? tidy(e.target.value) : "" } })}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-muted">No published posts with pictures yet</p>
          )}
        </>
      );
    case "video":
      return (
        <>
          <Field label="YouTube or TikTok link">
            <Input aria-label="YouTube or TikTok link" value={b.url} inputMode="url" placeholder="https://" onChange={(e) => update({ url: e.target.value })} onBlur={(e) => update({ url: tidy(e.target.value) })} />
          </Field>
          <Field label="Title">
            <Input aria-label="Title" value={b.title} maxLength={80} onChange={(e) => update({ title: e.target.value })} />
          </Field>
          <Field label="Picture">
            <Picture id={b.thumb} images={images} title="Choose a picture" pick={pick} onChange={(thumb) => update({ thumb })} />
          </Field>
        </>
      );
    case "email":
      return (
        <>
          <Field label="Label">
            <Input aria-label="Label" value={b.label} maxLength={80} onChange={(e) => update({ label: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input aria-label="Email" type="email" value={b.email} maxLength={254} onChange={(e) => update({ email: e.target.value })} />
          </Field>
          <Field label="Subject">
            <Input aria-label="Subject" value={b.subject ?? ""} maxLength={120} onChange={(e) => update({ subject: e.target.value })} />
          </Field>
        </>
      );
  }
}

/** The networks in a social row: a handle or link for each, in order. */
function SocialFields({ items, onChange }: { items: SocialItem[]; onChange: (items: SocialItem[]) => void }) {
  const [adding, setAdding] = useState(false);
  const button = useRef<HTMLSpanElement>(null);
  const left = SOCIALS.filter((s) => !items.some((i) => i.network === s.id));
  const set = (i: number, url: string) => onChange(items.map((it, j) => (j === i ? { ...it, url } : it)));
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => {
        const s = socialOf(it.network);
        return (
          <div key={it.network} className="flex items-center gap-2">
            <span className="flex w-28 shrink-0 items-center gap-2 text-[12.5px] font-medium text-body">
              <SocialIcon id={it.network} size={16} />
              <span className="truncate">{s?.name}</span>
            </span>
            <Input
              aria-label={`${s?.name} handle or link`}
              placeholder={it.network === "spotify" ? "https://" : "@handle or link"}
              value={it.url}
              onChange={(e) => set(i, e.target.value)}
              onBlur={(e) => set(i, socialHref(it.network, e.target.value) ?? e.target.value.trim())}
              className="min-w-0 flex-1"
            />
            <IconButton label={`Remove ${s?.name}`} align="end" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <X />
            </IconButton>
          </div>
        );
      })}
      {left.length ? (
        <div>
          <span ref={button} className="inline-flex">
            <Button variant="ghost" size="sm" onClick={() => setAdding(!adding)} aria-haspopup="menu" aria-expanded={adding}>
              <Plus /> Add network
            </Button>
          </span>
          {adding ? (
            <Floating anchor={button} placement="bottom-start" onClose={() => setAdding(false)} role="menu" className="max-h-72 min-w-48 overflow-y-auto rounded-lg bg-panel p-1.5 text-[13px] shadow-menu">
              {left.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAdding(false);
                    onChange([...items, { network: s.id, url: "" }]);
                  }}
                  className="flex h-8 w-full items-center gap-2.5 rounded-sm px-2.5 text-left hover:bg-hover"
                >
                  <SocialIcon id={s.id} size={15} />
                  {s.name}
                </button>
              ))}
            </Floating>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
