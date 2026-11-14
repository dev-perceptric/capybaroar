"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, CardHead, CopyButton, ErrorNote, Field, Input, Loading, Panel, Row, Rows, useLoad } from "./ui";
import { Loader } from "./Loader";
import { Select } from "./Select";
import { askText } from "./Dialogs";
import { Download } from "./Icons";
import { confirmTwoFactor, loadTwoFactor, newBackupCodes, openWorkspace, startTwoFactor, turnOffTwoFactor, type Enrollment, type TwoFactorState } from "@/app/mfa/actions";

// Two-factor sign-in with an authenticator app, for Settings (Your account) and /mfa/setup. Turning on shows the QR
// code and secret, takes the first code, then shows the 10 backup codes once. Turning off and new backup codes ask
// for a current code.

type Step = { kind: "idle" } | ({ kind: "scan" } & Enrollment) | { kind: "codes"; codes: string[] };

/**
 * `initial`: the state when the page already has it (/mfa/setup); left out, it loads itself (Settings).
 * `next`: where "Continue" goes once the backup codes are saved (/mfa/setup); left out, it stays on the page.
 */
export function TwoFactor({ initial, next }: { initial?: TwoFactorState; next?: string }) {
  const router = useRouter();
  const loaded = useLoad(loadTwoFactor, "two-factor");
  const state = loaded.data ?? initial ?? null;
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();

  if (!state) return loaded.error ? <ErrorNote message={loaded.error} /> : <Loading />;
  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setError("");
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });

  const turnOn = () =>
    run(async () => {
      const r = await startTwoFactor();
      if ("error" in r) return setError(r.error);
      setCode("");
      setStep({ kind: "scan", ...r });
    });

  const confirm = (factorId: string) =>
    run(async () => {
      const r = await confirmTwoFactor(factorId, code);
      if ("error" in r) {
        setError(r.error);
        if (r.on) {
          setStep({ kind: "idle" });
          loaded.reload();
        }
        return;
      }
      setStep({ kind: "codes", codes: r.codes });
      loaded.reload();
    });

  const withCode = (title: string, ok: string, fn: (code: string) => Promise<void>) => async () => {
    const typed = await askText(title, { placeholder: "123456", ok });
    if (typed) run(() => fn(typed));
  };

  const turnOff = withCode("Code from your authenticator app", "Turn off 2FA", async (c) => {
    const r = await turnOffTwoFactor(c);
    if (r.error) return setError(r.error);
    loaded.reload();
  });

  const remake = withCode("Code from your authenticator app", "Make new codes", async (c) => {
    const r = await newBackupCodes(c);
    if ("error" in r) return setError(r.error);
    setStep({ kind: "codes", codes: r.codes });
    loaded.reload();
  });

  const done = () => {
    setStep({ kind: "idle" });
    if (next) router.push(next);
  };

  return (
    <Panel className="overflow-hidden">
      <CardHead label="Two-factor sign-in">
        <Badge tone={state.on ? "green" : "gray"}>{state.on ? "On" : "Off"}</Badge>
      </CardHead>
      {step.kind === "scan" ? (
        <form
          className="flex flex-wrap items-start gap-5 px-4 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            confirm(step.factorId);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a data: SVG from Supabase Auth, nothing to optimize */}
          <img src={step.qr} alt="QR code for your authenticator app" width={176} height={176} className="size-44 shrink-0 rounded-md bg-white p-2 shadow-rest" />
          <div className="flex min-w-[14rem] flex-1 flex-col gap-4">
            <Field label="Secret" aside={<CopyButton text={step.secret} label="Copy secret" />}>
              <code className="rounded-sm bg-paper px-2.5 py-1.5 font-mono text-[12px] wrap-anywhere shadow-track">{step.secret}</code>
            </Field>
            <Field label="Code">
              <Input value={code} onChange={(e) => setCode(e.target.value)} autoFocus required autoComplete="one-time-code" inputMode="numeric" maxLength={7} placeholder="123456" className="font-mono tracking-[0.12em]" />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={busy || code.replace(/\s/g, "").length !== 6}>
                {busy ? <Loader /> : null}
                Verify
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => setStep({ kind: "idle" })}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      ) : step.kind === "codes" ? (
        <BackupCodes codes={step.codes} onDone={done} doneLabel={next ? "Continue" : "Done"} />
      ) : state.on ? (
        <Row title="Backup codes" sub={`${state.left} left`}>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void remake()}>
            New backup codes
          </Button>
          <Button variant="danger" size="sm" disabled={busy} onClick={() => (state.required.length ? setError(`${state.required[0]} requires 2FA`) : void turnOff())}>
            {busy ? <Loader /> : null}
            Turn off 2FA
          </Button>
        </Row>
      ) : (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Button disabled={busy} onClick={turnOn}>
            {busy ? <Loader /> : null}
            Turn on 2FA
          </Button>
        </div>
      )}
      {error ? <ErrorNote message={error} className="mx-4 mb-4" /> : null}
    </Panel>
  );
}

/** The backup codes, shown once: copy, download, then done. */
function BackupCodes({ codes, onDone, doneLabel }: { codes: string[]; onDone: () => void; doneLabel: string }) {
  const text = codes.join("\n");
  const download = () => {
    const url = URL.createObjectURL(new Blob([`Capybaroar backup codes\n\n${text}\n`], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "capybaroar-backup-codes.txt" });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="label-mono flex-1">Backup codes</p>
        <CopyButton text={text} label="Copy codes" />
        <Button variant="ghost" size="sm" onClick={download}>
          <Download />
          Download
        </Button>
      </div>
      <ol className="grid grid-cols-1 gap-2 rounded-md bg-paper p-3 font-mono text-[13px] tracking-[0.06em] shadow-track sm:grid-cols-2">
        {codes.map((c) => (
          <li key={c} className="wrap-anywhere">
            {c}
          </li>
        ))}
      </ol>
      <div>
        <Button onClick={onDone}>{doneLabel}</Button>
      </div>
    </div>
  );
}

/** /mfa/setup: open another workspace, one that doesn't require 2FA. */
export function OpenWorkspace({ workspaces }: { workspaces: { id: string; name: string }[] }) {
  const [id, setId] = useState(workspaces[0]?.id ?? "");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  if (!workspaces.length) return null;
  return (
    <Rows>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <Select value={id} options={workspaces.map((w) => ({ value: w.id, label: w.name }))} onChange={setId} ariaLabel="Workspace" className="min-w-[12rem] flex-1" />
        <Button
          variant="ghost"
          disabled={busy || !id}
          onClick={() =>
            start(async () => {
              const r = await openWorkspace(id);
              setError(r?.error ?? "");
            })
          }
        >
          {busy ? <Loader /> : null}
          Open
        </Button>
      </div>
      {error ? <ErrorNote message={error} className="mx-4 mb-3" /> : null}
    </Rows>
  );
}
