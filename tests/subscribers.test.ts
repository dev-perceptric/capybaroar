// Subprocessor change notices: only plain addresses and well-formed link tokens get through, and every step sends the
// browser back to the subprocessors page with a known state.
import { test } from "node:test";
import assert from "node:assert/strict";
import { backTo, cleanEmail, cleanToken } from "../src/lib/subscriberRules";

test("addresses are trimmed, lowercased and checked", () => {
  assert.equal(cleanEmail("  Ana@Example.COM "), "ana@example.com");
  assert.equal(cleanEmail("a.b+tag@mail.example.co.uk"), "a.b+tag@mail.example.co.uk");
  for (const bad of ["", "no-at", "a@b", "a@b.c", "a b@c.com", "<x>@y.com", "a@b.com\nBcc: c@d.com", `${"a".repeat(250)}@x.com`, 42, null]) assert.equal(cleanEmail(bad), null, String(bad));
});

test("link tokens must be 32 base64url characters", () => {
  assert.equal(cleanToken("A".repeat(32)), "A".repeat(32));
  assert.equal(cleanToken("a-b_".repeat(8)), "a-b_".repeat(8));
  for (const bad of ["", "A".repeat(31), "A".repeat(33), "A".repeat(31) + "=", "../" + "A".repeat(29), null]) assert.equal(cleanToken(bad), null);
});

test("every step goes back to the subprocessors page", () => {
  assert.equal(backTo("https://capybaroar.com/", "check"), "https://capybaroar.com/subprocessors?subscribed=check");
  assert.equal(backTo("https://capybaroar.com", "off"), "https://capybaroar.com/subprocessors?subscribed=off");
});
