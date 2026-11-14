// Consent to the Terms, Privacy Policy and DPA: a person is asked again exactly when a document's version changes,
// only the current versions can be recorded, and the shipped policies file is well formed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptedNow, currentPolicies, firstTime, stillToAccept } from "../src/lib/policyRules";

const cur = currentPolicies({
  terms: { title: "Terms", version: "2026-11-14", url: "https://x/terms" },
  privacy: { title: "Privacy", version: "2026-11-14", url: "https://x/privacy" },
  dpa: { title: "DPA", version: "2026-12-01", url: "https://x/dpa" },
});

test("up to date: nothing to accept; a changed version is asked again", () => {
  const all = cur.map((p) => ({ document: p.doc, version: p.version }));
  assert.deepEqual(stillToAccept(all, cur), []);
  const oldDpa = [...all.slice(0, 2), { document: "dpa", version: "2026-11-14" }];
  assert.deepEqual(stillToAccept(oldDpa, cur).map((p) => p.doc), ["dpa"]);
  assert.deepEqual(stillToAccept([], cur).map((p) => p.doc), ["terms", "privacy", "dpa"]);
  assert.equal(firstTime([]), true);
  assert.equal(firstTime(all), false);
});

test("only the current versions can be recorded as accepted", () => {
  assert.deepEqual(acceptedNow({ terms: "2026-11-14", privacy: "2026-11-14", dpa: "2026-12-01" }, cur)?.length, 3);
  assert.deepEqual(acceptedNow({ dpa: "2026-12-01" }, cur)?.map((p) => p.doc), ["dpa"]);
  assert.equal(acceptedNow({ dpa: "2026-11-14" }, cur), null);
  assert.equal(acceptedNow({ terms: "anything" }, cur), null);
  assert.equal(acceptedNow(null, cur), null);
  assert.equal(acceptedNow("terms", cur), null);
});

test("the shipped policies file has every document with a version and a link", () => {
  for (const p of currentPolicies()) {
    assert.match(p.version, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(p.url, /^https:\/\/capybaroar\.com\//);
    assert.ok(p.title);
  }
});
