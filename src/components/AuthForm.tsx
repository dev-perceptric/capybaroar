"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { Badge, Button, Checkbox, Field, Input } from "./ui";
import { Loader } from "./Loader";
import { Logo } from "./Logo";
import { requestReset, resendSignup, sendLink, setPassword, signIn, signInWithGoogle, signOut, signUp, verifyLink, type AuthState } from "@/app/login/actions";
import { verifyMfa } from "@/app/mfa/actions";
import { policiesPublished } from "@/lib/policyRules";
import { suggestEmail } from "@/lib/emailTypos";
import { strength } from "@/lib/passwordCheck";
import { Turnstile } from "./Turnstile";

// login and signup; link emails a sign-in link and code (/login/link); forgot asks for the email a reset link goes to;
// reset sets the new password after that link; mfa asks for the code from the authenticator app (or a backup code)
// after a password, a link or Google (/mfa).
type Mode = "login" | "signup" | "link" | "forgot" | "reset" | "mfa";
const ACTIONS = { login: signIn, signup: signUp, link: sendLink, forgot: requestReset, reset: setPassword, mfa: verifyMfa };
const SUBMIT = { login: "Sign in", signup: "Create account", link: "Email me a sign-in link", forgot: "Send reset link", reset: "Save password", mfa: "Verify" };
const TITLES: Record<Exclude<Mode, "mfa">, [string, string]> = {
  login: ["Welcome back.", "Sign in to your calendar."],
  signup: ["Create your account.", "Free plan, no card needed."],
  link: ["Sign in with email.", "We'll send a link and a code."],
  forgot: ["Reset your password.", "We'll email you a link."],
  reset: ["Choose a new password.", "Then you're back in."],
};

// The way someone signed in last on this computer, tagged "Last used" on /login.
const LAST_KEY = "capybaroar:last-signin";
type Method = "google" | "email";
const readLast = (): Method | null => {
  try {
    const v = localStorage.getItem(LAST_KEY);
    return v === "google" || v === "email" ? v : null;
  } catch {
    return null;
  }
};
const saveLast = (m: Method) => {
  try {
    localStorage.setItem(LAST_KEY, m);
  } catch {}
};

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

const METER = ["", "bg-danger", "bg-warning", "bg-signal", "bg-success"];

/** A password box with show/hide and a Caps Lock warning; `meter` adds the strength bar for a new password. Hidden again on send. */
function PasswordField({ mode }: { mode: "login" | "signup" | "reset" }) {
  const [value, setValue] = useState("");
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const box = useRef<HTMLInputElement>(null);
  const meter = mode !== "login";
  const s = strength(value);
  useEffect(() => {
    const form = box.current?.form;
    if (!form) return;
    const hide = () => setShown(false);
    form.addEventListener("submit", hide);
    return () => form.removeEventListener("submit", hide);
  }, []);
  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);
  return (
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
      <div className="relative">
        <Input
          ref={box}
          name="password"
          type={shown ? "text" : "password"}
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          autoCapitalize="none"
          spellCheck={false}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          onBlur={() => setCaps(false)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => {
            setShown((v) => !v);
            requestAnimationFrame(() => box.current?.focus());
          }}
          onMouseDown={(e) => e.preventDefault()}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          title={shown ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-ink"
        >
          {shown ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {caps ? (
        <p role="status" className="text-[12px] text-warning">
          Caps Lock is on
        </p>
      ) : null}
      {meter ? (
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1" aria-hidden>
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={`h-1 flex-1 rounded-full ${value && n <= s.score ? METER[s.score] : "bg-line"}`} />
            ))}
          </div>
          <span className="shrink-0 text-right text-[12px] text-muted" aria-live="polite">
            {value ? s.label : "8+ characters"}
          </span>
        </div>
      ) : null}
    </Field>
  );
}

/** After sign-up: open the inbox, send the email again, or start over with another address. */
function CheckInbox({ email, next, siteKey }: { email: string; next?: string; siteKey: string }) {
  const [state, action, busy] = useActionState<AuthState, FormData>(resendSignup, {});
  const [round, setRound] = useState(0);
  const [wait, setWait] = useState(30);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound((r) => r + 1);
    if (state.sent) setWait(30);
  }, [state]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  return (
    <div className="mt-6 flex flex-col gap-4">
      <p role="status" className="rounded-lg bg-signal-soft px-3.5 py-3 text-[13px] text-ink shadow-picked">
        We sent a link to <span className="font-medium break-all">{email}</span>. Click it to finish signing up.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <a href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noreferrer" className="flex h-9 items-center justify-center rounded-full bg-panel px-3 text-[13px] font-medium text-ink shadow-outline hover:bg-hover">
          Open Gmail
        </a>
        <a href="https://outlook.office.com/mail/" target="_blank" rel="noreferrer" className="flex h-9 items-center justify-center rounded-full bg-panel px-3 text-[13px] font-medium text-ink shadow-outline hover:bg-hover">
          Open Outlook
        </a>
      </div>
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {siteKey ? <Turnstile siteKey={siteKey} round={round} /> : null}
        {state.error ? (
          <p role="alert" className="text-[12px] text-danger">
            {state.error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <Link href={`/signup${next ? `?${new URLSearchParams({ next })}` : ""}`} className="text-muted underline-offset-2 hover:text-ink hover:underline">
            Use a different email
          </Link>
          <button type="submit" disabled={busy || wait > 0} className="font-medium text-ink underline-offset-2 hover:underline disabled:text-muted disabled:no-underline">
            {busy ? "Sending" : wait > 0 ? `Send again in ${wait}s` : "Send again"}
          </button>
        </div>
      </form>
    </div>
  );
}

const mailLink = "flex h-9 items-center justify-center rounded-full bg-panel px-3 text-[13px] font-medium text-ink shadow-outline hover:bg-hover";

/** After "Email me a sign-in link": the code from the email (for a link opened on another device), the inbox, and
 *  sending again after 30 seconds. */
function LinkSent({ email, next, siteKey }: { email: string; next?: string; siteKey: string }) {
  const [checked, check, checking] = useActionState<AuthState, FormData>(verifyLink, {});
  const [again, resend, sending] = useActionState<AuthState, FormData>(sendLink, {});
  const [round, setRound] = useState(0);
  const [wait, setWait] = useState(30);
  const [code, setCode] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound((r) => r + 1);
    if (again.sent) setWait(30);
  }, [again]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  const keep = next ? `?${new URLSearchParams({ next })}` : "";
  return (
    <div className="mt-6 flex flex-col gap-4">
      <p role="status" className="rounded-lg bg-signal-soft px-3.5 py-3 text-[13px] text-ink shadow-picked">
        If <span className="font-medium break-all">{email}</span> has an account, a sign-in link and code are on the way. Click the link, or enter the code.
      </p>
      <form action={check} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="Code">
          <Input
            name="code"
            autoFocus
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9 ]{6,11}"
            maxLength={11}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
            className="font-mono tracking-[0.12em]"
          />
        </Field>
        {checked.error ? (
          <p role="alert" className="text-[12px] text-danger">
            {checked.error}
          </p>
        ) : null}
        <Button type="submit" disabled={checking || code.replace(/\s/g, "").length < 6} className="w-full justify-center">
          {checking ? <Loader /> : null}
          Sign in
        </Button>
      </form>
      <div className="grid grid-cols-2 gap-2">
        <a href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noreferrer" className={mailLink}>
          Open Gmail
        </a>
        <a href="https://outlook.office.com/mail/" target="_blank" rel="noreferrer" className={mailLink}>
          Open Outlook
        </a>
      </div>
      <form action={resend} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {siteKey ? <Turnstile siteKey={siteKey} round={round} /> : null}
        {again.error ? (
          <p role="alert" className="text-[12px] text-danger">
            {again.error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <Link href={`/login/link${keep}`} className="text-muted underline-offset-2 hover:text-ink hover:underline">
            Use a different email
          </Link>
          <button type="submit" disabled={sending || wait > 0} className="font-medium text-ink underline-offset-2 hover:underline disabled:text-muted disabled:no-underline">
            {sending ? "Sending" : wait > 0 ? `Send again in ${wait}s` : "Send again"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** `google` and `siteKey` come from the page (src/lib/signinOptions.ts), read when it is asked for. */
export function AuthForm({ mode, next, email, notice, google: googleOn = false, siteKey: key = "" }: { mode: Mode; next?: string; email?: string; notice?: string; google?: boolean; siteKey?: string }) {
  const keep = next ? `?${new URLSearchParams({ next, ...(email ? { email } : {}) })}` : "";
  const [state, action, busy] = useActionState<AuthState, FormData>(ACTIONS[mode], {});
  const [agree, setAgree] = useState(false);
  const [backup, setBackup] = useState(false);
  const [typed, setTyped] = useState(email ?? "");
  const typo = mode === "login" || mode === "signup" || mode === "link" || mode === "forgot" ? suggestEmail(typed) : "";
  const [last, setLast] = useState<Method | null>(null);
  useEffect(() => {
    // Read after the first draw, so the server's page and the browser's match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLast(readLast());
  }, []);
  const lastTag = (m: Method) =>
    mode === "login" && last === m ? (
      <span className="inline-flex sm:absolute sm:right-3">
        <Badge>Last used</Badge>
      </span>
    ) : null;
  const google = googleOn && (mode === "login" || mode === "signup");
  // The bot check on the forms that reach Supabase Auth with an email. A token works once, so each answer gets a new one.
  const siteKey = mode === "login" || mode === "signup" || mode === "link" || mode === "forgot" ? key : "";
  const [round, setRound] = useState(0);
  useEffect(() => {
    // A new answer from the server is the moment the old token is spent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound((r) => r + 1);
  }, [state]);
  const title = mode === "mfa" ? null : TITLES[mode];
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
                {title![0]} <span className="text-faint">{title![1]}</span>
              </>
            )}
          </h1>
        </div>
        {state.sent && mode === "signup" ? (
          <CheckInbox email={typed.trim()} next={next} siteKey={key} />
        ) : state.sent && mode === "link" ? (
          <LinkSent email={typed.trim()} next={next} siteKey={key} />
        ) : state.sent ? (
          <p role="status" className="mt-6 rounded-lg bg-signal-soft px-3.5 py-3 text-[13px] text-ink shadow-picked">
            Check your email for a link to set a new password.
          </p>
        ) : (
          <>
            {google ? (
              <>
                <form action={signInWithGoogle} onSubmit={() => saveLast("google")} className="mt-6">
                  {next ? <input type="hidden" name="next" value={next} /> : null}
                  <Button type="submit" variant="ghost" className="relative w-full justify-center gap-2.5">
                    <GoogleLogo />
                    Continue with Google
                    {lastTag("google")}
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
            {notice ? (
              <p role="alert" className="mb-4 rounded-lg bg-signal-soft px-3.5 py-3 text-[13px] text-ink shadow-picked">
                {notice}
              </p>
            ) : null}
            <form action={action} onSubmit={() => mode === "login" && saveLast("email")} className="flex flex-col gap-4">
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
                  <Input name="email" type="email" autoComplete={mode === "signup" ? "email" : "username"} autoCapitalize="none" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value)} required />
                  {typo ? (
                    <p className="text-[12px] text-muted">
                      Did you mean{" "}
                      <button type="button" onClick={() => setTyped(typo)} className="font-medium break-all text-ink underline-offset-2 hover:underline">
                        {typo}
                      </button>
                      ?
                    </p>
                  ) : null}
                </Field>
              ) : null}
              {mode === "login" || mode === "signup" || mode === "reset" ? <PasswordField mode={mode} /> : null}
              {mode === "signup" && policiesPublished() ? (
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
              {siteKey ? <Turnstile siteKey={siteKey} round={round} /> : null}
              {state.error ? (
                <p role="alert" className="text-[12px] text-danger">
                  {state.error}
                </p>
              ) : null}
              <Button type="submit" disabled={busy || (mode === "signup" && policiesPublished() && !agree)} className="relative mt-1 w-full justify-center">
                {busy ? <Loader /> : null}
                {SUBMIT[mode]}
                {lastTag("email")}
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
            <span className="flex flex-col items-center gap-2">
              <Link href={`/login/link${keep}`} className="font-medium text-ink underline underline-offset-2">
                Email me a sign-in link
              </Link>
              <span>
                New here?{" "}
                <Link href={`/signup${keep}`} className="font-medium text-ink underline underline-offset-2">
                  Create an account
                </Link>
              </span>
            </span>
          ) : mode === "link" ? (
            <Link href={`/login${keep}`} className="font-medium text-ink underline underline-offset-2">
              Sign in with a password
            </Link>
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
