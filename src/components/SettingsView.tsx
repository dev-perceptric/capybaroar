"use client";

import { useState, useTransition } from "react";
import { Button, Field, Input } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { saveWorkspace } from "@/app/(app)/settings/actions";

const zones = () => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"]);

export function SettingsView({ name, timezone }: { name: string; timezone: string }) {
  const [n, setN] = useState(name);
  const [tz, setTz] = useState(timezone);
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  const save = () =>
    start(async () => {
      const r = await saveWorkspace(n, tz);
      setMsg(r.error ?? "Saved");
    });
  return (
    <div className="mx-auto w-full max-w-[640px]">
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-[15px] font-medium">Workspace</h2>
          <p className="text-[12px] text-muted">The name and time zone of this workspace</p>
        </div>
        <Field label="Name">
          <Input value={n} onChange={(e) => setN(e.target.value)} />
        </Field>
        <Field label="Time zone">
          <Select value={tz} onChange={setTz} options={[...new Set([tz, ...zones()])].map((z) => ({ value: z, label: z.replace(/_/g, " ") }))} />
        </Field>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader /> : null}
            Save
          </Button>
          {msg ? <span className={`text-[12px] ${msg === "Saved" ? "text-success" : "text-danger"}`}>{msg}</span> : null}
        </div>
      </section>
    </div>
  );
}
