import { redirect } from "next/navigation";
import { CalendarView } from "@/components/CalendarView";
import { listChannels } from "@/lib/channels";
import { getCtx } from "@/lib/session";

export default async function CalendarPage() {
  const ctx = await getCtx();
  const channels = await listChannels(ctx.workspaceId);
  if (!channels.length) redirect("/welcome");
  return <CalendarView channels={channels} />;
}
