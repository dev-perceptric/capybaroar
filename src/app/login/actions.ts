"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { userClient } from "@/lib/supabase/server";
import { trustedIp } from "@/lib/clientIp";
import { LIMITS, hashed, retryIn, takeAll } from "@/lib/limits";
import { safeNext } from "@/proxy";
import { currentPolicies } from "@/lib/policyRules";
import { recordAcceptance } from "@/lib/policies";

export type AuthState = { error?: string; sent?: boolean };

const MIN_PASSWORD = 8;

const origin = async () => {
  const h = await headers();
  return process.env.APP_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
};

const ip = async () => trustedIp(await headers());

/** Counts one try for the address and the visitor's IP; an error to show when either is over its limit. */
async function limited(kind: "login" | "reset" | "signup", email: string): Promise<string | null> {
  const addr = await ip();
  const list = [];
  if (kind === "login" && email) list.push({ bucket: hashed("login:email", email), l: LIMITS.loginEmail });
  if (kind === "reset" && email) list.push({ bucket: hashed("reset:email", email), l: LIMITS.resetEmail });
  // No IP (a proxy that didn't send one): only the address counts, so everyone isn't sharing one bucket.
  if (addr) list.push({ bucket: hashed(`${kind}:ip`, addr), l: kind === "login" ? LIMITS.loginIp : kind === "reset" ? LIMITS.resetIp : LIMITS.signupIp });
  const wait = await takeAll(list);
  return wait ? `Too many tries. ${retryIn(wait)}` : null;
}

const tooShort = (p: string) => (p.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : null);

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const stop = await limited("login", email);
  if (stop) return { error: stop };
  const sb = await userClient();
  const { error } = await sb.auth.signInWithPassword({ email, password: String(form.get("password") ?? "") });
  if (error) return { error: error.message };
  redirect(safeNext(String(form.get("next") ?? "")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const short = tooShort(password);
  if (short) return { error: short };
  if (form.get("agree") !== "yes") return { error: "Accept the Terms, Privacy Policy and Data Processing Agreement to continue" };
  const stop = await limited("signup", email);
  if (stop) return { error: stop };
  const sb = await userClient();
  const next = safeNext(String(form.get("next") ?? ""));
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { name: String(form.get("name") ?? "").trim(), company: String(form.get("company") ?? "").trim() },
      emailRedirectTo: `${await origin()}/auth/callback${next === "/calendar" ? "" : `?next=${encodeURIComponent(next)}`}`,
    },
  });
  if (error) return { error: error.message };
  // Proof of consent. An address that already has an account comes back with no identities: nothing to record.
  if (data.user?.id && data.user.identities?.length !== 0) await recordAcceptance(data.user.id, currentPolicies(), "signup").catch((e) => console.error("consent:", e instanceof Error ? e.message : e));
  if (!data.session) return { sent: true };
  redirect(next);
}

/** "Forgot password?": emails a link that signs in and opens /reset. The answer is the same whether or not the
 * address has an account. */
export async function requestReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email" };
  const stop = await limited("reset", email);
  if (stop) return { error: stop };
  const sb = await userClient();
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent("/reset")}` });
  if (error) console.error("reset:", error.message);
  return { sent: true };
}

/** Sets a new password for the person the reset link signed in. */
export async function setPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const password = String(form.get("password") ?? "");
  const short = tooShort(password);
  if (short) return { error: short };
  const sb = await userClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) return { error: "The link expired. Ask for a new one." };
  const { error } = await sb.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/calendar");
}

export async function signInWithGoogle(form?: FormData) {
  const sb = await userClient();
  const next = safeNext(String(form?.get("next") ?? ""));
  const { data, error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${await origin()}/auth/callback${next === "/calendar" ? "" : `?next=${encodeURIComponent(next)}`}` } });
  if (error) throw new Error(error.message);
  redirect(data.url);
}

export async function signOut() {
  const sb = await userClient();
  await sb.auth.signOut();
  redirect("/login");
}
