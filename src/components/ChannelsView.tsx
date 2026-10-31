"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";
import { Avatar, Badge, Button, Field, IconButton, Input } from "./ui";
import { Modal } from "./Overlay";
import { NetworkLogo } from "./NetworkLogo";
import { askConfirm } from "./Dialogs";
import { NETWORKS, networkOf, type NetworkId } from "@/lib/networks";
import type { Channel } from "@/lib/channels";
import { connectBluesky, removeChannel } from "@/app/(app)/channels/actions";

const connectHref = (n: NetworkId) => `/api/channels/${n}/connect`;

export function ChannelsView({ channels, ready, error }: { channels: Channel[]; ready: NetworkId[]; error: string | null }) {
  const [bsky, setBsky] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const connect = (n: NetworkId) => {
    if (n === "bluesky") setBsky(true);
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
      {bsky ? <BlueskyDialog onClose={() => setBsky(false)} onDone={() => (setBsky(false), router.refresh())} /> : null}
    </div>
  );
}

function BlueskyDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [state, action, busy] = useActionState(async (prev: { error?: string; ok?: boolean }, form: FormData) => {
    const r = await connectBluesky(prev, form);
    if (r.ok) onDone();
    return r;
  }, {});
  return (
    <Modal title="Connect Bluesky" onClose={onClose}>
      <form action={action} className="flex flex-col gap-3">
        <Field label="Handle">
          <Input name="handle" placeholder="you.bsky.social" autoComplete="username" required />
        </Field>
        <Field label="App password">
          <Input name="password" type="password" placeholder="xxxx-xxxx-xxxx-xxxx" required />
        </Field>
        <p className="text-[12px] text-muted">Make one in Bluesky under Settings, Privacy and security, App passwords.</p>
        {state.error ? <p className="text-[12px] text-danger">{state.error}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            Connect
          </Button>
        </div>
      </form>
    </Modal>
  );
}
