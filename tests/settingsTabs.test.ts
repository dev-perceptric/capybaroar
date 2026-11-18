// Settings tabs. The page reads only the open tab's data, so the server and the browser must agree on which tab an
// address opens. They prove: managers see every tab in the same order as before, other members see only Your account,
// a tab someone can't see (or a made-up one) opens their first tab, and `?tab=a&tab=b` uses the first.
import { test } from "node:test";
import assert from "node:assert/strict";
import { knownTab, openTab, settingsGroups } from "../src/app/(app)/settings/tabs";

const ids = (manager: boolean) => settingsGroups(manager).flatMap((g) => g.tabs.map((t) => t.id));

test("managers see every tab, in order", () => {
  assert.deepEqual(ids(true), ["general", "brands", "members", "queue", "audit", "billing", "api", "account"]);
  assert.deepEqual(
    settingsGroups(true).map((g) => g.label),
    ["Workspace", "Plan", "Developers", "Account"],
  );
});

test("other members see only their account", () => {
  assert.deepEqual(ids(false), ["account"]);
});

test("an address opens the tab it names", () => {
  for (const t of ids(true)) assert.equal(openTab(t, true), t);
  assert.equal(openTab("account", false), "account");
});

test("no tab, or one this person can't see, opens their first tab", () => {
  assert.equal(openTab(undefined, true), "general");
  assert.equal(openTab("", true), "general");
  assert.equal(openTab("nope", true), "general");
  assert.equal(openTab(undefined, false), "account");
  assert.equal(openTab("billing", false), "account");
  assert.equal(openTab("members", false), "account");
});

test("a repeated ?tab uses the first", () => {
  assert.equal(openTab(["billing", "api"], true), "billing");
  assert.equal(openTab([], true), "general");
});

test("knownTab reads old hash links and refuses the rest", () => {
  assert.equal(knownTab("brands", true), "brands");
  assert.equal(knownTab("brands", false), null);
  assert.equal(knownTab("constructor", true), null);
  assert.equal(knownTab(null, true), null);
});
