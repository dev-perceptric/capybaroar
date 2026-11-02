import Link from "next/link";
import { Inbox } from "lucide-react";
import { Page } from "@/components/ui";
import { ToolIntro } from "@/components/ToolIntro";
import { InboxView } from "@/components/InboxView";
import { listChannels } from "@/lib/channels";
import { getCtx } from "@/lib/session";
import { hasItems, inboxErrors, listThreads } from "@/lib/inbox";
import { providerOf } from "@/lib/providers";

export default async function InboxPage() {
  const ctx = await getCtx();
  const [channels, any] = await Promise.all([listChannels(ctx.workspaceId), hasItems(ctx.workspaceId)]);
  // Channels whose network has an Inbox that's switched on (X only with X_INBOX=1).
  const reading = channels.filter((c) => {
    const box = providerOf(c.network)?.inbox;
    return box && (box.enabled ? box.enabled() : true);
  });
  if (!any)
    return (
      <Page icon={<Inbox />} title="Inbox">
        <ToolIntro
          drawing="inbox"
          title="Answer comments and messages"
          lead="Comments, replies, mentions and messages from your channels, in one place."
          action={
            reading.length ? undefined : (
              <Link href="/channels" className="inline-flex h-8 items-center border border-frame bg-yolk px-3 text-[12px] font-medium text-on-yolk hover:bg-yolk-hover">
                Connect a channel
              </Link>
            )
          }
        />
      </Page>
    );
  const [threads, errors] = await Promise.all([listThreads(ctx.workspaceId, { status: "open" }), inboxErrors(reading.map((c) => c.id))]);
  return (
    <Page icon={<Inbox />} title="Inbox" flush>
      <InboxView channels={reading} errors={errors} initial={threads} />
    </Page>
  );
}
