// Publisher tests against fake networks that fail at random and an in-memory store that locks jobs like
// claim_jobs does (due, not done, under max attempts, unlocked or lock older than 10 minutes).
// They prove: every post goes out exactly once or fails cleanly, nothing is left pending, crashed workers are
// taken over, auth failures stop retrying and alert once.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runDue, sendsToReview, setSaveRetryMs, type Job, type Store, type TargetCtx } from "../src/lib/publisher";
import { AuthError, PostError, type Provider, type Published } from "../src/lib/providers/types";

setSaveRetryMs(0);

type Row = Job & { runAfter: number; lockedAt: number | null; done: boolean; lastError: string | null };

class Memory implements Store {
  now = Date.now();
  jobs: Row[] = [];
  targets = new Map<string, TargetCtx & { error: string | null; note: string | null }>();
  posts = new Map<string, string>();
  channels = new Map<string, string>();
  alerts: string[] = [];
  failPublishedSaves = 0;
  private seq = 0;

  add(n: number, network = "fake") {
    for (let i = 0; i < n; i++) {
      const id = `t${i}`;
      this.posts.set(`p${i}`, "scheduled");
      this.channels.set("c1", "active");
      this.targets.set(id, {
        id,
        status: "pending",
        remoteId: null,
        postId: `p${i}`,
        workspaceId: "w",
        channelId: "c1",
        channelName: "Fake",
        channelStatus: "active",
        network,
        accountId: "a",
        text: `post ${i}`,
        settings: {},
        mediaIds: [],
        error: null,
        note: null,
      });
      this.jobs.push({ id: ++this.seq, kind: "publish", payload: { postId: `p${i}`, targetId: id }, attempts: 0, max_attempts: 6, runAfter: this.now, lockedAt: null, done: false, lastError: null });
    }
  }
  async claim(_: string, n: number) {
    const due = this.jobs.filter((j) => !j.done && j.runAfter <= this.now && j.attempts < j.max_attempts && (j.lockedAt === null || j.lockedAt < this.now - 600000)).slice(0, n);
    for (const j of due) {
      j.lockedAt = this.now;
      j.attempts++;
    }
    return due.map((j) => ({ ...j }));
  }
  async jobDone(id: number, error: string | null) {
    const j = this.jobs.find((x) => x.id === id)!;
    Object.assign(j, { done: true, lockedAt: null, lastError: error });
  }
  async jobRetry(id: number, runAfter: Date, error: string) {
    const j = this.jobs.find((x) => x.id === id)!;
    Object.assign(j, { runAfter: runAfter.getTime(), lockedAt: null, lastError: error });
  }
  async target(id: string) {
    const t = this.targets.get(id);
    return t ? { ...t, channelStatus: this.channels.get(t.channelId)!, postStatus: this.posts.get(t.postId) } : null;
  }
  async publishing(t: TargetCtx) {
    this.targets.get(t.id)!.status = "publishing";
    if (this.posts.get(t.postId) === "scheduled") this.posts.set(t.postId, "publishing");
  }
  async published(t: TargetCtx, out: Published) {
    if (this.failPublishedSaves > 0) {
      this.failPublishedSaves--;
      throw new Error("database hiccup");
    }
    Object.assign(this.targets.get(t.id)!, { status: "published", remoteId: out.id, note: out.note ?? null, error: null });
  }
  async retrying(id: string, error: string) {
    const t = this.targets.get(id)!;
    if (t.status !== "published") Object.assign(t, { status: "pending", error });
  }
  async failed(id: string, error: string) {
    const t = this.targets.get(id)!;
    if (t.status === "published") return null;
    Object.assign(t, { status: "failed", error });
    return { ...t };
  }
  async reconnect(channelId: string) {
    this.channels.set(channelId, "reconnect");
  }
  async settle(postId: string) {
    const s = [...this.targets.values()].filter((t) => t.postId === postId).map((t) => t.status);
    if (s.some((x) => x === "pending" || x === "publishing")) return;
    this.posts.set(postId, s.every((x) => x === "published") ? "published" : s.some((x) => x === "published") ? "partial" : "failed");
  }
  async secret() {
    return { accessToken: "x", refreshToken: null, expiresAt: null, extra: {} };
  }
  async media() {
    return [];
  }
  async alert(kind: string, t: TargetCtx) {
    this.alerts.push(`${kind}:${t.id}`);
  }
  statsQueued: string[] = [];
  saved = new Map<string, Record<string, unknown>>();
  async statsLater(t: TargetCtx) {
    this.statsQueued.push(t.id);
  }
  async saveStats(t: TargetCtx, st: Record<string, unknown>) {
    this.saved.set(t.id, st);
  }
  // The Inbox has its own tests (inbox.test.ts).
  async claimInbox() {
    return [];
  }
  async inboxChannel() {
    return null;
  }
  async threadsOf() {
    return new Map<string, string>();
  }
  async saveInbox() {}
  async closeThread() {}
  async inboxError() {}
  events: string[] = [];
  failEvents = false;
  async event(type: string, t: TargetCtx) {
    if (this.failEvents) throw new Error("webhook store down");
    this.events.push(`${type}:${t.id}`);
  }
}

/** A fake network: records every post that went live, and fails at the given rate before posting. */
function fakeNetwork(opts: { failRate?: number; error?: () => Error; note?: string; seed?: number } = {}) {
  let seed = opts.seed ?? 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const live: string[] = [];
  const provider: Provider = {
    network: "fake" as never,
    publish: async (_s, _a, p) => {
      if (rand() < (opts.failRate ?? 0)) throw opts.error ? opts.error() : new Error("network timeout");
      live.push(p.text);
      return { id: `remote-${live.length}`, note: opts.note ?? null };
    },
  };
  return { provider, live };
}

/** Run workers until no job is due, moving the clock past every backoff. */
async function drain(m: Memory, provider: Provider, workers = 2) {
  for (let round = 0; round < 50; round++) {
    const counts = await Promise.all(Array.from({ length: workers }, (_, i) => runDue(m, () => provider, `w${i}`)));
    if (counts.every((c) => c === 0) && m.jobs.every((j) => j.done || j.runAfter > m.now)) {
      if (m.jobs.every((j) => j.done)) return;
    }
    m.now += 5 * 3600000;
  }
}

test("random network failures: every post goes out exactly once or fails cleanly, nothing left pending", async () => {
  for (const seed of [1, 7, 42, 99, 1234]) {
    const m = new Memory();
    m.add(200);
    const net = fakeNetwork({ failRate: 0.5, seed });
    await drain(m, net.provider, 3);
    const texts = new Map<string, number>();
    for (const t of net.live) texts.set(t, (texts.get(t) ?? 0) + 1);
    assert.ok([...texts.values()].every((n) => n === 1), `seed ${seed}: a post went out twice`);
    for (const t of m.targets.values()) {
      assert.ok(t.status === "published" || t.status === "failed", `seed ${seed}: ${t.id} left ${t.status}`);
      assert.equal(texts.get(t.text) ?? 0, t.status === "published" ? 1 : 0, `seed ${seed}: ${t.id} status doesn't match the network`);
    }
    assert.ok(m.jobs.every((j) => j.done), `seed ${seed}: a job is not done`);
    assert.ok([...m.posts.values()].every((s) => s === "published" || s === "failed"), `seed ${seed}: a post status is stuck`);
    const failed = [...m.targets.values()].filter((t) => t.status === "failed").length;
    assert.equal(m.alerts.length, failed, `seed ${seed}: one alert per failed post`);
  }
});

test("a database hiccup right after posting doesn't post twice", async () => {
  const m = new Memory();
  m.add(10);
  m.failPublishedSaves = 3; // fewer than the publisher's 5 save attempts
  const net = fakeNetwork();
  await drain(m, net.provider);
  assert.equal(net.live.length, 10);
  assert.ok([...m.targets.values()].every((t) => t.status === "published"));
});

test("a target that already has a remote id is never posted again", async () => {
  const m = new Memory();
  m.add(3);
  Object.assign(m.targets.get("t1")!, { remoteId: "already-out" });
  const net = fakeNetwork();
  await drain(m, net.provider);
  assert.deepEqual(net.live.sort(), ["post 0", "post 2"]);
  assert.equal(m.targets.get("t1")!.status, "published");
});

test("a crashed worker's job is taken over after its lock expires, and posts once", async () => {
  const m = new Memory();
  m.add(1);
  await m.claim("crashed", 1); // claimed, then the worker died before posting
  const net = fakeNetwork();
  assert.equal(await runDue(m, () => net.provider, "w1"), 0, "a fresh lock is respected");
  m.now += 11 * 60000;
  await drain(m, net.provider);
  assert.equal(net.live.length, 1);
  assert.equal(m.targets.get("t0")!.status, "published");
});

test("an expired sign-in marks the channel for reconnecting, fails at once and alerts once", async () => {
  const m = new Memory();
  m.add(5);
  const net = fakeNetwork({ failRate: 1, error: () => new AuthError("token expired") });
  await drain(m, net.provider);
  assert.equal(m.channels.get("c1"), "reconnect");
  assert.ok([...m.targets.values()].every((t) => t.status === "failed"));
  // First job hits the network; the rest stop before it because the channel is marked.
  assert.ok(m.jobs.every((j) => j.attempts === 1), "auth failures don't retry");
  assert.equal(m.alerts.filter((a) => a.startsWith("reconnect")).length, 5);
});

test("a post the network rejects fails at once without retrying", async () => {
  const m = new Memory();
  m.add(4);
  const net = fakeNetwork({ failRate: 1, error: () => new PostError("too long") });
  await drain(m, net.provider);
  assert.ok([...m.targets.values()].every((t) => t.status === "failed" && t.error === "too long"));
  assert.ok(m.jobs.every((j) => j.attempts === 1));
});

test("a problem after the post is live is a note, not a failure", async () => {
  const m = new Memory();
  m.add(2);
  const net = fakeNetwork({ note: "First comment failed" });
  await drain(m, net.provider);
  assert.ok([...m.targets.values()].every((t) => t.status === "published" && t.note === "First comment failed"));
  assert.equal(m.alerts.length, 0);
});

test("retries back off and give up after max attempts", async () => {
  const m = new Memory();
  m.add(1);
  const net = fakeNetwork({ failRate: 1 });
  await runDue(m, () => net.provider, "w");
  const j = m.jobs[0];
  assert.equal(j.attempts, 1);
  assert.equal(j.runAfter - m.now >= 60000 - 1000, true, "first retry waits about a minute");
  assert.equal(m.targets.get("t0")!.status, "pending");
  await drain(m, net.provider);
  assert.equal(j.attempts, 6);
  assert.equal(m.targets.get("t0")!.status, "failed");
  assert.equal(net.live.length, 0);
});

test("a published post queues its result checks once; failed posts queue none", async () => {
  const m = new Memory();
  m.add(20);
  const net = fakeNetwork({ failRate: 0.4, seed: 5 });
  await drain(m, net.provider, 3);
  const published = [...m.targets.values()].filter((t) => t.status === "published").map((t) => t.id).sort();
  assert.deepEqual([...m.statsQueued].sort(), published);
});

test("result checks read the network with the saved remote id and store the numbers", async () => {
  const m = new Memory();
  m.add(1);
  Object.assign(m.targets.get("t0")!, { status: "published", remoteId: "remote-9" });
  let asked = "";
  const provider: Provider = { network: "fake" as never, publish: async () => ({ id: "x" }), postStats: async (_s, _a, id) => ((asked = id), { likes: 7, views: 120 }) };
  m.jobs = [{ id: 99, kind: "stats", payload: { targetId: "t0" }, attempts: 0, max_attempts: 6, runAfter: m.now, lockedAt: null, done: false, lastError: null }];
  await runDue(m, () => provider, "w");
  assert.equal(asked, "remote-9");
  assert.deepEqual(m.saved.get("t0"), { likes: 7, views: 120 });
  assert.ok(m.jobs[0].done);
});

test("a post waiting for approval is never published, even with jobs queued for it", async () => {
  const m = new Memory();
  m.add(6);
  for (const id of ["p1", "p3", "p5"]) m.posts.set(id, "review");
  m.posts.set("p4", "draft");
  // Flaky network on top, so retries run too.
  const net = fakeNetwork({ failRate: 0.5, seed: 3 });
  await drain(m, net.provider);
  for (const i of [1, 3, 4, 5]) {
    assert.equal(m.targets.get(`t${i}`)!.status, "pending", `t${i} must wait`);
    assert.ok(!net.live.includes(`post ${i}`), `post ${i} went out while held`);
  }
  assert.equal(m.posts.get("p1"), "review");
  assert.ok(m.jobs.every((j) => j.done), "held jobs end instead of looping");
  assert.equal(m.alerts.length, [...m.targets.values()].filter((t) => t.status === "failed").length, "held posts never alert");
});

test("an approved post publishes exactly once from its new job", async () => {
  const m = new Memory();
  m.add(1);
  m.posts.set("p0", "review");
  const net = fakeNetwork();
  await drain(m, net.provider);
  assert.equal(net.live.length, 0);
  // Approve: the post is scheduled and a fresh job is queued, as savePost does.
  m.posts.set("p0", "scheduled");
  m.jobs.push({ id: 500, kind: "publish", payload: { postId: "p0", targetId: "t0" }, attempts: 0, max_attempts: 6, runAfter: m.now, lockedAt: null, done: false, lastError: null });
  await drain(m, net.provider, 3);
  assert.deepEqual(net.live, ["post 0"]);
  assert.equal(m.targets.get("t0")!.status, "published");
  assert.equal(m.posts.get("p0"), "published");
});

test("only editors' posts to a brand that needs approval go to review", () => {
  assert.equal(sendsToReview("editor", true), true);
  assert.equal(sendsToReview("editor", false), false);
  for (const role of ["owner", "admin", "client", undefined]) assert.equal(sendsToReview(role, true), false, `${role} schedules directly`);
});

test("webhooks hear once per channel: published when it went out, failed when it failed for good", async () => {
  for (const seed of [3, 11, 77]) {
    const m = new Memory();
    m.add(120);
    m.failPublishedSaves = 2;
    const net = fakeNetwork({ failRate: 0.5, seed });
    await drain(m, net.provider, 3);
    const told = new Map<string, number>();
    for (const e of m.events) told.set(e, (told.get(e) ?? 0) + 1);
    assert.ok([...told.values()].every((n) => n === 1), `seed ${seed}: an event was sent twice`);
    for (const t of m.targets.values()) {
      const want = t.status === "published" ? `post.published:${t.id}` : `post.failed:${t.id}`;
      assert.equal(told.get(want), 1, `seed ${seed}: ${t.id} has no ${want}`);
    }
    assert.equal(m.events.length, m.targets.size, `seed ${seed}: one event per channel`);
  }
});

test("a broken webhook store never stops a post going out", async () => {
  const m = new Memory();
  m.add(20);
  m.failEvents = true;
  const net = fakeNetwork({ failRate: 0.3, seed: 5 });
  await drain(m, net.provider);
  assert.ok([...m.targets.values()].every((t) => t.status === "published" || t.status === "failed"));
  assert.equal(net.live.length, [...m.targets.values()].filter((t) => t.status === "published").length);
});
