import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { envKeyring, openWith, sealWith } from "./sealing";

// Channel tokens, link tokens and webhook secrets are stored encrypted with AES-256-GCM under a named key
// (src/lib/sealing.ts has the format and the TOKEN_KEYS / TOKEN_KEY_CURRENT / TOKEN_KEY variables). `aad` binds a
// value to its row (a channel id, say): pass the same one to open it. Rotate with scripts/rotate-token-key.mjs.

export const seal = (plain: string, aad?: string): string => sealWith(envKeyring(), plain, aad);

export const open = (sealed: string, aad?: string): string => openWith(envKeyring(), sealed, aad);

/** A link's secret: 24 random bytes, URL-safe. Only its hash is looked up. */
export const newToken = () => randomBytes(24).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
