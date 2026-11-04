import Link from "next/link";
import { Check } from "lucide-react";
import { NetworkLogo } from "@/components/NetworkLogo";
import { listChannels } from "@/lib/channels";
import { teamCtx } from "@/lib/session";
import { getBrandCtx } from "@/lib/brands";
import { PROVIDERS, isReady } from "@/lib/providers";
import { OFFERED } from "@/lib/networks";

const primary = "inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-medium text-white shadow-primary hover:bg-brand-hover";

export default async function WelcomePage() {
  await teamCtx();
  const ctx = await getBrandCtx();
  const channels = await listChannels(ctx.workspaceId, ctx.scope);
  const step = channels.length ? 2 : 1;
  const ready = OFFERED.filter((n) => isReady(PROVIDERS[n.id]));
  // Sign-in networks go straight to the network; ones that ask something first (a form, a server) open on Channels.
  const href = (id: (typeof OFFERED)[number]["id"]) => {
    const p = PROVIDERS[id];
    return p.form || p.oauth?.asks?.length ? "/channels" : `/api/channels/${id}/connect`;
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 py-10 md:py-16">
        <ol className="grid grid-cols-2 gap-0.5 rounded-md bg-hover p-0.5" aria-label="Progress">
          {["Connect a channel", "Schedule a post"].map((label, i) => {
            const done = i + 1 < step;
            const on = i + 1 === step;
            return (
              <li key={label} aria-current={on ? "step" : undefined} className={`flex h-9 items-center gap-2 rounded-sm px-3 text-[13px] ${on ? "bg-panel font-medium text-ink shadow-chip" : done ? "text-ink" : "text-muted"}`}>
                <span className={`flex size-5 items-center justify-center rounded-full text-[11px] ${on || done ? "bg-signal text-on-signal" : "bg-panel shadow-chip"}`}>{done ? <Check size={12} /> : i + 1}</span>
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ready.map((n) => (
                <a key={n.id} href={href(n.id)} className="flex h-14 items-center gap-2.5 rounded-lg border border-frame bg-panel px-3 text-[13px] transition-shadow hover:shadow-hover">
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
