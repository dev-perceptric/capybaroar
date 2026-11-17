// The bot check on sign-in, sign-up and "Forgot password?" (src/lib/captcha.ts). It proves: the form's token is read
// and trimmed, a try with the check on and no token waits, the check off never blocks, and only Supabase's captcha
// refusals turn into the bot-check line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { captchaError, captchaMissing, captchaToken, NEEDS_CHECK, turnstileKey } from "../src/lib/captcha";

const form = (v: unknown) => ({ get: (name: string) => (name === "captchaToken" ? v : null) });

test("the token comes from the form's hidden field", () => {
  assert.equal(captchaToken(form(" abc ")), "abc");
  assert.equal(captchaToken(form("")), undefined);
  assert.equal(captchaToken(form(null)), undefined);
  assert.equal(captchaToken(form(new Blob())), undefined);
  assert.equal(captchaToken(form("x".repeat(5000)))?.length, 4096);
});

test("with the check on, a try waits for its token; with it off, nothing waits", () => {
  const on = { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAA" };
  assert.equal(turnstileKey(on), "0x4AAA");
  assert.equal(captchaMissing(undefined, on), NEEDS_CHECK);
  assert.equal(captchaMissing("tok", on), null);
  assert.equal(captchaMissing(undefined, {}), null);
  assert.equal(captchaMissing(undefined, { NEXT_PUBLIC_TURNSTILE_SITE_KEY: "  " }), null);
});

test("only Supabase's captcha refusals become the bot-check line", () => {
  assert.match(captchaError("captcha protection: request disallowed (timeout-or-duplicate)") ?? "", /security check/);
  assert.equal(captchaError("Invalid login credentials"), null);
  assert.equal(captchaError(undefined), null);
});
