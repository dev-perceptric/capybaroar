// What the sign-in screens offer, read when a page is asked for, so turning an option on or off needs no rebuild.
// The image is built in GitHub Actions with only the Supabase address and key, so NEXT_PUBLIC_ flags set on the server
// never reached the browser; the pages pass these to AuthForm instead.
// - Google shows when the Google provider is on in Supabase Auth (its /settings, checked every 5 minutes).
//   GOOGLE_SIGNIN=0 hides it and GOOGLE_SIGNIN=1 shows it whatever Supabase says.
// - The Turnstile bot check shows when TURNSTILE_SITE_KEY is set (src/lib/captcha.ts).
import { turnstileKey } from "./captcha";

export type SigninOptions = { google: boolean; siteKey: string };
type Settings = { external?: Record<string, unknown> } | null;

/** Whether to show "Continue with Google". Pure, so tests/captcha.test.ts runs it. */
export function googleShown(env: Record<string, string | undefined>, settings: Settings): boolean {
  const flag = (env.GOOGLE_SIGNIN ?? env.NEXT_PUBLIC_GOOGLE_SIGNIN ?? "").trim();
  if (flag === "0") return false;
  if (flag === "1") return true;
  return settings?.external?.google === true;
}

export async function signinOptions(): Promise<SigninOptions> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const settings: Settings =
    url && key
      ? await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, next: { revalidate: 300 }, signal: AbortSignal.timeout(3000) })
          .then((r) => (r.ok ? (r.json() as Promise<Settings>) : null))
          .catch(() => null)
      : null;
  return { google: googleShown(process.env, settings), siteKey: turnstileKey() };
}
