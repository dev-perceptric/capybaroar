// The JSON lines the app writes to stdout for the central log store (ops/monitoring): one valid JSON object per
// line, a fixed set of fields, and nothing that names or locates a person or leaks a secret.
import { test } from "node:test";
import assert from "node:assert/strict";
import { auditLine, errorLine, runnerLine } from "../src/lib/logLines";
import type { AuditEvent } from "../src/lib/auditRules";

const WS = "3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f";
const AT = new Date("2026-11-14T21:03:04.000Z");

const parse = (line: string) => {
  assert.ok(!line.includes("\n"), "one line");
  return JSON.parse(line) as Record<string, unknown>;
};

const full: AuditEvent = {
  workspaceId: WS,
  actorId: "11111111-2222-4333-8444-555555555555",
  actorKind: "user",
  actorLabel: "ana@example.com",
  action: "api_key.created",
  target: { type: "api_key", id: "k1", label: "Ana's key for Zapier" },
  meta: { name: "Zapier", prefix: "cbr_live", email: "ana@example.com" },
  ip: "203.0.113.9",
};

test("an audit line holds the action, workspace, actor kind and time, and nothing else", () => {
  const line = auditLine(full, AT);
  assert.deepEqual(parse(line), { type: "audit", action: "api_key.created", workspace: WS, actor_kind: "user", at: "2026-11-14T21:03:04.000Z" });
  for (const leak of ["ana@example.com", "203.0.113.9", "Zapier", "Ana", "cbr_live", "11111111-2222", "k1"]) assert.ok(!line.includes(leak), `no ${leak}`);
});

test("a failed sign-in with no workspace logs as the system or the user, with a null workspace", () => {
  const o = parse(auditLine({ workspaceId: null, actorKind: "user", actorLabel: "who@example.com", action: "auth.sign_in_failed", meta: { reason: "invalid_credentials" }, ip: "198.51.100.4" }, AT));
  assert.deepEqual(Object.keys(o), ["type", "action", "workspace", "actor_kind", "at"]);
  assert.equal(o.workspace, null);
  assert.equal(o.actor_kind, "user");
  assert.equal(parse(auditLine({ workspaceId: null, action: "account.deleted" }, AT)).actor_kind, "system");
});

test("a role change logs the role it gave, only when it is one of the fixed roles", () => {
  const ev = (to: unknown): AuditEvent => ({ workspaceId: WS, actorId: "u", action: "member.role_changed", meta: { from: "editor", to } });
  assert.equal(parse(auditLine(ev("admin"), AT)).role, "admin");
  assert.equal(parse(auditLine(ev("owner"), AT)).role, "owner");
  assert.equal(parse(auditLine(ev("bo@example.com"), AT)).role, undefined);
  assert.equal(parse(auditLine({ ...full, meta: { to: "admin" } }, AT)).role, undefined);
});

test("odd values never reach a line", () => {
  const o = parse(auditLine({ workspaceId: "not-a-uuid\n{\"type\":\"audit\"}", actorKind: "root" as never, action: "Evil Action" as never }, AT));
  assert.equal(o.workspace, null);
  assert.equal(o.actor_kind, "system");
  assert.equal(o.action, "unknown");
});

test("an error line holds where, a fingerprint and the time, with secrets and query strings taken out", () => {
  const e = new Error("Upload failed for ana@example.com with Bearer abcdefghijklmnop1234");
  const line = errorLine(e, "GET /api/v1/posts?access_token=supersecretvalue123", AT);
  const o = parse(line);
  assert.deepEqual(Object.keys(o), ["type", "where", "fp", "at"]);
  assert.equal(o.type, "error");
  assert.equal(o.where, "GET /api/v1/posts");
  assert.match(String(o.fp), /^[0-9a-f]{32}$/);
  for (const leak of ["ana@example.com", "abcdefghijklmnop1234", "supersecretvalue123", "Upload failed"]) assert.ok(!line.includes(leak), `no ${leak}`);
});

test("error routes lose emails and tokens even without a query string", () => {
  const o = parse(errorLine("boom", "POST /bio/ana@example.com/token=abcdef123456", AT));
  assert.equal(o.where, "POST /bio/[email]/token=[redacted]");
  assert.equal(parse(errorLine(new Error("x"), null, AT)).where, null);
  // Anything at all can be thrown; the line still goes out.
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  assert.equal(parse(errorLine(cyclic, "runner: publish", AT)).where, "runner: publish");
});

test("start and beat lines", () => {
  assert.deepEqual(parse(runnerLine("start", AT)), { type: "start", at: "2026-11-14T21:03:04.000Z" });
  assert.deepEqual(parse(runnerLine("beat", AT)), { type: "beat", at: "2026-11-14T21:03:04.000Z" });
});
