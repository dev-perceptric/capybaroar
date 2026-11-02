import { Bot } from "lucide-react";
import { Page } from "@/components/ui";
import { AgentChat, type Shown } from "@/components/AgentChat";
import { teamCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";

type Block = { type: string; text?: string; name?: string; input?: { posts?: unknown[] } };

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ chat?: string }> }) {
  const ctx = await teamCtx();
  const { chat } = await searchParams;
  const db = adminClient();
  // The open chat's messages load alongside the list, and show only when the chat is in it (this person's).
  const [{ data: chats }, open] = await Promise.all([
    db.from("agent_chats").select("id, title").eq("user_id", ctx.userId).eq("workspace_id", ctx.workspaceId).order("created_at", { ascending: false }).limit(50),
    chat ? db.from("agent_messages").select("id, role, content").eq("chat_id", chat).order("id") : null,
  ]);
  let shown: Shown[] = [];
  if (chat && chats?.some((c) => c.id === chat)) {
    const rows = open?.data;
    shown = (rows ?? []).flatMap((r) => {
      const blocks = (Array.isArray(r.content) ? r.content : [{ type: "text", text: String(r.content) }]) as Block[];
      return blocks.flatMap((b, i): Shown[] => {
        if (b.type === "text" && b.text?.trim()) return [{ key: `${r.id}-${i}`, role: r.role as "user" | "assistant", text: b.text }];
        if (b.type === "tool_use" && b.name === "save_posts") return [{ key: `${r.id}-${i}`, role: "tool", text: `Saved ${b.input?.posts?.length ?? 0} post${b.input?.posts?.length === 1 ? "" : "s"}` }];
        return [];
      });
    });
  }
  return (
    <Page icon={<Bot />} title="Agents" flush>
      <AgentChat chats={(chats ?? []) as { id: string; title: string }[]} chatId={chat ?? null} messages={shown} />
    </Page>
  );
}
