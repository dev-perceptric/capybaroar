"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, KeyRound, Plus, Trash2 } from "lucide-react";
import { Button, CopyButton, IconButton, timeAgo } from "./ui";
import { Modal } from "./Overlay";
import { askConfirm, askText, tell } from "./Dialogs";
import { fmtDate } from "@/lib/format";
import { newApiKey, removeApiKey } from "@/app/(app)/settings/actions";

export type ApiInfo = { base: string; docs: string; keys: { id: string; name: string; prefix: string; created_at: string; last_used_at: string | null }[] };

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-center gap-3 border-b border-line px-3 py-1.5 last:border-b-0">
      <span className="w-24 shrink-0 text-[12px] text-muted">{label}</span>
      <code className="min-w-0 flex-1 font-mono text-[12px] wrap-anywhere">{value}</code>
      <CopyButton text={value} label={`Copy ${label}`} />
    </div>
  );
}

/** Keys for the REST API and the MCP server. A key acts as the person who made it. */
export function ApiSection({ api }: { api: ApiInfo }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [made, setMade] = useState<string | null>(null);
  const mcp = `${api.base}/api/mcp`;
  const add = async () => {
    const name = await askText("New API key", { placeholder: "Claude, Cursor, our website", ok: "Make key" });
    if (!name) return;
    start(async () => {
      const r = await newApiKey(name);
      if (r.error) await tell("Couldn't make the key", r.error);
      else setMade(r.key ?? null);
      router.refresh();
    });
  };
  const del = async (k: ApiInfo["keys"][number]) => {
    if (!(await askConfirm(`Delete ${k.name}?`, { body: "Apps using this key stop working.", ok: "Delete", danger: true }))) return;
    start(async () => {
      const r = await removeApiKey(k.id);
      if (r.error) await tell("Couldn't delete the key", r.error);
      router.refresh();
    });
  };
  return (
    <section id="api" className="mt-10 flex scroll-mt-6 flex-col gap-4 border-t border-line pt-8">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-medium">API and MCP</h2>
          <p className="text-[12px] text-muted">Keys for apps and AI agents that work in this workspace</p>
        </div>
        <a href={api.docs} target="_blank" rel="noreferrer" className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-ink" aria-label="Docs" title="Docs">
          <BookOpen size={16} />
        </a>
        <Button variant="ghost" onClick={add} disabled={busy}>
          <Plus />
          New key
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-frame">
        <Line label="MCP server" value={mcp} />
        <Line label="REST API" value={`${api.base}/api/v1`} />
      </div>
      {api.keys.length ? (
        <div className="overflow-hidden rounded-lg border border-frame">
          {api.keys.map((k) => (
            <div key={k.id} className="flex min-h-12 items-center gap-3 border-b border-line px-3 py-2 last:border-b-0">
              <KeyRound size={15} className="shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium wrap-break-word">{k.name}</p>
                <p className="text-[12px] text-muted">
                  <span className="font-mono">{k.prefix}…</span> made {fmtDate(k.created_at)}, {k.last_used_at ? `used ${timeAgo(k.last_used_at)}` : "not used yet"}
                </p>
              </div>
              <IconButton label="Delete key" align="end" onClick={() => del(k)} disabled={busy}>
                <Trash2 />
              </IconButton>
            </div>
          ))}
        </div>
      ) : null}
      {made ? (
        <Modal title="Your new key" wide onClose={() => setMade(null)} footer={<Button onClick={() => setMade(null)}>Done</Button>}>
          <p className="text-[13px] text-muted">It shows only once. Keep it somewhere safe.</p>
          <div className="overflow-hidden rounded-lg border border-frame">
            <Line label="Key" value={made} />
            <Line label="MCP link" value={`${mcp}/${made}`} />
            <Line label="Claude Code" value={`claude mcp add --transport http capybaroar ${mcp} --header "Authorization: Bearer ${made}"`} />
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
