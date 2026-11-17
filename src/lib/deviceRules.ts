// New-device sign-in alerts, the pure half (src/lib/devices.ts does the database and email). Pure, so
// tests/signin.test.ts runs it.

import { createHmac, timingSafeEqual } from "node:crypto";

/** How long the "This wasn't me" link in the email works. */
export const SECURE_DAYS = 7;

const sign = (body: string, key: string) => createHmac("sha256", key).update(`secure:${body}`).digest("base64url");

/** The "This wasn't me" link's token: who, which device and until when, signed with the server's key. */
export function secureToken(o: { userId: string; device: string; now: Date }, key: string): string {
  const exp = Math.floor(o.now.getTime() / 1000) + SECURE_DAYS * 86400;
  const body = Buffer.from(JSON.stringify({ u: o.userId, d: o.device, e: exp })).toString("base64url");
  return `${body}.${sign(body, key)}`;
}

/** The person and device a token is for, or null when it's forged, changed or expired. */
export function readSecureToken(token: string, key: string, now: Date): { userId: string; device: string } | null {
  if (!key || typeof token !== "string" || token.length > 600) return null;
  const [body, mac, extra] = token.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const want = Buffer.from(sign(body, key));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const v = JSON.parse(Buffer.from(body, "base64url").toString()) as { u?: unknown; d?: unknown; e?: unknown };
    if (typeof v.u !== "string" || !/^[0-9a-f-]{36}$/.test(v.u) || typeof v.d !== "string" || typeof v.e !== "number") return null;
    if (v.e * 1000 < now.getTime()) return null;
    return { userId: v.u, device: v.d };
  } catch {
    return null;
  }
}

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
export function newDeviceMail(o: { device: string; ip: string; when: Date; appUrl: string; token: string }) {
  const when = o.when.toUTCString().replace(" GMT", " UTC");
  return {
    subject: "New sign-in to your Capybaroar account",
    title: "New sign-in to your account",
    body: `Someone signed in on ${o.device}${o.ip ? ` from ${o.ip}` : ""} at ${when}. If this was you, you can ignore this email. If it wasn't, use the button to sign out on every device, then set a new password and turn on two-factor sign-in in Settings.`,
    button: "This wasn't me",
    href: `${o.appUrl.replace(/\/$/, "")}/secure/${o.token}`,
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
