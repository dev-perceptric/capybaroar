"use client";

import { useActionState } from "react";
import { Button, LinkButton } from "@/components/ui";
import { Loader } from "@/components/Loader";
import { Logo } from "@/components/Logo";
import { secureAccount, type SecureState } from "../actions";

export function SecureForm({ token }: { token: string }) {
  const [state, action, busy] = useActionState<SecureState, FormData>(secureAccount, {});
  return (
    <div className="flex min-h-dvh items-center justify-center bg-shell px-4 py-10">
      <div className="w-full max-w-[400px] rounded-2xl bg-panel p-7 shadow-hover">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-9 w-auto" />
          <h1 className="mt-6 text-[22px] leading-[1.15] font-medium tracking-[-0.025em] text-balance">
            {state.done ? (
              <>
                Signed out everywhere. <span className="text-faint">Now set a new password.</span>
              </>
            ) : (
              <>
                Secure your account. <span className="text-faint">Sign out on every device.</span>
              </>
            )}
          </h1>
        </div>
        {state.done ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-[13px] text-muted">Every device is signed out within the hour. Set a new password so the old one stops working, then turn on two-factor sign-in in Settings.</p>
            <LinkButton href="/reset" className="w-full justify-center">
              Set a new password
            </LinkButton>
          </div>
        ) : (
          <form action={action} className="mt-6 flex flex-col gap-3">
            <input type="hidden" name="token" value={token} />
            {state.error ? (
              <p role="alert" className="text-[12px] text-danger">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy} className="w-full justify-center">
              {busy ? <Loader /> : null}
              Sign out everywhere
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
