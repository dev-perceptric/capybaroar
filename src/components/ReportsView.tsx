"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, MoreHorizontal, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { Badge, Button, Checkbox, CopyButton, Dot, Field, IconButton, IconLink, Input, Page, Segmented, TextArea } from "./ui";
import { Modal } from "./Overlay";
import { Floating } from "./Floating";
import { Picture } from "./BioBlocks";
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

// The table look from Charts (TopPosts).
const HEAD = "border-b border-line text-left text-[12px] text-muted";
const TH = "h-10 px-4 font-medium";
const MENU_ROW = "flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left";

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
        <div className="mx-auto w-full max-w-[960px] overflow-x-auto rounded-lg bg-panel shadow-card">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className={HEAD}>
                <th className={TH}>Report</th>
                <th className={TH}>Brand</th>
                <th className={TH}>Range</th>
                <th className={TH}>Schedule</th>
                <th className={TH}>Last sent</th>
                <th className={`${TH} text-right`}>Recipients</th>
                <th className="h-10 w-px px-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const b = brandOf(r.brandId);
                return (
                  <tr key={r.id} className="border-b border-line last:border-b-0 hover:bg-hover">
                    <td className="max-w-[260px] px-4 py-2.5">
                      <button type="button" onClick={() => setEditing(r)} className="block max-w-full truncate text-left font-medium hover:underline hover:underline-offset-2">
                        {r.name}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        {b ? <Dot tone={b.color} /> : <span className="size-2 rounded-full border border-line-strong" />}
                        {b?.name ?? "All brands"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-body">{RANGES.find((x) => x.value === r.range)?.label}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.schedule !== "none" ? <Badge>{r.schedule === "weekly" ? "Mondays, 9 AM" : "1st of the month, 9 AM"}</Badge> : <span className="text-faint">Off</span>}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-body tabular-nums">{r.lastSentAt ? fmtDate(r.lastSentAt) : <span className="text-faint">–</span>}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{r.sendTo.length || <span className="text-faint">–</span>}</td>
                    <td className="px-2 py-1.5">
                      <span className="flex items-center justify-end">
                        {r.url ? (
                          <>
                            <IconLink href={r.url} label="Open">
                              <ExternalLink />
                            </IconLink>
                            <CopyButton text={r.url} label="Copy link" />
                          </>
                        ) : null}
                        <ReportMenu
                          name={r.name}
                          busy={busy}
                          canSend={r.sendTo.length > 0}
                          onSend={() => run(() => sendNow(r.id), "Couldn't send the report")}
                          onEdit={() => setEditing(r)}
                          onDelete={() => void del(r)}
                        />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
  const [picking, setPicking] = useState<{ title: string; onPick: (id: string) => void } | null>(null);
  return (
    <>
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
                <Picture id={draft.logoMediaId} images={images} title="Choose a logo" pick={(title, onPick) => setPicking({ title, onPick })} onChange={(id) => set("logoMediaId", id)} />
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
      {picking ? (
        <Modal title={picking.title} onClose={() => setPicking(null)} wide>
          {images.length ? (
            <div className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto p-0.5 sm:grid-cols-4">
              {images.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-label={m.name}
                  onClick={() => {
                    picking.onPick(m.id);
                    setPicking(null);
                  }}
                  className="aspect-square overflow-hidden rounded-md bg-panel p-1 shadow-chip transition-shadow hover:shadow-pill"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.thumb} alt="" loading="lazy" className="size-full object-contain" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted">Upload a picture in Media first</p>
          )}
        </Modal>
      ) : null}
    </>
  );
}

/** Send now, Edit and Delete for one report, behind a "..." button. */
function ReportMenu({ name, busy, canSend, onSend, onEdit, onDelete }: { name: string; busy: boolean; canSend: boolean; onSend: () => void; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const item = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  return (
    <span ref={anchor} className="inline-flex">
      <IconButton label={`More for ${name}`} align="end" aria-haspopup="menu" aria-expanded={open} disabled={busy} onClick={() => setOpen(!open)}>
        <MoreHorizontal />
      </IconButton>
      {open ? (
        <Floating anchor={anchor} placement="bottom-end" onClose={() => setOpen(false)} role="menu" className="min-w-44 rounded-lg bg-panel p-1.5 text-[13px] shadow-menu">
          <button type="button" role="menuitem" disabled={!canSend} onClick={item(onSend)} className={`${MENU_ROW} hover:bg-hover disabled:pointer-events-none disabled:opacity-45`}>
            <Send size={14} className="text-muted" /> Send now
          </button>
          <button type="button" role="menuitem" onClick={item(onEdit)} className={`${MENU_ROW} hover:bg-hover`}>
            <Pencil size={14} className="text-muted" /> Edit
          </button>
          <button type="button" role="menuitem" onClick={item(onDelete)} className={`${MENU_ROW} text-danger hover:bg-danger-soft`}>
            <Trash2 size={14} /> Delete
          </button>
        </Floating>
      ) : null}
    </span>
  );
}
