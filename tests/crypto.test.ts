// Sealed secrets (src/lib/sealing.ts). They prove: values sealed in the old v1 format still open, v2 values round
// trip with and without AAD, a wrong AAD, kid or changed byte fails, and rotation moves every value to the current
// key so the old key can then be dropped.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCipheriv, randomBytes } from "node:crypto";
import { keyringFromEnv, openWith, resealWith, sealWith, sealedKid } from "../src/lib/sealing";

const k = () => randomBytes(32).toString("base64");
const OLD = k();
const NEW = k();

/** Exactly what src/lib/crypto.ts wrote before key ids. */
function sealV1(key: string, plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", Buffer.from(key, "base64"), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1.${iv.toString("base64")}.${c.getAuthTag().toString("base64")}.${body.toString("base64")}`;
}

test("a v1 value still opens with TOKEN_KEY alone, and with TOKEN_KEY next to new keys", () => {
  const v1 = sealV1(OLD, "access-token-123");
  assert.equal(openWith(keyringFromEnv({ TOKEN_KEY: OLD }), v1), "access-token-123");
  assert.equal(openWith(keyringFromEnv({ TOKEN_KEY: OLD, TOKEN_KEYS: `k2:${NEW}`, TOKEN_KEY_CURRENT: "k2" }), v1), "access-token-123");
  assert.equal(openWith(keyringFromEnv({ TOKEN_KEYS: `v1:${OLD},k2:${NEW}`, TOKEN_KEY_CURRENT: "k2" }), v1), "access-token-123");
  // AAD can't be checked on v1 (it had none), so callers that start passing one still read old rows.
  assert.equal(openWith(keyringFromEnv({ TOKEN_KEY: OLD }), v1, "channel-1"), "access-token-123");
  assert.equal(sealedKid(v1), "v1");
});

test("v2 round trips, names its key, and never repeats", () => {
  const ring = keyringFromEnv({ TOKEN_KEY: OLD, TOKEN_KEYS: `k2:${NEW}`, TOKEN_KEY_CURRENT: "k2" });
  for (const plain of ["", "x", "ünïcødé ✓", "a.b.c", "t".repeat(5000)]) {
    const a = sealWith(ring, plain);
    const b = sealWith(ring, plain);
    assert.match(a, /^v2\.k2\./);
    assert.notEqual(a, b);
    assert.equal(openWith(ring, a), plain);
    assert.equal(openWith(ring, sealWith(ring, plain, "ch-1"), "ch-1"), plain);
  }
  assert.equal(sealedKid(sealWith(ring, "x")), "k2");
  // With only TOKEN_KEY, new values are v2 under kid v1.
  assert.match(sealWith(keyringFromEnv({ TOKEN_KEY: OLD }), "x"), /^v2\.v1\./);
});

test("a wrong AAD, a missing AAD, a relabelled kid or a changed byte fails", () => {
  const ring = keyringFromEnv({ TOKEN_KEYS: `a:${OLD},b:${NEW}`, TOKEN_KEY_CURRENT: "a" });
  const s = sealWith(ring, "secret", "channel-1");
  assert.throws(() => openWith(ring, s, "channel-2"));
  assert.throws(() => openWith(ring, s));
  assert.throws(() => openWith(ring, sealWith(ring, "secret"), "channel-1"));
  assert.throws(() => openWith(ring, s.replace(/^v2\.a\./, "v2.b."), "channel-1"));
  const p = s.split(".");
  const body = Buffer.from(p[4], "base64");
  body[0] ^= 1;
  p[4] = body.toString("base64");
  assert.throws(() => openWith(ring, p.join("."), "channel-1"));
  assert.throws(() => openWith(ring, "v3.x.y.z"), /Unknown token format/);
  assert.throws(() => openWith(keyringFromEnv({ TOKEN_KEYS: `b:${NEW}` }), s, "channel-1"), /not configured/);
});

test("bad key settings are refused", () => {
  assert.throws(() => keyringFromEnv({}), /TOKEN_KEY must be 32 bytes/);
  assert.throws(() => keyringFromEnv({ TOKEN_KEY: Buffer.alloc(16).toString("base64") }), /32 bytes/);
  assert.throws(() => keyringFromEnv({ TOKEN_KEYS: `a.b:${NEW}` }), /kid/);
  assert.throws(() => keyringFromEnv({ TOKEN_KEYS: `a:${NEW},a:${OLD}` }), /twice/);
  assert.throws(() => keyringFromEnv({ TOKEN_KEYS: `a:${NEW}`, TOKEN_KEY_CURRENT: "b" }), /not in TOKEN_KEYS/);
  assert.throws(() => keyringFromEnv({ TOKEN_KEY: OLD, TOKEN_KEYS: `v1:${NEW}` }), /differ/);
});

test("rotation moves every value to the current key, after which the old key can go", () => {
  const before = keyringFromEnv({ TOKEN_KEY: OLD });
  const rows = [
    { id: "c1", v: sealV1(OLD, "tok-1") },
    { id: "c2", v: sealWith(before, "tok-2") },
    { id: "c3", v: sealWith(before, "tok-3", "c3"), aad: "c3" },
  ];
  const during = keyringFromEnv({ TOKEN_KEY: OLD, TOKEN_KEYS: `k2:${NEW}`, TOKEN_KEY_CURRENT: "k2" });
  const rotated = rows.map((r) => ({ ...r, v: resealWith(during, r.v, r.aad) }));
  for (const r of rotated) assert.match(r.v!, /^v2\.k2\./);
  // A second pass changes nothing.
  for (const r of rotated) assert.equal(resealWith(during, r.v!, r.aad), null);
  const after = keyringFromEnv({ TOKEN_KEYS: `k2:${NEW}` });
  assert.deepEqual(rotated.map((r) => openWith(after, r.v!, r.aad)), ["tok-1", "tok-2", "tok-3"]);
  for (const r of rows) assert.throws(() => openWith(after, r.v, r.aad));
});
