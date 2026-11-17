// Sign-in and sign-up checks (src/lib/passwordCheck.ts, src/lib/emailTypos.ts, src/lib/disposable.ts). They prove: weak
// passwords are caught and good ones pass, common email slips get the right fix while real addresses are left alone,
// and throwaway inboxes are refused at any subdomain while real providers are not.
import { test } from "node:test";
import assert from "node:assert/strict";
import { strength } from "../src/lib/passwordCheck.ts";
import { suggestEmail } from "../src/lib/emailTypos.ts";
import { isDisposable } from "../src/lib/disposable.ts";

test("weak passwords score low and good ones pass", () => {
  for (const p of ["password1", "capybaroar123", "12345678", "aaaaaaaa", "short"]) assert.equal(strength(p).score, 1, p);
  assert.ok(strength("abcd1234efgh").score <= 2);
  assert.ok(strength("Plum-Harbor-Window-42").score >= 3);
  assert.equal(strength("").score, 0);
});

test("common email slips get the right fix; real addresses are left alone", () => {
  assert.equal(suggestEmail("ana@gmial.com"), "ana@gmail.com");
  assert.equal(suggestEmail("ana@acme.con"), "ana@acme.com");
  for (const e of ["ana@gmail.com", "ana@acme.com", "ana@mail.com", "ana@hp.com", "ana"]) assert.equal(suggestEmail(e), "", e);
});

test("throwaway inboxes are refused, real providers are not", () => {
  assert.equal(isDisposable("x@mailinator.com"), true);
  assert.equal(isDisposable("x@sub.mailinator.com"), true);
  assert.equal(isDisposable("X@MAILINATOR.COM "), true);
  for (const e of ["ana@gmail.com", "ana@acme.com", "ana@outlook.com", "bad"]) assert.equal(isDisposable(e), false, e);
});
