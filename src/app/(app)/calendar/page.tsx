import { redirect } from "next/navigation";
import { CalendarView } from "@/components/CalendarView";
import { listChannels } from "@/lib/channels";
import { getBrandCtx } from "@/lib/brands";
import { canApprove } from "@/lib/session";

export default async function CalendarPage() {
  const b = await getBrandCtx();
  const channels = await listChannels(b.workspaceId, b.scope);
  if (!channels.length && b.role !== "client") redirect("/welcome");
  return <CalendarView key={b.brand?.id ?? "all"} channels={channels} access={{ write: b.role !== "client", approve: canApprove(b.role) }} />;
}
