"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabNav } from "./ui";

const TABS = [
  { value: "/channels", label: "Channels" },
  { value: "/channels/feeds", label: "Feeds" },
  { value: "/channels/bio", label: "Link in bio" },
];

/** The Channels page's tabs, each its own address. */
export function ChannelTabs() {
  const path = usePathname();
  const router = useRouter();
  const value = TABS.find((t) => t.value !== "/channels" && path.startsWith(t.value))?.value ?? "/channels";
  return <TabNav label="Channels" value={value} tabs={TABS} onChange={(v) => router.push(v)} />;
}
