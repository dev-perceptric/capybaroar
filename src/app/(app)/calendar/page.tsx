import { CalendarView } from "@/components/CalendarView";
import { listChannels } from "@/lib/channels";
import { getCtx } from "@/lib/session";

export default async function CalendarPage() {
  const ctx = await getCtx();
  const channels = await listChannels(ctx.workspaceId);
  return <CalendarView channels={channels} />;
}
