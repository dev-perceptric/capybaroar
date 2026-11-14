"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Overlay";
import { Button } from "./ui";
import { Loader } from "./Loader";
import type { Policy } from "@/lib/policyRules";
import { acceptPolicies } from "@/app/(app)/policy-actions";

/** Shown once when the Terms, Privacy Policy or DPA changed (or were never accepted). Closing it isn't possible:
 *  accepting is how the app is used. */
export function PolicyNotice({ pending, first }: { pending: Policy[]; first: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const accept = () =>
    start(async () => {
      setError("");
      const r = await acceptPolicies(Object.fromEntries(pending.map((p) => [p.doc, p.version])));
      if (r.error) return setError(r.error);
      router.refresh();
    });
  return (
    <Modal
      title={first ? "Before you continue" : "We updated our terms"}
      onClose={() => undefined}
      footer={
        <>
          {error ? <span className="mr-auto text-[12px] text-danger">{error}</span> : null}
          <Button disabled={busy} onClick={accept}>
            {busy ? <Loader /> : null}
            Accept and continue
          </Button>
        </>
      }
    >
      <p className="text-[13px] text-muted">{first ? "Please accept these to use Capybaroar:" : "Please review and accept:"}</p>
      <ul className="mt-3 flex flex-col gap-2 text-[13px]">
        {pending.map((p) => (
          <li key={p.doc}>
            <a href={p.url} target="_blank" rel="noreferrer" className="font-medium text-ink underline underline-offset-2">
              {p.title}
            </a>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
