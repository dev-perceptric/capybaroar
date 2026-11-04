"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, KeyRound, Plus, Send, Trash2, Webhook } from "lucide-react";
import { Badge, Button, CardHead, Checkbox, CopyField, Field, IconButton, Input, LinkButton, PaneHead, Panel, Row, Rows, Switch, timeAgo } from "./ui";
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
    <>
      <PaneHead title="API and MCP" line="Keys for apps and AI agents that work in this workspace">
        <LinkButton href={api.docs} external variant="ghost" size="sm">
          <BookOpen /> Docs
        </LinkButton>
      </PaneHead>
      <Rows label="Addresses">
        <CopyField label="MCP server" value={mcp} />
        <CopyField label="REST API" value={`${api.base}/api/v1`} />
      </Rows>
      <Panel className="overflow-hidden">
        <CardHead label="Keys" count={api.keys.length}>
          <Button variant="ghost" size="sm" onClick={add} disabled={busy}>
            <Plus /> New key
          </Button>
        </CardHead>
        {api.keys.length ? (
          <div className="divide-y divide-line">
            {api.keys.map((k) => (
              <Row
                key={k.id}
                lead={
                  <span className="flex size-8 items-center justify-center rounded-md bg-paper text-muted shadow-track">
                    <KeyRound size={15} />
                  </span>
                }
                title={k.name}
                sub={
                  <span className="block truncate">
                    <span className="font-mono">{k.prefix}…</span> made {fmtDate(k.created_at)}, {k.last_used_at ? `used ${timeAgo(k.last_used_at)}` : "not used yet"}
                  </span>
                }
              >
                <IconButton label="Delete key" align="end" onClick={() => del(k)} disabled={busy}>
                  <Trash2 />
                </IconButton>
              </Row>
            ))}
          </div>
        ) : (
          <p className="px-4 py-6 text-center text-[13px] text-muted">No keys yet</p>
        )}
      </Panel>
      {api.hooks ? <Webhooks hooks={api.hooks} /> : null}
      {made ? (
        <Modal title="Your new key" wide onClose={() => setMade(null)} footer={<Button onClick={() => setMade(null)}>Done</Button>}>
          <p className="text-[13px] text-muted">It shows only once. Keep it somewhere safe.</p>
          <Rows>
            <CopyField label="Key" value={made} />
            <CopyField label="MCP link" value={`${mcp}/${made}`} />
            <CopyField label="Claude Code" value={`claude mcp add --transport http capybaroar ${mcp} --header "Authorization: Bearer ${made}"`} />
          </Rows>
        </Modal>
      ) : null}
    </>
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
    <Panel className="overflow-hidden">
      <CardHead label="Webhooks" count={hooks.length}>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)} disabled={busy}>
          <Plus /> Add webhook
        </Button>
      </CardHead>
      {hooks.length ? (
        <div className="divide-y divide-line">
          {hooks.map((h) => (
            <Row
              key={h.id}
              top
              lead={
                <span className="flex size-8 items-center justify-center rounded-md bg-paper text-muted shadow-track">
                  <Webhook size={15} />
                </span>
              }
              title={<span className="font-mono text-[12px] font-normal wrap-anywhere whitespace-normal">{h.url}</span>}
              sub={
                <>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1">
                    {h.enabled ? null : <Badge tone="red">Off</Badge>}
                    {h.events.map((e) => (
                      <Badge key={e}>{e}</Badge>
                    ))}
                  </span>
                  <span className={`mt-1 block ${h.last_error ? "text-danger" : ""}`}>{last(h)}</span>
                </>
              }
            >
              <span className="mx-1 flex">
                <Switch on={h.enabled} label={h.enabled ? "Turn off" : "Turn on"} disabled={busy} onChange={(on) => run(() => saveWebhookOn(h.id, on), "Couldn't change the webhook")} />
              </span>
              <IconButton label="Send a test" align="end" disabled={busy} onClick={() => run(() => sendTestWebhook(h.id), "Couldn't send the test", "Test sent")}>
                <Send />
              </IconButton>
              <IconButton label="Delete webhook" align="end" disabled={busy} onClick={() => del(h)}>
                <Trash2 />
              </IconButton>
            </Row>
          ))}
        </div>
      ) : (
        <p className="px-4 py-6 text-center text-[13px] text-muted">No webhooks yet</p>
      )}
      {adding ? (
        <Modal
          title="Add webhook"
          onClose={() => setAdding(false)}
          footer={
            <>
              <Button variant="plain" onClick={() => setAdding(false)}>
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
            <div className="flex flex-col rounded-lg bg-paper p-1 shadow-track">
              {EVENTS.map((e) => (
                <label key={e} className="flex h-9 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-[13px] hover:bg-hover">
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
          <Rows>
            <CopyField label="Secret" value={secret} />
          </Rows>
        </Modal>
      ) : null}
    </Panel>
  );
}
