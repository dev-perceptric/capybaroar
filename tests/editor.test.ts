// Editing a published post, against fake networks and an in-memory store. They prove: each change gets exactly one
// result even when networks fail, hang or throw at random; nothing is saved unless the network took the change; a
// change that changes nothing is never sent; only allowed settings change; checks (length, required settings) stop a
// bad change before it's sent; deleted posts and networks without edit are skipped; AuthError marks the channel for
// reconnect; saving is retried; and one post never runs twice at once.
import { test } from "node:test";
import assert from "node:assert/strict";
import { editTargets, type EditStore, type EditTarget } from "../src/lib/editor";
import { AuthError, PostError, type Provider, type Remote, type Publishable, type Secret } from "../src/lib/providers/types";
import { networkOf } from "../src/lib/networks";

const secret: Secret = { accessToken: "tok", refreshToken: null, expiresAt: null, extra: {} };

// The rules read what can change from networks.ts; pin it here so these tests don't depend on each network's entry.
Object.assign(networkOf("mastodon"), { edit: { text: true, settings: [] } });
Object.assign(networkOf("youtube"), { edit: { text: true, settings: ["title", "tags"] } });

class Memory implements EditStore {
  saves = new Map<string, { text: string; settings: Record<string, string> }>();
  reconnected: string[] = [];
  failSaves = 0;
  async secret() {
    return secret;
  }
  async saved(targetId: string, text: string, settings: Record<string, string>) {
    if (this.failSaves > 0) {
      this.failSaves--;
      throw new Error("db down");
    }
    this.saves.set(targetId, { text, settings });
  }
  async reconnect(channelId: string) {
    this.reconnected.push(channelId);
  }
}

type Sent = { network: string; r: Remote; p: Publishable };
function fakeProviders(behave: (network: string, sent: Sent) => Promise<void>, noEdit: string[] = []) {
  const sent: Sent[] = [];
  const make = (network: string): Provider => ({
    network: network as Provider["network"],
    publish: async () => ({ id: "x" }),
    ...(noEdit.includes(network)
      ? {}
      : {
          edit: async (_s: Secret, _a: string, r: Remote, p: Publishable) => {
            const one = { network, r, p };
            sent.push(one);
            await behave(network, one);
          },
        }),
  });
  return { sent, providers: (n: string) => make(n) };
}

const target = (o: Partial<EditTarget> & { id: string; channelId: string; network: string }): EditTarget => ({
  postId: "p1",
  channelName: o.channelId,
  channelStatus: "active",
  accountId: "acc",
  status: "published",
  remoteId: `r-${o.id}`,
  url: null,
  publishedAt: new Date("2026-11-13T02:00:00Z"),
  deletedAt: null,
  text: "old text",
  settings: {},
  media: 0,
  ...o,
});

test("a change goes out once and is saved only after the network took it", async () => {
  const store = new Memory();
  const { sent, providers } = fakeProviders(async () => undefined);
  const ts = [target({ id: "t1", channelId: "c1", network: "mastodon" })];
  const r = await editTargets(store, providers, ts, [{ channelId: "c1", text: "new text", settings: {} }]);
  assert.deepEqual(r.map((x) => x.result), ["edited"]);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].r.id, "r-t1");
  assert.equal(sent[0].p.text, "new text");
  assert.deepEqual(store.saves.get("t1"), { text: "new text", settings: {} });
});

test("nothing changed: nothing is sent or saved", async () => {
  const store = new Memory();
  const { sent, providers } = fakeProviders(async () => undefined);
  const ts = [target({ id: "t1", channelId: "c1", network: "youtube", settings: { title: "T", privacy: "public" } })];
  const r = await editTargets(store, providers, ts, [{ channelId: "c1", text: " old text ", settings: { title: "T" } }]);
  assert.equal(r[0].result, "unchanged");
  assert.equal(sent.length, 0);
  assert.equal(store.saves.size, 0);
});

test("only the settings the network allows change; the rest stay as they went out", async () => {
  const store = new Memory();
  const { sent, providers } = fakeProviders(async () => undefined);
  const ts = [target({ id: "t1", channelId: "c1", network: "youtube", settings: { title: "Old", privacy: "public", category: "22" } })];
  await editTargets(store, providers, ts, [{ channelId: "c1", text: "old text", settings: { title: "New", privacy: "private", category: "10", tags: "a, b" } }]);
  assert.deepEqual(sent[0].p.settings, { title: "New", privacy: "public", category: "22", tags: "a, b" });
});

test("a bad change is stopped before it's sent: too long, or a required setting emptied", async () => {
  const store = new Memory();
  const { sent, providers } = fakeProviders(async () => undefined);
  const ts = [target({ id: "t1", channelId: "c1", network: "mastodon" }), target({ id: "t2", channelId: "c2", network: "youtube", settings: { title: "T" } })];
  const r = await editTargets(store, providers, ts, [
    { channelId: "c1", text: "x".repeat(networkOf("mastodon").limit + 1), settings: {} },
    { channelId: "c2", text: "new", settings: { title: "  " } },
  ]);
  assert.deepEqual(r.map((x) => x.result), ["failed", "failed"]);
  assert.match(r[0].error!, /characters/);
  assert.match(r[1].error!, /title/);
  assert.equal(sent.length, 0);
});

test("deleted posts, posts that never went out and networks without edit are skipped", async () => {
  const store = new Memory();
  const { sent, providers } = fakeProviders(async () => undefined, ["mastodon"]);
  const ts = [
    target({ id: "t1", channelId: "c1", network: "youtube", settings: { title: "T" }, deletedAt: new Date() }),
    target({ id: "t2", channelId: "c2", network: "youtube", settings: { title: "T" }, status: "failed", remoteId: null }),
    target({ id: "t3", channelId: "c3", network: "mastodon" }),
  ];
  const r = await editTargets(store, providers, ts, ["c1", "c2", "c3", "c4"].map((channelId) => ({ channelId, text: "new", settings: { title: "T" } })));
  assert.deepEqual(r.map((x) => x.result), ["skipped", "skipped", "skipped", "skipped"]);
  assert.equal(sent.length, 0);
});

test("AuthError marks the channel for reconnect and saves nothing; PostError keeps its message", async () => {
  const store = new Memory();
  const { providers } = fakeProviders(async (network) => {
    if (network === "mastodon") throw new AuthError("Mastodon: token revoked");
    throw new PostError("YouTube: title too long");
  });
  const ts = [target({ id: "t1", channelId: "c1", network: "mastodon" }), target({ id: "t2", channelId: "c2", network: "youtube", settings: { title: "T" } })];
  const r = await editTargets(store, providers, ts, [
    { channelId: "c1", text: "new", settings: {} },
    { channelId: "c2", text: "new", settings: { title: "T" } },
  ]);
  assert.deepEqual(r.map((x) => x.result), ["failed", "failed"]);
  assert.deepEqual(store.reconnected, ["c1"]);
  assert.equal(r[1].error, "YouTube: title too long");
  assert.equal(store.saves.size, 0);
});

test("a hanging network times out without holding up the others", async () => {
  const store = new Memory();
  const { providers } = fakeProviders(async (network) => {
    if (network === "mastodon") await new Promise(() => undefined);
  });
  const ts = [target({ id: "t1", channelId: "c1", network: "mastodon" }), target({ id: "t2", channelId: "c2", network: "youtube", settings: { title: "T" } })];
  const r = await editTargets(store, providers, ts, [
    { channelId: "c1", text: "new", settings: {} },
    { channelId: "c2", text: "new", settings: { title: "T" } },
  ], 50);
  assert.deepEqual(r.map((x) => x.result), ["failed", "edited"]);
  assert.match(r[0].error!, /in time/);
  assert.ok(!store.saves.has("t1"));
  assert.ok(store.saves.has("t2"));
});

test("saving is retried; after 3 failures it says the change is live but not saved", async () => {
  const store = new Memory();
  const { providers } = fakeProviders(async () => undefined);
  const ts = [target({ id: "t1", channelId: "c1", network: "mastodon" })];
  store.failSaves = 2;
  assert.equal((await editTargets(store, providers, ts, [{ channelId: "c1", text: "new", settings: {} }]))[0].result, "edited");
  store.failSaves = 3;
  const r = await editTargets(store, providers, ts, [{ channelId: "c1", text: "newer", settings: {} }]);
  assert.equal(r[0].result, "failed");
  assert.match(r[0].error!, /not saved here/);
});

test("random failures: every change gets exactly one result, and only edited ones are saved", async () => {
  for (let round = 0; round < 30; round++) {
    const store = new Memory();
    const { providers } = fakeProviders(async () => {
      const roll = Math.random();
      if (roll < 0.25) throw new Error("503");
      if (roll < 0.35) throw new PostError("bad");
      if (roll < 0.4) throw new AuthError("expired");
      if (roll < 0.5) await new Promise((r) => setTimeout(r, 5));
    });
    const ts = Array.from({ length: 6 }, (_, i) => target({ id: `t${i}`, channelId: `c${i}`, network: i % 2 ? "mastodon" : "youtube", settings: { title: "T" } }));
    const r = await editTargets(store, providers, ts, ts.map((t) => ({ channelId: t.channelId, text: `new ${round}`, settings: { title: "T" } })), 1000);
    assert.equal(r.length, ts.length);
    assert.deepEqual(r.map((x) => x.channelId), ts.map((t) => t.channelId));
    for (const x of r) assert.equal(store.saves.has(`t${x.channelId.slice(1)}`), x.result === "edited");
  }
});

test("one post never runs twice at once", async () => {
  const store = new Memory();
  let release: () => void = () => undefined;
  const { providers } = fakeProviders(() => new Promise<void>((r) => (release = r)));
  const ts = [target({ id: "t1", channelId: "c1", network: "mastodon" })];
  const first = editTargets(store, providers, ts, [{ channelId: "c1", text: "new", settings: {} }]);
  await assert.rejects(editTargets(store, providers, ts, [{ channelId: "c1", text: "newer", settings: {} }]), /being changed/);
  release();
  assert.equal((await first)[0].result, "edited");
});
