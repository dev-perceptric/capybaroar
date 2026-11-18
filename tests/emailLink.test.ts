// Sign-in by email link and code (src/lib/emailLink.ts). It proves: a typed code is read however it's spaced, junk is
// never sent to Supabase, errors that would tell who has an account stay quiet, code errors read as one plain line,
// and the link comes back to the callback with `next` only when it isn't home.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanCode, codeError, FROM_SIGNUP, LINK_NOTICE, linkNotice, linkReturn, linkTrouble, quietLinkError, signupReturn, troubleUrl } from "../src/lib/emailLink";

test("a code is 6 to 10 digits, with spaces and dashes ignored", () => {
  assert.equal(cleanCode("123456"), "123456");
  assert.equal(cleanCode(" 123 456 "), "123456");
  assert.equal(cleanCode("123-456"), "123456");
  assert.equal(cleanCode("12345"), "");
  assert.equal(cleanCode("12345a"), "");
  assert.equal(cleanCode("12345678901"), "");
  assert.equal(cleanCode(null), "");
});

test("an address with no account gets the same answer as one with an account", () => {
  assert.equal(quietLinkError("Signups not allowed for otp"), true);
  assert.equal(quietLinkError("User not found"), true);
  assert.equal(quietLinkError("Email rate limit exceeded"), false);
  assert.equal(quietLinkError(undefined), false);
});

test("code errors read as one plain line", () => {
  assert.equal(codeError("Token has expired or is invalid"), "That code didn't work. Check it or send a new one");
  assert.equal(codeError("Request rate limit reached"), "Too many tries. Wait a few minutes");
  assert.equal(codeError("fetch failed"), "Couldn't check the code. Try again");
});

test("the link comes back to the callback, with next only when it isn't home", () => {
  assert.equal(linkReturn("https://app.capybaroar.com", "/calendar"), "https://app.capybaroar.com/auth/callback");
  assert.equal(linkReturn("https://app.capybaroar.com", "/invite/abc?x=1"), "https://app.capybaroar.com/auth/callback?next=%2Finvite%2Fabc%3Fx%3D1");
});

// A link that comes back to /auth/callback and can't sign in (linkTrouble, troubleUrl, linkNotice). It proves: a
// confirm link opened in another browser says the email is confirmed, any other link opened there says so, errors on
// the address read as one plain line, a cancelled Google window says nothing, and people land on /login (or /reset)
// with `next` kept.
test("the confirm email comes back to the callback marked as a sign-up", () => {
  assert.equal(signupReturn("https://app.capybaroar.com", "/calendar"), "https://app.capybaroar.com/auth/callback?from=signup");
  assert.equal(signupReturn("https://app.capybaroar.com", "/invite/abc"), "https://app.capybaroar.com/auth/callback?from=signup&next=%2Finvite%2Fabc");
});

test("a link opened in another browser: the confirm email says the email is confirmed, others say where to sign in", () => {
  assert.equal(linkTrouble({ from: FROM_SIGNUP, exchange: "pkce_code_verifier_not_found" }), "confirmed");
  assert.equal(linkTrouble({ exchange: "pkce_code_verifier_not_found" }), "other");
  assert.equal(linkTrouble({ exchange: "flow_state_expired" }), "expired");
  assert.equal(linkTrouble({ exchange: "unexpected_failure" }), "failed");
  assert.equal(linkTrouble({ from: FROM_SIGNUP }), null);
  assert.equal(linkTrouble({}), null);
});

test("an error on the address reads as one line; a cancelled Google window says nothing", () => {
  assert.equal(linkTrouble({ error: "access_denied", errorCode: "otp_expired", errorDescription: "Email link is invalid or has expired" }), "expired");
  assert.equal(linkTrouble({ error: "server_error", errorDescription: "Database error" }), "failed");
  assert.equal(linkTrouble({ error: "access_denied", errorDescription: "The user cancelled the sign-in" }), null);
});

test("people land on /login with the line and next, or on /reset for a reset link", () => {
  assert.equal(troubleUrl("other", "/calendar"), "/login?link=other");
  assert.equal(troubleUrl("confirmed", "/invite/abc"), "/login?link=confirmed&next=%2Finvite%2Fabc");
  assert.equal(troubleUrl("other", "/reset"), "/reset?link=other");
  assert.equal(linkNotice("confirmed"), "Your email is confirmed. Sign in to continue.");
  assert.equal(linkNotice("other"), LINK_NOTICE.other);
  assert.match(linkNotice("other", true) ?? "", /Send a new one here/);
  assert.equal(linkNotice("toString"), undefined);
  assert.equal(linkNotice(undefined), undefined);
});
