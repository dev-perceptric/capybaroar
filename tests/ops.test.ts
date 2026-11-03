// Two (or more) servers against one in-memory database that behaves like Postgres where it matters: take_turn and
// record_error are one statement under a row lock (check and write happen together), claim_jobs skips locked rows
// and takes over a lock older than 10 minutes. Every await yields, so the servers interleave like real ones.
// They prove: one winner per period for upkeep and the Inbox queue, a long run never overlaps the next, a dead
// winner is replaced, a slow upload is never posted twice, and an error emails once an hour whoever sees it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { HeldJobs, MAX_HOLD_MS, appError, fingerprint, healthOf, keepHeld, onePerPeriod, reportError, scrub, type AppError, type OpsStore } from "../src/lib/ops";
import { runDue, setSaveRetryMs, type Job, type Store, type TargetCtx } from "../src/lib/publisher";
import type { Provider } from "../src/lib/providers/types";

setSaveRetryMs(0);
const yieldNow = () => new Promise<void>((r) => setImmediate(r));

class Db implements OpsStore {
  now = 0;
  turns = new Map<string, { ranAt: number; ranBy: string; busyUntil: number | null }>();
  errors = new Map<string, AppError & { count: number; emailedAt: number | null }>();
  jobs: (Job & { runAfter: number; lockedAt: number | null; lockedBy: string | null; done: boolean })[] = [];

  async takeTurn(name: string, everyS: number, leaseS: number, worker: string) {
    await yieldNow(); // the request on its way
    const u = this.turns.get(name);
    const won = !u || (u.ranAt <= this.now - everyS * 1000 && (u.busyUntil === null || u.busyUntil < this.now));
    if (won) this.turns.set(name, { ranAt: this.now, ranBy: worker, busyUntil: this.now + leaseS * 1000 });
    await yieldNow(); // the answer on its way back
    return won;
  }
  async endTurn(name: string, worker: string) {
    await yieldNow();
    const u = this.turns.get(name);
    if (u && u.ranBy === worker) u.busyUntil = null;
  }
  async keepLocks(ids: number[], worker: string) {
    await yieldNow();
    for (const j of this.jobs) if (ids.includes(j.id) && j.lockedBy === worker && !j.done && j.lockedAt !== null) j.lockedAt = this.now;
  }
  async recordError(e: AppError, mail: boolean) {
    await yieldNow();
    const row = this.errors.get(e.fingerprint);
    if (!row) this.errors.set(e.fingerprint, { ...e, count: 1, emailedAt: null });
    else Object.assign(row, { ...e, count: row.count + 1 });
    if (!mail) return false;
    await yieldNow(); // the second statement: a conditional update under the row lock
    const r = this.errors.get(e.fingerprint)!;
    const send = r.emailedAt === null || r.emailedAt < this.now - 3600000;
    if (send) r.emailedAt = this.now;
    await yieldNow();
    return send;
  }
}

/** The way it would go wrong: read the last run, then write it, as two requests. Used to show the tests can tell. */
class NaiveDb extends Db {
  async takeTurn(name: string, everyS: number, leaseS: number, worker: string) {
    await yieldNow();
    const u = this.turns.get(name);
    const due = !u || u.ranAt <= this.now - everyS * 1000;
    await yieldNow();
    if (due) this.turns.set(name, { ranAt: this.now, ranBy: worker, busyUntil: this.now + leaseS * 1000 });
    return due;
  }
}

test("two servers racing on the same period: only one runs upkeep", async () => {
  const db = new Db();
  let runs = 0;
  const work = async () => {
    runs++;
  };
  const won = await Promise.all(["a:1", "b:1"].map((w) => onePerPeriod(db, "upkeep", 3300, 7200, w, work)));
  assert.equal(runs, 1);
  assert.deepEqual(won.filter(Boolean).length, 1);
  // The same period again, from both: nothing.
  await Promise.all(["a:1", "b:1"].map((w) => onePerPeriod(db, "upkeep", 3300, 7200, w, work)));
  assert.equal(runs, 1);
});

test("the race check can fail: read-then-write lets both servers run", async () => {
  const db = new NaiveDb();
  let runs = 0;
  await Promise.all(["a:1", "b:1"].map((w) => onePerPeriod(db, "upkeep", 3300, 7200, w, async () => void runs++)));
  assert.equal(runs, 2);
});

test("a day on three servers: upkeep about hourly, the Inbox queue about every 10 minutes, never twice in a period", async () => {
  const db = new Db();
  const upkeep: number[] = [];
  const queued = new Map<string, number[]>();
  const servers = [
    { w: "a:1", offset: 0 },
    { w: "b:1", offset: 37_000 },
    { w: "c:1", offset: 211_000 },
  ];
  const step = 1000;
  for (let t = 0; t < 86400000; t += step) {
    db.now = t;
    const calls: Promise<unknown>[] = [];
    for (const s of servers) {
      const at = t - s.offset;
      if (at < 0) continue;
      // Upkeep looked at every 5 minutes (first after 30 s), the Inbox queue every 10 (first after 45 s).
      if (at % 300000 === 30000) calls.push(onePerPeriod(db, "upkeep", 3300, 7200, s.w, async () => void upkeep.push(t)));
      if (at % 600000 === 45000)
        calls.push(
          onePerPeriod(db, "inbox_queue", 540, 600, s.w, async () => {
            for (const c of ["c1", "c2", "c3"]) queued.set(c, [...(queued.get(c) ?? []), t]);
          }),
        );
    }
    await Promise.all(calls);
  }
  for (let i = 1; i < upkeep.length; i++) assert.ok(upkeep[i] - upkeep[i - 1] >= 3300000, `upkeep ran twice within 55 minutes at ${upkeep[i]}`);
  assert.ok(upkeep.length >= 23 && upkeep.length <= 27, `upkeep ran ${upkeep.length} times`);
  for (const [, times] of queued) {
    for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= 540000, "a channel was queued twice within 9 minutes");
    assert.ok(times.length >= 130 && times.length <= 160, `queued ${times.length} times`);
  }
});

test("a long upkeep blocks the next period until it ends; a winner that dies frees it when its lease ends", async () => {
  const db = new Db();
  let release!: () => void;
  const slow = new Promise<void>((r) => (release = r));
  let runs = 0;
  const first = onePerPeriod(db, "upkeep", 3300, 7200, "a:1", async () => {
    runs++;
    await slow;
  });
  await yieldNow();
  await yieldNow();
  await yieldNow();
  db.now = 70 * 60000; // past the period, still running
  assert.equal(await onePerPeriod(db, "upkeep", 3300, 7200, "b:1", async () => void runs++), false);
  release();
  await first;
  assert.equal(await onePerPeriod(db, "upkeep", 3300, 7200, "b:1", async () => void runs++), true);
  assert.equal(runs, 2);

  // b dies mid-run (never ends its turn): a takes over only once the 2-hour lease runs out.
  db.turns.get("upkeep")!.busyUntil = db.now + 7200000;
  db.now += 3600000;
  assert.equal(await onePerPeriod(db, "upkeep", 3300, 7200, "a:1", async () => void runs++), false);
  db.now += 3600001;
  assert.equal(await onePerPeriod(db, "upkeep", 3300, 7200, "a:1", async () => void runs++), true);
  assert.equal(runs, 3);
});

test("a run that throws still ends its turn, and the error reaches the caller", async () => {
  const db = new Db();
  await assert.rejects(onePerPeriod(db, "upkeep", 3300, 7200, "a:1", async () => Promise.reject(new Error("boom"))), /boom/);
  assert.equal(db.turns.get("upkeep")!.busyUntil, null);
});

// Publishing on two servers: the jobs table and one slow network.
class Jobs extends Db implements Store {
  targets = new Map<string, TargetCtx>();
  add(n: number) {
    for (let i = 0; i < n; i++) {
      this.targets.set(`t${i}`, { id: `t${i}`, status: "pending", remoteId: null, postId: `p${i}`, postStatus: "scheduled", workspaceId: "w", channelId: "c1", channelName: "Fake", channelStatus: "active", network: "fake", accountId: "a", text: `post ${i}`, settings: {}, mediaIds: [] });
      this.jobs.push({ id: i + 1, kind: "publish", payload: { targetId: `t${i}` }, attempts: 0, max_attempts: 6, runAfter: 0, lockedAt: null, lockedBy: null, done: false });
    }
  }
  held = new Map<string, HeldJobs>();
  async claim(worker: string, n: number) {
    await yieldNow();
    const due = this.jobs.filter((j) => !j.done && j.runAfter <= this.now && j.attempts < j.max_attempts && (j.lockedAt === null || j.lockedAt < this.now - 600000)).slice(0, n);
    for (const j of due) Object.assign(j, { lockedAt: this.now, lockedBy: worker, attempts: j.attempts + 1 });
    this.held.get(worker)?.hold(due.map((j) => j.id), this.now);
    return due.map((j) => ({ ...j }));
  }
  async claimInbox() {
    return [];
  }
  async jobDone(id: number) {
    for (const h of this.held.values()) h.release(id);
    Object.assign(this.jobs.find((j) => j.id === id)!, { done: true, lockedAt: null });
  }
  async jobRetry(id: number, runAfter: Date) {
    for (const h of this.held.values()) h.release(id);
    Object.assign(this.jobs.find((j) => j.id === id)!, { runAfter: runAfter.getTime(), lockedAt: null });
  }
  async target(id: string) {
    await yieldNow();
    const t = this.targets.get(id);
    return t ? { ...t } : null;
  }
  async publishing(t: TargetCtx) {
    this.targets.get(t.id)!.status = "publishing";
  }
  async published(t: TargetCtx, out: { id: string }) {
    Object.assign(this.targets.get(t.id)!, { status: "published", remoteId: out.id });
  }
  async retrying() {}
  async failed() {
    return null;
  }
  async reconnect() {}
  async settle() {}
  async secret() {
    return { accessToken: "x", refreshToken: null, expiresAt: null, extra: {} };
  }
  async media() {
    return [];
  }
  async alert() {}
  async statsLater() {}
  async saveStats() {}
  async inboxChannel() {
    return null;
  }
  async threadsOf() {
    return new Map<string, string>();
  }
  async saveInbox() {}
  async closeThread() {}
  async inboxError() {}
}

/** Server a claims two posts. The first is a 25-minute video upload; while it runs, server b looks for due jobs every
 * minute. b's uploads are slow too, so whatever b takes over is still going when a gets to it. */
async function slowUploadOnTwoServers(keep: boolean) {
  const db = new Jobs();
  db.add(2);
  const heldA = new HeldJobs();
  const heldB = new HeldJobs();
  db.held.set("a", heldA).set("b", heldB);
  const live: string[] = [];
  const bRuns: Promise<number>[] = [];
  let open!: () => void;
  const gate = new Promise<void>((r) => (open = r));
  const b: Provider = {
    network: "fake" as never,
    publish: async (_s, _a, p) => {
      await gate;
      live.push(p.text);
      return { id: `remote-${live.length}` };
    },
  };
  const a: Provider = {
    network: "fake" as never,
    publish: async (_s, _a, p) => {
      if (p.text === "post 0")
        for (let m = 0; m < 25; m++) {
          db.now += 60000;
          if (keep) {
            await keepHeld(db, heldA, "a", db.now);
            await keepHeld(db, heldB, "b", db.now);
          }
          bRuns.push(runDue(db, () => b, "b", 5));
          for (let i = 0; i < 5; i++) await yieldNow();
        }
      live.push(p.text);
      return { id: `remote-${live.length}` };
    },
  };
  await runDue(db, () => a, "a", 5);
  open();
  await Promise.all(bRuns);
  return live;
}

test("control: without kept locks, a slow upload lets the second server post the same thing twice", async () => {
  const live = await slowUploadOnTwoServers(false);
  assert.ok(live.length > 2, `posted ${live.join(", ")}`);
});

test("kept locks: a 25-minute upload on one server, the other polling every minute, every post goes out once", async () => {
  const live = await slowUploadOnTwoServers(true);
  assert.deepEqual(live.sort(), ["post 0", "post 1"]);
});

test("a held job stops being kept after an hour, so a hung server can't hold a post forever", () => {
  const h = new HeldJobs();
  h.hold([1, 2], 0);
  assert.deepEqual(h.fresh(MAX_HOLD_MS), [1, 2]);
  h.release(2);
  assert.deepEqual(h.fresh(MAX_HOLD_MS + 1), []);
});

test("two servers see the same error at once: one row, counted twice, one email; the next email waits an hour", async () => {
  const db = new Db();
  const sent: AppError[] = [];
  const send = async (e: AppError) => void sent.push(e);
  const boom = () => {
    const e = new Error(`Channel 5b0e2a54-8c1f-4f7e-9a33-1d2c3b4a5f60 failed after 3 tries`);
    e.stack = `Error: ${e.message}\n    at upkeep (/app/.next/server/chunks/runner.js:10:5)\n    at async tick (/app/.next/server/chunks/runner.js:2:1)`;
    return e;
  };
  await Promise.all([reportError(db, send, boom(), "runner: upkeep", "m1"), reportError(db, send, boom(), "runner: upkeep", "m2")]);
  assert.equal(db.errors.size, 1);
  assert.equal([...db.errors.values()][0].count, 2);
  assert.equal(sent.length, 1);
  db.now += 59 * 60000;
  await reportError(db, send, boom(), "runner: upkeep", "m1");
  assert.equal(sent.length, 1);
  db.now += 2 * 60000;
  await Promise.all([reportError(db, send, boom(), "runner: upkeep", "m1"), reportError(db, send, boom(), "runner: upkeep", "m2")]);
  assert.equal(sent.length, 2);
  assert.equal([...db.errors.values()][0].count, 5);
  // Without mail set up it is still counted, and nothing is sent.
  await reportError(db, null, boom(), "runner: upkeep", "m1");
  assert.equal([...db.errors.values()][0].count, 6);
  assert.equal(sent.length, 2);
});

test("errors that differ only in ids, numbers and line numbers share a fingerprint; others don't", () => {
  const a = fingerprint("Post 123 failed for 5b0e2a54-8c1f-4f7e-9a33-1d2c3b4a5f60", "Error\n    at go (/app/x.js:10:5)");
  const b = fingerprint("Post 9 failed for 11111111-2222-4333-8444-555555555555", "Error\n    at go (/app/x.js:12:9)");
  const c = fingerprint("Post 9 failed for 11111111-2222-4333-8444-555555555555", "Error\n    at other (/app/y.js:1:1)");
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("tokens, keys, passwords and signed links never reach the table or the email", () => {
  const secrets = [
    "Authorization: Bearer ya29.a0AfB_byC1234567890abcdefghijklmnop",
    "fetch https://graph.facebook.com/v21.0/me?access_token=EAAGm0PX4ZCpsBAKZCZBabcdef123456&fields=id",
    "jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
    "stripe sk_live_51Habcdefghijklmnop",
    "connect postgresql://postgres:hunter2secret@db.example.supabase.co:5432/postgres",
    '{"refresh_token":"1//0gAbCdEfGhIjKlMn","client_secret":"GOCSPX-abcdef123"}',
    "signed https://x.supabase.co/storage/v1/object/sign/media/a.png?token=abc.def.ghi1234567",
  ];
  const leaks = ["ya29.a0AfB_byC1234567890", "EAAGm0PX4ZCpsBAKZCZBabcdef123456", "dozjgNryP4J3jVmNHl0w5N", "sk_live_51H", "hunter2secret", "1//0gAbCdEfGhIjKlMn", "GOCSPX-abcdef123", "abc.def.ghi1234567"];
  for (const s of secrets) {
    const out = scrub(s);
    for (const l of leaks) assert.ok(!out.includes(l), `${l} leaked in ${out}`);
  }
  const e = new Error("Request failed: access_token=EAAGm0PX4ZCpsBAKZCZBabcdef123456");
  const rec = appError(e, "/api/channels/x/connect?code=4/0AbCdEfGh&state=s", "m1");
  assert.ok(!rec.message.includes("EAAGm0PX4ZCpsBAKZCZBabcdef123456"));
  assert.ok(!rec.stack!.includes("EAAGm0PX4ZCpsBAKZCZBabcdef123456"));
  assert.equal(rec.route, "/api/channels/x/connect");
  // Plain messages stay readable.
  assert.equal(scrub("duplicate key value violates unique constraint"), "duplicate key value violates unique constraint");
});

test("health: 200 with a fresh beat, 503 when the database or this server's runner is down", () => {
  const now = Date.now();
  const ok = healthOf({ db: true, runs: true, beatAt: new Date(now - 30000), version: "1", now });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body, { ok: true, db: "ok", runner: "ok", lastBeatSecondsAgo: 30, version: "1" });
  assert.equal(healthOf({ db: true, runs: true, beatAt: new Date(now - 400000), version: "1", now }).status, 503);
  assert.equal(healthOf({ db: true, runs: true, beatAt: null, version: "1", now }).status, 503);
  assert.equal(healthOf({ db: false, runs: true, beatAt: new Date(now), version: "1", now }).status, 503);
  // A server that doesn't run jobs only needs the database.
  assert.equal(healthOf({ db: true, runs: false, beatAt: null, version: "1", now }).body.runner, "off");
  assert.equal(healthOf({ db: true, runs: false, beatAt: null, version: "1", now }).status, 200);
});
