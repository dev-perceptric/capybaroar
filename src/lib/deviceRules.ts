// New-device sign-in alerts, the pure half (src/lib/devices.ts does the database and email). Pure, so
// tests/signin.test.ts runs it.

/** A device id from the cookie, or "" when it isn't one of ours. */
export const cleanDevice = (v: string | undefined | null) => (v && /^[A-Za-z0-9_-]{16,64}$/.test(v) ? v : "");

/** "Chrome on Mac" from a browser's user agent, for the email and Settings. */
export function deviceLabel(ua: string): string {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "A browser";
  const os = /iPhone|iPad|iPod/.test(ua) ? "iPhone or iPad" : /Android/.test(ua) ? "Android" : /Mac OS X|Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

/** Whether this sign-in gets an email: a device not seen before, and not the person's very first one. */
export const alertFor = (known: string[], device: string) => known.length > 0 && !known.includes(device);

/** The new-device email. */
export function newDeviceMail(o: { device: string; ip: string; when: Date; appUrl: string }) {
  const when = o.when.toUTCString().replace(" GMT", " UTC");
  return {
    subject: "New sign-in to your Capybaroar account",
    title: "New sign-in to your account",
    body: `Someone signed in on ${o.device}${o.ip ? ` from ${o.ip}` : ""} at ${when}. If this was you, you can ignore this email. If it wasn't, reset your password now and turn on two-factor sign-in in Settings.`,
    button: "Reset your password",
    href: `${o.appUrl.replace(/\/$/, "")}/reset`,
  };
}

/** The email after a password change. */
export function passwordChangedMail(o: { when: Date; appUrl: string }) {
  return {
    subject: "Your Capybaroar password was changed",
    title: "Your password was changed",
    body: `Your password was changed at ${o.when.toUTCString().replace(" GMT", " UTC")}, and every other device was signed out. If this wasn't you, reset your password now.`,
    button: "Reset your password",
    href: `${o.appUrl.replace(/\/$/, "")}/reset`,
  };
}
