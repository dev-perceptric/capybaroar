"use client";

import { useState } from "react";
import { ArrowUp, Bot, ImagePlus, Plus } from "lucide-react";
import { Button, IconButton, Page } from "@/components/ui";

export default function AgentsPage() {
  const [text, setText] = useState("");
  return (
    <Page
      icon={<Bot />}
      title="Agents"
      flush
      actions={
        <Button variant="ghost">
          <Plus size={14} /> New chat
        </Button>
      }
    >
      <div className="flex h-full min-h-0">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" width={88} height={88} className="size-22 border border-frame" />
            <h2 className="mt-6 text-[24px] font-semibold tracking-[-0.035em] text-balance">
              Plan a week of posts. <span className="text-faint">The agent writes and schedules them.</span>
            </h2>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mb-6 w-full max-w-[720px] border border-frame bg-panel px-3 pt-2 pb-2"
          >
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write 5 LinkedIn posts about our launch, one each weekday at 9 AM"
              className="w-full resize-none bg-transparent text-[13px] outline-none placeholder:text-faint"
            />
            <div className="flex items-center gap-1">
              <IconButton label="Add media">
                <ImagePlus size={16} />
              </IconButton>
              <span className="flex-1" />
              <IconButton label="Send" variant="primary" disabled={!text.trim()}>
                <ArrowUp size={16} />
              </IconButton>
            </div>
          </form>
        </div>
        <aside className="hidden w-64 shrink-0 border-l border-line p-2 lg:block">
          <p className="label-mono flex h-6 items-center px-2">
            <span className="bracket">Chats</span>
          </p>
          <p className="px-2 py-1 text-[12px] text-faint">No chats yet</p>
        </aside>
      </div>
    </Page>
  );
}
