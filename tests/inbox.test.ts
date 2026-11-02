// Inbox tests against fake networks that fail at random and an in-memory store that saves like the real one
// (an item already saved is left alone, the cursor moves only after the items are in).
// They prove: no item is lost or saved twice under random read and save failures, a person's "done" is never undone by
// a later read, bad sign-ins mark the channel and stop, missing permissions are kept without a reconnect, threads are
// worked out from parents, the channel's own answer closes what came before it, and every network the screen offers
// an Inbox for has one.
import { test } from "node:test";
import assert from "node:assert/strict";
import { INBOX_DAYS, INBOX_MARGIN_MIN, runDue, runInbox, type InboxChannel, type InboxRow, type Job, type Store, type TargetCtx } from "../src/lib/publisher";
import { AuthError, PostError, type InboxItem, type InboxQuery, type Provider } from "../src/lib/providers/types";
import { PROVIDERS } from "../src/lib/providers";
import { NETWORKS } from "../src/lib/networks";

type JobRow = Job & { done: boolean; lockedAt: number | null; lastError: string | null };

class Memory implements Store {
  jobs: JobRow[] = [];
  channel = { id: "c1", workspaceId: "w", name: "Page", network: "fake", accountId: "me", status: "active" };
  state: { cursor: string | null; fetchedAt: Date | null; error: string | null } = { cursor: null, fetchedAt: null, error: null };
  items = new Map<string, InboxRow>();
  alerts: string[] = [];
  failSaves = 0;
  private seq = 0;

  queue() {
    this.jobs.push({ id: ++this.seq, kind: "inbox", payload: { channelId: "c1" }, attempts: 0, max_attempts: 6, done: false, lockedAt: null, lastError: null });
  }
  private take(n: number, inbox: boolean) {
    const due = this.jobs.filter((j) => !j.done && j.lockedAt === null && j.attempts < j.max_attempts && (j.kind === "inbox") === inbox).slice(0, n);
    for (const j of due) {
      j.lockedAt = 1;
      j.attempts++;
    }
    return due.map((j) => ({ ...j }));
  }
  async claim(_: string, n: number) {
    return this.take(n, false);
  }
  async claimInbox(_: string, n: number) {
    return this.take(n, true);
  }
  async jobDone(id: number, error: string | null) {
    Object.assign(this.jobs.find((j) => j.id === id)!, { done: true, lockedAt: null, lastError: error });
  }
  async jobRetry(id: number, _: Date, error: string) {
    Object.assign(this.jobs.find((j) => j.id === id)!, { lockedAt: null, lastError: error });
  }
  async target() {
    return null;
  }
  async publishing() {}
  async published() {}
  async retrying() {}
  async failed() {
    return null;
  }
  async reconnect(channelId: string) {
    if (channelId === this.channel.id) this.channel.status = "reconnect";
  }
  async settle() {}
  async secret() {
    return { accessToken: "x", refreshToken: null, expiresAt: null, extra: {} };
  }
  async media() {
    return [];
  }
  async alert(kind: string, t: TargetCtx) {
    this.alerts.push(`${kind}:${t.channelId}`);
  }
  async statsLater() {}
  async saveStats() {}
  async inboxChannel(id: string): Promise<InboxChannel | null> {
    return id === this.channel.id ? { ...this.channel, cursor: this.state.cursor, fetchedAt: this.state.fetchedAt } : null;
  }
  async threadsOf(_: string, ids: string[]) {
    return new Map(ids.filter((id) => this.items.has(id)).map((id) => [id, this.items.get(id)!.threadId]));
  }
  async saveInbox(_: InboxChannel, rows: InboxRow[], cursor: string | null, at: Date) {
    if (this.failSaves > 0) {
      this.failSaves--;
      throw new Error("database hiccup");
    }
    for (const r of rows) if (!this.items.has(r.networkId)) this.items.set(r.networkId, { ...r });
    this.state = { cursor, fetchedAt: at, error: null };
  }
  async closeThread(_: string, threadId: string, before: Date) {
    for (const r of this.items.values()) if (r.threadId === threadId && r.status === "open" && !r.mine && r.createdAt < before) r.status = "done";
  }
  async inboxError(_: string, error: string) {
    this.state.error = error;
  }
}

const item = (id: string, minutesAgo: number, more: Partial<InboxItem> = {}): InboxItem => ({ networkId: id, kind: "comment", authorName: `person ${id}`, text: `comment ${id}`, createdAt: new Date(Date.now() - minutesAgo * 60000), ...more });

/** A fake network holding `items`; it fails at the given rate, and gives back everything newer than `since`. */
function fakeInbox(items: InboxItem[], opts: { failRate?: number; error?: () => Error; seed?: number } = {}) {
  let seed = opts.seed ?? 3;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const asked: InboxQuery[] = [];
  let calls = 0;
  const provider: Provider = {
    network: "fake" as never,
    publish: async () => ({ id: "x" }),
    inbox: {
      fetch: async (_s, _a, q) => {
        calls++;
        asked.push(q);
        if (rand() < (opts.failRate ?? 0)) throw opts.error ? opts.error() : new Error("network timeout");
        return { items: items.filter((i) => i.createdAt >= q.since).map((i) => ({ ...i })), cursor: String(items.length) };
      },
      reply: async () => ({ id: "r" }),
    },
  };
  return { provider, asked, calls: () => calls };
}

async function round(m: Memory, p: Provider) {
  m.queue();
  await runInbox(m, () => p, "w1");
}

test("random read and save failures: every item is saved exactly once, nothing lost, and done stays done", async () => {
  for (const seed of [1, 7, 42, 99, 1234]) {
    const m = new Memory();
    const network: InboxItem[] = [];
    const net = fakeInbox(network, { failRate: 0.4, seed });
    let saveSeed = seed;
    const closed = new Set<string>();
    for (let r = 0; r < 40; r++) {
      for (let k = 0; k < 3; k++) network.push(item(`i${network.length}`, 0));
      saveSeed = (saveSeed * 7 + 3) % 10;
      if (saveSeed < 3) m.failSaves = 1;
      await round(m, net.provider);
      // A person closes whatever is open now and then; later reads must not reopen it.
      if (r % 5 === 4)
        for (const it of m.items.values()) {
          it.status = "done";
          closed.add(it.networkId);
        }
    }
    m.failSaves = 0;
    for (let r = 0; r < 3; r++) await round(m, fakeInbox(network).provider);
    assert.equal(m.items.size, network.length, `seed ${seed}: an item was lost`);
    assert.deepEqual([...m.items.keys()].sort(), network.map((i) => i.networkId).sort(), `seed ${seed}: items don't match the network`);
    assert.ok(closed.size > 0);
    assert.ok([...closed].every((id) => m.items.get(id)!.status === "done"), `seed ${seed}: a later read reopened an item marked done`);
    assert.ok(m.jobs.every((j) => j.done && j.attempts === 1), `seed ${seed}: inbox reads retry on their own next round, never in place`);
  }
});

test("the cursor only moves once the items are saved", async () => {
  const m = new Memory();
  const net = fakeInbox([item("a", 1), item("b", 1)]);
  m.failSaves = 1;
  await round(m, net.provider);
  assert.equal(m.state.cursor, null);
  assert.equal(m.items.size, 0);
  await round(m, net.provider);
  assert.equal(m.state.cursor, "2");
  assert.equal(m.items.size, 2);
});

test("an expired sign-in marks the channel, alerts once and stops reading it", async () => {
  const m = new Memory();
  const net = fakeInbox([item("a", 1)], { failRate: 1, error: () => new AuthError("token expired") });
  await round(m, net.provider);
  await round(m, net.provider);
  assert.equal(m.channel.status, "reconnect");
  assert.deepEqual(m.alerts, ["reconnect:c1"]);
  assert.equal(net.calls(), 1, "a channel waiting for reconnect isn't read");
  assert.ok(m.jobs.every((j) => j.done && j.attempts === 1));
});

test("a missing permission is kept on the channel without asking to reconnect", async () => {
  const m = new Memory();
  const net = fakeInbox([], { failRate: 1, error: () => new PostError("(#10) This endpoint requires the 'pages_read_user_content' permission") });
  await round(m, net.provider);
  assert.equal(m.channel.status, "active");
  assert.match(m.state.error ?? "", /pages_read_user_content/);
  assert.equal(m.alerts.length, 0);
  await round(m, fakeInbox([item("a", 1)]).provider);
  assert.equal(m.state.error, null, "a good read clears it");
});

test("the first read looks back 7 days; later ones from the last read, with a margin", async () => {
  const m = new Memory();
  const net = fakeInbox([item("old", (INBOX_DAYS + 1) * 1440), item("week", (INBOX_DAYS - 1) * 1440), item("new", 5)]);
  await round(m, net.provider);
  assert.deepEqual([...m.items.keys()].sort(), ["new", "week"]);
  const firstSince = net.asked[0].since.getTime();
  assert.ok(Math.abs(Date.now() - INBOX_DAYS * 86400000 - firstSince) < 5000);
  const lastRead = m.state.fetchedAt!.getTime();
  await round(m, net.provider);
  const second = net.asked[1];
  assert.equal(second.cursor, "3");
  assert.equal(second.since.getTime(), lastRead - INBOX_MARGIN_MIN * 60000);
});

test("replies join their parent's thread, from the same read or from what's saved", async () => {
  const m = new Memory();
  await round(m, fakeInbox([item("top", 30, { threadId: "top" })]).provider);
  await round(
    m,
    fakeInbox([
      item("r1", 20, { kind: "reply", parentId: "top" }),
      item("r2", 10, { kind: "reply", parentId: "r1" }),
      item("r3", 5, { kind: "reply", parentId: "r2" }),
      item("lost", 5, { kind: "reply", parentId: "unknown" }),
      item("dup", 4),
      item("dup", 4, { text: "the same again" }),
    ]).provider,
  );
  assert.deepEqual(["r1", "r2", "r3"].map((id) => m.items.get(id)!.threadId), ["top", "top", "top"]);
  assert.equal(m.items.get("lost")!.threadId, "unknown", "an unknown parent is the thread");
  assert.equal(m.items.get("dup")!.text, "comment dup", "one row per network id");
});

test("the channel's own answer is done and closes what came before it in the thread", async () => {
  const m = new Memory();
  await round(
    m,
    fakeInbox([
      item("q1", 30, { threadId: "t" }),
      item("q2", 20, { threadId: "t", kind: "reply", parentId: "q1" }),
      item("ours", 10, { threadId: "t", kind: "reply", parentId: "q2", mine: true }),
      item("q3", 5, { threadId: "t", kind: "reply", parentId: "ours" }),
      item("other", 25, { threadId: "u" }),
    ]).provider,
  );
  const st = (id: string) => m.items.get(id)!.status;
  assert.deepEqual([st("q1"), st("q2"), st("ours"), st("q3"), st("other")], ["done", "done", "done", "open", "open"]);
});

test("inbox jobs never go through the publishing claim", async () => {
  const m = new Memory();
  m.queue();
  const net = fakeInbox([item("a", 1)]);
  assert.equal(await runDue(m, () => net.provider, "w"), 0);
  assert.equal(net.calls(), 0);
  assert.equal(await runInbox(m, () => net.provider, "w"), 1);
  assert.equal(m.items.size, 1);
});

test("a network switched off (X without X_INBOX) is not read", async () => {
  const m = new Memory();
  const net = fakeInbox([item("a", 1)]);
  net.provider.inbox!.enabled = () => false;
  await round(m, net.provider);
  assert.equal(net.calls(), 0);
  assert.ok(m.jobs[0].done);
});

test("every network the screen offers an Inbox for has one, with the same like and hide", () => {
  for (const n of NETWORKS) {
    const box = PROVIDERS[n.id].inbox;
    assert.equal(Boolean(n.inbox), Boolean(box), `${n.id}: networks.ts and the provider disagree about the Inbox`);
    if (!n.inbox || !box) continue;
    assert.equal(Boolean(n.inbox.like), Boolean(box.like), `${n.id}: like`);
    assert.equal(Boolean(n.inbox.hide), Boolean(box.hide), `${n.id}: hide`);
  }
});

/** Swap fetch for one test: `route` answers each URL. */
async function withFetch(route: (url: string, init?: RequestInit) => unknown, run: () => Promise<void>) {
  const real = globalThis.fetch;
  globalThis.fetch = (async (u: string | URL, init?: RequestInit) => new Response(JSON.stringify(route(String(u), init)), { status: 200, headers: { "Content-Type": "application/json" } })) as typeof fetch;
  try {
    await run();
  } finally {
    globalThis.fetch = real;
  }
}

test("Mastodon: mentions become items, direct ones are messages, and the cursor reads on with min_id", async () => {
  const seen: string[] = [];
  const status = (id: string, more: Record<string, unknown> = {}) => ({
    id: `n${id}`,
    type: "mention",
    created_at: new Date().toISOString(),
    status: { id, uri: `https://m.example/s/${id}`, url: `https://m.example/@a/${id}`, content: "<p>@me hello &amp; welcome</p>", created_at: new Date().toISOString(), visibility: "public", account: { id: "77", acct: "a@else.social", display_name: "A" }, ...more },
  });
  await withFetch(
    (url) => {
      seen.push(url);
      return url.includes("min_id=n5") ? [status("6", { visibility: "direct" })] : [];
    },
    async () => {
      const s = { accessToken: "t", refreshToken: null, expiresAt: null, extra: { instance: "m.example" } };
      const out = await PROVIDERS.mastodon.inbox!.fetch(s, "1@m.example", { cursor: "n5", since: new Date(Date.now() - 3600000) });
      assert.equal(out.items.length, 1);
      assert.equal(out.items[0].kind, "dm");
      assert.equal(out.items[0].text, "@me hello & welcome");
      assert.equal(out.items[0].extra?.visibility, "direct");
      assert.equal(out.cursor, "n6");
    },
  );
  assert.ok(seen[0].includes("types%5B%5D=mention"));
});

test("YouTube: threads and their replies, our own comments marked", async () => {
  const at = new Date().toISOString();
  const c = (id: string, author: string) => ({ id, snippet: { authorDisplayName: author, authorChannelId: { value: author }, textOriginal: `text ${id}`, publishedAt: at } });
  await withFetch(
    () => ({ items: [{ id: "T1", snippet: { videoId: "v1", topLevelComment: c("T1", "fan") }, replies: { comments: [c("T1.a", "UCme"), c("T1.b", "fan")] } }] }),
    async () => {
      const out = await PROVIDERS.youtube.inbox!.fetch({ accessToken: "t", refreshToken: null, expiresAt: null, extra: {} }, "UCme", { cursor: null, since: new Date(Date.now() - 3600000) });
      assert.deepEqual(
        out.items.map((i) => [i.networkId, i.kind, i.threadId, Boolean(i.mine), i.postRemoteId]),
        [
          ["T1", "comment", "T1", false, "v1"],
          ["T1.a", "reply", "T1", true, "v1"],
          ["T1.b", "reply", "T1", false, "v1"],
        ],
      );
    },
  );
});
