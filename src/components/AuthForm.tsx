"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Checkbox, Field, Input } from "./ui";
import { Loader } from "./Loader";
import { Logo } from "./Logo";
import { requestReset, setPassword, signIn, signInWithGoogle, signOut, signUp, type AuthState } from "@/app/login/actions";
import { verifyMfa } from "@/app/mfa/actions";

// login and signup; forgot asks for the email a reset link goes to; reset sets the new password after that link; mfa
// asks for the code from the authenticator app (or a backup code) after a password or Google (/mfa).
type Mode = "login" | "signup" | "forgot" | "reset" | "mfa";
const ACTIONS = { login: signIn, signup: signUp, forgot: requestReset, reset: setPassword, mfa: verifyMfa };
const SUBMIT = { login: "Sign in", signup: "Create account", forgot: "Send reset link", reset: "Save password", mfa: "Verify" };

export function AuthForm({ mode, next, email }: { mode: Mode; next?: string; email?: string }) {
  const keep = next ? `?${new URLSearchParams({ next, ...(email ? { email } : {}) })}` : "";
  const [state, action, busy] = useActionState<AuthState, FormData>(ACTIONS[mode], {});
  const [agree, setAgree] = useState(false);
  const [backup, setBackup] = useState(false);
  const google = process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === "1" && (mode === "login" || mode === "signup");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-shell px-4 py-10">
      <div className="w-full max-w-[400px] rounded-2xl bg-panel p-7 shadow-hover">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-9 w-auto" />
          <h1 className="mt-6 text-[22px] leading-[1.15] font-medium tracking-[-0.025em] text-balance">
            {mode === "mfa" ? (
              <>
                Two-factor sign-in. <span className="text-faint">{backup ? "Enter a backup code." : "Enter the code from your app."}</span>
              </>
            ) : (
              <>
                Every post, every channel. <span className="text-faint">One calendar.</span>
              </>
            )}
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
              {mode === "mfa" ? (
                <Field
                  label={backup ? "Backup code" : "Code"}
                  aside={
                    <button type="button" onClick={() => setBackup(!backup)} className="text-[12px] text-muted underline-offset-2 hover:text-ink hover:underline">
                      {backup ? "Use your app" : "Use a backup code"}
                    </button>
                  }
                >
                  <Input
                    key={backup ? "backup" : "app"}
                    name="code"
                    autoFocus
                    required
                    autoComplete="one-time-code"
                    inputMode={backup ? "text" : "numeric"}
                    pattern={backup ? undefined : "[0-9 ]{6,7}"}
                    maxLength={backup ? 14 : 7}
                    placeholder={backup ? "xxxxx-xxxxx" : "123456"}
                    className="font-mono tracking-[0.12em]"
                  />
                </Field>
              ) : mode !== "reset" ? (
                <Field label="Email">
                  <Input name="email" type="email" autoComplete="email" defaultValue={email} required />
                </Field>
              ) : null}
              {mode !== "forgot" && mode !== "mfa" ? (
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
              {mode === "signup" ? (
                <label className="flex items-start gap-2 text-[12px] leading-relaxed text-muted">
                  <Checkbox checked={agree} onChange={setAgree} label="I agree to the Terms, Privacy Policy and Data Processing Agreement" className="mt-0.5" />
                  <input type="hidden" name="agree" value={agree ? "yes" : ""} />
                  <span>
                    I agree to the{" "}
                    <a href="https://capybaroar.com/terms" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2">
                      Terms
                    </a>
                    ,{" "}
                    <a href="https://capybaroar.com/privacy" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2">
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a href="https://capybaroar.com/dpa" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2">
                      Data Processing Agreement
                    </a>
                  </span>
                </label>
              ) : null}
              {state.error ? (
                <p role="alert" className="text-[12px] text-danger">
                  {state.error}
                </p>
              ) : null}
              <Button type="submit" disabled={busy || (mode === "signup" && !agree)} className="mt-1 w-full justify-center">
                {busy ? <Loader /> : null}
                {SUBMIT[mode]}
              </Button>
            </form>
          </>
        )}
        <p className="mt-4 text-center text-[12px] text-muted">
          {mode === "mfa" ? (
            <button type="submit" form="mfa-sign-out" className="font-medium text-ink underline underline-offset-2">
              Sign out
            </button>
          ) : mode === "reset" ? null : mode === "login" ? (
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
        {mode === "mfa" ? <form id="mfa-sign-out" action={signOut} /> : null}
      </div>
    </div>
  );
}
