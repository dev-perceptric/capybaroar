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

// A link that comes back to /auth/callback and can't sign in. Email links use PKCE: the browser that asked for the email
// keeps the other half of the code in a cookie, so a link opened in another browser or on another device verifies the
// email but can't sign in there. The callback sends people to /login (or /reset) with ?link=<kind>, and the page says
// what to do in one line. The confirm email comes back with ?from=signup, so its line can say the email is confirmed.

/** Added to the confirm email's return address. */
export const FROM_SIGNUP = "signup";

/** Where the confirm email comes back to: the callback, marked as a sign-up, with `next` when it isn't home. */
export const signupReturn = (origin: string, next: string) => `${origin}/auth/callback?${new URLSearchParams({ from: FROM_SIGNUP, ...(next === "/calendar" ? {} : { next }) })}`;

export type LinkTrouble = "confirmed" | "other" | "expired" | "failed";

/** One plain line for each kind, shown above the sign-in form. */
export const LINK_NOTICE: Record<LinkTrouble, string> = {
  confirmed: "Your email is confirmed. Sign in to continue.",
  other: "That link opened in a different browser. Sign in here, or open it where you asked for it.",
  expired: "That link has expired or was already used. Sign in, or send a new one.",
  failed: "Sign-in didn't finish. Try again.",
};

/** The line for /login?link=<kind> (or /reset?link=<kind> with `reset`), or undefined for anything else. */
export function linkNotice(kind: string | null | undefined, reset = false): string | undefined {
  if (!kind || !Object.hasOwn(LINK_NOTICE, kind)) return undefined;
  if (reset && kind === "other") return "That link opened in a different browser. Send a new one here, or open it where you asked for it.";
  return LINK_NOTICE[kind as LinkTrouble];
}

/**
 * Why the callback couldn't sign in, or null when nothing went wrong. `error`, `errorCode` and `errorDescription` are
 * what Supabase Auth put on the address; `exchange` is the code swap's error code when it failed.
 */
export function linkTrouble(p: { error?: string | null; errorCode?: string | null; errorDescription?: string | null; from?: string | null; exchange?: string | null }): LinkTrouble | null {
  const signup = p.from === FROM_SIGNUP;
  if (p.error || p.errorCode || p.errorDescription) {
    const said = `${p.errorCode ?? ""} ${p.errorDescription ?? ""}`.toLowerCase();
    // Closing Google's window: back to the form, nothing to explain.
    if (p.error === "access_denied" && /cancel|denied by user/.test(said)) return null;
    if (/otp_expired|expired|invalid|already/.test(said)) return "expired";
    return "failed";
  }
  if (p.exchange === undefined || p.exchange === null) return null;
  // The email was confirmed before the link came back here, whatever the swap said.
  if (signup) return "confirmed";
  if (p.exchange === "pkce_code_verifier_not_found") return "other";
  return /expired|flow_state|bad_code_verifier|invalid/.test(p.exchange) ? "expired" : "failed";
}

/** Where the callback sends someone it couldn't sign in: /login with the line and `next`, or /reset for a reset link. */
export function troubleUrl(kind: LinkTrouble, next: string): string {
  if (next.startsWith("/reset")) return `/reset?${new URLSearchParams({ link: kind })}`;
  return `/login?${new URLSearchParams({ link: kind, ...(next === "/calendar" ? {} : { next }) })}`;
}
