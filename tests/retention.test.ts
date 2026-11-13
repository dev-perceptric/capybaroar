// Retention and deletion tests. They prove: each kind of row expires exactly at its keep time and open or unfinished
// rows never do; a channel's token is only ended on the network when no channel that stays relies on the same
// sign-in; deleting a workspace ends every channel's access even when some networks fail, deletes files before rows
// and stops before anything else when the subscription can't be cancelled; account deletion is refused while the
// person alone runs a workspace others use; and each network's disconnect calls its documented revoke endpoint.
// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { RETENTION, accountPlan, cutoffs, deleteWorkspaceWith, expired, revokeBlocked, type ChannelRef, type DeleteSteps } from "../src/lib/retention";
import { PROVIDERS } from "../src/lib/providers";
import type { Secret } from "../src/lib/providers/types";

const NOW = new Date("2026-11-13T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const DAY = 86400000;

test("sign-in states expire after an hour", () => {
  assert.equal(expired.oauthState({ created_at: ago(3600000 - 1000) }, NOW), false);
  assert.equal(expired.oauthState({ created_at: ago(3600000 + 1000) }, NOW), true);
  assert.equal(cutoffs(NOW).oauthStates.getTime(), NOW.getTime() - RETENTION.oauthStateMs);
});

test("closed Inbox items go after 180 days; open ones stay however old", () => {
  assert.equal(expired.inboxItem({ status: "done", created_at: ago(179 * DAY) }, NOW), false);
  assert.equal(expired.inboxItem({ status: "done", created_at: ago(181 * DAY) }, NOW), true);
  assert.equal(expired.inboxItem({ status: "open", created_at: ago(1000 * DAY) }, NOW), false);
});

test("agent chats go 365 days after their last message, or after being made when empty", () => {
  assert.equal(expired.agentChat({ created_at: ago(400 * DAY), last_message_at: ago(10 * DAY) }, NOW), false);
  assert.equal(expired.agentChat({ created_at: ago(400 * DAY), last_message_at: ago(366 * DAY) }, NOW), true);
  assert.equal(expired.agentChat({ created_at: ago(366 * DAY) }, NOW), true);
  assert.equal(expired.agentChat({ created_at: ago(364 * DAY), last_message_at: null }, NOW), false);
});

test("finished jobs go after 30 days; waiting or running jobs never do", () => {
  assert.equal(expired.job({ done_at: ago(29 * DAY) }, NOW), false);
  assert.equal(expired.job({ done_at: ago(31 * DAY) }, NOW), true);
  assert.equal(expired.job({ done_at: null }, NOW), false);
});

const ch = (id: string, network: string, accountId: string, workspaceId = "w1"): ChannelRef => ({ id, workspaceId, network, accountId });

test("a token is ended only when no channel that stays uses the same sign-in", () => {
  const x = ch("a", "x", "42");
  assert.equal(revokeBlocked(x, []), false);
  // The same X account connected in another workspace.
  assert.equal(revokeBlocked(x, [ch("b", "x", "42", "w2")]), true);
  // Another X account, or the same id on another network, doesn't count.
  assert.equal(revokeBlocked(x, [ch("b", "x", "43"), ch("c", "reddit", "42")]), false);
  // The channel itself in the list never blocks.
  assert.equal(revokeBlocked(x, [x]), false);
});

test("Google: one sign-in's Business locations and YouTube channels in a workspace keep each other's token", () => {
  const loc = ch("a", "gbp", "accounts/1/locations/10");
  // Another location from the same sign-in: Google's revoke would end both.
  assert.equal(revokeBlocked(loc, [ch("b", "gbp", "accounts/1/locations/11")]), true);
  // Another location of the same Business account in another workspace.
  assert.equal(revokeBlocked(loc, [ch("b", "gbp", "accounts/1/locations/11", "w2")]), true);
  // YouTube in the same workspace may be the same Google person.
  assert.equal(revokeBlocked(loc, [ch("b", "youtube", "UC1")]), true);
  assert.equal(revokeBlocked(ch("y", "youtube", "UC1"), [ch("b", "gbp", "accounts/9/locations/1")]), true);
  // A different Business account in another workspace is someone else's sign-in.
  assert.equal(revokeBlocked(loc, [ch("b", "gbp", "accounts/2/locations/11", "w2")]), false);
  // "accounts/1/" never matches "accounts/12/".
  assert.equal(revokeBlocked(loc, [ch("b", "gbp", "accounts/12/locations/11", "w2")]), false);
  // Other networks in the workspace don't hold a Google grant.
  assert.equal(revokeBlocked(loc, [ch("b", "x", "1"), ch("c", "tiktok", "2")]), false);
});

/** A fake workspace: records the order steps ran in. */
function fakeSteps(o: { channels: ChannelRef[]; files: string[]; failRevoke?: Set<string>; failBilling?: number; gone?: boolean }) {
  const log: string[] = [];
  let billingFails = o.failBilling ?? 0;
  let rows = !o.gone;
  const steps: DeleteSteps = {
    exists: async () => rows,
    cancelBilling: async () => {
      log.push("billing");
      if (billingFails-- > 0) throw new Error("Stripe is busy");
    },
    channels: async () => o.channels,
    revoke: async (c) => {
      log.push(`revoke:${c.id}`);
      if (o.failRevoke?.has(c.id)) throw new Error(`${c.network} said no`);
    },
    files: async () => o.files,
    removeFiles: async (paths) => {
      log.push(`files:${paths.length}`);
    },
    deleteRows: async () => {
      log.push("rows");
      rows = false;
    },
  };
  return { steps, log };
}

test("deleting a workspace ends every channel's access even when some networks fail, then files, then rows", async () => {
  const channels = [ch("a", "x", "1"), ch("b", "reddit", "2"), ch("c", "youtube", "3"), ch("d", "tiktok", "4")];
  const files = Array.from({ length: 250 }, (_, i) => `w1/${i}.png`);
  const { steps, log } = fakeSteps({ channels, files: [...files, "w1/0.png"], failRevoke: new Set(["a", "c"]) });
  const r = await deleteWorkspaceWith(steps);
  assert.deepEqual(log, ["billing", "revoke:a", "revoke:b", "revoke:c", "revoke:d", "files:100", "files:100", "files:50", "rows"]);
  assert.deepEqual(r, { deleted: true, channels: 4, revokeFailed: 2, files: 250 });
});

test("when the subscription can't be cancelled nothing is deleted, and the retry finishes it", async () => {
  const { steps, log } = fakeSteps({ channels: [ch("a", "x", "1")], files: ["w1/a.png"], failBilling: 1 });
  await assert.rejects(deleteWorkspaceWith(steps), /Stripe is busy/);
  assert.deepEqual(log, ["billing"]);
  await deleteWorkspaceWith(steps);
  assert.deepEqual(log, ["billing", "billing", "revoke:a", "files:1", "rows"]);
  // A repeat after it finished does nothing.
  const again = await deleteWorkspaceWith(steps);
  assert.equal(again.deleted, false);
  assert.equal(log.length, 5);
});

test("a failure removing files leaves the rows, so the retry still knows what to delete", async () => {
  const { steps, log } = fakeSteps({ channels: [], files: ["w1/a.png"] });
  steps.removeFiles = async () => {
    log.push("files");
    throw new Error("storage busy");
  };
  await assert.rejects(deleteWorkspaceWith(steps), /storage busy/);
  assert.equal(log.includes("rows"), false);
});

test("an account can't be deleted while its person alone runs a workspace others use", () => {
  const p = accountPlan([
    { workspaceId: "solo", name: "Solo", role: "owner", members: 1, owners: 1 },
    { workspaceId: "team", name: "Team", role: "owner", members: 3, owners: 1 },
    { workspaceId: "shared", name: "Shared", role: "owner", members: 3, owners: 2 },
    { workspaceId: "client", name: "Client", role: "editor", members: 4, owners: 1 },
  ]);
  assert.deepEqual(p.blockedBy, ["Team"]);
  assert.deepEqual(p.deleteWorkspaces, ["solo"]);
  assert.deepEqual(p.leave, ["team", "shared", "client"]);
  assert.deepEqual(accountPlan([{ workspaceId: "shared", name: "Shared", role: "owner", members: 3, owners: 2 }]).blockedBy, []);
});

/** Runs a provider's revoke against a fake network and returns the requests it made. */
async function revokeCalls(network: keyof typeof PROVIDERS, s: Secret, status = 200) {
  const real = globalThis.fetch;
  const seen: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (u: string | URL | Request, init: RequestInit = {}) => {
    seen.push({ url: String(u), init });
    return new Response(status === 200 ? "{}" : JSON.stringify({ error: "nope" }), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  try {
    await PROVIDERS[network].revoke!(s);
  } finally {
    globalThis.fetch = real;
  }
  return seen;
}

const secret = (o: Partial<Secret> = {}): Secret => ({ accessToken: "acc", refreshToken: "ref", expiresAt: null, extra: {}, ...o });
const body = (init: RequestInit) => new URLSearchParams(String(init.body));

test("Google disconnects end the grant with the refresh token at oauth2.googleapis.com/revoke", async () => {
  for (const n of ["youtube", "gbp"] as const) {
    const seen = await revokeCalls(n, secret());
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, "https://oauth2.googleapis.com/revoke");
    assert.equal(seen[0].init.method, "POST");
    assert.equal(body(seen[0].init).get("token"), "ref");
  }
  const only = await revokeCalls("youtube", secret({ refreshToken: null }));
  assert.equal(body(only[0].init).get("token"), "acc");
});

test("X ends both tokens with the app's Basic auth, and reports a failure after trying both", async () => {
  const seen = await revokeCalls("x", secret());
  assert.deepEqual(seen.map((s) => s.url), ["https://api.x.com/2/oauth2/revoke", "https://api.x.com/2/oauth2/revoke"]);
  assert.deepEqual(seen.map((s) => [body(s.init).get("token"), body(s.init).get("token_type_hint")]), [["ref", "refresh_token"], ["acc", "access_token"]]);
  assert.match(String((seen[0].init.headers as Record<string, string>).Authorization), /^Basic /);
  const real = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => (calls++, new Response("{}", { status: 503 }))) as typeof fetch;
  try {
    await assert.rejects(PROVIDERS.x.revoke!(secret()));
  } finally {
    globalThis.fetch = real;
  }
  assert.equal(calls, 2);
});

test("Reddit ends the refresh token (and with it the access tokens) at /api/v1/revoke_token", async () => {
  const seen = await revokeCalls("reddit", secret());
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, "https://www.reddit.com/api/v1/revoke_token");
  assert.equal(body(seen[0].init).get("token"), "ref");
  assert.equal(body(seen[0].init).get("token_type_hint"), "refresh_token");
  const h = seen[0].init.headers as Record<string, string>;
  assert.match(h.Authorization, /^Basic /);
  assert.ok(h["User-Agent"]);
});
