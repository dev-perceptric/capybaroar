"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, KeyRound, Plus, Send, Trash2, Webhook } from "lucide-react";
import { Badge, Button, Checkbox, CopyButton, Field, IconButton, Input, Switch, timeAgo } from "./ui";
import { Modal } from "./Overlay";
import { askConfirm, askText, tell } from "./Dialogs";
import { fmtDate } from "@/lib/format";
import { addWebhook, newApiKey, removeApiKey, removeWebhook, saveWebhookOn, sendTestWebhook } from "@/app/(app)/settings/actions";
import { EVENTS } from "@/lib/api/events";

type Hook = { id: string; url: string; events: string[]; enabled: boolean; failures: number; last_status: number | null; last_error: string | null; last_delivered_at: string | null };
export type ApiInfo = { base: string; docs: string; keys: { id: string; name: string; prefix: string; created_at: string; last_used_at: string | null }[]; hooks: Hook[] | null };

const EVENT_LABEL: Record<string, string> = {
  "post.published": "A post went out",
  "post.failed": "A post failed",
  "post.in_review": "A post waits for approval",
  "post.approved": "A post was approved",
  "post.rejected": "A post was sent back",
  "channel.reconnect": "A channel needs reconnecting",
};

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
      {api.hooks ? <Webhooks hooks={api.hooks} /> : null}
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

/** Webhooks: URLs told when posts go out, fail or wait for approval, and when a channel needs reconnecting. */
function Webhooks({ hooks }: { hooks: Hook[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["post.published", "post.failed"]);
  const [error, setError] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const run = (fn: () => Promise<{ error?: string }>, failTitle: string, done?: string) =>
    start(async () => {
      const r = await fn();
      if (r.error) await tell(failTitle, r.error);
      else if (done) await tell(done);
      router.refresh();
    });
  const add = () =>
    start(async () => {
      const r = await addWebhook(url, events);
      if (r.error) return setError(r.error);
      setAdding(false);
      setUrl("");
      setError("");
      setSecret(r.secret ?? null);
      router.refresh();
    });
  const del = async (h: Hook) => {
    if (await askConfirm("Delete this webhook?", { body: h.url, ok: "Delete", danger: true })) run(() => removeWebhook(h.id), "Couldn't delete the webhook");
  };
  const last = (h: Hook) =>
    h.last_error ? h.last_error : h.last_delivered_at ? `Answered ${h.last_status ?? 200}, ${timeAgo(h.last_delivered_at)}` : "Nothing sent yet";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-[13px] font-medium">Webhooks</h3>
        <Button variant="ghost" onClick={() => setAdding(true)} disabled={busy}>
          <Plus />
          Add webhook
        </Button>
      </div>
      {hooks.length ? (
        <div className="overflow-hidden rounded-lg border border-frame">
          {hooks.map((h) => (
            <div key={h.id} className="flex min-h-12 items-start gap-3 border-b border-line px-3 py-2.5 last:border-b-0">
              <Webhook size={15} className="mt-0.5 shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[12px] wrap-anywhere">{h.url}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {h.enabled ? null : <Badge tone="red">Off</Badge>}
                  {h.events.map((e) => (
                    <Badge key={e}>{e}</Badge>
                  ))}
                </div>
                <p className={`mt-1 text-[12px] ${h.last_error ? "text-danger" : "text-muted"}`}>{last(h)}</p>
              </div>
              <Switch on={h.enabled} label={h.enabled ? "Turn off" : "Turn on"} disabled={busy} onChange={(on) => run(() => saveWebhookOn(h.id, on), "Couldn't change the webhook")} />
              <IconButton label="Send a test" align="end" disabled={busy} onClick={() => run(() => sendTestWebhook(h.id), "Couldn't send the test", "Test sent")}>
                <Send />
              </IconButton>
              <IconButton label="Delete webhook" align="end" disabled={busy} onClick={() => del(h)}>
                <Trash2 />
              </IconButton>
            </div>
          ))}
        </div>
      ) : null}
      {adding ? (
        <Modal
          title="Add webhook"
          onClose={() => setAdding(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button onClick={add} disabled={busy || !url.trim() || !events.length}>
                Add
              </Button>
            </>
          }
        >
          <Field label="URL">
            <Input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" inputMode="url" />
          </Field>
          <Field label="Events">
            <div className="flex flex-col gap-2 pt-0.5">
              {EVENTS.map((e) => (
                <label key={e} className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <Checkbox checked={events.includes(e)} onChange={(on) => setEvents((x) => (on ? [...x, e] : x.filter((y) => y !== e)))} />
                  <span className="flex-1">{EVENT_LABEL[e]}</span>
                  <code className="font-mono text-[11px] text-faint">{e}</code>
                </label>
              ))}
            </div>
          </Field>
          {error ? <p className="text-[12px] text-danger">{error}</p> : null}
        </Modal>
      ) : null}
      {secret ? (
        <Modal title="Webhook added" onClose={() => setSecret(null)} footer={<Button onClick={() => setSecret(null)}>Done</Button>}>
          <p className="text-[13px] text-muted">The signing secret shows only once.</p>
          <div className="overflow-hidden rounded-lg border border-frame">
            <Line label="Secret" value={secret} />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
