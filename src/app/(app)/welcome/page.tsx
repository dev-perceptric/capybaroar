import Link from "next/link";
import { Check } from "lucide-react";
import { NetworkLogo } from "@/components/NetworkLogo";
import { listChannels } from "@/lib/channels";
import { getCtx } from "@/lib/session";
import { PROVIDERS, isReady } from "@/lib/providers";
import { NETWORKS } from "@/lib/networks";

const primary = "inline-flex h-8 items-center justify-center gap-1.5 border border-frame bg-yolk px-3.5 text-[12px] font-medium text-on-yolk hover:bg-yolk-hover";

export default async function WelcomePage() {
  const ctx = await getCtx();
  const channels = await listChannels(ctx.workspaceId);
  const step = channels.length ? 2 : 1;
  const ready = NETWORKS.filter((n) => isReady(PROVIDERS[n.id]));
  // Sign-in networks go straight to the network; ones that ask something first (a form, a server) open on Channels.
  const href = (id: (typeof NETWORKS)[number]["id"]) => {
    const p = PROVIDERS[id];
    return p.form || p.oauth?.asks?.length ? "/channels" : `/api/channels/${id}/connect`;
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 py-10 md:py-16">
        <ol className="grid grid-cols-2 border border-frame" aria-label="Progress">
          {["Connect a channel", "Schedule a post"].map((label, i) => {
            const done = i + 1 < step;
            const on = i + 1 === step;
            return (
              <li key={label} aria-current={on ? "step" : undefined} className={`flex h-10 items-center gap-2 px-3 text-[13px] ${i ? "border-l border-frame" : ""} ${on ? "bg-yolk font-semibold text-on-yolk" : done ? "text-ink" : "text-muted"}`}>
                <span className="flex size-5 items-center justify-center border border-frame text-[11px]">{done ? <Check size={12} /> : i + 1}</span>
                {label}
              </li>
            );
          })}
        </ol>
        {step === 1 ? (
          <section className="flex flex-col gap-5">
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight">
              Connect your first channel
              <br />
              <span className="text-muted">Pick where you post.</span>
            </h1>
            <div className="grid grid-cols-2 border-t border-l border-frame sm:grid-cols-3">
              {ready.map((n) => (
                <a key={n.id} href={href(n.id)} className="flex h-14 items-center gap-2.5 border-r border-b border-frame px-3 text-[13px] hover:bg-hover">
                  <NetworkLogo id={n.id} size={20} />
                  {n.name}
                </a>
              ))}
            </div>
            {!ready.length ? <p className="text-[13px] text-danger">No networks are set up yet</p> : null}
          </section>
        ) : (
          <section className="flex flex-col items-start gap-5">
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight">
              Schedule your first post
              <br />
              <span className="text-muted">
                {channels.length} {channels.length === 1 ? "channel" : "channels"} connected.
              </span>
            </h1>
            <Link href="/calendar?new=1" className={primary}>
              New post
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
