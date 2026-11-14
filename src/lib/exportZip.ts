// Building one export, free of Supabase so tests run it against a fake store (tests/export.test.ts).
// - Each table is written to its own JSON file on disk, row by row, then the ZIP is streamed to a temp file: JSON files,
//   then the media files one at a time (straight from storage, never whole in memory), then README.txt.
// - Only a whole ZIP is uploaded. Any failure (a read, a file, the disk, the upload) deletes what was uploaded, marks
//   the export failed and throws, so the job queue tries again; the temp folder is always deleted.
// - Safe to run twice, also at the same time: a ready export is left alone, both runs upload the same path, and only
//   the run that marks it ready emails and records it.
import { createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { finished, pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";
import { ZipFile } from "yazl";
import { EXPORT_RULES, linkExpiry, readme, zipPathOf, type ExportRow, type Row } from "./exportRules";

/** One JSON file: its name without ".json", and its rows. */
export type Part = { name: string; rows: () => AsyncIterable<Row> };

export interface ExportSteps {
  load(): Promise<ExportRow | null>;
  /** Marks it running unless it's ready. False when it's ready or gone. */
  start(): Promise<boolean>;
  /** Throws when there's no room on disk for this export. Optional. */
  checkRoom?(dir: string): Promise<void>;
  parts(row: ExportRow): Part[];
  /** A stored media file as a stream, or null when it's no longer in storage. Throws to fail the export. */
  open(path: string): Promise<Readable | null>;
  upload(file: string, size: number): Promise<void>;
  /** Deletes the uploaded ZIP. */
  remove(): Promise<void>;
  /** Marks it ready unless another run did first; true when this run did. */
  ready(size: number, expiresAt: Date): Promise<boolean>;
  /** Marks it failed unless it's ready. */
  failed(error: string): Promise<void>;
  /** Emails the link and records `data.exported`. Never throws. */
  done(row: ExportRow, size: number, expiresAt: Date): Promise<void>;
}

/** A promise that rejects when `fail` is called, to race the steps that wait on a stream against a broken ZIP. */
function breaker() {
  let fail: (e: unknown) => void = () => {};
  const broken = new Promise<never>((_, rej) => (fail = rej));
  broken.catch(() => {});
  return { fail, guard: <T,>(p: Promise<T>) => Promise.race([p, broken]) };
}

/** Writes rows as one JSON list, waiting when the disk is behind. Returns how many. */
async function writeJson(path: string, rows: AsyncIterable<Row>, map: (r: Row) => Row): Promise<number> {
  const out = createWriteStream(path);
  const b = breaker();
  out.once("error", b.fail);
  const put = async (s: string) => {
    if (!out.write(s)) await b.guard(once(out, "drain"));
  };
  try {
    let n = 0;
    await put("[");
    for await (const r of rows) {
      await put((n ? ",\n" : "\n") + JSON.stringify(map(r)));
      n++;
    }
    await put(n ? "\n]\n" : "]\n");
    out.end();
    await b.guard(finished(out));
    return n;
  } catch (e) {
    out.destroy();
    throw e;
  }
}

type Media = { path: string; file: string };

/** Streams the ZIP to `file`. Returns the media files no longer in storage. */
async function zipUp(file: string, json: { path: string; name: string }[], media: Media[], open: ExportSteps["open"], text: (missing: string[]) => string) {
  const zip = new ZipFile();
  const out = createWriteStream(file);
  const b = breaker();
  zip.on("error", b.fail);
  const piping = pipeline(zip.outputStream, out);
  piping.catch(b.fail);
  try {
    for (const j of json) zip.addFile(j.path, j.name, { compress: true });
    const missing: string[] = [];
    for (const m of media) {
      const src = await b.guard(open(m.path));
      if (!src) {
        missing.push(m.file);
        continue;
      }
      // Pictures and videos are already compressed: stored as they are.
      zip.addReadStream(src, m.file, { compress: false });
      try {
        await b.guard(finished(src));
      } catch (e) {
        src.destroy();
        throw e;
      }
    }
    zip.addBuffer(Buffer.from(text(missing)), "README.txt", { compress: true });
    zip.end();
    await b.guard(piping);
    return missing;
  } catch (e) {
    (zip.outputStream as Readable).destroy();
    out.destroy();
    await piping.catch(() => {});
    throw e;
  }
}

export type RunResult = "done" | "skipped" | "gone";

/** Builds, uploads and announces one export. Throws after marking it failed, so the job tries again. */
export async function runExportWith(s: ExportSteps, opts: { now?: () => Date; tmp?: string } = {}): Promise<RunResult> {
  const now = opts.now ?? (() => new Date());
  const row = await s.load();
  if (!row) return "gone";
  if (row.status === "ready") return "skipped";
  if (!(await s.start())) return "skipped";
  const dir = await mkdtemp(join(opts.tmp ?? tmpdir(), "capy-export-"));
  let uploading = false;
  try {
    await s.checkRoom?.(dir);
    const json: { path: string; name: string; rows: number }[] = [];
    const media: Media[] = [];
    for (const p of s.parts(row)) {
      const path = join(dir, `${p.name}.json`);
      const isMedia = row.kind === "workspace" && p.name === "media";
      const rows = await writeJson(path, p.rows(), (r) => {
        if (!isMedia) return r;
        const f = zipPathOf(r);
        if (typeof r.path === "string") media.push({ path: r.path, file: f });
        return { ...r, file: f };
      });
      json.push({ path, name: `${p.name}.json`, rows });
    }
    const zipFile = join(dir, "export.zip");
    const at = now();
    await zipUp(zipFile, json, media, (p) => s.open(p), (missing) => readme(row.kind, { at, files: json.map((j) => ({ name: j.name, rows: j.rows })), media: media.length - missing.length, missing }));
    const { size } = await stat(zipFile);
    if (size > EXPORT_RULES.maxBytes) throw new Error(`The export is ${Math.ceil(size / 1024 ** 3)} GB, over the 20 GB limit`);
    uploading = true;
    await s.upload(zipFile, size);
    const expires = linkExpiry(now());
    if (await s.ready(size, expires)) await s.done(row, size, expires).catch(() => {});
    return "done";
  } catch (e) {
    const msg = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    // Never delete the file of a run that finished first.
    if (uploading) {
      const cur = await s.load().catch(() => null);
      if (cur && cur.status !== "ready") await s.remove().catch(() => {});
    }
    await s.failed(msg).catch(() => {});
    throw e;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
