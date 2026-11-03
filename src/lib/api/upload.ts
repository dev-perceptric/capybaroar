import "server-only";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, open, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { adminClient } from "../supabase/server";
import { ALLOWED, MAX_BYTES } from "../media";
import { ApiError } from "./input";
import { BlockedAddress, safeGet } from "./fetchSafe";
import { nameFromUrl, sniffMime } from "./net";

// Adds a file from a link to the media library. The file goes to disk as it downloads and from disk to storage, so a
// 250 MB video never sits in memory next to the publisher. Two at a time per server; more wait and try again.
const AT_ONCE = 2;
const DEADLINE_MS = 180000;
let running = 0;

const bad = (m: string) => new ApiError(400, "invalid_request", m);

export async function uploadFromLink(workspaceId: string, userId: string, url: URL, alt: string | null): Promise<string> {
  if (running >= AT_ONCE) throw new ApiError(503, "busy", "Other uploads are running. Try again in a minute.");
  running++;
  const dir = await mkdtemp(join(tmpdir(), "link-"));
  try {
    let res;
    try {
      res = await safeGet(url, 30000);
    } catch (e) {
      if (e instanceof BlockedAddress) throw bad(`Can't download from that link: ${e.message}`);
      throw bad(`Couldn't reach the link: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (res.status < 200 || res.status >= 300) {
      res.body.resume();
      throw bad(`The link answered ${res.status}`);
    }
    const said = Number(res.headers["content-length"] ?? 0);
    if (said > MAX_BYTES) {
      res.body.destroy();
      throw new ApiError(413, "too_large", "Files are up to 250 MB");
    }
    const file = join(dir, "file");
    await new Promise<void>((resolve, reject) => {
      let size = 0;
      const out = createWriteStream(file);
      const timer = setTimeout(() => res.body.destroy(new Error("The download took longer than 3 minutes")), DEADLINE_MS);
      res.body.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_BYTES) res.body.destroy(new ApiError(413, "too_large", "Files are up to 250 MB"));
      });
      res.body.on("error", (e) => {
        clearTimeout(timer);
        out.destroy();
        reject(e instanceof ApiError ? e : bad(`The download stopped: ${e.message}`));
      });
      out.on("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
      out.on("finish", () => {
        clearTimeout(timer);
        resolve();
      });
      res.body.pipe(out);
    });
    const { size } = await stat(file);
    if (!size) throw bad("The link gave an empty file");
    // What the file really is, from its first bytes: a page or a script named photo.jpg is refused.
    const fh = await open(file, "r");
    const head = Buffer.alloc(16);
    await fh.read(head, 0, 16, 0);
    await fh.close();
    const mime = sniffMime(head);
    if (!mime || !ALLOWED.test(mime)) throw bad("The link isn't a JPG, PNG, GIF, WebP, MP4 or MOV file");
    const name = nameFromUrl(res.url, mime);
    const path = `${workspaceId}/${crypto.randomUUID()}-${name}`;
    const db = adminClient();
    const up = await db.storage.from("media").upload(path, createReadStream(file), { contentType: mime, duplex: "half" });
    if (up.error) throw new ApiError(503, "unavailable", `Couldn't save the file: ${up.error.message}`);
    const { data, error } = await db.from("media").insert({ workspace_id: workspaceId, path, name, mime, size, alt, created_by: userId }).select("id").single();
    if (error) {
      await db.storage.from("media").remove([path]);
      throw new ApiError(503, "unavailable", `Couldn't save the file: ${error.message}`);
    }
    return data.id as string;
  } finally {
    running--;
    await rm(dir, { recursive: true, force: true });
  }
}
