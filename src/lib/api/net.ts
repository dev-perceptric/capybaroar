// Rules for the addresses the server calls for people: webhook URLs and links to upload from. Only the public
// internet: never this server, the private network it sits on, or cloud metadata addresses. Pure, so tests cover them.
import { isIP } from "node:net";

function v4(ip: string): number[] | null {
  const p = ip.split(".");
  if (p.length !== 4) return null;
  const n = p.map((x) => (/^\d{1,3}$/.test(x) ? Number(x) : NaN));
  return n.every((x) => x >= 0 && x <= 255) ? n : null;
}

function publicV4([a, b, c]: number[]): boolean {
  if (a === 0 || a === 10 || a === 127) return false; // this network, private, loopback
  if (a === 100 && b >= 64 && b <= 127) return false; // carrier NAT
  if (a === 169 && b === 254) return false; // link-local, cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return false; // private
  if (a === 192 && b === 168) return false; // private
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false; // protocol assignments, documentation
  if (a === 192 && b === 88 && c === 99) return false; // 6to4 relay
  if (a === 198 && (b === 18 || b === 19)) return false; // benchmarking
  if (a === 198 && b === 51 && c === 100) return false; // documentation
  if (a === 203 && b === 0 && c === 113) return false; // documentation
  if (a >= 224) return false; // multicast, reserved, broadcast
  return true;
}

/** The 8 groups of an IPv6 address, or null. An IPv4 tail (::ffff:1.2.3.4) becomes two groups. */
function v6(ip: string): number[] | null {
  let s = ip.toLowerCase().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  const tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (tail) {
    const q = v4(tail[1]);
    if (!q) return null;
    s = s.slice(0, -tail[1].length) + `${((q[0] << 8) | q[1]).toString(16)}:${((q[2] << 8) | q[3]).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = 8 - head.length - rest.length;
  if ((halves.length === 1 && fill !== 0) || fill < 0) return null;
  const groups = [...head, ...Array(halves.length === 2 ? fill : 0).fill("0"), ...rest];
  if (groups.length !== 8 || !groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.map((g) => parseInt(g, 16));
}

/** True only for an address on the public internet. Anything unclear counts as not public. */
export function isPublicAddress(ip: string): boolean {
  const kind = isIP(ip.replace(/^\[|\]$/g, "").replace(/%.*$/, ""));
  if (kind === 4) {
    const q = v4(ip);
    return !!q && publicV4(q);
  }
  if (kind !== 6) return false;
  const g = v6(ip);
  if (!g) return false;
  const embedded = () => [g[6] >> 8, g[6] & 255, g[7] >> 8, g[7] & 255];
  // IPv4 written as IPv6 (::ffff:a.b.c.d) or through NAT64 (64:ff9b::a.b.c.d): judge the IPv4 inside.
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return publicV4(embedded());
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return publicV4(embedded());
  // Only global unicast (2000::/3), less documentation, Teredo and 6to4, which can hide other addresses.
  if ((g[0] & 0xe000) !== 0x2000) return false;
  if (g[0] === 0x2001 && (g[1] === 0x0db8 || g[1] === 0)) return false;
  if (g[0] === 0x2002) return false;
  return true;
}

/** The kind of file from its first bytes, whatever the server called it. null for anything else. */
export function sniffMime(head: Uint8Array): string | null {
  const at = (i: number, ...b: number[]) => b.every((x, j) => head[i + j] === x);
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  if (at(4, 0x66, 0x74, 0x79, 0x70)) return at(8, 0x71, 0x74, 0x20, 0x20) ? "video/quicktime" : "video/mp4"; // "ftyp", brand "qt  "
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x41, 0x56, 0x45)) return "audio/wav"; // "RIFF" ... "WAVE"
  if (at(0, 0x49, 0x44, 0x33) || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0)) return "audio/mpeg"; // "ID3" tag or an MP3 frame
  if (at(0, 0x4f, 0x67, 0x67, 0x53)) return "audio/ogg"; // "OggS"
  return null;
}

export const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp", "video/mp4": "mp4", "video/quicktime": "mov", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg" };

/** A file name from a link: its last path part, cleaned, with the right ending for what the file really is. */
export function nameFromUrl(url: URL, mime: string): string {
  const last = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  const base = last.replace(/\.[A-Za-z0-9]{1,5}$/, "").slice(0, 80) || "file";
  return `${base}.${EXT[mime] ?? "bin"}`;
}
