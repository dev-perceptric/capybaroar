// The audit log screen and its recording: filter groups cover every action once, pages follow a cursor that can't be
// forged into a query, Details read in words, old events go after the keep time, and a failing audit write never
// breaks, or holds up, the change it records.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AUDIT_ACTIONS, type AuditEvent } from "../src/lib/auditRules";
import {
  AUDIT_GROUPS,
  AUDIT_KEEP_DAYS,
  AUDIT_PAGE,
  actionsFor,
  afterCursor,
  auditCutoff,
  cleanFilter,
  decodeCursor,
  detailsOf,
  encodeCursor,
  pageOf,
  recordSafely,
  sinceFor,
  type Actor,
  type RecordDeps,
} from "../src/lib/auditLogRules";

test("every action is in exactly one filter group, and All filters nothing", () => {
  assert.equal(actionsFor("all"), null);
  for (const a of Object.keys(AUDIT_ACTIONS)) {
    const groups = AUDIT_GROUPS.filter((g) => g.value !== "all" && actionsFor(g.value)!.includes(a as never));
    assert.equal(groups.length, 1, `${a} is in ${groups.length} groups`);
  }
  assert.deepEqual(actionsFor("posts"), ["post.deleted", "post.deleted_everywhere", "post.edited_live", "media.deleted"]);
  assert.ok(actionsFor("api")!.includes("webhook.created"));
  assert.ok(actionsFor("api")!.includes("app.connected"));
  assert.ok(actionsFor("auth")!.every((a) => a.startsWith("auth.")));
});

test("filters from a request fall back to all for anything unknown", () => {
  assert.deepEqual(cleanFilter(null), { group: "all", actorId: null, period: "all" });
  assert.deepEqual(cleanFilter({ group: "members", period: "30", actorId: "0B6E2C1A-1111-4222-8333-444455556666" }), { group: "members", period: "30", actorId: "0b6e2c1a-1111-4222-8333-444455556666" });
  assert.deepEqual(cleanFilter({ group: "drop table", period: 7, actorId: "x' or 1=1" }), { group: "all", actorId: null, period: "all" });
  const now = new Date("2026-11-14T12:00:00Z");
  assert.equal(sinceFor("all", now), null);
  assert.equal(sinceFor("7", now)!.toISOString(), "2026-11-07T12:00:00.000Z");
});

test("cursors round-trip, and anything else starts from the top", () => {
  const c = { at: "2026-11-14T10:00:00.123456+00:00", id: 42 };
  assert.deepEqual(decodeCursor(encodeCursor(c)), c);
  assert.deepEqual(decodeCursor(encodeCursor({ at: "2026-11-14T10:00:00Z", id: 7 })), { at: "2026-11-14T10:00:00Z", id: 7 });
  for (const bad of [null, "", 5, "!!!", Buffer.from("2026-11-14|1").toString("base64url"), Buffer.from('2026-11-14T10:00:00Z",id.gt.0|1').toString("base64url"), Buffer.from("2026-11-14T10:00:00Z|0").toString("base64url"), Buffer.from("2026-11-14T10:00:00Z|-1").toString("base64url"), "x".repeat(300)])
    assert.equal(decodeCursor(bad), null, String(bad));
  assert.equal(afterCursor(c), 'created_at.lt."2026-11-14T10:00:00.123456+00:00",and(created_at.eq."2026-11-14T10:00:00.123456+00:00",id.lt.42)');
});

test("a page is 50 rows, with a cursor only when there are more", () => {
  const rows = Array.from({ length: AUDIT_PAGE + 1 }, (_, i) => ({ id: 1000 - i, created_at: `2026-11-14T10:00:${String(59 - (i % 60)).padStart(2, "0")}Z` }));
  const full = pageOf(rows);
  assert.equal(full.rows.length, AUDIT_PAGE);
  assert.deepEqual(decodeCursor(full.next), { at: rows[AUDIT_PAGE - 1].created_at, id: rows[AUDIT_PAGE - 1].id });
  assert.equal(pageOf(rows.slice(0, AUDIT_PAGE)).next, null);
  assert.equal(pageOf([]).next, null);
});

test("details read in words", () => {
  assert.equal(detailsOf({ from: "editor", to: "admin" }), "editor to admin");
  assert.equal(detailsOf({ to: "off" }), "off");
  assert.equal(detailsOf({ network: "bluesky", reconnected: true }), "network: bluesky, reconnected");
  assert.equal(detailsOf({ channels: ["X", "LinkedIn"], setting: "Queue times" }), "channels: X, LinkedIn, setting: Queue times");
  assert.equal(detailsOf({ from: null, to: 500 }), "none to 500");
  assert.equal(detailsOf({}), "");
  assert.equal(detailsOf(null), "");
});

test("events go a day after their 365 days, so the guard trigger never refuses the delete", () => {
  const now = new Date("2026-11-14T00:00:00Z");
  const cut = auditCutoff(now);
  assert.ok(now.getTime() - cut.getTime() > AUDIT_KEEP_DAYS * 86400000);
  assert.equal(AUDIT_KEEP_DAYS, 365);
});

// Recording: a fake change, then the audit write, the way every caller does it.

const ev = { workspaceId: "w1", action: "brand.renamed" as const, target: { type: "brand", id: "b1", label: "Acme" } };
const user: Actor = { id: "u1", kind: "user", label: "ana@example.com" };
const deps = (over: Partial<RecordDeps> = {}): RecordDeps & { written: AuditEvent[] } => {
  const written: AuditEvent[] = [];
  return {
    written,
    actor: async () => user,
    labelOf: async () => "lookup@example.com",
    ip: async () => "203.0.113.9",
    write: async (e) => (written.push(e), true),
    timeoutMs: 200,
    ...over,
  };
};

async function renameBrand(rows: Map<string, string>, d: RecordDeps) {
  rows.set("b1", "Acme");
  await recordSafely(ev, d);
  return "saved";
}

test("a failing audit insert never breaks the change it records", async () => {
  const failures: Partial<RecordDeps>[] = [
    { write: async () => false },
    { write: async () => Promise.reject(new Error("connection reset")) },
    {
      write: () => {
        throw new Error("adminClient: SUPABASE_URL is missing");
      },
    },
    { write: () => new Promise<boolean>(() => {}) },
    { actor: async () => Promise.reject(new Error("cookies() outside a request")), write: async () => Promise.reject(new Error("503")) },
  ];
  for (const f of failures) {
    const rows = new Map<string, string>();
    const started = Date.now();
    assert.equal(await renameBrand(rows, deps(f)), "saved");
    assert.equal(rows.get("b1"), "Acme");
    assert.ok(Date.now() - started < 1000, "a hung write is given up on");
  }
  assert.equal(await recordSafely(ev, deps({ write: () => new Promise<boolean>(() => {}) })), false);
});

test("flaky lookups are left out and the event is still written", async () => {
  // The actor can't be read (outside a request): recorded as the system, with no IP.
  const a = deps({ actor: async () => Promise.reject(new Error("no request")) });
  assert.equal(await recordSafely(ev, a), true);
  assert.deepEqual([a.written[0].actorKind, a.written[0].actorId, a.written[0].ip], ["system", null, null]);
  // The person's email lookup fails: written without a label.
  const b = deps({ actor: async () => ({ id: "u2", kind: "api", label: null }), labelOf: async () => Promise.reject(new Error("auth admin 500")) });
  assert.equal(await recordSafely(ev, b), true);
  assert.deepEqual([b.written[0].actorKind, b.written[0].actorId, b.written[0].actorLabel], ["api", "u2", null]);
  // The IP can't be read: written without it.
  const c = deps({ ip: () => Promise.reject(new Error("headers() outside a request")) });
  assert.equal(await recordSafely(ev, c), true);
  assert.equal(c.written[0].ip, null);
  // A known actor keeps its label and gets the request's IP; null means there's none to read.
  const d = deps();
  await recordSafely(ev, d);
  assert.deepEqual([d.written[0].actorLabel, d.written[0].ip], ["ana@example.com", "203.0.113.9"]);
  const e = deps({ actor: async () => ({ id: "u3", kind: "user", label: null, ip: null }) });
  await recordSafely(ev, e);
  assert.deepEqual([e.written[0].actorLabel, e.written[0].ip], ["lookup@example.com", null]);
});
