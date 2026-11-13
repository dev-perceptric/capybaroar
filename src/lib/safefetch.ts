// Fetching addresses people type in (feeds, media URLs in a CSV) without letting them reach our own network: only
// http and https, every address a name resolves to is checked at connect time (so a name can't point somewhere else
// between the check and the request), redirects are followed by hand and checked again, with a time limit and a size
// cap on what is read.
import { lookup } from "node:dns";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { isSelfAddress, isWebPort } from "./api/net";

const blocked = new BlockList();
for (const [net, bits] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(net, bits, "ipv4");
for (const [net, bits] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["100::", 64],
  ["2001::", 32],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8],
] as const)
  blocked.addSubnet(net, bits, "ipv6");

/**
 * True for loopback, private, link-local, shared, reserved and multicast addresses, this server's own public addresses
 * (45.90.109.7 and SELF_IPS), and anything that isn't an IP.
 */
export function isPrivateAddress(ip: string): boolean {
  const a = ip.replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  if (isSelfAddress(a)) return true;
  const kind = isIP(a);
  if (kind === 4) return blocked.check(a, "ipv4");
  if (kind !== 6) return true;
  // IPv4 written inside IPv6 (::ffff:10.0.0.1, ::ffff:a00:1): check the IPv4 part.
  const mapped = /^::ffff:(?:0:)?(.+)$/i.exec(a);
  if (mapped) {
    const v = mapped[1];
    if (isIP(v) === 4) return blocked.check(v, "ipv4");
    const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(v);
    if (hex) {
      const n = (parseInt(hex[1], 16) << 16) | parseInt(hex[2], 16);
      return blocked.check([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."), "ipv4");
    }
    return true;
  }
  return blocked.check(a, "ipv6");
}

/** DNS lookup that refuses a name when any of its addresses is private. */
const guardedLookup: LookupFunction = (hostname, options, done) => {
  lookup(hostname, { ...options, all: true }, (err, list) => {
    if (err) return done(err, "", 4);
    const addrs = list as { address: string; family: number }[];
    if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) return done(Object.assign(new Error("That address isn't reachable from here"), { code: "EBLOCKED" }), "", 4);
    if ((options as { all?: boolean }).all) return (done as unknown as (e: null, a: typeof addrs) => void)(null, addrs);
    done(null, addrs[0].address, addrs[0].family);
  });
};

export type Fetched = { body: Buffer; type: string; url: string };

/** Check an address before fetching it. Throws a message people can act on. */
export function checkUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("That isn't a link");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Use an http or https link");
  if (u.username || u.password) throw new Error("Links with a password aren't supported");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && isPrivateAddress(host)) throw new Error("That address isn't reachable from here");
  if (/^(localhost|.*\.localhost|.*\.local|.*\.internal)$/i.test(host)) throw new Error("That address isn't reachable from here");
  if (!isWebPort(u)) throw new Error("Use a link on port 443 or 80");
  return u;
}

/** GET an outside address. At most `maxBytes` are read; the whole request, redirects included, ends after `timeoutMs`. */
export async function safeGet(raw: string, opts: { maxBytes: number; timeoutMs: number; accept?: string }): Promise<Fetched> {
  const deadline = Date.now() + opts.timeoutMs;
  let url = checkUrl(raw);
  for (let hop = 0; hop < 5; hop++) {
    const res = await once(url, opts.maxBytes, deadline, opts.accept);
    if ("redirect" in res) {
      url = checkUrl(new URL(res.redirect, url).toString());
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}

function once(url: URL, maxBytes: number, deadline: number, accept?: string): Promise<Fetched | { redirect: string }> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const left = deadline - Date.now();
    if (left <= 0) return reject(new Error("The site took too long to answer"));
    const req = lib.get(url, { lookup: guardedLookup, headers: { "user-agent": "Capybaroar/1.0 (+https://capybaroar.com)", accept: accept ?? "*/*" }, timeout: left }, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        return resolve({ redirect: res.headers.location });
      }
      if (status < 200 || status >= 300) {
        res.resume();
        return reject(new Error(`The site answered ${status}`));
      }
      const declared = Number(res.headers["content-length"] ?? 0);
      if (declared > maxBytes) {
        res.destroy();
        return reject(new Error(`Files are up to ${Math.round(maxBytes / 1024 / 1024)} MB`));
      }
      const parts: Buffer[] = [];
      let size = 0;
      res.on("data", (c: Buffer) => {
        size += c.length;
        if (size > maxBytes) {
          res.destroy();
          reject(new Error(`Files are up to ${Math.round(maxBytes / 1024 / 1024)} MB`));
          return;
        }
        parts.push(c);
      });
      res.on("end", () => resolve({ body: Buffer.concat(parts), type: String(res.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase(), url: url.toString() }));
      res.on("error", reject);
    });
    const timer = setTimeout(() => req.destroy(new Error("The site took too long to answer")), left);
    req.on("timeout", () => req.destroy(new Error("The site took too long to answer")));
    req.on("error", (e: Error & { code?: string }) => reject(e.code === "EBLOCKED" ? e : new Error(/took too long|up to/.test(e.message) ? e.message : `Couldn't reach ${url.hostname}`)));
    req.on("close", () => clearTimeout(timer));
  });
}

/** The real type of a picture or video from its first bytes, or null when it's none we post. */
export function sniffMedia(b: Buffer): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length >= 6 && /^GIF8[79]a$/.test(b.subarray(0, 6).toString("latin1"))) return "image/gif";
  if (b.length >= 12 && b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  if (b.length >= 12 && b.subarray(4, 8).toString("latin1") === "ftyp") return b.subarray(8, 10).toString("latin1") === "qt" ? "video/quicktime" : "video/mp4";
  if (b.length >= 5 && b.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  return null;
}
