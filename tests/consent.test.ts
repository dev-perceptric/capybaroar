// Cookie consent: the app reads and writes the same cookie as the website, asks again for an old or broken value,
// and stays off the public pages people's own audiences open.
import { test } from "node:test";
import assert from "node:assert/strict";
import { consentCookie, consentHidden, readConsent } from "../src/lib/consentRules";

test("nothing is read until a choice is saved", () => {
  assert.equal(readConsent(""), null);
  assert.equal(readConsent("cb_ws=abc; cb_brand=x"), null);
});

test("a yes and a no are read", () => {
  assert.deepEqual(readConsent("cb_ws=abc; cb_consent=1.a"), { analytics: true });
  assert.deepEqual(readConsent("cb_consent=1.n; cb_ws=abc"), { analytics: false });
});

test("an old version or a broken value asks again", () => {
  assert.equal(readConsent("cb_consent=0.a"), null);
  assert.equal(readConsent("cb_consent=1.x"), null);
  assert.equal(readConsent("cb_consent=%E0%A4%A"), null);
  assert.equal(readConsent("xcb_consent=1.a"), null);
});

test("the cookie is shared on capybaroar.com and reads back", () => {
  const c = consentCookie({ analytics: false }, "app.capybaroar.com", true);
  assert.equal(c, "cb_consent=1.n; Max-Age=15552000; Path=/; SameSite=Lax; Domain=.capybaroar.com; Secure");
  assert.deepEqual(readConsent(c.split(";")[0]), { analytics: false });
});

test("no domain locally or on look-alike hosts", () => {
  assert.equal(consentCookie({ analytics: true }, "localhost", false), "cb_consent=1.a; Max-Age=15552000; Path=/; SameSite=Lax");
  assert.ok(!consentCookie({ analytics: true }, "evilcapybaroar.com", true).includes("Domain"));
});

test("public pages don't show the banner", () => {
  for (const p of ["/b/maya", "/l/abc", "/r/x", "/review/tok", "/api/v1/posts", "/oauth/authorize"]) assert.equal(consentHidden(p), true, p);
  for (const p of ["/login", "/signup", "/calendar", "/bio", "/reports", "/"]) assert.equal(consentHidden(p), false, p);
});
