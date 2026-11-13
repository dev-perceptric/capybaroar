// Sealing secrets at rest with AES-256-GCM and named keys. Pure (no Supabase, no "server-only"), so tests/crypto.test.ts
// and scripts/rotate-token-key.mjs use the same code the app does; the app imports it through ./crypto.
//
// Formats:
// - v2.<kid>.<iv>.<tag>.<body>  what seal() writes. <kid> names the key; the version and kid are bound into the
//   GCM additional data, with the caller's optional AAD (a channel id, say), so a value can't be moved to another
//   row or relabelled with another key.
// - v1.<iv>.<tag>.<body>        the old format, still opened, with the key named "v1" (TOKEN_KEY). It has no AAD.
//
// Keys come from the environment:
// - TOKEN_KEYS="kid1:base64,kid2:base64"  every key that may still be in use, 32 bytes each.
// - TOKEN_KEY_CURRENT=kid2                 the key new values are sealed with.
// - TOKEN_KEY=base64                       the original single key, kept as kid "v1".
// With only TOKEN_KEY set, everything is sealed and opened with "v1", as before.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type Keyring = { current: string; keys: ReadonlyMap<string, Buffer> };
type Env = Record<string, string | undefined>;

const KID = /^[A-Za-z0-9_-]{1,32}$/;
const LEGACY = "v1";

function keyBytes(b64: string, name: string) {
  const k = Buffer.from(b64.trim(), "base64");
  if (k.length !== 32) throw new Error(`${name} must be 32 bytes, base64`);
  return k;
}

/** The keys from TOKEN_KEYS, TOKEN_KEY_CURRENT and TOKEN_KEY. Throws on a malformed or missing key. */
export function keyringFromEnv(env: Env = process.env): Keyring {
  const keys = new Map<string, Buffer>();
  for (const part of (env.TOKEN_KEYS ?? "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const at = part.indexOf(":");
    const kid = at > 0 ? part.slice(0, at).trim() : "";
    if (!KID.test(kid)) throw new Error("TOKEN_KEYS entries are kid:base64, kid letters, digits, - or _");
    if (keys.has(kid)) throw new Error(`TOKEN_KEYS names ${kid} twice`);
    keys.set(kid, keyBytes(part.slice(at + 1), `TOKEN_KEYS ${kid}`));
  }
  if (env.TOKEN_KEY) {
    const legacy = keyBytes(env.TOKEN_KEY, "TOKEN_KEY");
    const listed = keys.get(LEGACY);
    if (listed && !listed.equals(legacy)) throw new Error("TOKEN_KEY and the v1 key in TOKEN_KEYS differ");
    keys.set(LEGACY, legacy);
  }
  if (!keys.size) throw new Error("TOKEN_KEY must be 32 bytes, base64");
  const current = env.TOKEN_KEY_CURRENT?.trim() || (keys.has(LEGACY) ? LEGACY : keys.keys().next().value!);
  if (!keys.has(current)) throw new Error(`TOKEN_KEY_CURRENT ${current} is not in TOKEN_KEYS`);
  return { current, keys };
}

let cached: { sig: string; ring: Keyring } | null = null;
/** The keyring for this process, read again only when the variables change. */
export function envKeyring(env: Env = process.env): Keyring {
  const sig = `${env.TOKEN_KEYS ?? ""}|${env.TOKEN_KEY_CURRENT ?? ""}|${env.TOKEN_KEY ?? ""}`;
  if (cached?.sig !== sig) cached = { sig, ring: keyringFromEnv(env) };
  return cached.ring;
}

const additional = (kid: string, aad?: string) => Buffer.from(`v2.${kid}\0${aad ?? ""}`, "utf8");

/** Seals `plain` with the ring's current key. Pass the same `aad` to open it. */
export function sealWith(ring: Keyring, plain: string, aad?: string): string {
  const kid = ring.current;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", ring.keys.get(kid)!, iv);
  c.setAAD(additional(kid, aad));
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v2.${kid}.${iv.toString("base64")}.${c.getAuthTag().toString("base64")}.${body.toString("base64")}`;
}

/** The key a sealed value was made with ("v1" for the old format), or null when it isn't a sealed value. */
export function sealedKid(sealed: string): string | null {
  const p = sealed.split(".");
  if (p[0] === "v1" && p.length === 4) return LEGACY;
  if (p[0] === "v2" && p.length === 5 && KID.test(p[1])) return p[1];
  return null;
}

function decrypt(key: Buffer, iv: string, tag: string, body: string, aad: Buffer | null) {
  const d = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  if (aad) d.setAAD(aad);
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(body, "base64")), d.final()]).toString("utf8");
}

/** Opens a v1 or v2 value. Throws when the key is gone, the value was changed, or `aad` doesn't match. v1 values
 *  carry no AAD, so `aad` is not checked for them (they are re-sealed with it on rotation or the next save). */
export function openWith(ring: Keyring, sealed: string, aad?: string): string {
  const p = sealed.split(".");
  const kid = sealedKid(sealed);
  if (!kid) throw new Error("Unknown token format");
  const key = ring.keys.get(kid);
  if (!key) throw new Error(`Token key ${kid} is not configured`);
  if (p[0] === "v1") return decrypt(key, p[1], p[2], p[3], null);
  return decrypt(key, p[2], p[3], p[4], additional(kid, aad));
}

/** A value re-sealed with the current key, or null when it already uses it (v2 and the current kid). */
export function resealWith(ring: Keyring, sealed: string, aad?: string): string | null {
  if (sealed.startsWith("v2.") && sealedKid(sealed) === ring.current) return null;
  return sealWith(ring, openWith(ring, sealed, aad), aad);
}
