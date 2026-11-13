"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge, Button, ErrorNote, Field, IconButton, Input } from "./ui";
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
const TH = "h-10 px-4 font-medium";

/** Starts connecting a network: its form first when it asks for one, else straight to its sign-in. */
function useConnect(asks: Record<string, Ask>) {
  const [asking, setAsking] = useState<NetworkId | null>(null);
  const router = useRouter();
  const connect = (n: NetworkId) => {
    if (asks[n]) setAsking(n);
    else window.location.assign(connectHref(n));
  };
  const dialog =
    asking && asks[asking] ? (
      <AskDialog
        network={asking}
        ask={asks[asking]!}
        onClose={() => setAsking(null)}
        onDone={() => {
          setAsking(null);
          router.refresh();
        }}
      />
    ) : null;
  return { connect, dialog };
}

/** The page's Add channel button: a dialog with every offered network and a search. */
export function AddChannel({ ready, asks }: { ready: NetworkId[]; asks: Record<string, Ask> }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { connect, dialog } = useConnect(asks);
  const term = q.trim().toLowerCase();
  const shown = term ? OFFERED.filter((n) => n.name.toLowerCase().includes(term)) : OFFERED;
  const close = () => {
    setOpen(false);
    setQ("");
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Add channel
      </Button>
      {open ? (
        <Modal title="Add channel" onClose={close}>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search" autoFocus />
          {shown.length ? (
            <div className="-mx-5 -mb-5 max-h-[60vh] divide-y divide-line overflow-y-auto border-t border-line">
              {shown.map((n) => (
                <div key={n.id} className="flex min-h-12 items-center gap-3 px-5 py-2">
                  <NetworkLogo id={n.id} size={20} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{n.name}</span>
                  {ready.includes(n.id) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        close();
                        connect(n.id);
                      }}
                    >
                      Connect
                    </Button>
                  ) : (
                    <Badge>Soon</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted">No matches</p>
          )}
        </Modal>
      ) : null}
      {dialog}
    </>
  );
}

export function ChannelsView({ channels, ready, asks, error, brands = [] }: { channels: Channel[]; ready: NetworkId[]; asks: Record<string, Ask>; error: string | null; brands?: { id: string; name: string }[] }) {
  const [brand, setBrand] = useState("all");
  const [, start] = useTransition();
  const router = useRouter();
  const { connect, dialog } = useConnect(asks);
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
  const shown = brand === "all" ? channels : brand === "none" ? channels.filter((c) => !c.brand_id) : channels.filter((c) => c.brand_id === brand);
  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8">
      {error ? <ErrorNote message={error} /> : null}
      {channels.length ? (
        <section className="flex flex-col gap-3">
          {brands.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select<string>
                size="sm"
                lead="Brand"
                ariaLabel="Brand"
                value={brand}
                onChange={setBrand}
                options={[{ value: "all", label: "All" }, ...brands.map((b) => ({ value: b.id, label: b.name })), { value: "none", label: "No brand" }]}
              />
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-lg bg-panel shadow-card">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-[12px] text-muted">
                  <th className={TH}>Channel</th>
                  <th className={TH}>Network</th>
                  {brands.length ? <th className={TH}>Brand</th> : null}
                  <th className={TH}>Status</th>
                  <th className="h-10 w-px px-2 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-b-0 hover:bg-hover">
                    <td className="max-w-[300px] px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <ChannelFace channel={c} size={28} badge={12} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.name}</p>
                          {c.username ? <p className="truncate text-[12px] text-muted">@{c.username}</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <NetworkLogo id={c.network} size={14} />
                        {networkOf(c.network).name}
                      </span>
                    </td>
                    {brands.length ? (
                      <td className="px-4 py-2">
                        <Select size="sm" ariaLabel="Brand" className="w-40" value={c.brand_id ?? ""} placeholder="No brand" onChange={(v) => move(c, v)} options={brands.map((b) => ({ value: b.id, label: b.name }))} />
                      </td>
                    ) : null}
                    <td className="px-4 py-2.5">{c.status === "reconnect" ? <Badge tone="red">Reconnect</Badge> : <Badge tone="green">Active</Badge>}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-end">
                        {c.status === "reconnect" ? (
                          <IconButton label="Reconnect" onClick={() => connect(c.network)}>
                            <RefreshCw />
                          </IconButton>
                        ) : null}
                        <IconButton label="Remove" align="end" onClick={() => del(c)}>
                          <Trash2 />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {!shown.length ? (
                  <tr>
                    <td colSpan={brands.length ? 5 : 4} className="px-4 py-6 text-center text-muted">
                      No matches
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <>
          <h2 className="text-[22px] leading-[1.15] font-medium tracking-[-0.025em] text-balance">
            Connect a channel. <span className="text-faint">Post to it from the calendar.</span>
          </h2>
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
        </>
      )}
      {dialog}
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
