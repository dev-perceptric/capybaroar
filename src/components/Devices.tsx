"use client";

import { useState, useTransition } from "react";
import { Badge, Button, CardHead, ErrorNote, Loading, Panel, Row, timeAgo, useLoad } from "./ui";
import { askConfirm } from "./Dialogs";
import { forgetDevice, loadDevices, signOutOthers } from "@/app/devices/actions";

// Settings › Your account: where this person is signed in (044_login_devices.sql), with Sign out other devices and a
// way to forget one. Rows come from sign-ins since the list started; the first device never sent an alert.
export function Devices() {
  const list = useLoad(loadDevices, "devices");
  const [busy, start] = useTransition();
  const [error, setError] = useState("");
  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      setError("");
      const r = await fn().catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }));
      if (r.error) setError(r.error);
      list.reload();
    });
  const rows = list.data;
  return (
    <Panel className="overflow-hidden">
      <CardHead label="Signed-in devices">
        <Button
          size="sm"
          variant="ghost"
          disabled={busy || !rows}
          onClick={async () => {
            if (await askConfirm("Sign out other devices?", { body: "Every device but this one is signed out.", ok: "Sign out" })) run(signOutOthers);
          }}
        >
          Sign out other devices
        </Button>
      </CardHead>
      {list.error ? <div className="px-4 py-3"><ErrorNote message={list.error} /></div> : null}
      {!rows ? (
        list.error ? null : <Loading />
      ) : rows.length === 0 ? (
        <p className="px-4 py-3 text-[13px] text-muted">Devices show here after your next sign-in.</p>
      ) : (
        <div className="divide-y divide-line">
          {rows.map((d) => (
            <Row key={d.id} title={d.label} sub={`Last used ${timeAgo(d.lastSeen)}`}>
              {d.current ? (
                <Badge tone="green">This device</Badge>
              ) : (
                <Button size="sm" variant="plain" disabled={busy} onClick={() => run(() => forgetDevice(d.id))}>
                  Forget
                </Button>
              )}
            </Row>
          ))}
        </div>
      )}
      {error ? <div className="px-4 py-3"><ErrorNote message={error} /></div> : null}
    </Panel>
  );
}
