// No secrets here, so tests can run it against a local server.
import http from "node:http";
import https from "node:https";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { isIP } from "node:net";
import type { Readable } from "node:stream";
import { isPublicAddress } from "./net";

// Calls to addresses people give us (webhook URLs, links to upload from), only on the public internet. The address
// is checked when the connection opens, on the very IP it connects to, so a name that changes its answer between a
// check and the call can't reach this server or its private network.

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

/** One request, no redirects followed. Rejects private addresses, plain IPs included. */
export function safeRequest(url: URL, opts: { method?: string; headers?: Record<string, string>; body?: string | Buffer; timeoutMs: number }): Promise<SafeResponse> {
  return new Promise((resolve, reject) => {
    const host = url.hostname.replace(/^\[|\]$/g, "");
    if (isIP(host) && !isPublicAddress(host)) return reject(new BlockedAddress(`${host} isn't on the public internet`));
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: opts.method ?? "GET",
        headers: { "user-agent": "Capybaroar/1.0 (+https://capybaroar.com/api)", ...(opts.headers ?? {}) },
        lookup: publicLookup as never,
        timeout: opts.timeoutMs,
      },
      (res) => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: res }),
    );
    req.on("timeout", () => req.destroy(new Error(`No answer within ${Math.round(opts.timeoutMs / 1000)} seconds`)));
    req.on("error", reject);
    if (opts.body !== undefined) req.write(opts.body);
    req.end();
  });
}

/** A GET that follows up to 3 redirects, checking every hop the same way. */
export async function safeGet(url: URL, timeoutMs: number): Promise<SafeResponse & { url: URL }> {
  let at = url;
  for (let hop = 0; hop <= 3; hop++) {
    const res = await safeRequest(at, { timeoutMs });
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
