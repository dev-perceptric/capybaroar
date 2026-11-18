// Sign-in by email link and code (src/lib/emailLink.ts). It proves: a typed code is read however it's spaced, junk is
// never sent to Supabase, errors that would tell who has an account stay quiet, code errors read as one plain line,
// and the link comes back to the callback with `next` only when it isn't home.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanCode, codeError, linkReturn, quietLinkError } from "../src/lib/emailLink";

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
