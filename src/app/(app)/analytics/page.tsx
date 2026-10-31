import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Page } from "@/components/ui";
import { ToolIntro } from "@/components/ToolIntro";

export default function AnalyticsPage() {
  return (
    <Page icon={<BarChart3 />} title="Analytics">
      <ToolIntro
        drawing="dashboards"
        title="See how your posts do"
        lead="Reach, likes and followers for every channel, in one place."
        action={
          <Link href="/channels" className="inline-flex h-8 items-center border border-frame bg-yolk px-3 text-[12px] font-medium text-on-yolk hover:bg-yolk-hover">
            Connect a channel
          </Link>
        }
      />
    </Page>
  );
}
