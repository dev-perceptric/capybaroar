"use client";

import { useState, useTransition } from "react";
import { Button } from "./ui";
import { Loader } from "./Loader";
import { accept, signOutTo } from "@/app/invite/actions";

/** The invite page: who invited you to what, and the one button that joins. */
export function InviteCard({ title, line, token, mismatch, children }: { title: string; line?: string; token?: string; mismatch?: { invited: string; signedIn: string }; children?: React.ReactNode }) {
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-panel px-4">
      <div className="w-full max-w-[380px] rounded-2xl border border-frame bg-panel p-6 shadow-card">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={72} height={72} className="size-18" />
          <p className="mt-2 text-[13px] font-semibold tracking-[0.18em]">CAPYBAROAR</p>
          <h1 className="mt-6 text-[20px] font-semibold tracking-[-0.025em] text-balance">{title}</h1>
          {line ? <p className="mt-2 text-[13px] text-muted">{line}</p> : null}
        </div>
        {mismatch ? (
          <p className="mt-6 rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-[12px] text-danger">
            This invite is for {mismatch.invited}. You are signed in as {mismatch.signedIn}.
          </p>
        ) : null}
        {error ? <p className="mt-6 text-[12px] text-danger">{error}</p> : null}
        <div className="mt-6 flex flex-col gap-2 [&>*]:w-full">
          {token && mismatch ? (
            <Button disabled={busy} onClick={() => start(() => signOutTo(token))}>
              {busy ? <Loader /> : null}
              Sign in as {mismatch.invited}
            </Button>
          ) : token ? (
            <Button
              disabled={busy}
              onClick={() =>
                start(async () => {
                  const r = await accept(token);
                  if (r?.error) setError(r.error);
                })
              }
            >
              {busy ? <Loader /> : null}
              Join
            </Button>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
