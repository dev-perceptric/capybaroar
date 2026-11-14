// Two-factor sign-in, the pure parts. They prove: backup codes are random, readable, hashed per person and used only
// once, even when two tries race or a reply is lost and the try is repeated; an authenticator code survives an expired
// challenge and network hiccups but a wrong code is never tried twice; and where a signed-in person goes: an app on
// file but only a password (aal1) goes to /mfa, a workspace that requires 2FA without an app goes to /mfa/setup,
// aal2 goes through, an unverified app doesn't count, and the API, MCP, /mfa itself, sign-out and the auth callback
// never go through the gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { BACKUP_COUNT, codeKind, hashBackup, mfaGate, mfaNext, newBackupCodes, normalizeBackup, redeemBackup, retry, transient, verifiedTotp, verifyTotp, type BackupStore, type TotpApi } from "../src/lib/mfaRules";
import { config, safeNext } from "../src/proxy";

process.env.APP_URL = "https://app.capybaroar.com";
const now = async () => {};

// ---------- backup codes ----------

test("ten different codes, 10 readable characters in two groups", () => {
  const codes = newBackupCodes();
  assert.equal(codes.length, BACKUP_COUNT);
  assert.equal(new Set(codes).size, BACKUP_COUNT);
  for (const c of codes) {
    assert.match(c, /^[2-9a-hjkmnp-z]{5}-[2-9a-hjkmnp-z]{5}$/);
    assert.equal(normalizeBackup(c), c.replace("-", ""));
  }
  // Two sets never share a code.
  const other = new Set(newBackupCodes());
  assert.ok(codes.every((c) => !other.has(c)));
});

test("every character is equally likely (bytes past the last full alphabet are skipped)", () => {
  // A source that gives only 255s (which would bias toward the start) must be skipped, then real bytes used.
  let calls = 0;
  const bytes = (n: number) => {
    calls++;
    return calls === 1 ? new Uint8Array(n).fill(255) : Uint8Array.from({ length: n }, (_, i) => (i * 7 + calls) % 248);
  };
  const [c] = newBackupCodes(1, bytes);
  assert.ok(calls >= 2);
  assert.ok(normalizeBackup(c));
});

test("codes read the way people type them", () => {
  assert.equal(normalizeBackup(" ABCDE-FGHJK "), "abcdefghjk");
  assert.equal(normalizeBackup("abcde fghjk"), "abcdefghjk");
  assert.equal(normalizeBackup("abcdefghjk"), "abcdefghjk");
  // 0, 1, i, l, o aren't in the alphabet; too short or long isn't a code.
  for (const bad of ["abcde-fghj0", "abcde-fghi2", "abcd-fghjk", "abcde-fghjkm", "", "123456"]) assert.equal(normalizeBackup(bad), null, bad);
  assert.equal(codeKind("123456"), "totp");
  assert.equal(codeKind("123 456"), "totp");
  assert.equal(codeKind("abcde-fghjk"), "backup");
  assert.equal(codeKind("12345"), null);
  assert.equal(codeKind("1234567"), null);
  assert.equal(codeKind("hello"), null);
});

test("a hash is the same for the same person and code, different for another person, and never the code", async () => {
  const a = await hashBackup("user-a", "abcde-fghjk");
  assert.equal(await hashBackup("user-a", "ABCDE FGHJK"), a);
  assert.notEqual(await hashBackup("user-b", "abcde-fghjk"), a);
  assert.notEqual(await hashBackup("user-a", "abcde-fghjm"), a);
  assert.ok(!a.includes("abcde"));
  assert.ok(a.length >= 40 && a.length <= 128);
  await assert.rejects(hashBackup("user-a", "nope"));
});

/** The table and use_backup_code() from 038: an update that only one try can win, remembering which try it was. */
function memoryStore(hashes: string[], flaky: { before?: number; after?: number } = {}) {
  const rows = hashes.map((h) => ({ user: "u", hash: h, usedBy: null as string | null }));
  let before = flaky.before ?? 0;
  let after = flaky.after ?? 0;
  let calls = 0;
  const store: BackupStore = {
    async consume(user, hash, attempt) {
      calls++;
      if (before > 0) {
        before--;
        throw Object.assign(new Error("fetch failed"), { status: 0 });
      }
      await Promise.resolve();
      const row = rows.find((r) => r.user === user && r.hash === hash);
      let won = false;
      if (row && row.usedBy == null) {
        row.usedBy = attempt;
        won = true;
      }
      // The change went through, but the reply was lost.
      if (after > 0) {
        after--;
        throw Object.assign(new Error("socket hang up"), { status: 0 });
      }
      return won || row?.usedBy === attempt;
    },
  };
  return { store, rows, calls: () => calls };
}

const fastHash = async (u: string, c: string) => `${u}:${normalizeBackup(c)}`.padEnd(24, "x");

test("a backup code works once", async () => {
  const { store } = memoryStore([await fastHash("u", "abcde-fghjk")]);
  assert.equal(await redeemBackup(store, "u", "abcde-fghjk", { hash: fastHash, sleep: now }), "ok");
  assert.equal(await redeemBackup(store, "u", "abcde-fghjk", { hash: fastHash, sleep: now }), "wrong");
  assert.equal(await redeemBackup(store, "u", "zzzzz-zzzzz", { hash: fastHash, sleep: now }), "wrong");
  assert.equal(await redeemBackup(store, "u", "not a code", { hash: fastHash, sleep: now }), "wrong");
  // Someone else's code is not yours.
  assert.equal(await redeemBackup(store, "other", "abcde-fghjk", { hash: fastHash, sleep: now }), "wrong");
});

test("two tries with the same code at once: exactly one gets in", async () => {
  const { store } = memoryStore([await fastHash("u", "abcde-fghjk")]);
  const results = await Promise.all(Array.from({ length: 5 }, () => redeemBackup(store, "u", "abcde-fghjk", { hash: fastHash, sleep: now })));
  assert.equal(results.filter((r) => r === "ok").length, 1);
});

test("flaky: the database fails before the change, the retry uses the code", async () => {
  const s = memoryStore([await fastHash("u", "abcde-fghjk")], { before: 2 });
  assert.equal(await redeemBackup(s.store, "u", "abcde-fghjk", { hash: fastHash, sleep: now }), "ok");
  assert.equal(s.calls(), 3);
});

test("flaky: the code was used but the reply was lost; the retry still counts as this try, not 'already used'", async () => {
  const s = memoryStore([await fastHash("u", "abcde-fghjk")], { after: 1 });
  assert.equal(await redeemBackup(s.store, "u", "abcde-fghjk", { hash: fastHash, sleep: now }), "ok");
  // And it's gone for any other try.
  assert.equal(await redeemBackup(s.store, "u", "abcde-fghjk", { hash: fastHash, sleep: now }), "wrong");
});

test("flaky: a database that stays down throws (shown as an error), and the code isn't used up", async () => {
  const s = memoryStore([await fastHash("u", "abcde-fghjk")], { before: 3 });
  await assert.rejects(redeemBackup(s.store, "u", "abcde-fghjk", { hash: fastHash, sleep: now }));
  assert.equal(s.rows[0].usedBy, null);
  assert.equal(await redeemBackup(s.store, "u", "abcde-fghjk", { hash: fastHash, sleep: now }), "ok");
});

test("retry tries again only after hiccups, with growing waits", async () => {
  const waits: number[] = [];
  let n = 0;
  const v = await retry(
    async () => {
      if (++n < 3) throw Object.assign(new Error("busy"), { status: 503 });
      return "done";
    },
    { sleep: async (ms) => void waits.push(ms) },
  );
  assert.equal(v, "done");
  assert.deepEqual(waits, [200, 400]);
  let m = 0;
  await assert.rejects(
    retry(async () => {
      m++;
      throw Object.assign(new Error("duplicate key"), { status: 409 });
    }, { sleep: now }),
  );
  assert.equal(m, 1);
  assert.ok(transient({ name: "AuthRetryableFetchError" }));
  assert.ok(transient({ status: 429 }));
  assert.ok(transient(new Error("fetch failed")));
  assert.ok(!transient({ status: 400, code: "mfa_verification_failed" }));
  assert.ok(!transient(null));
});

// ---------- authenticator codes ----------

type Call = { kind: "challenge" | "verify"; challengeId?: string };
/** Supabase Auth's challenge and verify, scripted: each verify answer in turn ("ok", an error code, or a hiccup). */
function scripted(verifies: ("ok" | "wrong" | "expired" | "down" | "throw")[], challenges: ("ok" | "down")[] = []) {
  const calls: Call[] = [];
  let c = 0;
  const api: TotpApi = {
    async challenge() {
      const what = challenges[c] ?? "ok";
      c++;
      calls.push({ kind: "challenge" });
      if (what === "down") return { data: null, error: { name: "AuthRetryableFetchError", status: 0, message: "fetch failed" } };
      return { data: { id: `ch${c}` }, error: null };
    },
    async verify({ challengeId, code }) {
      calls.push({ kind: "verify", challengeId });
      assert.match(code, /^\d{6}$/);
      const what = verifies.shift() ?? "wrong";
      if (what === "ok") return { data: {}, error: null };
      if (what === "wrong") return { data: null, error: { status: 422, code: "mfa_verification_failed", message: "Invalid TOTP code entered" } };
      if (what === "expired") return { data: null, error: { status: 422, code: "mfa_challenge_expired", message: "Challenge expired" } };
      if (what === "throw") throw new TypeError("fetch failed");
      return { data: null, error: { status: 503, message: "Service unavailable" } };
    },
  };
  return { api, calls };
}

test("a right code passes on the first try", async () => {
  const s = scripted(["ok"]);
  assert.deepEqual(await verifyTotp(s.api, "f1", "123 456", { sleep: now }), { ok: true });
  assert.equal(s.calls.length, 2);
});

test("a wrong code is wrong, and never tried a second time", async () => {
  const s = scripted(["wrong", "ok"]);
  const r = await verifyTotp(s.api, "f1", "123456", { sleep: now });
  assert.deepEqual(r, { ok: false, reason: "wrong" });
  assert.equal(s.calls.filter((c) => c.kind === "verify").length, 1);
  // Not six digits: Supabase isn't asked at all.
  const t = scripted(["ok"]);
  assert.deepEqual(await verifyTotp(t.api, "f1", "12345", { sleep: now }), { ok: false, reason: "wrong" });
  assert.equal(t.calls.length, 0);
});

test("odd case: the challenge expired; a fresh challenge is made and the code checked against it", async () => {
  const s = scripted(["expired", "ok"]);
  assert.deepEqual(await verifyTotp(s.api, "f1", "123456", { sleep: now }), { ok: true });
  const verifies = s.calls.filter((c) => c.kind === "verify");
  assert.equal(verifies.length, 2);
  assert.notEqual(verifies[0].challengeId, verifies[1].challengeId);
  // Expired again right away: stop, instead of looping.
  const t = scripted(["expired", "expired", "ok"]);
  assert.deepEqual(await verifyTotp(t.api, "f1", "123456", { sleep: now }), { ok: false, reason: "expired" });
});

test("flaky: Supabase Auth busy or unreachable, then fine: the code still passes", async () => {
  assert.deepEqual(await verifyTotp(scripted(["down", "ok"]).api, "f1", "123456", { sleep: now }), { ok: true });
  assert.deepEqual(await verifyTotp(scripted(["throw", "ok"]).api, "f1", "123456", { sleep: now }), { ok: true });
  assert.deepEqual(await verifyTotp(scripted(["ok"], ["down"]).api, "f1", "123456", { sleep: now }), { ok: true });
  // Down the whole time: a failure to show, not "wrong code".
  const r = await verifyTotp(scripted(["down", "down", "down", "down"]).api, "f1", "123456", { sleep: now });
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.reason, "failed");
});

// ---------- where people go ----------

const gate = (aal: string | null | undefined, verified: boolean, required: boolean, next = "/calendar") => mfaGate({ aal, verified, required, next });

test("an app on file and only a password (aal1): enter a code first, then back to where they were going", () => {
  assert.equal(gate("aal1", true, false), "/mfa");
  assert.equal(gate("aal1", true, false, "/settings?tab=team"), "/mfa?next=%2Fsettings%3Ftab%3Dteam");
  // A token without a level counts as aal1.
  assert.equal(gate(undefined, true, false), "/mfa");
  assert.equal(gate(null, true, true), "/mfa");
});

test("aal2 goes through", () => {
  assert.equal(gate("aal2", true, false), null);
  assert.equal(gate("aal2", true, true), null);
});

test("no app, workspace doesn't require it: through", () => {
  assert.equal(gate("aal1", false, false), null);
});

test("workspace requires 2FA, no app: set one up", () => {
  assert.equal(gate("aal1", false, true), "/mfa/setup");
  assert.equal(gate("aal1", false, true, "/inbox"), "/mfa/setup?next=%2Finbox");
  // aal2 from before, but the app was removed since: set up again.
  assert.equal(gate("aal2", false, true), "/mfa/setup");
});

test("odd case: an app set up but never confirmed (unverified) doesn't count", () => {
  const factors = [
    { id: "a", factor_type: "totp", status: "unverified" },
    { id: "b", factor_type: "phone", status: "verified" },
  ];
  assert.deepEqual(verifiedTotp(factors), []);
  assert.equal(gate("aal1", verifiedTotp(factors).length > 0, false), null);
  assert.equal(gate("aal1", verifiedTotp(factors).length > 0, true), "/mfa/setup");
  assert.deepEqual(verifiedTotp([...factors, { id: "c", factor_type: "totp", status: "verified" }]).map((f) => f.id), ["c"]);
  assert.deepEqual(verifiedTotp(null), []);
});

test("odd case: switching to a workspace that requires 2FA", () => {
  // The same person: fine in the workspace without the rule, sent to set up in the one with it.
  assert.equal(gate("aal1", false, false, "/calendar"), null);
  assert.equal(gate("aal1", false, true, "/calendar"), "/mfa/setup");
  // With an app and a code already given, the switch changes nothing.
  assert.equal(gate("aal2", true, true), null);
  // With an app but only a password, the code comes first, whatever the workspace.
  assert.equal(gate("aal1", true, true), "/mfa");
});

test("next stays on this site and never loops back to /mfa", () => {
  assert.equal(mfaNext("/settings", safeNext), "/settings");
  assert.equal(mfaNext("//evil.com", safeNext), "/calendar");
  assert.equal(mfaNext("https://evil.com", safeNext), "/calendar");
  assert.equal(mfaNext(null, safeNext), "/calendar");
  assert.equal(mfaNext("/mfa", safeNext), "/calendar");
  assert.equal(mfaNext("/mfa?next=/x", safeNext), "/calendar");
  assert.equal(mfaNext("/mfa/setup", safeNext), "/calendar");
  assert.equal(mfaNext("/oauth/authorize?client_id=a&state=b", safeNext), "/oauth/authorize?client_id=a&state=b");
});

// ---------- the gate's reach ----------

const root = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
function files(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((n) => {
    const p = join(dir, n);
    return statSync(join(root, p)).isDirectory() ? files(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
}
const usesSession = (src: string) => /from\s+["'](@\/lib\/session|\.\.?\/(\.\.\/)*session)["']/.test(src) && /\b(getCtx|teamCtx|managerCtx|writerCtx|getBrandCtx)\b/.test(src);

test("the API, MCP and OAuth token routes never use the cookie session's gate", () => {
  const api = [...files("src/lib/api"), ...files("src/app/api/v1"), ...files("src/app/api/mcp"), ...files("src/app/api/oauth")];
  assert.ok(api.length > 10);
  for (const f of api) {
    const src = read(f);
    assert.ok(!usesSession(src) && !/getBrandCtx|getCtx\(/.test(src), `${f} must not call getCtx`);
  }
  // And the proxy (which sets the path for /mfa's "next") skips /api/ entirely.
  const matcher = new RegExp(`^${config.matcher[0]}$`);
  for (const p of ["/api/v1/posts", "/api/mcp", "/api/mcp/abc", "/api/oauth/token"]) assert.ok(!matcher.test(p), p);
  for (const p of ["/calendar", "/mfa", "/mfa/setup", "/oauth/authorize"]) assert.ok(matcher.test(p), p);
});

test("/mfa, /mfa/setup, their actions, sign-out and the auth callback work at aal1 (no getCtx, so no loop)", () => {
  for (const f of ["src/app/mfa/page.tsx", "src/app/mfa/setup/page.tsx", "src/app/mfa/actions.ts", "src/app/auth/callback/route.ts", "src/app/login/actions.ts", "src/lib/mfa.ts"]) {
    const src = read(f);
    assert.ok(!/\b(getCtx|teamCtx|managerCtx|writerCtx|getBrandCtx)\s*\(/.test(src), `${f} must not call getCtx`);
  }
  // /mfa needs a session, so it isn't in the signed-out list, and signed-in people at any level reach it.
  assert.ok(!/"\/mfa/.test(read("src/proxy.ts").match(/const OPEN = \[[^\]]*\]/)![0]));
});

test("getCtx enforces the gate for app pages and server actions", () => {
  const src = read("src/lib/session.ts");
  assert.match(src, /mfaGate\(/);
  assert.match(src, /if \(gate\) redirect\(gate\)/);
});
