// The sign-in emails (scripts/email-templates.mjs → public/email-templates) and the app's sender (src/lib/mailFrom.ts).
// They prove: every email has the links or codes Supabase Auth fills in; the HTML on disk is what the script makes;
// ops/vps/docker-compose.override.yml points Supabase Auth at every one, with the same subject; and the app's emails
// never come from "resend" (SMTP_USER), which Resend refuses.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EMAILS, render } from "../scripts/email-templates.mjs";
import { DEFAULT_FROM, mailFrom } from "../src/lib/mailFrom";

const file = (name: string) => readFileSync(new URL(`../public/email-templates/${name}.html`, import.meta.url), "utf8");
const override = readFileSync(new URL("../ops/vps/docker-compose.override.yml", import.meta.url), "utf8");
const ENV: Record<string, string> = { confirmation: "CONFIRMATION", "magic-link": "MAGIC_LINK", recovery: "RECOVERY", invite: "INVITE", "email-change": "EMAIL_CHANGE", reauthentication: "REAUTHENTICATION" };

test("every email has what Supabase Auth fills in, and nothing left over", () => {
  for (const name of Object.keys(EMAILS)) {
    const html = file(name);
    assert.match(html, /wordmark-light@2x\.png/, name);
    if (name === "reauthentication") assert.match(html, /\{\{ \.Token \}\}/, name);
    else assert.match(html, /href="\{\{ \.ConfirmationURL \}\}"/, name);
    if (name === "magic-link") assert.match(html, /\{\{ \.Token \}\}/, name);
    if (name === "email-change") assert.match(html, /\{\{ \.NewEmail \}\}/, name);
    assert.doesNotMatch(html, /undefined|\[object/, name);
    assert.equal(html, render(name), `${name}.html is out of date: run npm run email-templates`);
  }
});

test("Supabase Auth loads every email from the app, with the script's subject", () => {
  for (const [name, [subject]] of Object.entries(EMAILS) as [string, [string, unknown]][]) {
    const key = ENV[name];
    assert.ok(key, name);
    assert.ok(override.includes(`GOTRUE_MAILER_TEMPLATES_${key}: "https://app.capybaroar.com/email-templates/${name}.html"`), name);
    assert.ok(override.includes(`GOTRUE_MAILER_SUBJECTS_${key}: "${subject}"`), name);
  }
  assert.match(override, /GOTRUE_MAILER_OTP_EXP: "3600"/);
});

test("the app's emails come from a real address, never from SMTP_USER=resend", () => {
  assert.equal(mailFrom({ SMTP_USER: "resend" }), DEFAULT_FROM);
  assert.equal(mailFrom({}), DEFAULT_FROM);
  assert.equal(mailFrom({ ALERT_FROM: "Capybaroar <hello@mail.capybaroar.com>", SMTP_USER: "resend" }), "Capybaroar <hello@mail.capybaroar.com>");
  assert.equal(mailFrom({ SMTP_ADMIN_EMAIL: "hello@mail.capybaroar.com", SMTP_SENDER_NAME: "Capybaroar" }), "Capybaroar <hello@mail.capybaroar.com>");
  assert.equal(mailFrom({ SMTP_ADMIN_EMAIL: "hello@mail.capybaroar.com" }), "Capybaroar <hello@mail.capybaroar.com>");
  assert.equal(mailFrom({ ALERT_FROM: "not an address", SMTP_USER: "ops@mail.capybaroar.com" }), "ops@mail.capybaroar.com");
});
