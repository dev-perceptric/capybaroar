"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bot, CalendarDays, Check, ChevronsUpDown, FileText, Image as ImageIcon, Inbox, LogOut, Plug, Settings } from "lucide-react";
import { Avatar, Dot } from "./ui";
import { Floating } from "./Floating";
import { tell } from "./Dialogs";
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
];

// Sidebar links sit on the gray shell, like Claritia's rail: no group titles, the open page a white chip on a soft ring
// with a medium label and its icon on a small yellow square. Settings is at the bottom, above the account.
const item = "group flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-[13px] whitespace-nowrap transition-[background-color,box-shadow,color] duration-[var(--duration-instant)] [&_svg]:size-4";
const itemOn = "bg-panel font-medium text-ink shadow-chip";
const itemOff = "text-body hover:bg-hover hover:text-ink";

function NavLink({ href, label, icon, count }: { href: string; label: string; icon: React.ReactNode; count?: number }) {
  const path = usePathname();
  const on = path === href || path.startsWith(`${href}/`);
  const ref = useRef<HTMLAnchorElement>(null);
  // On a phone the links are one row that scrolls sideways: keep the open page's link in view.
  useEffect(() => {
    if (on && window.matchMedia("(max-width: 767px)").matches) ref.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [on]);
  return (
    <Link ref={ref} href={href} prefetch aria-current={on ? "page" : undefined} className={`${item} ${on ? itemOn : itemOff}`}>
      <span className={`-ml-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs [&_svg]:size-3.5 ${on ? "bg-signal text-on-signal [&_svg]:stroke-[2.25]" : "text-muted group-hover:text-ink"}`}>{icon}</span>
      {label}
      {count ? (
        <span aria-label={`${count} open`} className="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-signal px-1.5 text-[11px] leading-none font-medium text-on-signal tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

export type Switcher = { role: Role; brands: Brand[]; brand: string | null; workspaces: { id: string; name: string }[]; workspaceId: string };

export function Sidebar({ name, email, workspace, switcher, inbox = 0 }: { name: string; email: string; workspace: string; switcher: Switcher; inbox?: number }) {
  const settings = switcher.role === "owner" || switcher.role === "admin";
  return (
    <aside className="flex shrink-0 flex-col gap-2 border-b border-line px-3 pt-2.5 pb-2 md:w-[240px] md:gap-3 md:border-b-0 md:pt-4 md:pb-3">
      {/* On a phone the name and the brand share one row; on wider screens the brand sits under the name. */}
      <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-3">
        <div className="flex h-9 min-w-0 flex-1 items-center gap-2 px-1 md:flex-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={24} height={24} className="size-6 shrink-0 rounded-sm" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold" title={workspace}>
            {workspace}
          </span>
        </div>
        <BrandSwitcher s={switcher} />
      </div>
      <nav aria-label="Main" className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] md:mx-0 md:min-h-0 md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto md:px-0 md:pt-2 md:pb-0">
        {ITEMS.filter((n) => switcher.role !== "client" || n.client).map((n) => (
          <NavLink key={n.href} href={n.href} label={n.label} icon={n.icon} count={n.href === "/inbox" ? inbox : undefined} />
        ))}
        {settings ? (
          <span className="contents md:hidden">
            <NavLink href="/settings" label="Settings" icon={<Settings />} />
          </span>
        ) : null}
      </nav>
      <div className="hidden flex-col gap-2 md:flex">
        {settings ? <NavLink href="/settings" label="Settings" icon={<Settings />} /> : null}
        <div className="flex items-center gap-2 border-t border-line px-1 pt-3">
          <Avatar label={name} size={28} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{name}</p>
            <p className="truncate text-[11px] text-faint">{email}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-ink" title="Sign out" aria-label="Sign out">
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

const MENU = "min-w-56 rounded-lg bg-panel p-1.5 text-[13px] shadow-menu";
const ROW = "flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left hover:bg-hover";

/** The brand every screen shows, and the workspace when there are several. */
function BrandSwitcher({ s }: { s: Switcher }) {
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  const button = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const manager = s.role === "owner" || s.role === "admin";
  if (!manager && s.brands.length < 2 && s.workspaces.length < 2) return null;
  const current = s.brands.find((b) => b.id === s.brand) ?? null;
  const pick = (fn: () => Promise<{ error?: string }>) => {
    setOpen(false);
    start(async () => {
      const r = await fn();
      if (r.error) await tell("Couldn't switch", r.error);
      router.refresh();
    });
  };
  return (
    <div className="w-[48%] max-w-56 shrink-0 md:w-full md:max-w-none">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center gap-2 rounded-md bg-panel px-3 text-left text-[13px] font-medium shadow-chip transition-shadow hover:shadow-pill aria-expanded:shadow-focus disabled:opacity-60"
      >
        {current ? <Dot tone={current.color} /> : <span className="size-2 rounded-full border border-line-strong" />}
        <span className="min-w-0 flex-1 truncate">{current?.name ?? "All brands"}</span>
        <ChevronsUpDown size={14} className="shrink-0 text-muted" />
      </button>
      {open ? (
        <Floating anchor={button} placement="bottom-start" matchWidth onClose={() => setOpen(false)} role="menu" className={MENU}>
          {manager && s.brands.length > 1 ? (
            <button type="button" role="menuitem" className={ROW} onClick={() => pick(() => switchBrand("all"))}>
              <span className="size-2 rounded-full border border-line-strong" />
              <span className="flex-1">All brands</span>
              {!current ? <Check size={14} /> : null}
            </button>
          ) : null}
          {s.brands.map((b) => (
            <button key={b.id} type="button" role="menuitem" className={ROW} onClick={() => pick(() => switchBrand(b.id))}>
              <Dot tone={b.color} />
              <span className="min-w-0 flex-1 truncate">{b.name}</span>
              {current?.id === b.id ? <Check size={14} /> : null}
            </button>
          ))}
          {manager ? (
            <Link href="/settings?tab=brands" role="menuitem" className={`${ROW} mt-1 text-muted`} onClick={() => setOpen(false)}>
              Manage brands
            </Link>
          ) : null}
          {s.workspaces.length > 1 ? (
            <div className="mt-1 border-t border-line pt-1">
              <p className="label-mono flex h-6 items-center px-2">Workspaces</p>
              {s.workspaces.map((w) => (
                <button key={w.id} type="button" role="menuitem" className={ROW} onClick={() => pick(() => switchWorkspace(w.id))}>
                  <span className="min-w-0 flex-1 truncate">{w.name}</span>
                  {w.id === s.workspaceId ? <Check size={14} /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </Floating>
      ) : null}
    </div>
  );
}
