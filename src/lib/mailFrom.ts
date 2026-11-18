// Who the app's own emails (alerts, reports, invites) come from. Pure, so tests/mailFrom.test.ts runs it.
//
// Resend only sends from an address on a domain verified in the same Resend team as SMTP_PASS's key: for Capybaroar
// that's mail.capybaroar.com in the "arrowsterr" team (ops/vps/CHECKLIST.md, step 4). SMTP_USER is "resend" there, not
// an address, so it never stands in for one.

export const DEFAULT_FROM = "Capybaroar <hello@mail.capybaroar.com>";

const isAddress = (v: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v) || /^[^<>]*<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/.test(v);

/** ALERT_FROM, else SMTP_ADMIN_EMAIL (with the sender name), else SMTP_USER when it's an address, else the default. */
export function mailFrom(env: Record<string, string | undefined> = process.env): string {
  const pick = (v: string | undefined) => (v && isAddress(v.trim()) ? v.trim() : "");
  const admin = pick(env.SMTP_ADMIN_EMAIL);
  return pick(env.ALERT_FROM) || (admin ? (admin.includes("<") ? admin : `${env.SMTP_SENDER_NAME?.trim() || "Capybaroar"} <${admin}>`) : "") || pick(env.SMTP_USER) || DEFAULT_FROM;
}
