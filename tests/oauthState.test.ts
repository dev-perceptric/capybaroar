// Connecting a channel: a sign-in finishes only in the browser and for the person that started it, a connect started
// from another site is refused, and a network's error text never reaches the page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { callbackProblem, fromAnotherSite, networkError } from "../src/lib/oauthState";

const h = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null });
const APP = "https://app.capybaroar.com";

test("connect from the app or typed in is allowed; from another site is refused", () => {
  assert.equal(fromAnotherSite(h({ "sec-fetch-site": "same-origin" }), APP), false);
  assert.equal(fromAnotherSite(h({ "sec-fetch-site": "none" }), APP), false);
  assert.equal(fromAnotherSite(h({ "sec-fetch-site": "cross-site" }), APP), true);
  assert.equal(fromAnotherSite(h({ "sec-fetch-site": "same-site" }), APP), true);
  assert.equal(fromAnotherSite(h({ referer: `${APP}/channels` }), APP), false);
  assert.equal(fromAnotherSite(h({ referer: "https://evil.example/x" }), APP), true);
  assert.equal(fromAnotherSite(h({ referer: "not a url" }), APP), true);
  assert.equal(fromAnotherSite(h({}), APP), false);
});

test("the callback finishes only for the same person in the same browser, in time", () => {
  const ok = { state: "s1", cookieState: "s1", rowUserId: "u1", sessionUserId: "u1", createdAt: new Date(Date.now() - 60_000) };
  assert.equal(callbackProblem(ok), null);
  // Someone sends their own sign-in link to another person: that person's browser has no matching cookie.
  assert.match(callbackProblem({ ...ok, cookieState: null })!, /this browser/);
  assert.match(callbackProblem({ ...ok, cookieState: "other" })!, /this browser/);
  // The cookie matches but the signed-in person isn't the one who started it.
  assert.match(callbackProblem({ ...ok, sessionUserId: "u2" })!, /someone else/);
  assert.match(callbackProblem({ ...ok, sessionUserId: null })!, /Sign in/);
  assert.match(callbackProblem({ ...ok, rowUserId: null })!, /someone else/);
  assert.match(callbackProblem({ ...ok, createdAt: new Date(Date.now() - 16 * 60_000) })!, /expired/);
});

test("a network's error text is never shown as is", () => {
  assert.equal(networkError("access_denied"), "Sign-in was cancelled");
  assert.equal(networkError("server_error"), "Sign-in didn't finish");
  assert.equal(networkError(null), "Sign-in didn't finish");
});
