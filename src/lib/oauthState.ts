// Connecting a channel, the pure checks. A sign-in with a network must finish in the same browser, by the same person,
// that started it: otherwise someone could send their own sign-in link to another person and collect that person's
// account into their workspace, or start a sign-in in another person's session from a link on another site.

/** The cookie holding the state of the sign-in this browser started. Read only by the network's callback. */
export const STATE_COOKIE = "cb_oauth";
export const STATE_PATH = "/integrations/social";
export const STATE_TTL_MS = 15 * 60 * 1000;

/**
 * Whether a connect request came from another site (a link or form elsewhere). Browsers send Sec-Fetch-Site; older ones
 * don't, so the Referer is checked then. A request with neither (typed or bookmarked) is allowed.
 */
export function fromAnotherSite(h: { get(name: string): string | null }, appOrigin: string): boolean {
  const site = h.get("sec-fetch-site");
  if (site) return site !== "same-origin" && site !== "none";
  const ref = h.get("referer");
  if (!ref) return false;
  try {
    return new URL(ref).origin !== appOrigin;
  } catch {
    return true;
  }
}

/** Why this callback can't be finished, or null when it can. */
export function callbackProblem(o: { state: string; cookieState: string | null | undefined; rowUserId: string | null | undefined; sessionUserId: string | null | undefined; createdAt: string | Date; now?: number }): string | null {
  if (!o.sessionUserId) return "Sign in to Capybaroar, then connect the channel again";
  if (!o.cookieState || o.cookieState !== o.state) return "Start connecting from Capybaroar in this browser";
  if (!o.rowUserId || o.rowUserId !== o.sessionUserId) return "This sign-in was started by someone else";
  if ((o.now ?? Date.now()) - new Date(o.createdAt).getTime() > STATE_TTL_MS) return "Sign-in expired, try again";
  return null;
}

/** A network's own error, as one fixed line: its text isn't shown, since anyone can put text in a link. */
export const networkError = (code: string | null) => (code === "access_denied" || code === "user_cancelled_login" || code === "user_cancelled_authorize" ? "Sign-in was cancelled" : "Sign-in didn't finish");
