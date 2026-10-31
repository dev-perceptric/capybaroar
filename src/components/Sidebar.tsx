"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, CalendarDays, Image as ImageIcon, LogOut, Plug, Settings } from "lucide-react";
import { Avatar } from "./ui";
import { signOut } from "@/app/login/actions";

const SECTIONS = [
  {
    label: "Workspace",
    items: [
      { href: "/calendar", label: "Calendar", icon: <CalendarDays /> },
      { href: "/channels", label: "Channels", icon: <Plug /> },
      { href: "/agents", label: "Agents", icon: <Bot /> },
      { href: "/analytics", label: "Analytics", icon: <BarChart3 /> },
      { href: "/media", label: "Media", icon: <ImageIcon /> },
    ],
  },
];

const item = "group flex h-8 shrink-0 items-center gap-2 border px-2 text-[13px] whitespace-nowrap transition-colors duration-[var(--duration-instant)] [&_svg]:size-4";
const itemOn = "border-frame bg-yolk font-semibold text-on-yolk";
const itemOff = "border-transparent text-ink/85 hover:bg-pressed hover:text-ink";

function NavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  const path = usePathname();
  const on = path === href || path.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={on ? "page" : undefined} className={`${item} ${on ? itemOn : itemOff}`}>
      <span className={on ? "[&_svg]:stroke-[2.25]" : "text-ink/70 group-hover:text-ink"}>{icon}</span>
      {label}
    </Link>
  );
}

export function Sidebar({ name, email, workspace }: { name: string; email: string; workspace: string }) {
  return (
    <aside className="flex shrink-0 flex-col border-b border-frame bg-side md:w-[220px] md:border-r md:border-b-0">
      <div className="flex h-12 items-center gap-2 px-3 md:h-14 md:border-b md:border-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" width={24} height={24} className="size-6 border border-frame bg-white" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold" title={workspace}>
          {workspace}
        </span>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:min-h-0 md:flex-1 md:flex-col md:gap-0.5 md:overflow-y-auto md:pt-1 md:pb-3">
        {SECTIONS.map((sec) => (
          <div key={sec.label} className="contents">
            <p className="label-mono mt-3 hidden h-6 items-center px-2 md:flex">
              <span className="bracket">{sec.label}</span>
            </p>
            {sec.items.map((n) => (
              <NavLink key={n.href} {...n} />
            ))}
          </div>
        ))}
        <span className="md:hidden">
          <NavLink href="/settings" label="Settings" icon={<Settings />} />
        </span>
      </nav>
      <div className="hidden border-t border-frame p-2 md:block">
        <NavLink href="/settings" label="Settings" icon={<Settings />} />
        <div className="mt-2 flex items-center gap-2 border-t border-line px-2 pt-2.5 pb-1">
          <Avatar label={name} size={24} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{name}</p>
            <p className="truncate text-[11px] text-faint">{email}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="flex size-8 items-center justify-center text-muted transition-colors hover:bg-pressed hover:text-ink" title="Sign out" aria-label="Sign out">
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
