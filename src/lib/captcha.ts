// Cloudflare Turnstile on sign-in, sign-up and "Forgot password?". The widget (src/components/Turnstile.tsx) puts a
// one-time token in the form; the server actions hand it to Supabase Auth, which checks it with Cloudflare when bot
// protection is on (Supabase, Authentication, Attack Protection, Turnstile, with the same keys).
// On only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Pure, so tests/captcha.test.ts runs it.

export const turnstileKey = (env: Record<string, string | undefined> = process.env) => env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

/** The token the widget left in the form, or undefined when there's none. */
export function captchaToken(form: { get(name: string): unknown }): string | undefined {
  const v = form.get("captchaToken");
  return typeof v === "string" && v.trim() ? v.trim().slice(0, 4096) : undefined;
}

export const NEEDS_CHECK = "Wait for the security check to finish, then try again";
const FAILED = "The security check didn't pass. Try again";

/** Why a try can't go ahead yet: the check is on and its token hasn't arrived. null when it may. */
export function captchaMissing(token: string | undefined, env: Record<string, string | undefined> = process.env): string | null {
  return turnstileKey(env) && !token ? NEEDS_CHECK : null;
}

/** Supabase Auth's answer when it refused the token, as a line to show. null for any other error. */
export function captchaError(message: string | null | undefined): string | null {
  return /captcha/i.test(message ?? "") ? FAILED : null;
}
