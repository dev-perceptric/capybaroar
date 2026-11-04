"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { Badge, Button, Checkbox, CopyButton, Dot, Field, IconButton, IconLink, Input, Page, Row, Rows, Segmented, TextArea } from "./ui";
import { Modal } from "./Overlay";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { ToolIntro } from "./ToolIntro";
import { askConfirm, tell } from "./Dialogs";
import type { Brand } from "@/lib/brands";
import type { Report, ReportInput } from "@/lib/reports";
import { RANGES, SCHEDULES, SECTIONS, type SectionKey } from "@/lib/reportTimes";
import { fmtDate } from "@/lib/format";
import { removeReport, saveReportAction, sendNow } from "@/app/(app)/reports/actions";

type Image = { id: string; name: string; thumb: string };
type Props = { reports: Report[]; brands: Brand[]; brand: string | null; allBrands: boolean; whiteLabel: boolean; images: Image[] };

const DEFAULT_SECTIONS: SectionKey[] = ["summary", "growth", "top", "best", "formats", "channels"];
const ALL = "all";

export function ReportsView({ reports, brands, brand, allBrands, whiteLabel, images }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Report | "new" | null>(null);
  const [busy, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string }>, failTitle: string) =>
    start(async () => {
      const r = await fn();
      if (r.error) await tell(failTitle, r.error);
      router.refresh();
    });
  const del = async (r: Report) => {
    if (await askConfirm(`Delete ${r.name}?`, { body: "Its link stops working.", ok: "Delete", danger: true })) run(() => removeReport(r.id), "Couldn't delete the report");
  };
  const brandOf = (id: string | null) => brands.find((b) => b.id === id) ?? null;
  const add = (
    <Button onClick={() => setEditing("new")}>
      <Plus /> New report
    </Button>
  );
  return (
    <Page icon={<FileText />} title="Reports" count={reports.length || undefined} actions={reports.length ? add : undefined}>
      {reports.length ? (
        <Rows className="mx-auto w-full max-w-[960px]" label="Reports">
          {reports.map((r) => {
            const b = brandOf(r.brandId);
            return (
              <Row
                key={r.id}
                lead={<span className="flex size-4 items-center justify-center">{b ? <Dot tone={b.color} /> : <span className="size-2 rounded-full border border-line-strong" />}</span>}
                title={r.name}
                sub={
                  <span className="block truncate">
                    {b?.name ?? "All brands"}, {RANGES.find((x) => x.value === r.range)?.label.toLowerCase()}
                    {r.lastSentAt ? `, sent ${fmtDate(r.lastSentAt)}` : ""}
                  </span>
                }
              >
                {r.schedule !== "none" ? <Badge>{r.schedule === "weekly" ? "Mondays, 9 AM" : "1st of the month, 9 AM"}</Badge> : null}
                <span className="flex items-center">
                  {r.url ? (
                    <>
                      <IconLink href={r.url} label="Open">
                        <ExternalLink />
                      </IconLink>
                      <CopyButton text={r.url} label="Copy link" />
                    </>
                  ) : null}
                  <IconButton label="Send now" disabled={busy || !r.sendTo.length} onClick={() => run(() => sendNow(r.id), "Couldn't send the report")}>
                    <Send />
                  </IconButton>
                  <IconButton label="Edit" disabled={busy} onClick={() => setEditing(r)}>
                    <Pencil />
                  </IconButton>
                  <IconButton label="Delete" align="end" disabled={busy} onClick={() => del(r)}>
                    <Trash2 />
                  </IconButton>
                </span>
              </Row>
            );
          })}
        </Rows>
      ) : (
        <ToolIntro drawing="dashboards" title="Make your first report" lead="A brand's results as a link to share or a PDF, emailed every week or month if you like." action={add} />
      )}
      {editing ? (
        <ReportDialog
          report={editing === "new" ? null : editing}
          brands={brands}
          brand={brand}
          allBrands={allBrands}
          whiteLabel={whiteLabel}
          images={images}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Page>
  );
}

function ReportDialog({ report, brands, brand, allBrands, whiteLabel, images, onClose }: Omit<Props, "reports"> & { report: Report | null; onClose: () => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ReportInput>(
    report ?? { name: "", brandId: allBrands ? null : brand, range: "30", sections: DEFAULT_SECTIONS, notes: "", schedule: "none", sendTo: [], logoMediaId: null, accent: null },
  );
  const [sendTo, setSendTo] = useState((report?.sendTo ?? []).join(", "));
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const set = <K extends keyof ReportInput>(k: K, v: ReportInput[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const toggle = (k: SectionKey, on: boolean) => set("sections", on ? [...new Set([...draft.sections, k])] : draft.sections.filter((x) => x !== k));
  const save = () =>
    start(async () => {
      setError("");
      const r = await saveReportAction(report?.id ?? null, { ...draft, sendTo: sendTo.split(/[\s,;]+/).filter(Boolean) });
      if (r.error) return setError(r.error);
      router.refresh();
      onClose();
    });
  const accent = draft.accent?.trim() ?? "";
  return (
    <Modal
      wide
      title={report ? "Edit report" : "New report"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="plain" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="report-form" disabled={busy || !draft.name.trim() || !draft.sections.length}>
            {busy ? <Loader /> : null}
            Save
          </Button>
        </>
      }
    >
      <form
        id="report-form"
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Name">
          <Input autoFocus value={draft.name} maxLength={80} onChange={(e) => set("name", e.target.value)} placeholder="Monthly results" />
        </Field>
        {allBrands ? (
          <Field label="Brand">
            <Select
              ariaLabel="Brand"
              value={draft.brandId ?? ALL}
              onChange={(v) => set("brandId", v === ALL ? null : v)}
              options={[{ value: ALL, label: "All brands" }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
            />
          </Field>
        ) : null}
        <Field label="Range">
          <div>
            <Segmented label="Range" value={draft.range} onChange={(v) => set("range", v)} options={RANGES} />
          </div>
        </Field>
        <Field label="Sections">
          <div className="grid gap-x-3 rounded-lg bg-paper px-1 py-1 shadow-track sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <label key={s.key} className="flex h-9 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-[13px] hover:bg-hover">
                <Checkbox checked={draft.sections.includes(s.key)} onChange={(on) => toggle(s.key, on)} />
                {s.label}
              </label>
            ))}
          </div>
        </Field>
        {draft.sections.includes("notes") ? (
          <Field label="Notes">
            <TextArea rows={4} maxLength={5000} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        ) : null}
        <Field label="Email">
          <div>
            <Segmented label="Email" value={draft.schedule} onChange={(v) => set("schedule", v)} options={SCHEDULES} />
          </div>
        </Field>
        <Field label="Send to">
          <Input value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="name@client.com, other@client.com" autoComplete="off" />
        </Field>
        {whiteLabel ? (
          <>
            <Field label="Logo">
              <div className="flex flex-wrap gap-2">
                <LogoChoice on={!draft.logoMediaId} label="No logo" onClick={() => set("logoMediaId", null)}>
                  <span className="text-[11px] text-muted">None</span>
                </LogoChoice>
                {images.map((m) => (
                  <LogoChoice key={m.id} on={draft.logoMediaId === m.id} label={m.name} onClick={() => set("logoMediaId", m.id)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.thumb} alt="" className="size-full object-contain" />
                  </LogoChoice>
                ))}
              </div>
            </Field>
            <Field label="Color">
              <div className="flex items-center gap-2">
                <span className="size-9 shrink-0 rounded-md bg-paper shadow-input" style={/^#[0-9a-fA-F]{6}$/.test(accent) ? { background: accent } : undefined} />
                <Input value={draft.accent ?? ""} maxLength={7} onChange={(e) => set("accent", e.target.value || null)} placeholder="#1F6FEB" aria-label="Color" className="max-w-40" />
              </div>
            </Field>
          </>
        ) : null}
        {error ? <p className="text-[12px] text-danger">{error}</p> : null}
      </form>
    </Modal>
  );
}

function LogoChoice({ on, label, onClick, children }: { on: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={on}
      onClick={onClick}
      className={`flex size-14 items-center justify-center overflow-hidden rounded-lg bg-panel p-1 transition-shadow ${on ? "shadow-focus" : "shadow-chip hover:shadow-pill"}`}
    >
      {children}
    </button>
  );
}
