"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MoreHorizontal, SquarePen, Trash2 } from "lucide-react";
import { Floating, type Placement } from "./Floating";
import { askConfirm, tell } from "./Dialogs";
import { deleteChat, recentChats } from "@/app/(app)/agents/actions";

// The Agent's chats: this person's chats, newest first, then New chat. It sits under Agents in
// the main sidebar while an Agents page is open, and in a menu on phones. The chat page tells it to look again with
// CHATS_EVENT after a message starts a new chat.
export const CHATS_EVENT = "capybaroar:chats";

type Chat = { id: string; title: string };

function useChats() {
  const [chats, setChats] = useState<Chat[] | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => recentChats().then((c) => live && setChats(c), () => live && setChats((x) => x ?? []));
    load();
    window.addEventListener(CHATS_EVENT, load);
    return () => {
      live = false;
      window.removeEventListener(CHATS_EVENT, load);
    };
  }, []);
  return [chats, setChats] as const;
}

const row = "relative flex h-8 w-full items-center rounded-md pr-8 pl-2.5 text-left text-[13px] transition-colors";

/** The newest chats a sidebar shows before "All chats". */
const SIDEBAR_CHATS = 6;

function List({ onPick, limit }: { onPick?: () => void; limit?: number }) {
  const [chats, setChats] = useChats();
  const [all, setAll] = useState(false);
  const allButton = useRef<HTMLButtonElement>(null);
  const current = useSearchParams().get("chat");
  const router = useRouter();
  const [, start] = useTransition();
  const [menu, setMenu] = useState<string | null>(null);
  const anchor = useRef<HTMLButtonElement | null>(null);
  const remove = async (c: Chat) => {
    setMenu(null);
    if (!(await askConfirm(`Delete "${c.title}"?`, { ok: "Delete", danger: true }))) return;
    start(async () => {
      const r = await deleteChat(c.id);
      if (r.error) return void (await tell("Couldn't delete the chat", r.error));
      setChats((all) => (all ?? []).filter((x) => x.id !== c.id));
      // Another list of the same chats (the sidebar and the All chats menu) looks again too.
      window.dispatchEvent(new Event(CHATS_EVENT));
      if (current === c.id) router.push("/agents");
    });
  };
  const list = chats ?? [];
  const more = limit != null && list.length > limit;
  // The newest few, plus the open chat when it's older than those.
  const shown = more ? list.filter((c, i) => i < limit || c.id === current) : list;
  return (
    <div className="flex flex-col gap-0.5">
      {shown.map((c) => (
        <div key={c.id} className="group/chat relative">
          <Link
            href={`/agents?chat=${c.id}`}
            onClick={onPick}
            aria-current={c.id === current ? "page" : undefined}
            className={`${row} ${c.id === current ? "bg-paper-deep font-medium text-ink" : "text-body hover:bg-hover hover:text-ink"}`}
            title={c.title}
          >
            <span className="truncate">{c.title}</span>
          </Link>
          <button
            ref={menu === c.id ? anchor : undefined}
            type="button"
            aria-label={`More for ${c.title}`}
            aria-haspopup="menu"
            aria-expanded={menu === c.id}
            onClick={(e) => {
              anchor.current = e.currentTarget;
              setMenu(menu === c.id ? null : c.id);
            }}
            className={`absolute top-1 right-1 flex size-6 items-center justify-center rounded-sm text-muted hover:bg-hover hover:text-ink ${c.id === current || menu === c.id ? "flex" : "hidden group-hover/chat:flex focus-visible:flex"}`}
          >
            <MoreHorizontal size={14} />
          </button>
          {menu === c.id ? (
            <Floating anchor={anchor} placement="bottom-end" onClose={() => setMenu(null)} role="menu" className="min-w-40 rounded-lg bg-panel p-1.5 text-[13px] shadow-menu">
              <button type="button" role="menuitem" onClick={() => remove(c)} className="flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left text-danger hover:bg-danger-soft">
                <Trash2 size={14} /> Delete
              </button>
            </Floating>
          ) : null}
        </div>
      ))}
      {more ? (
        <>
          <button ref={allButton} type="button" aria-haspopup="dialog" aria-expanded={all} onClick={() => setAll(!all)} className={`${row} text-muted hover:bg-hover hover:text-ink`}>
            All chats
            <span className="ml-auto pl-2 text-[11px] text-faint tabular-nums">{list.length}</span>
          </button>
          {all ? <ChatsMenu anchor={allButton} placement="right-start" onClose={() => setAll(false)} /> : null}
        </>
      ) : null}
      <Link href="/agents" onClick={onPick} className={`${row} gap-2 font-medium text-ink hover:bg-hover ${chats?.length ? "mt-1" : ""}`}>
        <SquarePen size={14} className="shrink-0 text-muted" />
        New chat
      </Link>
    </div>
  );
}

/** Under Agents in the main sidebar, while an Agents page is open (computers only; not when collapsed to icons). */
export function SidebarChats() {
  const path = usePathname();
  if (!path.startsWith("/agents")) return null;
  return (
    <div className="relative mt-0.5 mb-1 hidden pl-4 before:absolute before:top-1 before:bottom-1 before:left-[17px] before:w-px before:bg-line md:block rail:hidden">
      <div className="pl-2">
        <Suspense fallback={null}>
          <List limit={SIDEBAR_CHATS} />
        </Suspense>
      </div>
    </div>
  );
}

/** The same list for phones, opened from the Agents header, and every chat from the sidebar's All chats. */
export function ChatsMenu({ anchor, onClose, placement = "bottom-end" }: { anchor: React.RefObject<HTMLElement | null>; onClose: () => void; placement?: Placement }) {
  return (
    <Floating anchor={anchor} placement={placement} onClose={onClose} className="max-h-[70vh] w-72 overflow-y-auto rounded-lg bg-panel p-1.5 shadow-menu">
      <Suspense fallback={null}>
        <List onPick={onClose} />
      </Suspense>
    </Floating>
  );
}
