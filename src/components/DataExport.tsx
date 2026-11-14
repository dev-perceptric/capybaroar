"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge, Button, CardHead, LinkButton, Panel, type Tone } from "./ui";
import { Loader } from "./Loader";
import { fmtDateTime } from "@/lib/format";
import { fmtBytes, type ExportView } from "@/lib/exportRules";
import { exportStatus, requestExport, type Exports } from "@/app/(app)/settings/export-actions";

export type DataExportProps = {
  /** This person's last "Download my data" (lastExports in src/lib/exports.ts). */
  account: ExportView | null;
  /** The workspace's last export by this person; only shown to owners. */
  workspace: ExportView | null;
  owner: boolean;
  /** Show one part only, to place them in different panes (default: both). */
  only?: "account" | "workspace";
};

const STATE: Record<ExportView["status"], { label: string; tone: Tone }> = {
  queued: { label: "Preparing", tone: "amber" },
  running: { label: "Preparing", tone: "amber" },
  ready: { label: "Ready", tone: "green" },
  failed: { label: "Didn't finish", tone: "red" },
};

const working = (v: ExportView | null) => v?.status === "queued" || v?.status === "running";

/** Settings: "Download my data" for everyone, "Export workspace" for owners. The link is also emailed. */
export function DataExport({ account, workspace, owner, only }: DataExportProps) {
  const [now, setNow] = useState<Exports>({ account, workspace });
  // New props from the server (a refresh) replace what was looked up here.
  const [given, setGiven] = useState<Exports>({ account, workspace });
  if (given.account !== account || given.workspace !== workspace) {
    setGiven({ account, workspace });
    setNow({ account, workspace });
  }
  const busy = working(now.account) || working(now.workspace);
  // While one is being made, look again every 5 seconds.
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => {
      void exportStatus().then((r) => r.exports && setNow(r.exports)).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [busy]);
  return (
    <>
      {only !== "workspace" ? <Part title="Your data" button="Download my data" kind="account" last={now.account} onChange={setNow} /> : null}
      {owner && only !== "account" ? <Part title="Workspace data" button="Export workspace" kind="workspace" last={now.workspace} onChange={setNow} /> : null}
    </>
  );
}

function Part({ title, button, kind, last, onChange }: { title: string; button: string; kind: "account" | "workspace"; last: ExportView | null; onChange: (e: Exports) => void }) {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const go = () =>
    start(async () => {
      setMsg("");
      const r = await requestExport(kind).catch(() => ({ error: "Couldn't reach the export. Try again.", exports: undefined }));
      if (r.exports) onChange(r.exports);
      setMsg(r.error ?? "");
    });
  const state = last ? STATE[last.status] : null;
  return (
    <Panel className="overflow-hidden">
      <CardHead label={title} />
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <Button variant="ghost" disabled={pending || working(last)} onClick={go}>
          {pending ? <Loader /> : null}
          {button}
        </Button>
        {last && state ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[12px] text-muted">
            <Badge tone={state.tone} dot>
              {state.label}
            </Badge>
            {last.status === "ready" ? (
              <>
                {last.size != null ? <span className="tabular-nums">{fmtBytes(last.size)}</span> : null}
                {last.expiresAt ? <span>Until {fmtDateTime(last.expiresAt)}</span> : null}
                <LinkButton href={`/api/exports/${last.id}`} variant="plain" size="sm" external>
                  Download
                </LinkButton>
              </>
            ) : (
              <span>{fmtDateTime(last.createdAt)}</span>
            )}
          </div>
        ) : null}
        {msg ? (
          <span role="alert" className="text-[12px] text-danger">
            {msg}
          </span>
        ) : null}
      </div>
    </Panel>
  );
}
