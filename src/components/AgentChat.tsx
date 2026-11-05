"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, CalendarCheck, Plus } from "lucide-react";
import { IconButton, LinkButton, bareArea, boxClass } from "./ui";
import { Loader } from "./Loader";
import { Logo } from "./Logo";
import { send } from "@/app/(app)/agents/actions";
import { Markdown } from "./Markdown";

export type Shown = {
  key: string;
  role: "user" | "assistant" | "tool" | "media";
  text: string;
  /** Where an action's line links to (role "tool"). */
  href?: string;
  /** A picture or video the agent made (role "media"). */
  media?: { kind: "image" | "video"; status: "queued" | "running" | "done" | "failed"; error: string | null; thumb: string | null; mime: string | null };
};

export function AgentChat({ chats, chatId, messages, ai = false }: { chats: { id: string; title: string }[]; chatId: string | null; messages: Shown[]; ai?: boolean }) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const router = useRouter();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending]);
  // Videos still being made: look again every 5 seconds until they're in.
  const making = messages.some((m) => m.media && (m.media.status === "queued" || m.media.status === "running"));
  useEffect(() => {
    if (!making || busy) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [making, busy, router]);

  const submit = () => {
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    setPending(t);
    setError("");
    start(async () => {
      const r = await send(chatId, t);
      setPending("");
      if (r.error) {
        setError(r.error);
        setText(t);
      } else if (r.chatId && r.chatId !== chatId) router.push(`/agents?chat=${r.chatId}`);
      else router.refresh();
    });
  };

  const empty = !messages.length && !pending;
  return (
    <div className="flex h-full min-h-0 bg-panel">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {empty ? (
            <div className="rise flex h-full flex-col items-center justify-center px-6 text-center">
              <Logo variant="icon" className="size-20" />
              <h2 className="mt-6 max-w-md text-[22px] leading-[1.15] font-medium tracking-[-0.025em] text-balance">
                Plan a week of posts. <span className="text-faint">{ai ? "The agent writes them and makes their pictures and videos." : "The agent writes and schedules them."}</span>
              </h2>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 py-6">
              {messages.map((m) => (
                <Bubble key={m.key} m={m} />
              ))}
              {pending ? (
                <>
                  <Bubble m={{ key: "pending", role: "user", text: pending }} />
                  <div className="flex items-center gap-2 text-[12px] text-muted">
                    <Loader /> Working
                  </div>
                </>
              ) : null}
              <div ref={end} />
            </div>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className={`mx-auto mb-4 w-[calc(100%-2rem)] max-w-[720px] md:mb-6 ${boxClass}`}
        >
          <textarea
            aria-label="Message"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={ai ? "Write 5 Instagram posts about our launch with a picture for each, one each weekday at 9 AM" : "Write 5 LinkedIn posts about our launch, one each weekday at 9 AM"}
            className={bareArea}
          />
          <div className="flex items-center gap-2 px-2 pb-2">
            {error ? (
              <p role="alert" className="pl-1 text-[12px] text-danger">
                {error}
              </p>
            ) : null}
            <span className="flex-1" />
            <IconButton label="Send" variant="primary" type="submit" disabled={!text.trim() || busy}>
              <ArrowUp size={16} />
            </IconButton>
          </div>
        </form>
      </div>
      <aside className="hidden w-64 shrink-0 flex-col gap-0.5 border-l border-line bg-paper p-3 lg:flex">
        <LinkButton href="/agents" variant="ghost" className="mb-3 w-full">
          <Plus /> New chat
        </LinkButton>
        <p className="label-mono flex h-6 items-center px-2">Chats</p>
        {chats.length ? (
          chats.map((c) => (
            <Link
              key={c.id}
              href={`/agents?chat=${c.id}`}
              aria-current={c.id === chatId ? "page" : undefined}
              className={`flex h-8 shrink-0 items-center truncate rounded-md px-2 text-[13px] transition-colors ${c.id === chatId ? "bg-panel font-medium text-ink shadow-chip" : "text-body hover:bg-hover hover:text-ink"}`}
            >
              <span className="truncate">{c.title}</span>
            </Link>
          ))
        ) : (
          <p className="px-2 py-1 text-[12px] text-faint">No chats yet</p>
        )}
      </aside>
    </div>
  );
}

function Bubble({ m }: { m: Shown }) {
  if (m.role === "media" && m.media) {
    const f = m.media;
    if (f.status === "failed") return <p className="w-fit max-w-[80%] rounded-lg bg-danger-soft px-3 py-2 text-[12px] text-danger">{f.error ?? "Couldn't make it"}</p>;
    if (f.status !== "done" || !f.thumb)
      return (
        <div className="flex size-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-[12px] text-muted">
          <Loader />
          {f.kind === "image" ? "Picture" : "Video"}
        </div>
      );
    return (
      <Link href="/media" className="block w-fit overflow-hidden rounded-lg bg-paper shadow-card transition-shadow hover:shadow-hover" title={m.text}>
        {f.mime?.startsWith("video/") ? (
          <video src={f.thumb} className="max-h-72 max-w-72" muted controls preload="metadata" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.thumb} alt={m.text} loading="lazy" decoding="async" className="max-h-72 max-w-72 object-contain" />
        )}
      </Link>
    );
  }
  if (m.role === "tool")
    return (
      <Link href={m.href ?? "/calendar"} className="inline-flex h-7 w-fit items-center gap-1.5 rounded-full bg-signal-soft px-3 text-[12px] font-medium text-ink shadow-picked">
        <CalendarCheck size={14} /> {m.text}
      </Link>
    );
  if (m.role === "user") return <p className="ml-auto max-w-[80%] rounded-lg bg-paper px-3 py-2 text-[13px] whitespace-pre-wrap shadow-track">{m.text}</p>;
  return <Markdown text={m.text} className="max-w-[90%] text-[13px] leading-relaxed" />;
}
