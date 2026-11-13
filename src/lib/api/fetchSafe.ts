// No secrets here, so tests can run it against a local server.
import http from "node:http";
import https from "node:https";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { isIP } from "node:net";
import type { Readable } from "node:stream";
import { isPublicAddress, isWebPort } from "./net";

// Calls to addresses people give us (webhook URLs, links to upload from), only on the public internet. The address
// is checked when the connection opens, on the very IP it connects to, so a name that changes its answer between a
// check and the call can't reach this server or its private network. Only ports 80 and 443, and every request has a
// hard deadline, so a server that sends one byte at a time can't hold a worker.

export class BlockedAddress extends Error {}

type LookupCb = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

function publicLookup(hostname: string, options: { all?: boolean } | number, cb: LookupCb) {
  dnsLookup(hostname, { all: true, verbatim: true }, (err, addrs) => {
    if (err) return cb(err, "");
    // Every answer must be public: one private answer means the name points inside.
    if (!addrs.length || addrs.some((a) => !isPublicAddress(a.address))) return cb(new BlockedAddress(`${hostname} isn't on the public internet`) as NodeJS.ErrnoException, "");
    if (typeof options === "object" && options.all) return cb(null, addrs);
    cb(null, addrs[0].address, addrs[0].family);
  });
}

export type SafeResponse = { status: number; headers: http.IncomingHttpHeaders; body: Readable };

export type SafeOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string | Buffer;
  /** Longest wait with nothing happening on the connection. */
  timeoutMs: number;
  /**
   * Hard limit for the whole exchange: connecting, sending, the answer and reading its body. When it passes the
   * request is destroyed, however slowly the other side keeps sending. Defaults to timeoutMs plus a second per MB sent.
   */
  deadlineMs?: number;
};

/** How this module checks where it may connect. Tests swap it to reach a local server; nothing else does. */
export type Guard = { lookup: typeof publicLookup; check: (url: URL) => void };

function publicCheck(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new BlockedAddress("Only web addresses can be called");
  if (isIP(host) && !isPublicAddress(host)) throw new BlockedAddress(`${host} isn't on the public internet`);
  if (!isWebPort(url)) throw new BlockedAddress(`Port ${url.port} isn't allowed; use 443 or 80`);
}

const PUBLIC: Guard = { lookup: publicLookup, check: publicCheck };

/** One request, no redirects followed. Rejects private addresses (plain IPs included), this server, and ports other than 80 and 443. */
export function safeRequest(url: URL, opts: SafeOptions): Promise<SafeResponse> {
  return guardedRequest(url, opts, PUBLIC);
}

/** safeRequest with another guard. Only for tests, which need a local server. */
export function guardedRequest(url: URL, opts: SafeOptions, guard: Guard): Promise<SafeResponse> {
  return new Promise((resolve, reject) => {
    try {
      guard.check(url);
    } catch (e) {
      return reject(e);
    }
    const sent = opts.body === undefined ? 0 : Buffer.byteLength(opts.body);
    const deadlineMs = opts.deadlineMs ?? opts.timeoutMs + Math.ceil(sent / 1_000_000) * 1000;
    const lib = url.protocol === "https:" ? https : http;
    let res: http.IncomingMessage | null = null;
    const req = lib.request(
      url,
      {
        method: opts.method ?? "GET",
        headers: { "user-agent": "Capybaroar/1.0 (+https://capybaroar.com/api)", ...(opts.headers ?? {}) },
        lookup: guard.lookup as never,
        timeout: opts.timeoutMs,
      },
      (r) => {
        res = r;
        // A body destroyed by the deadline must not crash a caller that only drains it; readers still get the error.
        r.on("error", () => undefined);
        r.on("close", () => clearTimeout(timer));
        resolve({ status: r.statusCode ?? 0, headers: r.headers, body: r });
      },
    );
    const timer = setTimeout(() => {
      const e = new Error(`No full answer within ${Math.round(deadlineMs / 1000)} seconds`);
      if (res) res.destroy(e);
      req.destroy(e);
    }, deadlineMs);
    req.on("timeout", () => req.destroy(new Error(`No answer within ${Math.round(opts.timeoutMs / 1000)} seconds`)));
    req.on("error", (e) => {
      if (!res) clearTimeout(timer);
      reject(e);
    });
    req.on("close", () => {
      if (!res) clearTimeout(timer);
    });
    if (opts.body !== undefined) req.write(opts.body);
    req.end();
  });
}

/** Reading a page or file after its headers came: the default hard limit on top of timeoutMs for safeGet. */
const READ_MS = 180000;

/**
 * A GET that follows up to 3 redirects, checking every hop the same way. timeoutMs is the idle limit; everything, all
 * hops and the body included, ends by deadlineMs (timeoutMs plus 3 minutes unless given).
 */
export async function safeGet(url: URL, timeoutMs: number, deadlineMs = timeoutMs + READ_MS): Promise<SafeResponse & { url: URL }> {
  return guardedGet(url, timeoutMs, deadlineMs, PUBLIC);
}

export async function guardedGet(url: URL, timeoutMs: number, deadlineMs: number, guard: Guard): Promise<SafeResponse & { url: URL }> {
  const end = Date.now() + deadlineMs;
  let at = url;
  for (let hop = 0; hop <= 3; hop++) {
    const left = end - Date.now();
    if (left <= 0) throw new Error(`No full answer within ${Math.round(deadlineMs / 1000)} seconds`);
    const res = await guardedRequest(at, { timeoutMs, deadlineMs: left }, guard);
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      res.body.resume();
      const next = new URL(res.headers.location, at);
      if (next.protocol !== "https:" && next.protocol !== "http:") throw new BlockedAddress("The link redirects somewhere that isn't a web address");
      at = next;
      continue;
    }
    return { ...res, url: at };
  }
  throw new Error("The link redirects too many times");
}

/**
 * fetch's shape over safeRequest, for providers whose server address a person typed (Mastodon). The answer body is
 * read in full, up to maxBytes. A signal aborts it; timeoutMs is also the hard limit unless deadlineMs is given.
 */
export async function safeFetch(input: string | URL, init: RequestInit & { timeoutMs?: number; deadlineMs?: number; maxBytes?: number } = {}): Promise<Response> {
  const url = new URL(String(input));
  const timeoutMs = init.timeoutMs ?? 60000;
  const maxBytes = init.maxBytes ?? 10_000_000;
  // Request turns FormData, URLSearchParams and strings into bytes and sets their content type.
  const asked = new Request(url, { method: init.method ?? "GET", headers: init.headers, body: init.body ?? null });
  const headers: Record<string, string> = {};
  asked.headers.forEach((v, k) => (headers[k] = v));
  const body = init.body == null ? undefined : Buffer.from(await asked.arrayBuffer());
  if (body !== undefined) headers["content-length"] = String(body.length);
  if (init.signal?.aborted) throw init.signal.reason ?? new Error("Aborted");
  const res = await safeRequest(url, { method: asked.method, headers, body, timeoutMs, deadlineMs: init.deadlineMs ?? timeoutMs + Math.ceil((body?.length ?? 0) / 1_000_000) * 1000 });
  const stop = () => res.body.destroy(init.signal?.reason instanceof Error ? init.signal.reason : new Error("Aborted"));
  init.signal?.addEventListener("abort", stop, { once: true });
  try {
    const parts: Buffer[] = [];
    let size = 0;
    for await (const c of res.body as AsyncIterable<Buffer>) {
      size += c.length;
      if (size > maxBytes) {
        res.body.destroy();
        throw new Error("The server answered with too much data");
      }
      parts.push(c);
    }
    const out = new Headers();
    for (const [k, v] of Object.entries(res.headers)) if (v !== undefined) out.set(k, Array.isArray(v) ? v.join(", ") : v);
    const status = res.status >= 200 && res.status <= 599 ? res.status : 502;
    return new Response([101, 204, 205, 304].includes(status) ? null : Buffer.concat(parts), { status, headers: out });
  } finally {
    init.signal?.removeEventListener("abort", stop);
  }
}
