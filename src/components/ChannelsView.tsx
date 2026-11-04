"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";
import { Badge, Button, ErrorNote, Field, IconButton, Input, Row, Rows } from "./ui";
import { Modal } from "./Overlay";
import { ChannelFace, NetworkLogo } from "./NetworkLogo";
import { askConfirm, tell } from "./Dialogs";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { OFFERED, networkOf, type NetworkId } from "@/lib/networks";
import type { Channel } from "@/lib/channels";
import { connectWithForm, removeChannel, setChannelBrand } from "@/app/(app)/channels/actions";

export type Ask = { kind: "form" | "oauth"; fields: { key: string; label: string; placeholder?: string; secret?: boolean }[] } | null;

const connectHref = (n: NetworkId) => `/api/channels/${n}/connect`;

export function ChannelsView({ channels, ready, asks, error, brands = [] }: { channels: Channel[]; ready: NetworkId[]; asks: Record<string, Ask>; error: string | null; brands?: { id: string; name: string }[] }) {
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
      const r = await removeChannel(c.id);
      if (r.error) await tell("Couldn't remove the channel", r.error);
      router.refresh();
    });
  };
  const move = (c: Channel, brandId: string) =>
    start(async () => {
      const r = await setChannelBrand(c.id, brandId);
      if (r.error) await tell("Couldn't move the channel", r.error);
      router.refresh();
    });
  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8">
      {error ? <ErrorNote message={error} /> : null}
      {channels.length ? (
        <section className="flex flex-col gap-2">
          <p className="label-mono">Connected</p>
          <Rows label="Connected">
            {channels.map((c) => (
              <Row
                key={c.id}
                lead={<ChannelFace channel={c} size={32} badge={14} />}
                title={c.name}
                sub={
                  <span className="block truncate">
                    {networkOf(c.network).name}
                    {c.username ? `, @${c.username}` : ""}
                  </span>
                }
              >
                {brands.length ? <Select size="sm" ariaLabel="Brand" className="w-40" value={c.brand_id ?? ""} placeholder="No brand" onChange={(v) => move(c, v)} options={brands.map((b) => ({ value: b.id, label: b.name }))} /> : null}
                {c.status === "reconnect" ? (
                  <>
                    <Badge tone="red">Reconnect</Badge>
                    <IconButton label="Reconnect" onClick={() => connect(c.network)}>
                      <RefreshCw />
                    </IconButton>
                  </>
                ) : null}
                <IconButton label="Remove" align="end" onClick={() => del(c)}>
                  <Trash2 />
                </IconButton>
              </Row>
            ))}
          </Rows>
        </section>
      ) : (
        <h2 className="text-[22px] leading-[1.15] font-medium tracking-[-0.025em] text-balance">
          Connect a channel. <span className="text-faint">Post to it from the calendar.</span>
        </h2>
      )}
      <section className="flex flex-col gap-2">
        <p className="label-mono">Add</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OFFERED.map((n) => {
            const on = ready.includes(n.id);
            return (
              <div key={n.id} className="flex h-16 items-center gap-3 rounded-lg bg-panel px-4 shadow-card">
                <NetworkLogo id={n.id} size={22} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{n.name}</span>
                {on ? (
                  <Button variant="ghost" size="sm" onClick={() => connect(n.id)}>
                    Connect
                  </Button>
                ) : (
                  <Badge>Soon</Badge>
                )}
              </div>
            );
          })}
        </div>
      </section>
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
      <form action={submit} className="flex flex-col gap-4">
        {ask.fields.map((f, i) => (
          <Field key={f.key} label={f.label}>
            <Input name={f.key} type={f.secret ? "password" : "text"} placeholder={f.placeholder} required autoComplete="off" autoFocus={i === 0} />
          </Field>
        ))}
        {error ? <p className="text-[12px] text-danger">{error}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? <Loader /> : null}
            Connect
          </Button>
        </div>
      </form>
    </Modal>
  );
}
