"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppWindow, BookOpen, KeyRound, Plus, Send, Trash2 } from "lucide-react";
import { Button, CardHead, Checkbox, CopyField, Field, IconButton, Input, LinkButton, PaneHead, Panel, Row, Rows, Switch, timeAgo } from "./ui";
import { HoverTip } from "./Floating";
import { Modal } from "./Overlay";
import { askConfirm, askText, tell } from "./Dialogs";
import { fmtDate } from "@/lib/format";
import { addWebhook, newApiKey, removeApiKey, removeConnectedApp, removeWebhook, saveWebhookOn, sendTestWebhook } from "@/app/(app)/settings/actions";
import { EVENTS } from "@/lib/api/events";

type Hook = { id: string; url: string; events: string[]; enabled: boolean; failures: number; last_status: number | null; last_error: string | null; last_delivered_at: string | null };
type App = { id: string; name: string; created_at: string; last_used_at: string | null };
export type ApiInfo = { base: string; docs: string; keys: { id: string; name: string; prefix: string; created_at: string; last_used_at: string | null }[]; apps: App[]; hooks: Hook[] | null };

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
      {api.apps.length ? <ConnectedApps apps={api.apps} /> : null}
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

/** Apps connected with a sign-in (OAuth), like Claude's Capybaroar connector. Removing one signs it out at once. */
function ConnectedApps({ apps }: { apps: App[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const del = async (a: App) => {
    if (!(await askConfirm(`Remove ${a.name}?`, { body: "It stops working right away. You can connect it again later.", ok: "Remove", danger: true }))) return;
    start(async () => {
      const r = await removeConnectedApp(a.id);
      if (r.error) await tell("Couldn't remove the app", r.error);
      router.refresh();
    });
  };
  return (
    <Panel className="overflow-hidden">
      <CardHead label="Connected apps" count={apps.length} />
      <div className="divide-y divide-line">
        {apps.map((a) => (
          <Row
            key={a.id}
            lead={
              <span className="flex size-8 items-center justify-center rounded-md bg-paper text-muted shadow-track">
                <AppWindow size={15} />
              </span>
            }
            title={a.name}
            sub={`Connected ${fmtDate(a.created_at)}, ${a.last_used_at ? `used ${timeAgo(a.last_used_at)}` : "not used yet"}`}
          >
            <IconButton label="Remove app" align="end" onClick={() => del(a)} disabled={busy}>
              <Trash2 />
            </IconButton>
          </Row>
        ))}
      </div>
    </Panel>
  );
}

const TH = "h-10 px-4 font-medium whitespace-nowrap";
const TD = "px-4 py-2.5";

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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-muted">
                <th className={TH}>URL</th>
                <th className={TH}>Events</th>
                <th className={TH}>Last delivery</th>
                <th className={TH}>On</th>
                <th className={TH}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {hooks.map((h) => (
                <tr key={h.id} className="border-b border-line last:border-b-0 hover:bg-hover">
                  <td className={`${TD} max-w-[280px]`}>
                    <span className="font-mono text-[12px] wrap-anywhere">{h.url}</span>
                  </td>
                  <td className={`${TD} whitespace-nowrap`}>
                    <span tabIndex={0} className="cursor-default rounded-xs outline-none focus-visible:shadow-focus">
                      {h.events.length} {h.events.length === 1 ? "event" : "events"}
                      <HoverTip text={h.events.map((e) => EVENT_LABEL[e] ?? e).join(", ")} wrap />
                    </span>
                  </td>
                  <td className={`${TD} text-[12.5px] ${h.last_error ? "text-danger" : "text-muted"}`}>
                    <span className="wrap-break-word">{last(h)}</span>
                  </td>
                  <td className={TD}>
                    <Switch on={h.enabled} label={h.enabled ? "Turn off" : "Turn on"} disabled={busy} onChange={(on) => run(() => saveWebhookOn(h.id, on), "Couldn't change the webhook")} />
                  </td>
                  <td className={`${TD} text-right`}>
                    <span className="inline-flex items-center justify-end gap-1">
                      <IconButton label="Send a test" align="end" disabled={busy} onClick={() => run(() => sendTestWebhook(h.id), "Couldn't send the test", "Test sent")}>
                        <Send />
                      </IconButton>
                      <IconButton label="Delete webhook" align="end" disabled={busy} onClick={() => del(h)}>
                        <Trash2 />
                      </IconButton>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
