// Sign-in by email link and code, the pure half (the actions are in src/app/login/actions.ts). Supabase Auth emails a
// link and a 6-digit code together: the link signs in this browser, the code works anywhere, so a link opened on a
// phone or used up by a mail scanner still gets someone in. Only for accounts that exist: new people sign up at
// /signup, where they accept the Terms. No Supabase or Next here, so tests/emailLink.test.ts runs it.

/** The digits someone typed, or "" when it can't be a code (6 to 10 digits, spaces and dashes ignored). */
export function cleanCode(input: unknown): string {
  const s = String(input ?? "").replace(/[\s-]/g, "");
  return /^\d{6,10}$/.test(s) ? s : "";
}

/** An error that would say whether the address has an account. The answer is "check your email" either way. */
export function quietLinkError(message: string | null | undefined): boolean {
  return /signups? not allowed|user not found|not registered|otp_disabled/i.test(message ?? "");
}

/** Supabase Auth's answer to a code, as one plain line. */
export function codeError(message: string | null | undefined): string {
  if (/expired|invalid|not found|otp/i.test(message ?? "")) return "That code didn't work. Check it or send a new one";
  if (/rate limit|too many/i.test(message ?? "")) return "Too many tries. Wait a few minutes";
  return "Couldn't check the code. Try again";
}

/** Where the link comes back to: the callback, with `next` when it isn't home. */
export const linkReturn = (origin: string, next: string) => `${origin}/auth/callback${next === "/calendar" ? "" : `?next=${encodeURIComponent(next)}`}`;
