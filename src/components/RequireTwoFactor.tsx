"use client";

import { useTransition, useState } from "react";
import { ErrorNote, Loading, Panel, Row, Switch, useLoad } from "./ui";
import { loadRequireTwoFactor, setRequireTwoFactor } from "@/app/(app)/settings/mfa-actions";

/** Workspace settings: owners require two-factor sign-in for everyone in the workspace. Others see it, switched off. */
export function RequireTwoFactor() {
  const { data, error, set } = useLoad(loadRequireTwoFactor, "require-two-factor");
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  if (!data) return error ? <ErrorNote message={error} /> : <Loading />;
  const change = (on: boolean) =>
    start(async () => {
      setMsg("");
      const r = await setRequireTwoFactor(on);
      if (r.error) return setMsg(r.error);
      set({ ...data, on });
    });
  return (
    <Panel className="overflow-hidden">
      <Row title="Require two-factor sign-in">
        <Switch on={data.on} label="Require two-factor sign-in" disabled={busy || !data.owner} onChange={change} />
      </Row>
      {msg ? <ErrorNote message={msg} className="mx-4 mb-4" /> : null}
    </Panel>
  );
}
