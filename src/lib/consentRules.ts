/** Cookie consent, shared with the website (site/public/consent.js writes the same cookie). One cookie on
 * .capybaroar.com holds the choice, so a choice on the site counts in the app and back. Needed cookies are always on;
 * analytics stays off until someone allows it. Pure, so tests/consent.test.ts can check it. */
export const CONSENT_COOKIE = "cb_consent";
export const CONSENT_VERSION = "1";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 6 months, then we ask again

export type Consent = { analytics: boolean };

/** The saved choice from a document.cookie string, or null when there is none (or it's from an older version). */
export function readConsent(cookie: string): Consent | null {
  const m = cookie.match(/(?:^|;\s*)cb_consent=([^;]+)/);
  if (!m) return null;
  let v = m[1];
  try {
    v = decodeURIComponent(v);
  } catch {
    return null;
  }
  const [ver, pick] = v.split(".");
  if (ver !== CONSENT_VERSION || (pick !== "a" && pick !== "n")) return null;
  return { analytics: pick === "a" };
}

/** The Set-Cookie line for a choice. The Domain is only added on capybaroar.com, so local runs still work. */
export function consentCookie(c: Consent, hostname: string, https: boolean): string {
  const dom = /(^|\.)capybaroar\.com$/.test(hostname) ? "; Domain=.capybaroar.com" : "";
  return `${CONSENT_COOKIE}=${CONSENT_VERSION}.${c.analytics ? "a" : "n"}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${dom}${https ? "; Secure" : ""}`;
}

/** Public pages people's own audiences open (link-in-bio, short links, client review links) don't show the banner:
 * they set no cookies of ours. */
export const consentHidden = (path: string) => /^\/(b|l|r|review|oauth|api)(\/|$)/.test(path);
