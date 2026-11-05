"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, AudioLines, Bot, CalendarCheck, CalendarDays, Check, ChevronDown, Copy, History, Image as ImageIcon, Link2, Paperclip, Plus, RotateCcw, Sparkles, TrendingUp, Video, X } from "lucide-react";
import { IconButton, Page } from "./ui";
import { Loader } from "./Loader";
import { Logo } from "./Logo";
import { Drawing } from "./Drawing";
import { Floating } from "./Floating";
import { Markdown } from "./Markdown";
import { ChatsMenu, CHATS_EVENT } from "./AgentChats";
import { send } from "@/app/(app)/agents/actions";
import { loadMedia } from "@/app/(app)/calendar/actions";
import { CAPY, type GenKind } from "@/lib/genRules";

// The Agent, like ChatGPT: chats live in the sidebar (AgentChats), the first screen is a drawing, a title, the box and
// starters, and a chat is a thread with the box docked at the bottom. The box has + (files from Media) and Make on
// its left (what Capy makes for this message), and send on its right.

export type Shown = {
  key: string;
  role: "user" | "assistant" | "tool" | "media" | "files";
  text: string;
  /** Where an action's line links to (role "tool"). */
  href?: string;
  /** Files added with + (role "files"). */
  files?: string[];
  /** A picture, video or audio file the agent made (role "media"), with the model Capy picked. */
  media?: { kind: GenKind; status: "queued" | "running" | "done" | "failed"; error: string | null; thumb: string | null; mime: string | null; model: string; credits: number; reason: string | null };
};

type Make = "auto" | GenKind;
type File = { id: string; name: string; mime: string; thumb: string | null };

const MAKE_KEY = "cb_agent_make";
const MAKE_ICON: Record<Make, React.ReactNode> = { auto: <Sparkles />, image: <ImageIcon />, video: <Video />, audio: <AudioLines /> };
const MAKES: { value: Make; label: string; line: string }[] = [
  { value: "auto", label: "Auto", line: "The agent decides what each post needs" },
  { value: "image", label: CAPY.image.name, line: "Pictures and edits, from 3 credits" },
  { value: "video", label: CAPY.video.name, line: "Short videos with sound, from 84 credits" },
  { value: "audio", label: CAPY.audio.name, line: "Voiceovers, music and sound effects, from 1 credit" },
];

type Starter = { make: Make; icon: React.ReactNode; title: string; line: string; text: string };
const TEXT_STARTERS: Starter[] = [
  { make: "auto", icon: <CalendarDays />, title: "Plan a week of posts", line: "One a day for your channels", text: "Plan next week's posts for our channels, one a day at 9 AM" },
  { make: "auto", icon: <Link2 />, title: "Posts from a link", line: "Turn an article into posts", text: "Write 3 posts from this article: " },
  { make: "auto", icon: <TrendingUp />, title: "What worked", line: "Your best posts and times", text: "Which of our posts did best in the last 30 days, and when should we post?" },
];
const MEDIA_STARTERS: Starter[] = [
  TEXT_STARTERS[0],
  { make: "image", icon: <ImageIcon />, title: "Make a picture", line: "A poster with words that read right", text: 'A poster that says "Grand opening Saturday" on a sunny shop window' },
  { make: "video", icon: <Video />, title: "Make a video", line: "5 seconds with sound for a reel", text: 'Our barista says "See you Saturday" to the camera, warm morning light' },
  { make: "audio", icon: <AudioLines />, title: "Make a voiceover", line: "Your words in a natural voice", text: "Welcome! We open this Saturday at 8, and the first coffee is on us." },
];

export function AgentChat({ chatId, title, messages, ai = false, credits = null }: { chatId: string | null; title: string | null; messages: Shown[]; ai?: boolean; credits?: number | null }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState<{ text: string; files: string[] } | null>(null);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const [make, setMake] = useState<Make>("auto");
  const [history, setHistory] = useState(false);
  const historyBtn = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MAKE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after the first paint, so the server and browser render the same
      if (MAKES.some((m) => m.value === saved)) setMake(saved as Make);
    } catch {
      // no saved choice
    }
  }, []);
  const pickMake = (v: Make) => {
    setMake(v);
    try {
      localStorage.setItem(MAKE_KEY, v);
    } catch {
      // kept for this visit only
    }
  };
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending]);
  // Files still being made: look again every 5 seconds until they're in.
  const making = messages.some((m) => m.media && (m.media.status === "queued" || m.media.status === "running"));
  useEffect(() => {
    if (!making || busy) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [making, busy, router]);

  const submit = (t = text.trim()) => {
    if (!t || busy) return;
    const sent = files;
    setText("");
    setFiles([]);
    setPending({ text: t, files: sent.map((f) => f.name) });
    setError("");
    start(async () => {
      const r = await send(chatId, t, make, sent.map((f) => f.id));
      setPending(null);
      if (r.error) {
        setError(r.error);
        setText(t);
        setFiles(sent);
      } else if (r.chatId && r.chatId !== chatId) {
        window.dispatchEvent(new Event(CHATS_EVENT));
        router.push(`/agents?chat=${r.chatId}`);
      } else router.refresh();
    });
  };
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.text;

  const empty = !messages.length && !pending;
  const box = <Composer text={text} setText={setText} files={files} setFiles={setFiles} make={make} setMake={pickMake} ai={ai} busy={busy} error={error} onSend={() => submit()} big={empty} />;
  const actions = (
    <div className="flex items-center gap-1.5">
      {ai && credits != null ? (
        <span title="AI credits left this month" className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] text-body tabular-nums shadow-chip">
          <span className="size-2 rounded-full bg-signal shadow-picked" />
          {credits.toLocaleString("en-US")} credits
        </span>
      ) : null}
      <button ref={historyBtn} type="button" aria-label="Chats" title="Chats" aria-expanded={history} onClick={() => setHistory(!history)} className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-ink md:hidden">
        <History size={16} />
      </button>
      {history ? <ChatsMenu anchor={historyBtn} onClose={() => setHistory(false)} /> : null}
    </div>
  );

  return (
    <Page icon={<Bot />} title={title ?? "Agents"} actions={actions} flush>
      <div className="flex h-full min-h-0 flex-col bg-panel">
        {empty ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="rise mx-auto flex min-h-full w-full max-w-[760px] flex-col items-center justify-center px-4 py-10">
              <Drawing kind="agent" size={200} />
              <h2 className="mt-5 text-center text-[26px] leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-ink">What should we post this week?</h2>
              <p className="mt-1.5 mb-6 text-center text-[13px] text-balance text-muted">{ai ? "The agent plans, writes and schedules posts, and Capy makes what they need." : "The agent plans, writes and schedules posts for your channels."}</p>
              {box}
              <div className={`mt-4 grid w-full gap-2.5 ${ai ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
                {(ai ? MEDIA_STARTERS : TEXT_STARTERS).map((s) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => {
                      if (ai) pickMake(s.make);
                      setText(s.text);
                      requestAnimationFrame(() => document.getElementById("agent-box")?.focus());
                    }}
                    className="flex min-h-24 flex-col items-start gap-2.5 rounded-lg bg-panel p-3 text-left shadow-card transition-shadow duration-[var(--duration-fast)] hover:shadow-hover"
                  >
                    <span className="flex size-[30px] items-center justify-center rounded-md bg-paper-deep text-ink [&_svg]:size-4">{s.icon}</span>
                    <span>
                      <span className="block text-[13px] font-medium text-ink">{s.title}</span>
                      <span className="block text-[12px] leading-snug text-muted">{s.line}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 py-7">
                {messages.map((m, i) => (
                  <Bubble key={m.key} m={m} first={m.role !== "user" && m.role !== "files" && (i === 0 || ["user", "files"].includes(messages[i - 1].role))} last={i === messages.length - 1} onRetry={!pending && lastUser ? () => submit(lastUser) : undefined} />
                ))}
                {pending ? (
                  <>
                    <Bubble m={{ key: "p", role: "user", text: pending.text }} first={false} last={false} />
                    {pending.files.length ? <Bubble m={{ key: "pf", role: "files", text: "", files: pending.files }} first={false} last={false} /> : null}
                    <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                      <Avatar />
                      <span className="flex h-7 items-center gap-1" aria-label="Working">
                        {[0, 1, 2].map((d) => (
                          <span key={d} className="size-1.5 animate-pulse rounded-full bg-faint" style={{ animationDelay: `${d * 150}ms` }} />
                        ))}
                      </span>
                    </div>
                  </>
                ) : null}
                <div ref={end} />
              </div>
            </div>
            <div className="shrink-0 px-4 pb-4">{box}</div>
          </>
        )}
      </div>
    </Page>
  );
}

function Avatar() {
  return (
    <span className="flex size-7 items-center justify-center overflow-hidden rounded-md">
      <Logo variant="icon" title="" className="size-7" />
    </span>
  );
}

/** The message box: + and Make on the left, send on the right, files added with + above the text. */
function Composer({ text, setText, files, setFiles, make, setMake, ai, busy, error, onSend, big }: { text: string; setText: (v: string) => void; files: File[]; setFiles: (f: File[]) => void; make: Make; setMake: (m: Make) => void; ai: boolean; busy: boolean; error: string; onSend: () => void; big: boolean }) {
  const area = useRef<HTMLTextAreaElement>(null);
  const plus = useRef<HTMLButtonElement>(null);
  const makeBtn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState<"files" | "make" | null>(null);
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [text]);
  const current = MAKES.find((m) => m.value === make)!;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className="mx-auto w-full max-w-[760px] rounded-[22px] bg-panel shadow-[0_0_0_1px_rgba(0,0,0,.08),0_2px_6px_rgba(0,0,0,.06),0_12px_32px_-12px_rgba(0,0,0,.12)] transition-shadow focus-within:shadow-focus"
    >
      {files.length ? (
        <div className="flex flex-wrap gap-1.5 px-3 pt-3">
          {files.map((f) => (
            <span key={f.id} className="inline-flex h-7 max-w-56 items-center gap-1.5 rounded-full bg-paper pr-1 pl-2.5 text-[12px] text-ink shadow-chip">
              <Paperclip size={12} className="shrink-0 text-muted" />
              <span className="truncate">{f.name}</span>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((x) => x.id !== f.id))} className="flex size-5 items-center justify-center rounded-full text-muted hover:bg-hover hover:text-ink">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <textarea
        id="agent-box"
        ref={area}
        aria-label="Message"
        rows={big ? 2 : 1}
        value={text}
        autoFocus={big}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={ai ? "Ask the agent to plan, write, make or schedule" : "Ask the agent to plan, write or schedule"}
        className="block max-h-[220px] w-full resize-none bg-transparent px-[18px] pt-3.5 pb-1 text-[14px] leading-normal text-ink outline-none placeholder:text-faint"
      />
      <div className="flex items-center gap-1.5 px-2 pt-1 pb-2 pl-2.5">
        <button ref={plus} type="button" aria-label="Add files from Media" title="Add files from Media" aria-expanded={open === "files"} onClick={() => setOpen(open === "files" ? null : "files")} className="flex size-8 items-center justify-center rounded-full text-muted shadow-chip transition-colors hover:bg-hover hover:text-ink">
          <Plus size={16} />
        </button>
        {ai ? (
          <button
            ref={makeBtn}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open === "make"}
            onClick={() => setOpen(open === "make" ? null : "make")}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full pr-2.5 pl-2.5 text-[13px] font-medium whitespace-nowrap text-ink transition-shadow [&_svg]:size-3.5 ${make === "auto" ? "shadow-chip hover:shadow-pill" : "bg-signal-soft shadow-picked"}`}
          >
            {MAKE_ICON[make]}
            {current.label}
            <ChevronDown size={12} className="text-faint" />
          </button>
        ) : null}
        {error ? (
          <p role="alert" className="min-w-0 pl-1 text-[12px] text-danger">
            {error}
          </p>
        ) : null}
        <span className="flex-1" />
        <button type="submit" aria-label="Send" disabled={!text.trim() || busy} className="flex size-[34px] items-center justify-center rounded-full bg-brand text-white shadow-primary transition-opacity hover:bg-brand-hover disabled:opacity-30">
          {busy ? <Loader /> : <ArrowUp size={16} />}
        </button>
      </div>
      {open === "make" ? (
        <Floating anchor={makeBtn} placement="top-start" gap={8} onClose={() => setOpen(null)} role="listbox" className="w-[340px] max-w-[calc(100vw-32px)] rounded-xl bg-panel p-1.5 shadow-menu">
          <p className="px-2 pt-1 pb-1.5 text-[11.5px] font-medium text-faint">Make</p>
          {MAKES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="option"
              aria-selected={m.value === make}
              onClick={() => {
                setMake(m.value);
                setOpen(null);
                area.current?.focus();
              }}
              className="grid w-full grid-cols-[30px_minmax(0,1fr)_16px] items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-hover"
            >
              <span className={`flex size-[30px] items-center justify-center rounded-md [&_svg]:size-4 ${m.value === make ? "bg-signal text-on-signal" : "bg-paper-deep text-ink"}`}>{MAKE_ICON[m.value]}</span>
              <span>
                <span className="block text-[13px] font-medium text-ink">{m.label}</span>
                <span className="block text-[12px] text-muted">{m.line}</span>
              </span>
              {m.value === make ? <Check size={14} className="text-ink" /> : <span />}
            </button>
          ))}
        </Floating>
      ) : null}
      {open === "files" ? <FilePicker anchor={plus} picked={files} onPick={setFiles} onClose={() => setOpen(null)} /> : null}
    </form>
  );
}

/** Pictures and videos from Media to add to the message. */
function FilePicker({ anchor, picked, onPick, onClose }: { anchor: React.RefObject<HTMLElement | null>; picked: File[]; onPick: (f: File[]) => void; onClose: () => void }) {
  const [library, setLibrary] = useState<File[] | null>(null);
  useEffect(() => {
    loadMedia().then(
      (m) => setLibrary((m as File[]).filter((f) => !f.mime.startsWith("audio/"))),
      () => setLibrary([]),
    );
  }, []);
  const on = (f: File) => picked.some((x) => x.id === f.id);
  return (
    <Floating anchor={anchor} placement="top-start" gap={8} onClose={onClose} className="w-[360px] max-w-[calc(100vw-32px)] rounded-xl bg-panel p-2.5 shadow-menu">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <span className="text-[13px] font-medium text-ink">Add from Media</span>
        <Link href="/media" className="text-[12px] text-muted hover:text-ink">
          Open Media
        </Link>
      </div>
      {library === null ? (
        <div className="flex h-24 items-center justify-center">
          <Loader />
        </div>
      ) : library.length ? (
        <div className="grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto">
          {library.map((f) => (
            <button key={f.id} type="button" title={f.name} aria-pressed={on(f)} onClick={() => onPick(on(f) ? picked.filter((x) => x.id !== f.id) : [...picked, f].slice(0, 10))} className={`relative aspect-square overflow-hidden rounded-md bg-paper ${on(f) ? "shadow-picked" : "shadow-chip"}`}>
              {f.mime.startsWith("video/") ? (
                <video src={f.thumb ?? undefined} className="size-full object-cover" muted preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.thumb ?? ""} alt={f.name} loading="lazy" className="size-full object-cover" />
              )}
              {on(f) ? (
                <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-signal text-on-signal">
                  <Check size={12} />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <p className="px-0.5 py-3 text-[12px] text-muted">No files yet</p>
      )}
    </Floating>
  );
}

function Bubble({ m, first, last, onRetry }: { m: Shown; first: boolean; last: boolean; onRetry?: () => void }) {
  if (m.role === "user") return <p className="ml-auto max-w-[78%] rounded-[18px] bg-paper-deep px-3.5 py-2 text-[14px] leading-normal whitespace-pre-wrap text-ink">{m.text}</p>;
  if (m.role === "files")
    return (
      <div className="-mt-3 ml-auto flex max-w-[78%] flex-wrap justify-end gap-1.5">
        {(m.files ?? []).map((f, i) => (
          <span key={`${i}:${f}`} className="inline-flex h-6 max-w-56 items-center gap-1 rounded-full bg-paper px-2 text-[11.5px] text-muted shadow-chip">
            <Paperclip size={11} className="shrink-0" />
            <span className="truncate">{f}</span>
          </span>
        ))}
      </div>
    );
  return (
    <div className={`grid grid-cols-[28px_minmax(0,1fr)] gap-3 ${first ? "" : "-mt-2"}`}>
      {first ? <Avatar /> : <span />}
      <div className="flex min-w-0 flex-col gap-2">
        <Body m={m} />
        {m.role === "assistant" ? (
          <div className="-ml-1.5 flex gap-0.5">
            <CopyText text={m.text} />
            {last && onRetry ? (
              <IconButton label="Ask again" onClick={onRetry}>
                <RotateCcw size={14} />
              </IconButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CopyText({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <IconButton
      label={done ? "Copied" : "Copy"}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          },
          () => undefined,
        );
      }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
    </IconButton>
  );
}

function Body({ m }: { m: Shown }) {
  if (m.role === "media" && m.media) {
    const f = m.media;
    const label = f.kind === "image" ? "Picture" : f.kind === "video" ? "Video" : "Audio";
    let body: React.ReactNode;
    if (f.status === "failed") body = <p className="w-fit max-w-[80%] rounded-lg bg-danger-soft px-3 py-2 text-[12px] text-danger">{f.error ?? "Couldn't make it"}</p>;
    else if (f.status !== "done" || !f.thumb)
      body = (
        <div className={`flex items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-[12px] text-muted ${f.kind === "audio" ? "h-12 w-64" : "size-40 flex-col"}`}>
          <Loader />
          {label}
        </div>
      );
    else if (f.mime?.startsWith("audio/")) body = <audio src={f.thumb} controls preload="metadata" className="w-72 max-w-full" />;
    else
      body = (
        <Link href="/media" className="block w-fit overflow-hidden rounded-lg bg-paper shadow-card transition-shadow hover:shadow-hover" title={m.text}>
          {f.mime?.startsWith("video/") ? (
            <video src={f.thumb} className="max-h-72 max-w-72" muted controls preload="metadata" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.thumb} alt={m.text} loading="lazy" decoding="async" className="max-h-72 max-w-72 object-contain" />
          )}
        </Link>
      );
    return (
      <div className="flex flex-col gap-2">
        <p className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
          <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-signal-soft px-2 font-medium text-ink shadow-picked [&_svg]:size-3">
            {MAKE_ICON[f.kind]}
            {CAPY[f.kind].name}
          </span>
          <span>
            picked <span className="font-medium text-ink">{f.model}</span>, {f.credits} credits{f.reason ? `, because ${f.reason}` : ""}
          </span>
        </p>
        {body}
      </div>
    );
  }
  if (m.role === "tool")
    return (
      <Link href={m.href ?? "/calendar"} className="inline-flex h-7 w-fit items-center gap-1.5 rounded-full bg-signal-soft px-3 text-[12px] font-medium text-ink shadow-picked">
        <CalendarCheck size={14} /> {m.text}
      </Link>
    );
  return <Markdown text={m.text} className="text-[14px] leading-relaxed text-body" />;
}
