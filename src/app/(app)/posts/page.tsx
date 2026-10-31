"use client";

import { useState } from "react";
import { PanelsTopLeft, Plus } from "lucide-react";
import { Button, Page, TabNav } from "@/components/ui";
import { ToolIntro } from "@/components/ToolIntro";
import { Composer } from "@/components/Composer";

type Tab = "scheduled" | "drafts" | "published" | "failed";

const EMPTY: Record<Tab, string> = {
  scheduled: "Schedule your first post",
  drafts: "No drafts",
  published: "Nothing published yet",
  failed: "No failed posts",
};

export default function PostsPage() {
  const [tab, setTab] = useState<Tab>("scheduled");
  const [compose, setCompose] = useState(false);
  return (
    <Page
      icon={<PanelsTopLeft />}
      title="Posts"
      actions={
        <Button onClick={() => setCompose(true)}>
          <Plus size={14} /> New post
        </Button>
      }
      tabs={
        <TabNav<Tab>
          label="Post status"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "scheduled", label: "Scheduled" },
            { value: "drafts", label: "Drafts" },
            { value: "published", label: "Published" },
            { value: "failed", label: "Failed" },
          ]}
        />
      }
    >
      <ToolIntro
        drawing="campaigns"
        title={EMPTY[tab]}
        lead={tab === "scheduled" ? "Write once and post to every channel at the right time." : undefined}
        action={tab === "scheduled" ? <Button onClick={() => setCompose(true)}>New post</Button> : undefined}
      />
      {compose ? <Composer onClose={() => setCompose(false)} /> : null}
    </Page>
  );
}
