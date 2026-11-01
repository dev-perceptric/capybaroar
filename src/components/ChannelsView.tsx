"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";
import { Avatar, Badge, Button, Field, IconButton, Input } from "./ui";
import { Modal } from "./Overlay";
import { NetworkLogo } from "./NetworkLogo";
import { askConfirm } from "./Dialogs";
import { NETWORKS, networkOf, type NetworkId } from "@/lib/networks";
import type { Channel } from "@/lib/channels";
import { connectWithForm, removeChannel } from "@/app/(app)/channels/actions";

export type Ask = { kind: "form" | "oauth"; fields: { key: string; label: string; placeholder?: string; secret?: boolean }[] } | null;

const connectHref = (n: NetworkId) => `/api/channels/${n}/connect`;

export function ChannelsView({ channels, ready, asks, error }: { channels: Channel[]; ready: NetworkId[]; asks: Record<string, Ask>; error: string | null }) {
  const [asking, setAsking] = useState<NetworkId | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const connect = (n: NetworkId) => {
    if (asks[n]) setAsking(n);
    else window.location.assign(connectHref(n));
  };
  const del = async (c: Channel) => {
    if (!(await askConfirm(`Remove ${c.name}?`, { body: "Scheduled posts stop going to this channel.", ok: "Remove", danger: true }))) return;
    start(async () => {
      await removeChannel(c.id);
      router.refresh();
    });
  };
  return (
    <div className="mx-auto w-full max-w-[960px]">
      {error ? <p className="mb-4 border border-danger bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p> : null}
      {channels.length ? (
        <section className="mb-8">
          <p className="label-mono mb-2">
            <span className="bracket">Connected</span>
          </p>
          <div className="border border-frame">
            {channels.map((c) => (
              <div key={c.id} className="flex h-14 items-center gap-3 border-b border-line px-3 last:border-b-0">
                <span className="relative">
                  {c.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar} alt="" className="size-8 rounded-full object-cover" />
                  ) : (
                    <Avatar label={c.name} size={32} />
                  )}
                  <span className="absolute -right-1 -bottom-1 bg-panel">
                    <NetworkLogo id={c.network} size={14} />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{c.name}</p>
                  <p className="truncate text-[11px] text-faint">
                    {networkOf(c.network).name}
                    {c.username ? `, @${c.username}` : ""}
                  </p>
                </div>
                {c.status === "reconnect" ? (
                  <>
                    <Badge tone="red">Reconnect</Badge>
                    <IconButton label="Reconnect" onClick={() => connect(c.network)}>
                      <RefreshCw size={16} />
                    </IconButton>
                  </>
                ) : null}
                <IconButton label="Remove" onClick={() => del(c)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <h2 className="mb-6 text-[20px] font-semibold tracking-[-0.025em] text-balance">
          Connect a channel. <span className="text-faint">Post to it from the calendar.</span>
        </h2>
      )}
      <p className="label-mono mb-2">
        <span className="bracket">Add</span>
      </p>
      <div className="grid grid-cols-1 border-t border-l border-frame sm:grid-cols-2 lg:grid-cols-3">
        {NETWORKS.map((n) => {
          const on = ready.includes(n.id);
          return (
            <div key={n.id} className="flex h-16 items-center gap-3 border-r border-b border-frame px-4">
              <NetworkLogo id={n.id} size={22} />
              <span className="flex-1 text-[13px] font-medium">{n.name}</span>
              {on ? (
                <Button variant="ghost" onClick={() => connect(n.id)}>
                  Connect
                </Button>
              ) : (
                <Badge>Soon</Badge>
              )}
            </div>
          );
        })}
      </div>
      {asking && asks[asking] ? (
        <AskDialog
          network={asking}
          ask={asks[asking]!}
          onClose={() => setAsking(null)}
          onDone={() => {
            setAsking(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function AskDialog({ network, ask, onClose, onDone }: { network: NetworkId; ask: NonNullable<Ask>; onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const submit = (form: FormData) => {
    const values = Object.fromEntries(ask.fields.map((f) => [f.key, String(form.get(f.key) ?? "").trim()]));
    if (ask.kind === "oauth") {
      window.location.assign(`${connectHref(network)}?${new URLSearchParams(values)}`);
      return;
    }
    start(async () => {
      const r = await connectWithForm(network, values);
      if (r.error) setError(r.error);
      else onDone();
    });
  };
  return (
    <Modal title={`Connect ${networkOf(network).name}`} onClose={onClose}>
      <form action={submit} className="flex flex-col gap-3">
        {ask.fields.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input name={f.key} type={f.secret ? "password" : "text"} placeholder={f.placeholder} required autoComplete="off" />
          </Field>
        ))}
        {error ? <p className="text-[12px] text-danger">{error}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            Connect
          </Button>
        </div>
      </form>
    </Modal>
  );
}
