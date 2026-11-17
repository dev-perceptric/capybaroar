"use client";

import { useState, useTransition } from "react";
import { Button, ErrorNote, Row, Rows } from "./ui";
import { Loader } from "./Loader";
import { Logo } from "./Logo";
import { ChannelFace, NetworkLogo } from "./NetworkLogo";
import { networkOf, type NetworkId } from "@/lib/networks";
import { finishLink, startLink } from "@/app/connect/actions";

// The connect link pages (a partner's customer, signed out): claim the link, connect accounts, done.

function Shell({ title, line, children }: { title: string; line?: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-shell px-4 py-10">
      <div className="w-full max-w-[400px] rounded-2xl bg-panel p-7 shadow-hover">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-9 w-auto" />
          <h1 className="mt-6 text-[22px] leading-[1.15] font-medium tracking-[-0.025em] text-balance">{title}</h1>
          {line ? <p className="mt-2 text-[13px] text-muted">{line}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

/** A link that can't be used: expired, closed, used in another browser or unknown. */
export function LinkMessage({ title, line }: { title: string; line: string }) {
  return <Shell title={title} line={line} />;
}

/** The first screen: one button that claims the link for this browser. */
export function StartCard({ token, brand }: { token: string; brand: string }) {
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  return (
    <Shell title="Connect your social accounts" line={`For ${brand}. No account needed.`}>
      <ErrorNote message={error} className="mt-6" />
      <div className="mt-6 flex flex-col [&>*]:w-full">
        <Button
          disabled={busy}
          onClick={() =>
            start(async () => {
              const r = await startLink(token);
              if (r?.error) setError(r.error);
            })
          }
        >
          {busy ? <Loader /> : null}
          Start
        </Button>
      </div>
    </Shell>
  );
}

type Channel = { id: string; name: string; avatar: string | null; network: NetworkId };

/** Pick a network to sign in to; what's connected so far; Done closes the link. */
export function ConnectCard({ brand, channels, networks, error }: { brand: string; channels: Channel[]; networks: NetworkId[]; error: string | null }) {
  const [busy, start] = useTransition();
  return (
    <Shell title="Connect your social accounts" line={brand}>
      <ErrorNote message={error ?? ""} className="mt-6" />
      {channels.length ? (
        <Rows label="Connected" className="mt-6">
          {channels.map((c) => (
            <Row key={c.id} lead={<ChannelFace channel={c} size={28} />} title={c.name} sub={networkOf(c.network).name} />
          ))}
        </Rows>
      ) : null}
      <div className="mt-6 flex flex-col gap-2 [&>*]:w-full">
        {/* A full page load: the server sends the browser on to the network's sign-in. */}
        {networks.map((n) => (
          <Button key={n} variant="ghost" disabled={busy} onClick={() => window.location.assign(new URL(`/api/connect/${n}`, window.location.origin))}>
            <NetworkLogo id={n} /> {networkOf(n).name}
          </Button>
        ))}
        {channels.length ? (
          <Button disabled={busy} onClick={() => start(() => finishLink())}>
            {busy ? <Loader /> : null}
            Done
          </Button>
        ) : null}
      </div>
    </Shell>
  );
}
