import { Bot } from "lucide-react";
import { Page } from "@/components/ui";
import { AgentChat, type Shown } from "@/components/AgentChat";
import { teamCtx } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { aiReady, generationsOf } from "@/lib/generations";
import { modelOf } from "@/lib/genRules";
import { mediaThumbs } from "@/lib/media";
import { actionLabel } from "@/lib/agentTools";

type Block = { type: string; id?: string; text?: string; name?: string; input?: Record<string, unknown>; tool_use_id?: string; content?: unknown; is_error?: boolean };

const genIdOf = (content: unknown): string | null => {
  try {
    const v = JSON.parse(typeof content === "string" ? content : "");
    const g = v?.generation?.id ?? v?.generation_id;
    return typeof g === "string" ? g : null;
  } catch {
    return null;
  }
};

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
    const rows = (open?.data ?? []).map((r) => ({ ...r, blocks: (Array.isArray(r.content) ? r.content : [{ type: "text", text: String(r.content) }]) as Block[] }));
    // Pictures and videos the agent made: each generate_media call's answer names its request.
    const genOf = new Map<string, string>();
    // Actions that failed show no "done" line.
    const failed = new Set<string>();
    for (const r of rows) for (const b of r.blocks) if (b.type === "tool_result" && b.tool_use_id) {
      if (b.is_error) failed.add(b.tool_use_id);
      const g = genIdOf(b.content);
      if (g) genOf.set(b.tool_use_id, g);
    }
    const gens = new Map((await generationsOf(ctx.workspaceId, [...new Set(genOf.values())])).map((g) => [g.id, g]));
    const thumbs = new Map((await mediaThumbs(ctx.workspaceId, [...gens.values()].map((g) => g.media_id).filter((x): x is string => !!x))).map((m) => [m.id, m]));
    shown = rows.flatMap((r) =>
      r.blocks.flatMap((b, i): Shown[] => {
        const key = `${r.id}-${i}`;
        if (b.type === "text" && b.text?.trim()) return [{ key, role: r.role as "user" | "assistant", text: b.text }];
        const label = b.type === "tool_use" && b.name && b.id && !failed.has(b.id) ? actionLabel(b.name, b.input) : null;
        if (label) return [{ key, role: "tool", text: label, href: /webhook/.test(b.name!) ? "/settings" : b.name === "upload_media" ? "/media" : "/calendar" }];
        if (b.type === "tool_use" && b.name === "generate_media" && b.id) {
          const g = gens.get(genOf.get(b.id) ?? "");
          if (!g) return [];
          const m = g.media_id ? thumbs.get(g.media_id) : undefined;
          return [{ key, role: "media", text: g.prompt, media: { kind: g.kind, status: g.status, error: g.error, thumb: m?.thumb ?? null, mime: m?.mime ?? null, model: modelOf(g.model)?.name ?? g.model, credits: g.credits, reason: g.reason } }];
        }
        return [];
      }),
    );
  }
  return (
    <Page icon={<Bot />} title="Agents" flush>
      <AgentChat chats={(chats ?? []) as { id: string; title: string }[]} chatId={chat ?? null} messages={shown} ai={aiReady()} />
    </Page>
  );
}
