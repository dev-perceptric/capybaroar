import { redirect } from "next/navigation";
import { CalendarView } from "@/components/CalendarView";
import { listChannels } from "@/lib/channels";
import { getBrandCtx } from "@/lib/brands";
import { postsAroundNow } from "@/lib/posts";
import { canApprove } from "@/lib/session";

export default async function CalendarPage() {
  const b = await getBrandCtx();
  // The week opens with its posts, instead of asking for them after the page shows.
  const [channels, initial] = await Promise.all([listChannels(b.workspaceId, b.scope), postsAroundNow(b.workspaceId, b.scope)]);
  if (!channels.length && b.role !== "client") redirect("/welcome");
  return <CalendarView key={b.brand?.id ?? "all"} channels={channels} initial={initial} access={{ write: b.role !== "client", approve: canApprove(b.role) }} />;
}
