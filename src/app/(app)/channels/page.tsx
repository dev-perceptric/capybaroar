import { Plug } from "lucide-react";
import { Button, Page } from "@/components/ui";
import { NetworkLogo } from "@/components/NetworkLogo";
import { NETWORKS } from "@/lib/networks";

export default function ChannelsPage() {
  return (
    <Page icon={<Plug />} title="Channels">
      <div className="mx-auto w-full max-w-[960px]">
        <h2 className="text-[20px] font-semibold tracking-[-0.025em] text-balance">
          Connect a channel. <span className="text-faint">Post to it from the calendar.</span>
        </h2>
        <div className="mt-6 grid grid-cols-1 border-t border-l border-frame sm:grid-cols-2 lg:grid-cols-3">
          {NETWORKS.map((n) => (
            <div key={n.id} className="flex h-16 items-center gap-3 border-r border-b border-frame px-4">
              <NetworkLogo id={n.id} size={22} />
              <span className="flex-1 text-[13px] font-medium">{n.name}</span>
              <Button variant="ghost">Connect</Button>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
