"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { userClient } from "@/lib/supabase/server";
import { trustedIp } from "@/lib/clientIp";
import { LIMITS, hashed, retryIn, takeAll } from "@/lib/limits";
import { safeNext } from "@/proxy";
import { currentPolicies, policiesPublished } from "@/lib/policyRules";
import { recordAcceptance } from "@/lib/policies";
import { audit } from "@/lib/audit";
import { firstWorkspaceId } from "@/lib/mfa";
import { mfaGate, mfaNext, verifiedTotp } from "@/lib/mfaRules";
import { captchaError, captchaMissing, captchaToken } from "@/lib/captcha";
import { isDisposable } from "@/lib/disposable";
import { leakedCount, passwordProblem } from "@/lib/passwordCheck";
import { notePasswordChanged, noteSignIn } from "@/lib/devices";
import { cleanCode, codeError, linkReturn, quietLinkError, signupReturn } from "@/lib/emailLink";

export type AuthState = { error?: string; sent?: boolean };

const MIN_PASSWORD = 8;

const origin = async () => {
  const h = await headers();
  return process.env.APP_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
};

const ip = async () => trustedIp(await headers());

/** Counts one try for the address and the visitor's IP; an error to show when either is over its limit. */
async function limited(kind: "login" | "reset" | "signup" | "resend" | "link" | "code", email: string): Promise<string | null> {
  const addr = await ip();
  const list = [];
  if (kind === "login" && email) list.push({ bucket: hashed("login:email", email), l: LIMITS.loginEmail });
  if (kind === "reset" && email) list.push({ bucket: hashed("reset:email", email), l: LIMITS.resetEmail });
  if (kind === "signup" && email) list.push({ bucket: hashed("signup:email", email.toLowerCase()), l: LIMITS.signupEmail });
  if (kind === "resend" && email) list.push({ bucket: hashed("resend:email", email), l: LIMITS.resetEmail });
  if (kind === "link" && email) list.push({ bucket: hashed("link:email", email), l: LIMITS.linkEmail });
  if (kind === "code" && email) list.push({ bucket: hashed("code:email", email), l: LIMITS.codeEmail });
  // No IP (a proxy that didn't send one): only the address counts, so everyone isn't sharing one bucket.
  const ipLimit = { login: LIMITS.loginIp, reset: LIMITS.resetIp, resend: LIMITS.resetIp, signup: LIMITS.signupIp, link: LIMITS.linkIp, code: LIMITS.codeIp }[kind];
  if (addr) list.push({ bucket: hashed(`${kind}:ip`, addr), l: ipLimit });
  const wait = await takeAll(list);
  return wait ? `Too many tries. ${retryIn(wait)}` : null;
}

/** Supabase Auth's sign-in error as one plain line. The same line for a wrong password and no account. */
function signInError(message: string | undefined): string {
  if (!message || /invalid login credentials|invalid.*(email|password)/i.test(message)) return "Wrong email or password";
  if (/email not confirmed/i.test(message)) return "Confirm your email first. The link is in your inbox";
  return message;
}

const tooShort = (p: string) => (p.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : null);
/** Why a new password can't be used: too short, too easy to guess, or found in data leaks. null when it's fine. */
const weak = async (p: string) => tooShort(p) ?? ((await passwordProblem(p)).replace(/\.$/, "") || null);

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const token = captchaToken(form);
  const missing = captchaMissing(token);
  if (missing) return { error: missing };
  const stop = await limited("login", email);
  if (stop) return { error: stop };
  const sb = await userClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password: String(form.get("password") ?? ""), options: { captchaToken: token } });
  const addr = await ip();
  const bot = captchaError(error?.message);
  if (bot) return { error: bot };
  if (error || !data.user) {
    // Who it was is unknown (a wrong password looks the same as no account), so the event has no workspace.
    await audit({ workspaceId: null, actorKind: "user", actorLabel: email, action: "auth.sign_in_failed", meta: { reason: error?.code ?? "no_user" }, ip: addr });
    return { error: signInError(error?.message) };
  }
  let next = safeNext(String(form.get("next") ?? ""));
  // A password found in data leaks: signed in, then asked for a new one before anything else (the check sends only 5
  // characters of a hash; when it can't run, sign-in goes on).
  if ((await leakedCount(String(form.get("password") ?? ""))) > 0) {
    await audit({ workspaceId: await firstWorkspaceId(data.user.id), actorId: data.user.id, actorLabel: email, action: "auth.password_leaked", ip: addr });
    next = "/reset?leaked=1";
  }
  // An authenticator app on file: the password alone is aal1, so the code comes next. Signed in is recorded there.
  const gate = mfaGate({ aal: "aal1", verified: verifiedTotp(data.user.factors).length > 0, required: false, next: mfaNext(next, safeNext) });
  if (gate) redirect(gate);
  await audit({ workspaceId: await firstWorkspaceId(data.user.id), actorId: data.user.id, actorLabel: email, action: "auth.sign_in", meta: { method: "password" }, ip: addr });
  await noteSignIn({ userId: data.user.id, email: data.user.email ?? email, ip: addr });
  redirect(next);
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (isDisposable(email)) return { error: "Use your work or personal email. Throwaway inboxes can't sign up" };
  const short = await weak(password);
  if (short) return { error: short };
  if (policiesPublished() && form.get("agree") !== "yes") return { error: "Accept the Terms, Privacy Policy and Data Processing Agreement to continue" };
  const token = captchaToken(form);
  const missing = captchaMissing(token);
  if (missing) return { error: missing };
  const stop = await limited("signup", email);
  if (stop) return { error: stop };
  const sb = await userClient();
  const next = safeNext(String(form.get("next") ?? ""));
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { name: String(form.get("name") ?? "").trim(), company: String(form.get("company") ?? "").trim() },
      emailRedirectTo: signupReturn(await origin(), next),
      captchaToken: token,
    },
  });
  // An address that already has an account gets the same answer as a new one, so sign-up never tells who has one.
  if (error && /already (registered|exists)/i.test(error.message)) return { sent: true };
  if (error) return { error: captchaError(error.message) ?? error.message };
  // Proof of consent. An address that already has an account comes back with no identities: nothing to record.
  if (policiesPublished() && data.user?.id && data.user.identities?.length !== 0) await recordAcceptance(data.user.id, currentPolicies(), "signup").catch((e) => console.error("consent:", e instanceof Error ? e.message : e));
  if (!data.session) return { sent: true };
  redirect(next);
}

/** "Send again" on Check your inbox after sign-up: the confirm email once more. Quiet about whether the address exists. */
export async function resendSignup(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email" };
  const token = captchaToken(form);
  const missing = captchaMissing(token);
  if (missing) return { error: missing };
  const stop = await limited("resend", email);
  if (stop) return { error: stop };
  const sb = await userClient();
  const next = safeNext(String(form.get("next") ?? ""));
  const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: signupReturn(await origin(), next), captchaToken: token } });
  const bot = captchaError(error?.message);
  if (bot) return { error: bot };
  if (error && /rate limit|seconds/i.test(error.message)) return { error: "Wait a minute, then send again" };
  if (error) console.error("resend:", error.message);
  return { sent: true };
}

/** "Email me a sign-in link": a link and a code in one email, for an account that exists. The answer is the same
 *  whether or not it does, so the screen never tells who has an account. */
export async function sendLink(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email" };
  const token = captchaToken(form);
  const missing = captchaMissing(token);
  if (missing) return { error: missing };
  const stop = await limited("link", email);
  if (stop) return { error: stop };
  const sb = await userClient();
  const next = safeNext(String(form.get("next") ?? ""));
  // The browser keeps the link's PKCE half in a cookie, so the link signs in here; the code works anywhere.
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: linkReturn(await origin(), next), captchaToken: token } });
  const bot = captchaError(error?.message);
  if (bot) return { error: bot };
  if (error && /rate limit|seconds/i.test(error.message)) return { error: "Wait a minute, then send again" };
  if (error && !quietLinkError(error.message)) console.error("link:", error.message);
  return { sent: true };
}

/** The code from the sign-in email. Signs in here, then goes on like any sign-in: the 2FA code first when there's
 *  an authenticator app, else where they were going. */
export async function verifyLink(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const code = cleanCode(form.get("code"));
  if (!email || !code) return { error: "Enter the code from the email" };
  const stop = await limited("code", email);
  if (stop) return { error: stop };
  const sb = await userClient();
  const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
  const addr = await ip();
  if (error || !data.user) {
    await audit({ workspaceId: null, actorKind: "user", actorLabel: email, action: "auth.sign_in_failed", meta: { reason: error?.code ?? "no_user", step: "email_code" }, ip: addr });
    return { error: codeError(error?.message) };
  }
  const next = safeNext(String(form.get("next") ?? ""));
  const gate = mfaGate({ aal: "aal1", verified: verifiedTotp(data.user.factors).length > 0, required: false, next: mfaNext(next, safeNext) });
  if (gate) redirect(gate);
  await audit({ workspaceId: await firstWorkspaceId(data.user.id), actorId: data.user.id, actorLabel: data.user.email ?? email, action: "auth.sign_in", meta: { method: "email_code" }, ip: addr });
  await noteSignIn({ userId: data.user.id, email: data.user.email ?? email, ip: addr });
  redirect(next);
}

/** "Forgot password?": emails a link that signs in and opens /reset. The answer is the same whether or not the
 * address has an account. */
export async function requestReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email" };
  const token = captchaToken(form);
  const missing = captchaMissing(token);
  if (missing) return { error: missing };
  const stop = await limited("reset", email);
  if (stop) return { error: stop };
  const sb = await userClient();
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent("/reset")}`, captchaToken: token });
  // A refused bot check is the visitor's to fix; any other error stays quiet, so the answer never tells who has an account.
  const bot = captchaError(error?.message);
  if (bot) return { error: bot };
  if (error) console.error("reset:", error.message);
  return { sent: true };
}

/** Sets a new password for the person the reset link signed in. */
export async function setPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const password = String(form.get("password") ?? "");
  const short = await weak(password);
  if (short) return { error: short };
  const sb = await userClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) return { error: "The link expired. Ask for a new one." };
  // The reset link alone is aal1: someone with 2FA enters a code before a new password.
  const { data: claims } = await sb.auth.getClaims();
  const gate = mfaGate({ aal: (claims?.claims?.aal as string | undefined) ?? null, verified: verifiedTotp(data.user.factors).length > 0, required: false, next: "/reset" });
  if (gate) redirect(gate);
  const { error } = await sb.auth.updateUser({ password });
  if (error) return { error: error.message };
  // Anyone else signed in with the old password is signed out; this device stays in.
  const { error: outErr } = await sb.auth.signOut({ scope: "others" });
  if (outErr) console.error("reset: sign out others:", outErr.message);
  await notePasswordChanged(data.user.email ?? null);
  await audit({ workspaceId: await firstWorkspaceId(data.user.id), actorId: data.user.id, actorLabel: data.user.email ?? null, action: "auth.password_reset", ip: await ip() });
  redirect("/calendar");
}

export async function signInWithGoogle(form?: FormData) {
  const sb = await userClient();
  const next = safeNext(String(form?.get("next") ?? ""));
  // Google's account picker every time, so someone with two Google accounts picks the right one.
  const { data, error } = await sb.auth.signInWithOAuth({ provider: "google", options: { queryParams: { prompt: "select_account" }, redirectTo: `${await origin()}/auth/callback${next === "/calendar" ? "" : `?next=${encodeURIComponent(next)}`}` } });
  if (error) throw new Error(error.message);
  redirect(data.url);
}

export async function signOut() {
  const sb = await userClient();
  const { data } = await sb.auth.getClaims();
  const c = data?.claims;
  if (c?.sub) await audit({ workspaceId: await firstWorkspaceId(c.sub), actorId: c.sub, actorLabel: (c.email as string | undefined) ?? null, action: "auth.sign_out", ip: await ip() });
  await sb.auth.signOut();
  redirect("/login");
}
