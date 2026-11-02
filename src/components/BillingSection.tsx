"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Button } from "./ui";
import { Loader } from "./Loader";
import { tell } from "./Dialogs";
import { fmtDate, fmtNum } from "@/lib/format";

export type PlanCard = { id: "free" | "pro" | "agency"; name: string; price: number; members: number; brands: number | null; channels: number; postsPerMonth: number | null; agent: boolean };

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
  const ref = useRef<HTMLElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "billing") ref.current?.scrollIntoView({ block: "start" });
  }, []);
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
  return (
    <section ref={ref} id="billing" className="mt-10 flex scroll-mt-6 flex-col gap-4 border-t border-line pt-8">
      <div>
        <h2 className="text-[15px] font-medium">Billing</h2>
        <p className="text-[12px] text-muted">Your plan and what this workspace uses</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="font-medium">{cur.name}</span>
        {info.trialDays > 0 ? <Badge tone="yellow">Trial, {info.trialDays} {info.trialDays === 1 ? "day" : "days"} left</Badge> : null}
        {info.status === "past_due" ? <Badge tone="red">Payment due</Badge> : null}
        {info.paying && info.periodEnd ? <span className="text-muted">Renews {fmtDate(info.periodEnd, { year: true })}</span> : null}
      </div>
      <div className="grid grid-cols-2 border border-frame sm:grid-cols-4">
        {[
          { label: "Brands", used: info.usage.brands, max: cur.brands },
          { label: "Channels", used: info.usage.channels, max: cur.channels as number | null },
          { label: "Posts this month", used: info.usage.posts, max: cur.postsPerMonth },
          { label: "Members", used: info.usage.members, max: cur.members as number | null },
        ].map((u, i) => (
          <div key={u.label} className={`flex flex-col gap-1 p-3 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}>
            <span className="text-[12px] text-muted">{u.label}</span>
            <span className={`text-[15px] font-medium ${u.max != null && u.used >= u.max ? "text-danger" : ""}`}>
              {fmtNum(u.used)} <span className="text-muted">/ {limit(u.max)}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="grid gap-0 border-t border-l border-frame sm:grid-cols-3">
        {info.plans.map((p) => {
          const current = p.id === info.plan && (info.paying || p.id === "free");
          const higher = order.indexOf(p.id) > order.indexOf(info.plan);
          const primary = !info.paying && p.id === "pro";
          return (
            <div key={p.id} className="flex flex-col gap-3 border-r border-b border-frame p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium">{p.name}</span>
                {current ? <Badge>Current</Badge> : null}
              </div>
              <div className="text-[22px] font-semibold">
                ${p.price}
                <span className="text-[12px] font-normal text-muted"> / month</span>
              </div>
              <ul className="flex flex-col gap-1 text-[12px] text-muted">
                <li>{limit(p.members)} {p.members === 1 ? "member" : "members"}</li>
                <li>{p.brands == null ? "Unlimited brands" : `${fmtNum(p.brands)} ${p.brands === 1 ? "brand" : "brands"}`}</li>
                <li>{limit(p.channels)} channels</li>
                <li>{p.postsPerMonth == null ? "Unlimited posts" : `${fmtNum(p.postsPerMonth)} posts a month`}</li>
                <li>{p.agent ? "Agent" : "No agent"}</li>
              </ul>
              {info.ready && info.canManage && p.id !== "free" && !current && !info.paying && higher ? (
                <Button variant={primary ? "primary" : "ghost"} className="mt-auto" disabled={!!busy} onClick={() => run(p.id, "/api/stripe/checkout", { plan: p.id })}>
                  {busy === p.id ? <Loader /> : null}
                  Upgrade
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
      {info.ready && info.canManage && info.paying ? (
        <div>
          <Button variant="ghost" disabled={!!busy} onClick={() => run("portal", "/api/stripe/portal")}>
            {busy === "portal" ? <Loader /> : null}
            Manage billing
          </Button>
        </div>
      ) : null}
    </section>
  );
}
