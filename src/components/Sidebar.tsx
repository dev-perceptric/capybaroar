"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bot, CalendarDays, Check, ChevronsUpDown, Image as ImageIcon, Inbox, LogOut, Plug, Settings } from "lucide-react";
import { Avatar, Dot } from "./ui";
import { Floating } from "./Floating";
import { tell } from "./Dialogs";
import { signOut } from "@/app/login/actions";
import { switchBrand, switchWorkspace } from "@/app/(app)/actions";
import type { Brand } from "@/lib/brands";
import type { Role } from "@/lib/session";

const SECTIONS = [
  {
    label: "Workspace",
    items: [
      { href: "/calendar", label: "Calendar", icon: <CalendarDays />, client: true },
      { href: "/inbox", label: "Inbox", icon: <Inbox /> },
      { href: "/channels", label: "Channels", icon: <Plug /> },
      { href: "/agents", label: "Agents", icon: <Bot /> },
      { href: "/analytics", label: "Analytics", icon: <BarChart3 /> },
      { href: "/media", label: "Media", icon: <ImageIcon /> },
    ],
  },
];

// Sidebar links: dark gray labels on the white sidebar, the open page a soft gray fill with a medium label and its
// icon on a small yellow square.
const item = "group flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-[13px] whitespace-nowrap transition-colors duration-[var(--duration-instant)] [&_svg]:size-4";
const itemOn = "bg-hover font-medium text-ink shadow-[inset_0_0_0_1px_var(--border-light)]";
const itemOff = "text-ink/85 hover:bg-hover hover:text-ink";

function NavLink({ href, label, icon, count }: { href: string; label: string; icon: React.ReactNode; count?: number }) {
  const path = usePathname();
  const on = path === href || path.startsWith(`${href}/`);
  return (
    <Link href={href} prefetch aria-current={on ? "page" : undefined} className={`${item} ${on ? itemOn : itemOff}`}>
      <span className={`-ml-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs [&_svg]:size-3.5 ${on ? "bg-signal text-on-signal [&_svg]:stroke-[2.25]" : "text-muted group-hover:text-ink"}`}>{icon}</span>
      {label}
      {count ? (
        <span aria-label={`${count} open`} className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-xs bg-signal px-1 text-[11px] leading-none font-medium text-on-signal tabular-nums">
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
    <aside className="flex shrink-0 flex-col border-b border-frame bg-panel md:w-[232px] md:rounded-lg md:border md:shadow-card">
      <div className="flex h-12 items-center gap-2 px-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" width={24} height={24} className="size-6 rounded-sm" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold" title={workspace}>
          {workspace}
        </span>
      </div>
      <BrandSwitcher s={switcher} />
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:min-h-0 md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto md:pt-1 md:pb-3">
        {SECTIONS.map((sec) => (
          <div key={sec.label} className="contents">
            <p className="label-mono mt-3 hidden h-6 items-center px-2 md:flex">{sec.label}</p>
            {sec.items
              .filter((n) => switcher.role !== "client" || n.client)
              .map((n) => (
                <NavLink key={n.href} href={n.href} label={n.label} icon={n.icon} count={n.href === "/inbox" ? inbox : undefined} />
              ))}
          </div>
        ))}
        {settings ? (
          <span className="md:hidden">
            <NavLink href="/settings" label="Settings" icon={<Settings />} />
          </span>
        ) : null}
      </nav>
      <div className="hidden border-t border-line p-2 md:block">
        {settings ? <NavLink href="/settings" label="Settings" icon={<Settings />} /> : null}
        <div className={`${settings ? "mt-2 border-t border-line" : ""} flex items-center gap-2 px-2 pt-2.5 pb-1`}>
          <Avatar label={name} size={24} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{name}</p>
            <p className="truncate text-[11px] text-faint">{email}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-ink" title="Sign out" aria-label="Sign out">
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

const MENU = "min-w-56 rounded-lg border border-frame bg-panel p-1 text-[13px] shadow-pop";
const ROW = "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-hover";

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
    <div className="px-2 pt-1 md:pt-1">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center gap-2 rounded-md bg-panel px-2.5 text-left text-[13px] font-medium shadow-input transition-colors hover:bg-canvas disabled:opacity-60"
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
            <Link href="/settings#brands" role="menuitem" className={`${ROW} mt-1 text-muted`} onClick={() => setOpen(false)}>
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
