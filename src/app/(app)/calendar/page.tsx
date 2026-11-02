import { redirect } from "next/navigation";
import { CalendarView } from "@/components/CalendarView";
import { listChannels } from "@/lib/channels";
import { postsAroundNow } from "@/lib/posts";
import { getCtx } from "@/lib/session";

export default async function CalendarPage() {
  const ctx = await getCtx();
  // The week opens with its posts, instead of asking for them after the page shows.
  const [channels, initial] = await Promise.all([listChannels(ctx.workspaceId), postsAroundNow(ctx.workspaceId)]);
  if (!channels.length) redirect("/welcome");
  return <CalendarView channels={channels} initial={initial} />;
}
