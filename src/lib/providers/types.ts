import type { NetworkId } from "../networks";

/** What a network gives back when someone connects: one or more accounts (a person, their Pages). */
export type Account = {
  accountId: string;
  name: string;
  username?: string | null;
  avatar?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  extra?: Record<string, unknown>;
};

/** The stored tokens for one channel, already decrypted. */
export type Secret = { accessToken: string; refreshToken: string | null; expiresAt: Date | null; extra: Record<string, unknown> };

export type MediaFile = { url: string; mime: string; size: number; name: string; bytes: () => Promise<Buffer> };

export type Publishable = { text: string; media: MediaFile[] };

export type Published = { id: string; url?: string | null };

export type Provider = {
  network: NetworkId;
  /** Sign in with the network. Missing for networks connected with a form (Bluesky). */
  oauth?: {
    configured: () => boolean;
    authUrl: (o: { state: string; redirect: string; verifier: string }) => string;
    exchange: (o: { code: string; redirect: string; verifier: string }) => Promise<Account[]>;
  };
  refresh?: (s: Secret) => Promise<Pick<Account, "accessToken" | "refreshToken" | "expiresAt">>;
  /** Whether these tokens can be refreshed. Defaults to having a refresh token. */
  refreshable?: (s: Secret) => boolean;
  /** Checks before scheduling: returns a reason this post can't go to this network. */
  check?: (p: Publishable) => string | null;
  publish: (s: Secret, accountId: string, p: Publishable) => Promise<Published>;
  followers?: (s: Secret, accountId: string) => Promise<number | null>;
};

/** A failure that a retry won't fix: the person must reconnect the channel. */
export class AuthError extends Error {}

/** A failure that a retry won't fix: the post itself is wrong for this network. */
export class PostError extends Error {}

/** fetch that turns network errors into AuthError, PostError or a plain (retryable) Error. */
export async function call<T = Record<string, unknown>>(url: string, init: RequestInit = {}, opts: { what: string } = { what: "Request" }): Promise<T> {
  const res = await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(60000) });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (res.ok) return body as T;
  const msg = errorText(body) || `${res.status} ${res.statusText}`;
  const fb = (body as { error?: { code?: number } } | null)?.error?.code;
  if (res.status === 401 || fb === 190) throw new AuthError(`${opts.what}: ${msg}`);
  if (res.status === 400 || res.status === 403 || res.status === 422) throw new PostError(`${opts.what}: ${msg}`);
  throw new Error(`${opts.what}: ${msg}`);
}

function errorText(body: unknown): string {
  if (!body) return "";
  if (typeof body === "string") return body.slice(0, 300);
  const b = body as Record<string, unknown>;
  const e = b.error as Record<string, unknown> | string | undefined;
  if (typeof e === "string") return String(b.error_description ?? b.message ?? e);
  if (e && typeof e === "object") return String(e.message ?? e.error_user_msg ?? JSON.stringify(e)).slice(0, 300);
  return String(b.message ?? b.error_description ?? JSON.stringify(b)).slice(0, 300);
}

export const form = (o: Record<string, string>) => new URLSearchParams(o);
export const qs = (o: Record<string, string>) => new URLSearchParams(o).toString();
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const isVideo = (m: MediaFile) => m.mime.startsWith("video/");
