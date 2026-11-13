"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Input } from "./ui";
import { Loader } from "./Loader";
import { Logo } from "./Logo";
import { requestReset, setPassword, signIn, signInWithGoogle, signUp, type AuthState } from "@/app/login/actions";

// login and signup; forgot asks for the email a reset link goes to; reset sets the new password after that link.
type Mode = "login" | "signup" | "forgot" | "reset";
const ACTIONS = { login: signIn, signup: signUp, forgot: requestReset, reset: setPassword };
const SUBMIT = { login: "Sign in", signup: "Create account", forgot: "Send reset link", reset: "Save password" };

export function AuthForm({ mode, next, email }: { mode: Mode; next?: string; email?: string }) {
  const keep = next ? `?${new URLSearchParams({ next, ...(email ? { email } : {}) })}` : "";
  const [state, action, busy] = useActionState<AuthState, FormData>(ACTIONS[mode], {});
  const google = process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === "1" && (mode === "login" || mode === "signup");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-shell px-4 py-10">
      <div className="w-full max-w-[400px] rounded-2xl bg-panel p-7 shadow-hover">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-9 w-auto" />
          <h1 className="mt-6 text-[22px] leading-[1.15] font-medium tracking-[-0.025em] text-balance">
            Every post, every channel. <span className="text-faint">One calendar.</span>
          </h1>
        </div>
        {state.sent ? (
          <p role="status" className="mt-6 rounded-lg bg-signal-soft px-3.5 py-3 text-[13px] text-ink shadow-picked">
            {mode === "forgot" ? "Check your email for a link to set a new password." : "Check your email for a link to finish signing up."}
          </p>
        ) : (
          <>
            {google ? (
              <>
                <form action={signInWithGoogle} className="mt-6">
                  {next ? <input type="hidden" name="next" value={next} /> : null}
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
            <form action={action} className="flex flex-col gap-4">
              {next ? <input type="hidden" name="next" value={next} /> : null}
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
              {mode !== "reset" ? (
                <Field label="Email">
                  <Input name="email" type="email" autoComplete="email" defaultValue={email} required />
                </Field>
              ) : null}
              {mode !== "forgot" ? (
                <Field
                  label={mode === "reset" ? "New password" : "Password"}
                  aside={
                    mode === "login" ? (
                      <Link href="/reset" className="text-[12px] text-muted underline-offset-2 hover:text-ink hover:underline">
                        Forgot password?
                      </Link>
                    ) : null
                  }
                >
                  <Input name="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
                </Field>
              ) : null}
              {state.error ? (
                <p role="alert" className="text-[12px] text-danger">
                  {state.error}
                </p>
              ) : null}
              <Button type="submit" disabled={busy} className="mt-1 w-full justify-center">
                {busy ? <Loader /> : null}
                {SUBMIT[mode]}
              </Button>
            </form>
          </>
        )}
        <p className="mt-4 text-center text-[12px] text-muted">
          {mode === "reset" ? null : mode === "login" ? (
            <>
              New here?{" "}
              <Link href={`/signup${keep}`} className="font-medium text-ink underline underline-offset-2">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Have an account?{" "}
              <Link href={`/login${keep}`} className="font-medium text-ink underline underline-offset-2">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
