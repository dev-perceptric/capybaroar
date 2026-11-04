"use client";

import { useState } from "react";
import { Badge, Button, PaneHead, StatCards } from "./ui";
import { Loader } from "./Loader";
import { tell } from "./Dialogs";
import { fmtDate, fmtNum } from "@/lib/format";

export type PlanCard = { id: "free" | "pro" | "agency"; name: string; price: number; members: number; brands: number | null; channels: number; postsPerMonth: number | null; agent: boolean; reports: boolean; whiteLabel: boolean; bioBadgeOff: boolean };

export type BillingInfo = {
  plan: PlanCard["id"];
  effective: PlanCard["id"];
  status: string | null;
  trialDays: number;
  periodEnd: string | null;
  paying: boolean;
  ready: boolean;
  canManage: boolean;
  plans: PlanCard[];
  usage: { channels: number; posts: number; members: number; brands: number };
};

const limit = (n: number | null) => (n == null ? "Unlimited" : fmtNum(n));

async function go(path: string, body?: object) {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (data.url) window.location.assign(data.url);
  else await tell(data.error ?? "Something went wrong");
}

export function BillingSection({ info }: { info: BillingInfo }) {
  const [busy, setBusy] = useState<string | null>(null);
  const cur = info.plans.find((p) => p.id === info.effective)!;
  const run = async (key: string, path: string, body?: object) => {
    setBusy(key);
    try {
      await go(path, body);
    } finally {
      setBusy(null);
    }
  };
  const order = ["free", "pro", "agency"];
  const usage = [
    { label: "Brands", used: info.usage.brands, max: cur.brands },
    { label: "Channels", used: info.usage.channels, max: cur.channels as number | null },
    { label: "Posts this month", used: info.usage.posts, max: cur.postsPerMonth },
    { label: "Members", used: info.usage.members, max: cur.members as number | null },
  ];
  return (
    <>
      <PaneHead title="Billing" line="Your plan and what this workspace uses">
        {info.ready && info.canManage && info.paying ? (
          <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => run("portal", "/api/stripe/portal")}>
            {busy === "portal" ? <Loader /> : null}
            Manage billing
          </Button>
        ) : null}
      </PaneHead>
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="font-medium">{cur.name}</span>
        {info.trialDays > 0 ? <Badge tone="yellow">Trial, {info.trialDays} {info.trialDays === 1 ? "day" : "days"} left</Badge> : null}
        {info.status === "past_due" ? <Badge tone="red">Payment due</Badge> : null}
        {info.paying && info.periodEnd ? <span className="text-muted">Renews {fmtDate(info.periodEnd, { year: true })}</span> : null}
      </div>
      <StatCards
        cards={usage.map((u) => ({
          label: u.label,
          value: fmtNum(u.used),
          note: `of ${limit(u.max)}`,
          tone: u.max != null && u.used >= u.max ? ("red" as const) : undefined,
        }))}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {info.plans.map((p) => {
          const current = p.id === info.plan && (info.paying || p.id === "free");
          const higher = order.indexOf(p.id) > order.indexOf(info.plan);
          const primary = !info.paying && p.id === "pro";
          return (
            <div key={p.id} className={`flex flex-col gap-3 rounded-lg bg-panel p-5 ${current ? "shadow-hover" : "shadow-card"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold tracking-[-0.01em]">{p.name}</span>
                {current ? <Badge>Current</Badge> : null}
              </div>
              <div className="text-[26px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                ${p.price}
                <span className="text-[12px] font-normal tracking-normal text-muted"> / month</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-[12.5px] text-muted">
                <li>{limit(p.members)} {p.members === 1 ? "member" : "members"}</li>
                <li>{p.brands == null ? "Unlimited brands" : `${fmtNum(p.brands)} ${p.brands === 1 ? "brand" : "brands"}`}</li>
                <li>{limit(p.channels)} channels</li>
                <li>{p.postsPerMonth == null ? "Unlimited posts" : `${fmtNum(p.postsPerMonth)} posts a month`}</li>
                <li>{p.agent ? "Agent" : "No agent"}</li>
                <li>{p.whiteLabel ? "White-label reports" : p.reports ? "Reports" : "No reports"}</li>
                <li>{p.bioBadgeOff ? "Link in bio without our badge" : "Link in bio"}</li>
              </ul>
              {info.ready && info.canManage && p.id !== "free" && !current && !info.paying && higher ? (
                <Button variant={primary ? "primary" : "ghost"} className="mt-auto w-full" disabled={!!busy} onClick={() => run(p.id, "/api/stripe/checkout", { plan: p.id })}>
                  {busy === p.id ? <Loader /> : null}
                  Upgrade
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
