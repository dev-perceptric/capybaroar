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

import { alertFor, cleanDevice, deviceLabel, newDeviceMail } from "../src/lib/deviceRules.ts";

test("a new device gets an email, but not the first one or a known one", () => {
  assert.equal(alertFor([], "dev-aaaaaaaaaaaaaaaa"), false);
  assert.equal(alertFor(["dev-aaaaaaaaaaaaaaaa"], "dev-aaaaaaaaaaaaaaaa"), false);
  assert.equal(alertFor(["dev-aaaaaaaaaaaaaaaa"], "dev-bbbbbbbbbbbbbbbb"), true);
});

test("device ids and labels are read safely", () => {
  assert.equal(cleanDevice("short"), "");
  assert.equal(cleanDevice("<script>alert(1)</script>xxxxxx"), "");
  assert.equal(cleanDevice("abcDEF0123456789_-xy"), "abcDEF0123456789_-xy");
  assert.equal(cleanDevice(undefined), "");
  assert.equal(deviceLabel("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"), "Chrome on Mac");
  assert.equal(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"), "Safari on iPhone or iPad");
  assert.equal(deviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0"), "Edge on Windows");
  assert.equal(deviceLabel(""), "A browser");
});

test("the new-device email links to the reset page and says where", () => {
  const m = newDeviceMail({ device: "Chrome on Mac", ip: "9.9.9.9", when: new Date("2026-11-17T15:00:00Z"), appUrl: "https://app.capybaroar.com/" });
  assert.equal(m.href, "https://app.capybaroar.com/reset");
  assert.match(m.body, /Chrome on Mac from 9\.9\.9\.9 at Tue, 17 Nov 2026 15:00:00 UTC/);
});
