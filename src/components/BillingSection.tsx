"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Badge, Button, CardHead, Input, LinkButton, PaneHead, Panel, Row, Rows, Segmented, StatCards, Switch } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { tell } from "./Dialogs";
import { fmtDate, fmtNum } from "@/lib/format";
import { saveAutoTopUp, saveBrandLimit } from "@/app/(app)/settings/actions";

type PlanId = "free" | "creator" | "pro" | "agency";

export type PlanCard = { id: PlanId; name: string; price: number; yearly: number; members: number; brands: number | null; channels: number; postsPerMonth: number | null; ai: boolean; aiCredits: number; approvals: boolean; brandLimits: boolean; reports: boolean; whiteLabel: boolean; bioBadgeOff: boolean };

export type BillingInfo = {
  plan: PlanId;
  effective: PlanId;
  status: string | null;
  interval: "month" | "year" | null;
  trialDays: number;
  periodEnd: string | null;
  paying: boolean;
  ready: boolean;
  canManage: boolean;
  plans: PlanCard[];
  usage: { channels: number; posts: number; members: number; brands: number };
  credits: { planTotal: number; planLeft: number; bought: number; left: number; refillAt: string | null } | null;
  packs: { credits: number; price: number }[];
  autoTopUp: { pack: number | null; max: number };
  brandLimits: { id: string; name: string; limit: number | null; used: number }[] | null;
  history: { key: string; at: string; what: string; model: string | null; person: string | null; credits: number }[];
};

const limit = (n: number | null) => (n == null ? "Unlimited" : fmtNum(n));
const ORDER: PlanId[] = ["free", "creator", "pro", "agency"];

async function go(path: string, body?: object) {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (data.url) window.location.assign(data.url);
  else await tell(data.error ?? "Something went wrong");
}

export function BillingSection({ info }: { info: BillingInfo }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [interval, setBillingInterval] = useState<"month" | "year">(info.interval ?? "month");
  const cur = info.plans.find((p) => p.id === info.effective)!;
  const run = async (key: string, path: string, body?: object) => {
    setBusy(key);
    try {
      await go(path, body);
    } finally {
      setBusy(null);
    }
  };
  const usage = [
    { label: "Brands", used: info.usage.brands, max: cur.brands },
    { label: "Channels", used: info.usage.channels, max: cur.channels as number | null },
    { label: "Posts this month", used: info.usage.posts, max: cur.postsPerMonth },
    { label: "Members", used: info.usage.members, max: cur.members as number | null },
  ];
  const paid = info.effective !== "free" && info.plan !== "free";
  return (
    <>
      <PaneHead title="Billing" line="Your plan, credits and what this workspace uses">
        {info.ready && info.canManage && info.paying ? (
          <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => run("portal", "/api/stripe/portal")}>
            {busy === "portal" ? <Loader /> : null}
            Manage billing
          </Button>
        ) : null}
      </PaneHead>
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="font-medium">{cur.name}</span>
        {info.paying && info.interval ? <Badge>{info.interval === "year" ? "Yearly" : "Monthly"}</Badge> : null}
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

      {info.credits && cur.ai ? <Credits info={info} paid={paid} busy={busy} run={run} /> : null}
      {info.brandLimits ? <BrandLimits brands={info.brandLimits} /> : null}

      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em]">Plans</h3>
        <Segmented
          size="sm"
          label="Billing period"
          value={interval}
          onChange={setBillingInterval}
          options={[
            { value: "month", label: "Monthly" },
            { value: "year", label: "Yearly" },
          ]}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {info.plans.map((p) => {
          const current = p.id === info.plan && (info.paying || p.id === "free");
          const higher = ORDER.indexOf(p.id) > ORDER.indexOf(info.plan);
          const primary = !info.paying && p.id === "pro";
          const price = interval === "year" ? p.yearly : p.price;
          return (
            <div key={p.id} className={`flex flex-col gap-3 rounded-lg bg-panel p-5 ${current ? "shadow-hover" : "shadow-card"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold tracking-[-0.01em]">{p.name}</span>
                {current ? <Badge>Current</Badge> : null}
              </div>
              <div className="text-[26px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                ${fmtNum(price)}
                <span className="text-[12px] font-normal tracking-normal text-muted"> / {interval === "year" ? "year" : "month"}</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-[12.5px] text-muted">
                <li>
                  {limit(p.members)} {p.members === 1 ? "member" : "members"}
                </li>
                <li>{p.brands == null ? "Unlimited brands" : `${fmtNum(p.brands)} ${p.brands === 1 ? "brand" : "brands"}`}</li>
                <li>{limit(p.channels)} channels</li>
                <li>{p.postsPerMonth == null ? "Unlimited posts" : `${fmtNum(p.postsPerMonth)} posts a month`}</li>
                <li>{p.ai ? `${fmtNum(p.aiCredits)} credits a month` : "No AI"}</li>
                {p.approvals ? <li>Approvals</li> : null}
                {p.brandLimits ? <li>Credit limits for each brand</li> : null}
                <li>{p.whiteLabel ? "Reports with your logo" : p.reports ? "Reports" : "No reports"}</li>
                <li>{p.bioBadgeOff ? "Link in bio without our badge" : "Link in bio"}</li>
              </ul>
              {info.ready && info.canManage && p.id !== "free" && !current && !info.paying && higher ? (
                <Button variant={primary ? "primary" : "ghost"} className="mt-auto w-full" disabled={!!busy} onClick={() => run(p.id, "/api/stripe/checkout", { plan: p.id, interval })}>
                  {busy === p.id ? <Loader /> : null}
                  Upgrade
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>

      {info.history.length ? (
        <Panel>
          <CardHead label="Credit history">
            <LinkButton href="/api/credits/usage" variant="ghost" size="sm" aria-label="Download CSV">
              <Download size={14} />
              CSV
            </LinkButton>
          </CardHead>
          <div className="divide-y divide-line">
            {info.history.map((h) => (
              <Row key={h.key} title={h.what} sub={[fmtDate(h.at, { year: true }), h.model, h.person].filter(Boolean).join(", ")}>
                <span className={`text-[13px] tabular-nums ${h.credits > 0 ? "text-success" : "text-body"}`}>
                  {h.credits > 0 ? "+" : ""}
                  {fmtNum(h.credits)}
                </span>
              </Row>
            ))}
          </div>
        </Panel>
      ) : null}
    </>
  );
}

function Credits({ info, paid, busy, run }: { info: BillingInfo; paid: boolean; busy: string | null; run: (key: string, path: string, body?: object) => Promise<void> }) {
  const c = info.credits!;
  const router = useRouter();
  const [auto, setAuto] = useState(info.autoTopUp);
  const [saving, setSaving] = useState(false);
  const save = async (next: { pack: number | null; max: number }) => {
    const before = auto;
    setAuto(next);
    setSaving(true);
    const r = await saveAutoTopUp(next.pack, next.max);
    setSaving(false);
    if (r.error) {
      setAuto(before);
      await tell(r.error);
    } else router.refresh();
  };
  const buy = paid && info.ready && info.canManage;
  return (
    <>
      <StatCards
        cards={[
          { label: "Credits left", value: fmtNum(c.left), tone: c.left <= 0 ? ("red" as const) : undefined, note: "" },
          { label: "Plan credits", value: fmtNum(c.planLeft), note: c.refillAt ? `of ${fmtNum(c.planTotal)}, refills ${fmtDate(c.refillAt)}` : `of ${fmtNum(c.planTotal)}` },
          { label: "Bought credits", value: fmtNum(c.bought), note: "" },
        ]}
      />
      {buy ? (
        <Panel>
          <CardHead label="Buy credits" />
          <div className="flex flex-wrap gap-2 px-4 py-3">
            {info.packs.map((p) => (
              <Button key={p.credits} variant="ghost" size="sm" disabled={!!busy} onClick={() => run(`pack${p.credits}`, "/api/stripe/credits", { credits: p.credits })}>
                {busy === `pack${p.credits}` ? <Loader /> : null}
                {fmtNum(p.credits)} for ${fmtNum(p.price)}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
            <Switch on={auto.pack != null} label="Automatic top-up" disabled={saving} onChange={(on) => save({ ...auto, pack: on ? (auto.pack ?? info.packs[0].credits) : null })} />
            <span className="text-[13px]">Automatic top-up</span>
            {auto.pack != null ? (
              <>
                <Select size="sm" ariaLabel="Pack" disabled={saving} value={auto.pack} onChange={(v) => save({ ...auto, pack: v })} options={info.packs.map((p) => ({ value: p.credits, label: `${fmtNum(p.credits)} for $${fmtNum(p.price)}` }))} />
                <Select
                  size="sm"
                  ariaLabel="Most a month"
                  lead="Most a month"
                  disabled={saving}
                  value={auto.max}
                  onChange={(v) => save({ ...auto, max: v })}
                  options={Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
                />
              </>
            ) : null}
            {saving ? <Loader /> : null}
          </div>
        </Panel>
      ) : null}
    </>
  );
}

function BrandLimits({ brands }: { brands: { id: string; name: string; limit: number | null; used: number }[] }) {
  return (
    <Rows label="Brand credit limits">
      {brands.map((b) => (
        <BrandLimit key={b.id} brand={b} />
      ))}
    </Rows>
  );
}

function BrandLimit({ brand }: { brand: { id: string; name: string; limit: number | null; used: number } }) {
  const router = useRouter();
  const [value, setValue] = useState(brand.limit == null ? "" : String(brand.limit));
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const t = value.trim();
    const next = t === "" ? null : Number(t);
    if (next === brand.limit) return;
    if (next != null && (!Number.isInteger(next) || next < 0)) {
      await tell("Enter a whole number of credits");
      return;
    }
    setSaving(true);
    const r = await saveBrandLimit(brand.id, next);
    setSaving(false);
    if (r.error) await tell(r.error);
    else router.refresh();
  };
  return (
    <Row title={brand.name} sub={`${fmtNum(brand.used)} used this month`}>
      {saving ? <Loader /> : null}
      <Input aria-label={`Credit limit for ${brand.name}`} inputMode="numeric" placeholder="No limit" className="w-32" value={value} onChange={(e) => setValue(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} />
    </Row>
  );
}
