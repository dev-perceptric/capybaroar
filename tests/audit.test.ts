// The audit log: secrets never reach an event, CSV downloads can't run formulas in a spreadsheet, and every action
// has a label.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AUDIT_ACTIONS, actionLabel, auditCsv, csvCell, safeMeta } from "../src/lib/auditRules";

test("meta drops anything that looks like a secret and keeps values short", () => {
  const m = safeMeta({ role: "admin", api_key: "cbr_x", token: "t", Authorization: "Bearer x", password: "p", long: "x".repeat(500), list: ["a", "b"], n: 3, obj: { a: 1 } });
  assert.deepEqual(Object.keys(m).sort(), ["list", "long", "n", "obj", "role"]);
  assert.equal((m.long as string).length, 200);
  assert.equal(m.obj, '{"a":1}');
});

test("CSV cells are quoted and formulas are defused", () => {
  assert.equal(csvCell('He said "hi"'), '"He said ""hi"""');
  assert.equal(csvCell("=HYPERLINK(\"x\")"), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell("+1"), "\"'+1\"");
  assert.equal(csvCell(null), '""');
  const csv = auditCsv([{ created_at: "2026-11-14T00:00:00Z", actor_label: "Ana", actor_kind: "user", action: "member.role_changed", target_type: "member", target_label: "Bo", meta: { from: "editor", to: "admin" } }]);
  assert.match(csv, /^"Time \(UTC\)"/);
  assert.match(csv, /"Changed a role"/);
});

test("every action reads in plain words and follows the area.verb shape", () => {
  for (const [k, v] of Object.entries(AUDIT_ACTIONS)) {
    assert.match(k, /^[a-z_]+\.[a-z_]+$/);
    assert.ok(v.length > 3);
  }
  assert.equal(actionLabel("unknown.thing"), "unknown.thing");
});
