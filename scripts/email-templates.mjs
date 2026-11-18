// Writes the sign-in emails Supabase Auth sends (public/email-templates/*.html), all in the house style of the app's
// own emails (src/lib/alerts.ts: the wordmark, a yellow button with a black edge). Supabase Auth loads them from
// https://app.capybaroar.com/email-templates/<name>.html (ops/vps/docker-compose.override.yml) and fills in
// {{ .ConfirmationURL }}, {{ .Token }}, {{ .Email }} and {{ .NewEmail }}. Change the words here and run
// `npm run email-templates`; never edit the HTML files by hand. tests/emailTemplates.test.ts checks them.
import { writeFileSync, mkdirSync } from "node:fs";

const LOGO = "https://capybaroar.com/brand/wordmark-light@2x.png";
const INK = "#0A0A0A";
const MUTED = "#737373";

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** One email: logo, title, a line or two, an optional button, an optional code, and a quiet note at the bottom. */
function page({ title, preview, lines, button, code, note }) {
  const p = (t) => `<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:${MUTED}">${t}</p>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(title)}</title>
</head>
<!-- Made by scripts/email-templates.mjs. Edit that file, not this one. -->
<body style="margin:0;padding:24px 16px;background:#FFFFFF;font-family:Inter,Helvetica,Arial,sans-serif;color:${INK}">
<span style="display:none;max-height:0;overflow:hidden">${esc(preview)}</span>
<div style="max-width:520px">
<p style="margin:0 0 24px"><img src="${LOGO}" width="136" height="24" alt="Capybaroar" style="display:block;border:0;width:136px;height:auto"></p>
<h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:${INK}">${esc(title)}</h1>
${lines.map(p).join("\n")}
${button ? `<p style="margin:0 0 20px"><a href="${button.href}" style="display:inline-block;background:#FFE100;color:${INK};border:1px solid ${INK};padding:10px 16px;text-decoration:none;font-weight:600;font-size:13px">${esc(button.label)}</a></p>` : ""}
${code ? `<p style="margin:0 0 6px;font-size:12px;color:${MUTED}">${esc(code.label)}</p>
<p style="margin:0 0 20px"><span style="display:inline-block;border:1px solid ${INK};padding:8px 14px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:22px;letter-spacing:6px;font-weight:600;color:${INK}">{{ .Token }}</span></p>` : ""}
<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #EDEDED;font-size:12px;line-height:1.55;color:${MUTED}">${esc(note)}</p>
</div>
</body>
</html>
`;
}

const URL = "{{ .ConfirmationURL }}";
const ignore = (what) => `If you didn't ${what}, you can ignore this email. Your account stays as it is.`;

// name: [file, subject (for the override), email]
export const EMAILS = {
  confirmation: [
    "Confirm your email for Capybaroar",
    { title: "Confirm your email", preview: "One click to finish setting up Capybaroar.", lines: ["Welcome to Capybaroar. Confirm {{ .Email }} to finish setting up your account. The link works once, for 1 hour."], button: { label: "Confirm email", href: URL }, note: ignore("sign up") },
  ],
  "magic-link": [
    "{{ .Token }} is your Capybaroar sign-in code",
    { title: "Sign in to Capybaroar", preview: "Your sign-in link and code. Both work once, for 1 hour.", lines: ["Use the button or the code to sign in as {{ .Email }}. Both work once, for 1 hour."], button: { label: "Sign in", href: URL }, code: { label: "Or enter this code" }, note: ignore("ask to sign in") },
  ],
  recovery: [
    "Reset your Capybaroar password",
    { title: "Reset your password", preview: "Choose a new password. The link works for 1 hour.", lines: ["We got a request to reset the password for {{ .Email }}. The link works once, for 1 hour."], button: { label: "Choose a new password", href: URL }, note: "If you didn't ask for this, your password stays the same. Someone may have typed your email by mistake." },
  ],
  invite: [
    "You're invited to Capybaroar",
    { title: "You're invited to Capybaroar", preview: "Join your team on Capybaroar.", lines: ["You were invited to a team on Capybaroar. It plans and schedules posts to every social channel from one calendar."], button: { label: "Accept the invite", href: URL }, note: ignore("expect this invite") },
  ],
  "email-change": [
    "Confirm your new Capybaroar email",
    { title: "Confirm your new email", preview: "One click to use this address for Capybaroar.", lines: ["Confirm {{ .NewEmail }} as the new email for your Capybaroar account (now {{ .Email }})."], button: { label: "Confirm new email", href: URL }, note: "If you didn't ask for this, don't click the button, and change your password in Settings." },
  ],
  reauthentication: [
    "{{ .Token }} is your Capybaroar security code",
    { title: "Your security code", preview: "Enter it to finish the change you started.", lines: ["Enter this code in Capybaroar to finish the change you started, like a new password."], code: { label: "Security code" }, note: ignore("start a change") },
  ],
};

/** The HTML for one email, by name. */
export const render = (name) => page(EMAILS[name][1]);

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync("public/email-templates", { recursive: true });
  for (const name of Object.keys(EMAILS)) writeFileSync(`public/email-templates/${name}.html`, render(name));
  console.log(`Wrote ${Object.keys(EMAILS).length} templates to public/email-templates/`);
}
