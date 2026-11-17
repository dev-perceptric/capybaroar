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

test("the new-device email links to Sign out everywhere and says where", () => {
  const m = newDeviceMail({ device: "Chrome on Mac", ip: "9.9.9.9", when: new Date("2026-11-17T15:00:00Z"), appUrl: "https://app.capybaroar.com/", token: "abc.def" });
  assert.equal(m.href, "https://app.capybaroar.com/secure/abc.def");
  assert.match(m.body, /Chrome on Mac from 9\.9\.9\.9 at Tue, 17 Nov 2026 15:00:00 UTC/);
});

import { readSecureToken, secureToken } from "../src/lib/deviceRules.ts";

test("the This wasn't me link works only as signed, unchanged and in time", () => {
  const key = "k".repeat(32);
  const now = new Date("2026-11-17T12:00:00Z");
  const user = "11111111-1111-1111-1111-111111111111";
  const t = secureToken({ userId: user, device: "dev-aaaaaaaaaaaaaaaa", now }, key);
  assert.deepEqual(readSecureToken(t, key, now), { userId: user, device: "dev-aaaaaaaaaaaaaaaa" });
  // Another key, a changed body, a changed signature, too late, or junk: refused.
  assert.equal(readSecureToken(t, "x".repeat(32), now), null);
  const [body, mac] = t.split(".");
  const other = Buffer.from(JSON.stringify({ u: "22222222-2222-2222-2222-222222222222", d: "dev-aaaaaaaaaaaaaaaa", e: 9999999999 })).toString("base64url");
  assert.equal(readSecureToken(`${other}.${mac}`, key, now), null);
  assert.equal(readSecureToken(`${body}.${mac!.slice(0, -2)}xx`, key, now), null);
  assert.equal(readSecureToken(t, key, new Date("2026-11-25T12:00:00Z")), null);
  assert.equal(readSecureToken("nope", key, now), null);
  assert.equal(readSecureToken(t, "", now), null);
});
