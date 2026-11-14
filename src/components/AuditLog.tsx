"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Badge, Button, Empty, ErrorNote, LinkButton, Loading, PaneHead, Panel, useLoad } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { fmtParts } from "@/lib/format";
import { AUDIT_GROUPS, AUDIT_PERIODS, NO_FILTER, type AuditFilter } from "@/lib/auditLogRules";
import type { AuditItem } from "@/lib/auditLog";
import { loadAudit } from "@/app/(app)/settings/audit-actions";

/** Who did what in the workspace, newest first, 50 at a time, for owners and admins. `people`: the members, for the
 *  person filter and to show names. */
export function AuditLog({ timezone, people }: { timezone: string; people: { userId: string; name: string; email: string }[] }) {
  const [filter, setFilter] = useState<AuditFilter>(NO_FILTER);
  const key = JSON.stringify(filter);
  const first = useLoad(async () => {
    const r = await loadAudit(filter, null);
    if (r.error) throw new Error(r.error);
    return { key, rows: r.rows ?? [], next: r.next ?? null };
  }, key);
  // Pages after the first, for this filter only.
  const [extra, setExtra] = useState<{ key: string; rows: AuditItem[]; next: string | null } | null>(null);
  const [more, setMore] = useState(false);
  const [moreError, setMoreError] = useState("");

  const loaded = first.data?.key === key ? first.data : null;
  const later = extra?.key === key ? extra : null;
  const seen = new Set(loaded?.rows.map((r) => r.id));
  const rows = loaded ? [...loaded.rows, ...(later?.rows ?? []).filter((r) => !seen.has(r.id))] : null;
  const next = later ? later.next : (loaded?.next ?? null);
  const error = first.error || moreError;

  const loadMore = async () => {
    if (!next || more) return;
    const at = key;
    setMore(true);
    setMoreError("");
    try {
      const r = await loadAudit(filter, next);
      if (r.error) setMoreError(r.error);
      else setExtra((cur) => ({ key: at, rows: [...(cur?.key === at ? cur.rows : []), ...(r.rows ?? [])], next: r.next ?? null }));
    } catch {
      setMoreError("Couldn't load more. Try again.");
    } finally {
      setMore(false);
    }
  };

  const csvHref = `/api/audit/export?${new URLSearchParams({ group: filter.group, period: filter.period, ...(filter.actorId ? { person: filter.actorId } : {}) })}`;

  const byId = new Map(people.map((p) => [p.userId, p]));
  const who = (r: AuditItem) => (r.actorId && byId.get(r.actorId)?.name) || r.actorLabel || (r.actorKind === "system" ? "Capybaroar" : r.actorKind === "review_link" ? "Review link" : "Someone");
  const filtered = filter.group !== "all" || filter.period !== "all" || !!filter.actorId;

  return (
    <>
      <PaneHead title="Audit log" line="Who changed what in this workspace">
        {rows?.length ? (
          <LinkButton href={csvHref} external variant="ghost" size="sm">
            <Download size={14} /> Download CSV
          </LinkButton>
        ) : null}
      </PaneHead>
      <div className="flex flex-wrap items-center gap-2">
        <Select size="sm" lead="Action" ariaLabel="Action" className="w-auto" value={filter.group} onChange={(v) => setFilter({ ...filter, group: v })} options={AUDIT_GROUPS.map((g) => ({ value: g.value, label: g.label }))} />
        <Select
          size="sm"
          lead="Person"
          ariaLabel="Person"
          className="w-auto"
          value={filter.actorId ?? ""}
          onChange={(v) => setFilter({ ...filter, actorId: v || null })}
          options={[{ value: "", label: "Everyone" }, ...people.map((p) => ({ value: p.userId, label: p.name === p.email ? p.email : `${p.name} (${p.email})` }))]}
        />
        <Select size="sm" lead="Time" ariaLabel="Time" className="w-auto" value={filter.period} onChange={(v) => setFilter({ ...filter, period: v })} options={AUDIT_PERIODS.map((p) => ({ value: p.value, label: p.label }))} />
      </div>
      <ErrorNote message={error} />
      {rows === null ? (
        first.error ? null : <Loading shape="table" />
      ) : !rows.length ? (
        <Panel>
          <Empty compact title={filtered ? "No matches" : "No events yet"} />
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className={HEAD}>
                  <th className={TH}>Time</th>
                  <th className={TH}>Who</th>
                  <th className={TH}>Action</th>
                  <th className={TH}>Target</th>
                  <th className={TH}>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line align-top last:border-b-0 hover:bg-hover">
                    <td className={`${TD} whitespace-nowrap text-muted tabular-nums`}>{fmtParts(r.at, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: timezone })}</td>
                    <td className={TD}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="min-w-0 wrap-anywhere">{who(r)}</span>
                        {r.actorKind === "api" ? <Badge>API</Badge> : r.actorKind === "app" ? <Badge>App</Badge> : null}
                      </div>
                    </td>
                    <td className={`${TD} wrap-break-word`}>{r.actionLabel}</td>
                    <td className={`${TD} wrap-anywhere`}>{r.targetLabel ?? ""}</td>
                    <td className={`${TD} wrap-anywhere text-muted`}>{r.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {next ? (
            <div className="flex justify-center border-t border-line px-4 py-2.5">
              <Button variant="plain" size="sm" onClick={loadMore} disabled={more}>
                {more ? <Loader /> : null}
                Load more
              </Button>
            </div>
          ) : null}
        </Panel>
      )}
    </>
  );
}

const HEAD = "border-b border-line text-left text-[12px] text-muted";
const TH = "h-10 px-4 font-medium whitespace-nowrap";
const TD = "px-4 py-2.5";
