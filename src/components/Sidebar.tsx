"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bot, CalendarDays, Check, ChevronsUpDown, FileText, Image as ImageIcon, Inbox, Link2, LogOut, PanelLeftClose, PanelLeftOpen, Plug, Settings } from "lucide-react";
import { Avatar, Dot, Input } from "./ui";
import { Floating, HoverTip } from "./Floating";
import { tell } from "./Dialogs";
import { Logo } from "./Logo";
import { SidebarChats } from "./AgentChats";
import { signOut } from "@/app/login/actions";
import { switchBrand, switchWorkspace } from "@/app/(app)/actions";
import type { Brand } from "@/lib/brands";
import type { Role } from "@/lib/session";

const ITEMS = [
  { href: "/calendar", label: "Calendar", icon: <CalendarDays />, client: true },
  { href: "/inbox", label: "Inbox", icon: <Inbox /> },
  { href: "/channels", label: "Channels", icon: <Plug /> },
  { href: "/agents", label: "Agents", icon: <Bot /> },
  { href: "/analytics", label: "Analytics", icon: <BarChart3 /> },
  { href: "/reports", label: "Reports", icon: <FileText /> },
  { href: "/media", label: "Media", icon: <ImageIcon /> },
  { href: "/bio", label: "Link in bio", icon: <Link2 /> },
];

// Sidebar links sit on the gray shell, like Claritia's rail: no group titles, the open page a white chip on a soft ring
// with a medium label and its icon on a small yellow square. Settings is at the bottom, above the account.
// On a computer the sidebar collapses to icons (`rail:` classes, set by data-rail on <html>): RailScript in the app
// layout sets it from localStorage before the first paint, so a collapsed sidebar never opens wide first.
const item = "group relative flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-[13px] whitespace-nowrap transition-[background-color,box-shadow,color] duration-[var(--duration-instant)] rail:w-9 rail:justify-center rail:self-center rail:px-0 [&_svg]:size-4";
const itemOn = "bg-panel font-medium text-ink shadow-chip";
const itemOff = "text-body hover:bg-hover hover:text-ink";

const RAIL_KEY = "capybaroar:sidebar";
const railOn = () => document.documentElement.dataset.rail === "collapsed";
function watchRail(change: () => void) {
  const seen = new MutationObserver(change);
  seen.observe(document.documentElement, { attributes: true, attributeFilter: ["data-rail"] });
  return () => seen.disconnect();
}
/** Whether the sidebar is collapsed to icons (always false on the server and before hydration). */
const useRail = () => useSyncExternalStore(watchRail, railOn, () => false);

/** Sets the collapsed sidebar from localStorage before the page paints. Rendered once, in the app layout. */
export function RailScript() {
  const js = `try{if(localStorage.getItem(${JSON.stringify(RAIL_KEY)})==="collapsed")document.documentElement.dataset.rail="collapsed"}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

function toggleRail() {
  const el = document.documentElement;
  const collapse = !railOn();
  if (collapse) el.dataset.rail = "collapsed";
  else delete el.dataset.rail;
  try {
    if (collapse) localStorage.setItem(RAIL_KEY, "collapsed");
    else localStorage.removeItem(RAIL_KEY);
  } catch {
    /* private window or blocked storage: it still collapses, just isn't remembered */
  }
}

function NavLink({ href, label, icon, count }: { href: string; label: string; icon: React.ReactNode; count?: number }) {
  const rail = useRail();
  const path = usePathname();
  const on = path === href || path.startsWith(`${href}/`);
  const ref = useRef<HTMLAnchorElement>(null);
  // On a phone the links are one row that scrolls sideways: keep the open page's link in view.
  useEffect(() => {
    if (on && window.matchMedia("(max-width: 767px)").matches) ref.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [on]);
  return (
    <Link ref={ref} href={href} prefetch aria-current={on ? "page" : undefined} className={`${item} ${on ? itemOn : itemOff}`}>
      <span className={`-ml-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs rail:ml-0 [&_svg]:size-3.5 ${on ? "bg-signal text-on-signal [&_svg]:stroke-[2.25]" : "text-muted group-hover:text-ink"}`}>{icon}</span>
      <span className="rail:sr-only">{label}</span>
      {count ? (
        <span
          aria-label={`${count} open`}
          className="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-signal px-1.5 text-[11px] leading-none font-medium text-on-signal tabular-nums rail:absolute rail:-top-1 rail:-right-1.5 rail:h-4 rail:min-w-4 rail:px-1 rail:text-[10px]"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
      {rail ? <HoverTip text={label} placement="right-start" /> : null}
    </Link>
  );
}

export type Switcher = { role: Role; brands: Brand[]; brand: string | null; workspaces: { id: string; name: string }[]; workspaceId: string };

export function Sidebar({ name, email, workspace, switcher, inbox = 0 }: { name: string; email: string; workspace: string; switcher: Switcher; inbox?: number }) {
  const settings = switcher.role === "owner" || switcher.role === "admin";
  const rail = useRail();
  return (
    <aside className="flex shrink-0 flex-col gap-2 border-b border-line px-3 pt-2.5 pb-2 md:w-[240px] md:gap-3 md:border-b-0 md:pt-4 md:pb-3 rail:w-[60px] rail:px-2">
      {/* The logo, then the brand. On a phone they share one row with the stacked mark; on a computer the wordmark
          sits above the brand, and the collapsed sidebar shows the stacked mark alone. */}
      <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-3">
        <Link href="/calendar" aria-label="Capybaroar" className="flex h-9 shrink-0 items-center rounded-md px-1 rail:justify-center rail:px-0">
          <Logo variant="stacked" title="" className="size-9 md:hidden rail:block rail:size-11" />
          <Logo variant="wordmark" title="" className="hidden h-[22px] w-auto md:block rail:hidden" />
        </Link>
        <BrandSwitcher s={switcher} workspace={workspace} />
      </div>
      <nav aria-label="Main" className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] md:mx-0 md:min-h-0 md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto md:px-0 md:pt-2 md:pb-0">
        {ITEMS.filter((n) => switcher.role !== "client" || n.client).map((n) => (
          <span key={n.href} className="contents">
            <NavLink href={n.href} label={n.label} icon={n.icon} count={n.href === "/inbox" ? inbox : undefined} />
            {n.href === "/agents" ? <SidebarChats /> : null}
          </span>
        ))}
        {settings ? (
          <span className="contents md:hidden">
            <NavLink href="/settings" label="Settings" icon={<Settings />} />
          </span>
        ) : null}
      </nav>
      <div className="hidden flex-col gap-2 md:flex">
        {settings ? <NavLink href="/settings" label="Settings" icon={<Settings />} /> : null}
        <div className="flex items-center gap-2 border-t border-line px-1 pt-3 rail:flex-col rail:px-0">
          <span title={rail ? `${name}, ${email}` : undefined} className="flex">
            <Avatar label={name} size={28} />
          </span>
          <div className="min-w-0 flex-1 rail:hidden">
            <p className="truncate text-[13px] font-medium">{name}</p>
            <p className="truncate text-[11px] text-faint">{email}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-ink" title="Sign out" aria-label="Sign out">
              <LogOut size={15} />
            </button>
          </form>
        </div>
        <button type="button" onClick={toggleRail} aria-label={rail ? "Expand sidebar" : "Collapse sidebar"} className={`${item} ${itemOff} w-full`}>
          <span className="-ml-0.5 flex size-5 shrink-0 items-center justify-center text-muted group-hover:text-ink rail:ml-0 [&_svg]:size-3.5">
            <PanelLeftClose className="rail:hidden" />
            <PanelLeftOpen className="hidden rail:block" />
          </span>
          <span className="text-muted group-hover:text-ink rail:sr-only">Collapse</span>
          {rail ? <HoverTip text="Expand sidebar" placement="right-start" /> : null}
        </button>
      </div>
    </aside>
  );
}

const MENU = "min-w-56 rounded-lg bg-panel p-1.5 text-[13px] shadow-menu";
const ROW = "flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left hover:bg-hover";
/** More brands than this, and the menu gets a search box. */
const SEARCH_FROM = 8;

/** The brand every screen shows, and the workspace when there are several. People with nothing to switch see the
    workspace's name. */
function BrandSwitcher({ s, workspace }: { s: Switcher; workspace: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [busy, start] = useTransition();
  const button = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const manager = s.role === "owner" || s.role === "admin";
  if (!manager && s.brands.length < 2 && s.workspaces.length < 2)
    return (
      <p className="flex h-9 min-w-0 flex-1 items-center px-1 text-[13px] font-semibold md:flex-none rail:hidden" title={workspace}>
        <span className="truncate">{workspace}</span>
      </p>
    );
  const current = s.brands.find((b) => b.id === s.brand) ?? null;
  const searchable = s.brands.length > SEARCH_FROM;
  const term = searchable ? q.trim().toLowerCase() : "";
  const brands = term ? s.brands.filter((b) => b.name.toLowerCase().includes(term)) : s.brands;
  const pick = (fn: () => Promise<{ error?: string }>) => {
    setOpen(false);
    start(async () => {
      const r = await fn();
      if (r.error) await tell("Couldn't switch", r.error);
      router.refresh();
    });
  };
  return (
    <div className="min-w-0 flex-1 md:w-full md:flex-none rail:flex rail:justify-center">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => {
          setQ("");
          setOpen(!open);
        }}
        title={`${workspace}: ${current?.name ?? "All brands"}`}
        className="flex h-9 w-full items-center gap-2 rounded-md bg-panel px-3 text-left text-[13px] font-medium shadow-chip transition-shadow hover:shadow-pill aria-expanded:shadow-focus disabled:opacity-60 rail:size-9 rail:justify-center rail:px-0"
      >
        {current ? <Dot tone={current.color} /> : <span className="size-2 rounded-full border border-line-strong" />}
        <span className="min-w-0 flex-1 truncate rail:sr-only">{current?.name ?? "All brands"}</span>
        <ChevronsUpDown size={14} className="shrink-0 text-muted rail:hidden" />
      </button>
      {open ? (
        <Floating anchor={button} placement="bottom-start" matchWidth onClose={() => setOpen(false)} role="menu" className={MENU}>
          {searchable ? <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brands" aria-label="Search brands" className="mb-1 h-8" /> : null}
          <div className="max-h-72 overflow-y-auto">
            {manager && s.brands.length > 1 && !term ? (
              <button type="button" role="menuitem" className={ROW} onClick={() => pick(() => switchBrand("all"))}>
                <span className="size-2 rounded-full border border-line-strong" />
                <span className="flex-1">All brands</span>
                {!current ? <Check size={14} /> : null}
              </button>
            ) : null}
            {brands.map((b) => (
              <button key={b.id} type="button" role="menuitem" className={ROW} onClick={() => pick(() => switchBrand(b.id))}>
                <Dot tone={b.color} />
                <span className="min-w-0 flex-1 truncate">{b.name}</span>
                {current?.id === b.id ? <Check size={14} /> : null}
              </button>
            ))}
            {term && !brands.length ? <p className="flex h-8 items-center px-2.5 text-muted">No matches</p> : null}
          </div>
          {manager ? (
            <Link href="/settings?tab=brands" role="menuitem" className={`${ROW} mt-1 text-muted`} onClick={() => setOpen(false)}>
              Manage brands
            </Link>
          ) : null}
          {s.workspaces.length > 1 ? (
            <div className="mt-1 border-t border-line pt-1">
              <p className="label-mono flex h-6 items-center px-2">Workspaces</p>
              <div className="max-h-48 overflow-y-auto">
                {s.workspaces.map((w) => (
                  <button key={w.id} type="button" role="menuitem" className={ROW} onClick={() => pick(() => switchWorkspace(w.id))}>
                    <span className="min-w-0 flex-1 truncate">{w.name}</span>
                    {w.id === s.workspaceId ? <Check size={14} /> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </Floating>
      ) : null}
    </div>
  );
}
