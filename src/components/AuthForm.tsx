"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Input } from "./ui";
import { Loader } from "./Loader";
import { signIn, signInWithGoogle, signUp, type AuthState } from "@/app/login/actions";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, busy] = useActionState<AuthState, FormData>(mode === "login" ? signIn : signUp, {});
  return (
    <div className="flex min-h-dvh items-center justify-center bg-panel px-4">
      <div className="w-full max-w-[380px] border border-frame bg-panel p-6">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={72} height={72} className="size-18" />
          <p className="mt-2 text-[13px] font-semibold tracking-[0.18em]">CAPYBAROAR</p>
          <h1 className="mt-6 text-[20px] font-semibold tracking-[-0.025em] text-balance">
            Every post, every channel. <span className="text-faint">One calendar.</span>
          </h1>
        </div>
        {state.sent ? (
          <p className="mt-6 border border-frame bg-yolk-soft p-3 text-[13px]">Check your email for a link to finish signing up.</p>
        ) : (
          <>
            {process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === "1" ? (
              <>
                <form action={signInWithGoogle} className="mt-6">
                  <Button type="submit" variant="ghost" className="w-full justify-center">
                    Continue with Google
                  </Button>
                </form>
                <div className="my-3 flex items-center gap-2 text-[11px] text-faint">
                  <span className="h-px flex-1 bg-line" />
                  or
                  <span className="h-px flex-1 bg-line" />
                </div>
              </>
            ) : (
              <div className="mt-6" />
            )}
            <form action={action} className="flex flex-col gap-3">
              {mode === "signup" ? (
                <>
                  <Field label="Name">
                    <Input name="name" autoComplete="name" required />
                  </Field>
                  <Field label="Company">
                    <Input name="company" autoComplete="organization" />
                  </Field>
                </>
              ) : null}
              <Field label="Email">
                <Input name="email" type="email" autoComplete="email" required />
              </Field>
              <Field label="Password">
                <Input name="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
              </Field>
              {state.error ? <p className="text-[12px] text-danger">{state.error}</p> : null}
              <Button type="submit" disabled={busy} className="mt-1 w-full justify-center">
                {busy ? <Loader /> : null}
                {mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </>
        )}
        <p className="mt-4 text-center text-[12px] text-muted">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href="/signup" className="font-medium text-ink underline underline-offset-2">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Have an account?{" "}
              <Link href="/login" className="font-medium text-ink underline underline-offset-2">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
