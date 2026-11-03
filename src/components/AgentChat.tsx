"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, CalendarCheck, Plus } from "lucide-react";
import { IconButton } from "./ui";
import { Loader } from "./Loader";
import { send } from "@/app/(app)/agents/actions";

export type Shown = { key: string; role: "user" | "assistant" | "tool"; text: string };

export function AgentChat({ chats, chatId, messages }: { chats: { id: string; title: string }[]; chatId: string | null; messages: Shown[] }) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const router = useRouter();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending]);

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
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {empty ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" width={88} height={88} className="size-22 rounded-2xl" />
              <h2 className="mt-6 text-[24px] font-semibold tracking-[-0.035em] text-balance">
                Plan a week of posts. <span className="text-faint">The agent writes and schedules them.</span>
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
          className="mx-auto mb-6 w-full max-w-[720px] rounded-lg bg-panel px-3 pt-2 pb-2 shadow-input transition-shadow focus-within:shadow-focus"
        >
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Write 5 LinkedIn posts about our launch, one each weekday at 9 AM"
            className="w-full resize-none bg-transparent text-[13px] outline-none placeholder:text-faint"
          />
          <div className="flex items-center gap-2">
            {error ? <p className="text-[12px] text-danger">{error}</p> : null}
            <span className="flex-1" />
            <IconButton label="Send" variant="primary" type="submit" disabled={!text.trim() || busy}>
              <ArrowUp size={16} />
            </IconButton>
          </div>
        </form>
      </div>
      <aside className="hidden w-64 shrink-0 flex-col border-l border-line p-2 lg:flex">
        <Link href="/agents" className="mb-2 flex h-8 items-center gap-2 rounded-md bg-panel px-2 text-[13px] font-medium shadow-outline hover:bg-canvas">
          <Plus size={14} /> New chat
        </Link>
        <p className="label-mono flex h-6 items-center px-2">
          Chats
        </p>
        {chats.length ? (
          chats.map((c) => (
            <Link
              key={c.id}
              href={`/agents?chat=${c.id}`}
              className={`flex h-8 items-center truncate rounded-md px-2 text-[13px] ${c.id === chatId ? "bg-hover font-medium text-ink shadow-[inset_0_0_0_1px_var(--border-light)]" : "text-ink/85 hover:bg-hover"}`}
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
  if (m.role === "tool")
    return (
      <Link href="/calendar" className="flex w-fit items-center gap-2 rounded-md bg-signal-soft px-2 py-1 text-[12px] font-medium shadow-[0_0_0_1px_var(--signal-10)]">
        <CalendarCheck size={14} /> {m.text}
      </Link>
    );
  if (m.role === "user") return <p className="ml-auto max-w-[80%] rounded-lg bg-hover px-3 py-2 text-[13px] whitespace-pre-wrap">{m.text}</p>;
  return <p className="max-w-[90%] text-[13px] leading-relaxed whitespace-pre-wrap">{m.text}</p>;
}
