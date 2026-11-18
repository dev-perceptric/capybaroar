// The local session check (src/lib/jwt.ts). It proves: a token signed with the secret passes without asking Supabase
// Auth; a wrong secret, another algorithm, a broken token or an expired one never pass here and fall back to
// getClaims (the network check), so a misconfigured secret costs speed, never sign-ins; and no session means signed out.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { sessionClaims, verifyHs256 } from "../src/lib/jwt";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
function sign(claims: Record<string, unknown>, secret: string, alg = "HS256") {
  const head = b64({ alg, typ: "JWT" });
  const body = b64(claims);
  const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}
const SECRET = "super-secret-jwt-token-with-at-least-32-characters";
const future = () => Math.floor(Date.now() / 1000) + 3600;

test("a token signed with the secret passes, and its claims come back", async () => {
  const v = await verifyHs256(sign({ sub: "u1", exp: future(), aal: "aal1" }, SECRET), SECRET);
  assert.equal(v.ok, true);
  assert.equal(v.ok && v.claims.sub, "u1");
});

test("a wrong secret, another algorithm, a broken token or an expired one never pass", async () => {
  assert.deepEqual(await verifyHs256(sign({ sub: "u1", exp: future() }, "another-secret"), SECRET), { ok: false, reason: "signature" });
  assert.deepEqual(await verifyHs256(sign({ sub: "u1", exp: future() }, SECRET, "none"), SECRET), { ok: false, reason: "alg" });
  assert.deepEqual(await verifyHs256("not.a.token", SECRET), { ok: false, reason: "format" });
  assert.deepEqual(await verifyHs256("two.parts", SECRET), { ok: false, reason: "format" });
  assert.deepEqual(await verifyHs256(sign({ sub: "u1", exp: Math.floor(Date.now() / 1000) - 5 }, SECRET), SECRET), { ok: false, reason: "expired" });
  // A tampered body breaks the signature.
  const [h, , s] = sign({ sub: "u1", exp: future() }, SECRET).split(".");
  assert.deepEqual(await verifyHs256(`${h}.${b64({ sub: "admin", exp: future() })}.${s}`, SECRET), { ok: false, reason: "signature" });
});

function fakeSb(token: string | null, network: Record<string, unknown> | null) {
  const calls = { claims: 0 };
  const sb = {
    auth: {
      getSession: async () => ({ data: { session: token ? { access_token: token } : null }, error: null }),
      getClaims: async () => {
        calls.claims++;
        return { data: network ? { claims: network, header: {}, signature: new Uint8Array() } : null, error: null };
      },
    },
  };
  return { sb: sb as never, calls };
}

test("with the secret set, a good token is checked here and Supabase Auth isn't asked", async () => {
  process.env.SUPABASE_JWT_SECRET = SECRET;
  const { sb, calls } = fakeSb(sign({ sub: "u1", exp: future() }, SECRET), { sub: "from-network" });
  assert.equal((await sessionClaims(sb))?.sub, "u1");
  assert.equal(calls.claims, 0);
});

test("a secret that doesn't match falls back to the network check, so nobody is signed out", async () => {
  process.env.SUPABASE_JWT_SECRET = "the-wrong-secret-for-this-install-xxxxxxxx";
  const { sb, calls } = fakeSb(sign({ sub: "u1", exp: future() }, SECRET), { sub: "u1" });
  assert.equal((await sessionClaims(sb))?.sub, "u1");
  assert.equal(calls.claims, 1);
});

test("without the secret, it asks Supabase Auth as before; no session is signed out", async () => {
  delete process.env.SUPABASE_JWT_SECRET;
  const { sb, calls } = fakeSb(sign({ sub: "u1", exp: future() }, SECRET), { sub: "u1" });
  assert.equal((await sessionClaims(sb))?.sub, "u1");
  assert.equal(calls.claims, 1);
  process.env.SUPABASE_JWT_SECRET = SECRET;
  assert.equal(await sessionClaims(fakeSb(null, null).sb), null);
  delete process.env.SUPABASE_JWT_SECRET;
});
