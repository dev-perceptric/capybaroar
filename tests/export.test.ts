// Data export tests. They prove: no token, secret or hash column is ever exported, nested JSON included, and every
// listed column exists in the migrations; every workspace table is exported or left out with a reason; a workspace
// export never holds another workspace's rows (nor an account export another person's), even when a query comes back
// wrong; a table read, a media file or the upload failing part way marks the export failed, removes what was uploaded,
// leaves no temp files and can be run again; a missing media file is listed instead of failing; the link works for 24
// hours and only for its owner; and running the job twice, one after the other or at once, emails once.
// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { inflateRawSync } from "node:zlib";
import {
  ACCOUNT_TABLES,
  EXPORT_RULES,
  LEFT_OUT,
  SECRET_COLUMN,
  WORKSPACE_TABLES,
  fileOf,
  inScope,
  keysNeeded,
  linkExpiry,
  mayDownload,
  nextStep,
  pickColumns,
  readTable,
  scrubValue,
  storagePath,
  withRetry,
  type ExportRow,
  type Query,
  type Reader,
  type Row,
  type Seen,
  type TableSpec,
  type Who,
} from "../src/lib/exportRules";
import { runExportWith, type ExportSteps, type Part } from "../src/lib/exportZip";

const NOW = new Date("2026-11-14T12:00:00Z");
const HOUR = 3600000;
const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const ME = "11111111-0000-4000-8000-000000000001";
const YOU = "22222222-0000-4000-8000-000000000002";

// ---- the migrations, read as text: table -> columns

function schema(): Map<string, Set<string>> {
  const dir = join(import.meta.dirname, "../supabase/migrations");
  const out = new Map<string, Set<string>>();
  const SKIP = /^(primary|unique|check|foreign|constraint|exclude)\b/i;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    const sql = readFileSync(join(dir, f), "utf8").replace(/--[^\n]*/g, "");
    for (const m of sql.matchAll(/create table (?:if not exists )?public\.(\w+) \(([\s\S]*?)\n\);/g)) {
      const cols = out.get(m[1]) ?? new Set<string>();
      for (const line of m[2].split("\n")) {
        const t = line.trim();
        const w = /^(\w+)\s/.exec(t)?.[1];
        if (w && !SKIP.test(t)) cols.add(w);
      }
      out.set(m[1], cols);
    }
    for (const m of sql.matchAll(/alter table (?:if exists )?public\.(\w+)([\s\S]*?);/g))
      for (const c of m[2].matchAll(/add column (?:if not exists )?(\w+)/g)) out.get(m[1])?.add(c[1]);
  }
  return out;
}

test("no export ever lists a token, secret or hash column, or a credential table", () => {
  for (const s of [...WORKSPACE_TABLES, ...ACCOUNT_TABLES]) {
    for (const c of s.columns) assert.doesNotMatch(c, SECRET_COLUMN, `${s.table}.${c}`);
    assert.ok(!["channel_secrets", "oauth_tokens", "oauth_codes", "oauth_states"].includes(s.table), s.table);
  }
  for (const c of ["access_token", "refresh_token", "token", "token_hash", "secret", "hash", "verifier", "api_key", "client_secret", "password"]) assert.match(c, SECRET_COLUMN);
  // Columns people need stay: a credit entry's idempotency key and an API key's name are not credentials.
  for (const c of ["key", "name", "url", "events", "text", "hashtags"]) assert.doesNotMatch(c, SECRET_COLUMN);
  for (const c of ["ip_hash", "hash", "refreshToken", "accessToken"]) assert.match(c, SECRET_COLUMN);
});

test("rows are cut to their columns, and credentials are dropped at any depth", () => {
  const channels = WORKSPACE_TABLES.find((s) => s.table === "channels")!;
  const row = { id: "c1", workspace_id: A, name: "Acme", network: "x", access_token: "tok", refresh_token: "ref", extra: { a: 1 } };
  assert.deepEqual(Object.keys(pickColumns(channels, row)).sort(), ["id", "name", "network", "workspace_id"]);
  const hooks = WORKSPACE_TABLES.find((s) => s.table === "webhooks")!;
  assert.equal("secret" in pickColumns(hooks, { id: "w", workspace_id: A, url: "https://x.test", secret: "whsec_1" }), false);
  const targets = WORKSPACE_TABLES.find((s) => s.table === "post_targets")!;
  const t = pickColumns(targets, { id: "t", workspace_id: A, settings: { title: "Hi", access_token: "x", nested: [{ client_secret: "y", keep: 1 }] } });
  assert.deepEqual(t.settings, { title: "Hi", nested: [{ keep: 1 }] });
  assert.deepEqual(scrubValue({ Authorization: "Bearer x", ok: true }), { ok: true });
  // Nothing in a whole export's output looks like a credential.
  const out = JSON.stringify(pickColumns(targets, { id: "t", workspace_id: A, settings: { refreshToken: "r" } }));
  assert.doesNotMatch(out, /refreshToken/);
});

test("every exported column exists in the migrations", () => {
  const db = schema();
  for (const s of [...WORKSPACE_TABLES, ...ACCOUNT_TABLES]) {
    const cols = db.get(s.table);
    assert.ok(cols, `table ${s.table} is in no migration`);
    for (const c of [...s.columns, s.scope.col, ...s.order]) assert.ok(cols.has(c), `${s.table}.${c} is in no migration`);
    if ("parent" in s.scope) {
      const p = [...WORKSPACE_TABLES, ...ACCOUNT_TABLES].find((x) => fileOf(x) === (s.scope as { parent: string }).parent);
      assert.ok(p, `${s.table}: parent ${s.scope.parent}`);
    }
  }
});

test("every table with a workspace_id is exported or left out with a reason", () => {
  const db = schema();
  const inExport = new Set(WORKSPACE_TABLES.map((s) => s.table));
  for (const [table, cols] of db) {
    if (!cols.has("workspace_id")) continue;
    assert.ok(inExport.has(table) || LEFT_OUT[table], `${table} has a workspace_id: add it to WORKSPACE_TABLES or LEFT_OUT`);
  }
  for (const t of ["channel_secrets", "inbox_state", "bio_visits", "oauth_tokens"]) assert.ok(LEFT_OUT[t], t);
  // Parents come before the tables scoped by them.
  for (const list of [WORKSPACE_TABLES, ACCOUNT_TABLES])
    list.forEach((s, i) => {
      if ("parent" in s.scope) assert.ok(list.slice(0, i).some((p) => fileOf(p) === (s.scope as { parent: string }).parent), s.table);
    });
});

// ---- a fake database: rows of two workspaces and two people

const DB: Record<string, Row[]> = {
  workspaces: [{ id: A, name: "Mine" }, { id: B, name: "Theirs" }],
  brands: [{ id: "b1", workspace_id: A, name: "One" }, { id: "b2", workspace_id: B, name: "Two" }],
  posts: [
    { id: "p1", workspace_id: A, created_by: ME, text: "mine" },
    { id: "p2", workspace_id: B, created_by: YOU, text: "theirs" },
    { id: "p3", workspace_id: B, created_by: ME, text: "mine elsewhere" },
  ],
  bio_pages: [{ id: "bp1", workspace_id: A, slug: "a" }, { id: "bp2", workspace_id: B, slug: "b" }],
  bio_views: [{ page_id: "bp1", day: "2026-11-01", views: 3 }, { page_id: "bp2", day: "2026-11-01", views: 9 }],
  agent_chats: [{ id: "c1", workspace_id: A, user_id: ME, title: "mine" }, { id: "c2", workspace_id: A, user_id: YOU, title: "theirs" }],
  agent_messages: [{ id: 1, chat_id: "c1", role: "user", content: { text: "hi" } }, { id: 2, chat_id: "c2", role: "user", content: { text: "private" } }],
  webhooks: [{ id: "w1", workspace_id: A, url: "https://a.test", events: ["post.published"], secret: "whsec_a" }, { id: "w2", workspace_id: B, url: "https://b.test", events: ["post.failed"], secret: "whsec_b" }],
  media: [{ id: "m1", workspace_id: A, path: `${A}/m1.png`, name: "pic.png", size: 4 }, { id: "m2", workspace_id: B, path: `${B}/m2.png`, name: "theirs.png", size: 4 }],
};

/** Applies the query like PostgREST would. */
const honest: Reader = async (q: Query) => {
  const rows = (DB[q.table] ?? []).filter((r) => ("eq" in q.filter ? r[q.filter.col] === q.filter.eq : q.filter.in.includes(String(r[q.filter.col]))));
  return rows.slice(q.from, q.to + 1).map((r) => ({ ...r }));
};
/** A query that came back wrong: every row of the table, whatever was asked. */
const wrong: Reader = async (q: Query) => (q.from === 0 ? (DB[q.table] ?? []).map((r) => ({ ...r })) : []);

async function collect(specs: TableSpec[], read: Reader, who: Who) {
  const seen: Seen = new Map();
  const needed = keysNeeded(specs);
  const out: Record<string, Row[]> = {};
  for (const s of specs) {
    out[fileOf(s)] = [];
    for await (const r of readTable(s, read, who, seen, needed)) out[fileOf(s)].push(r);
  }
  return out;
}

const only = (names: string[], list: TableSpec[]) => list.filter((s) => names.includes(s.table));

test("a workspace export never holds another workspace's rows, even when a query comes back wrong", async () => {
  const specs = only(["workspaces", "brands", "posts", "bio_pages", "bio_views", "webhooks", "media"], WORKSPACE_TABLES);
  for (const read of [honest, wrong]) {
    const out = await collect(specs, read, { workspaceId: A, userId: ME });
    assert.deepEqual(out.workspace.map((r) => r.id), [A]);
    assert.deepEqual(out.brands.map((r) => r.id), ["b1"]);
    assert.deepEqual(out.posts.map((r) => r.id), ["p1"]);
    assert.deepEqual(out.bio_views.map((r) => r.page_id), ["bp1"]);
    assert.deepEqual(out.webhooks.map((r) => r.url), ["https://a.test"]);
    assert.doesNotMatch(JSON.stringify(out), /whsec_|Theirs|theirs|bp2/);
  }
});

test("Download my data holds only the person's own rows, across workspaces", async () => {
  const specs = only(["posts", "agent_chats", "agent_messages"], ACCOUNT_TABLES);
  for (const read of [honest, wrong]) {
    const out = await collect(specs, read, { workspaceId: null, userId: ME });
    assert.deepEqual(out.posts.map((r) => r.id), ["p1", "p3"]);
    assert.deepEqual(out.agent_chats.map((r) => r.id), ["c1"]);
    assert.deepEqual(out.agent_messages.map((r) => r.id), [1]);
    assert.doesNotMatch(JSON.stringify(out), /private/);
  }
  // A row without its scope column, or a workspace scope without a workspace, never passes.
  const posts = WORKSPACE_TABLES.find((s) => s.table === "posts")!;
  assert.equal(inScope(posts, { id: "x" }, { workspaceId: A, userId: ME }, new Map()), false);
  assert.equal(inScope(posts, { id: "x", workspace_id: A }, { workspaceId: null, userId: ME }, new Map()), false);
});

test("children of a table with no rows read nothing; long id lists are read in chunks", async () => {
  const views = WORKSPACE_TABLES.find((s) => s.table === "bio_views")!;
  const asked: Query[] = [];
  const spy: Reader = async (q) => (asked.push(q), []);
  const none: Row[] = [];
  for await (const r of readTable(views, spy, { workspaceId: A, userId: ME }, new Map(), new Map())) none.push(r);
  assert.equal(asked.length, 0);
  const ids = Array.from({ length: EXPORT_RULES.chunk * 2 + 1 }, (_, i) => `p${i}`);
  const seen: Seen = new Map([["bio_pages", new Map([["id", new Set(ids)]])]]);
  for await (const r of readTable(views, spy, { workspaceId: A, userId: ME }, seen, new Map())) none.push(r);
  assert.equal(asked.length, 3);
  assert.ok(asked.every((q) => "in" in q.filter && q.filter.in.length <= EXPORT_RULES.chunk));
});

// ---- building the ZIP

/** name -> contents of a ZIP, read from its central directory. */
function unzip(buf: Buffer): Map<string, Buffer> {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  assert.ok(eocd >= 0, "not a ZIP");
  const n = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let i = 0; i < n; i++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50);
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nl = buf.readUInt16LE(p + 28);
    const el = buf.readUInt16LE(p + 30);
    const cl = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nl);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + csize);
    out.set(name, method === 8 ? inflateRawSync(data) : Buffer.from(data));
    p += 46 + nl + el + cl;
  }
  return out;
}

const row = (o: Partial<ExportRow> = {}): ExportRow => ({ id: "e1", user_id: ME, workspace_id: A, kind: "workspace", status: "queued", path: storagePath(ME, "e1"), size: null, error: null, created_at: NOW.toISOString(), expires_at: null, ...o });

type Fake = { row: ExportRow; stored: Buffer | null; removed: number; done: number; uploads: number };

/** A store that behaves like data_exports and the bucket: ready and failed never undo a ready export. */
function fake(o: { parts?: Part[]; open?: ExportSteps["open"]; upload?: (file: string, f: Fake) => Promise<void>; kind?: "account" | "workspace" } = {}) {
  const f: Fake = { row: row({ kind: o.kind ?? "workspace" }), stored: null, removed: 0, done: 0, uploads: 0 };
  const steps: ExportSteps = {
    load: async () => ({ ...f.row }),
    start: async () => {
      if (f.row.status === "ready") return false;
      f.row = { ...f.row, status: "running", error: null };
      return true;
    },
    parts: () => o.parts ?? [{ name: "posts", rows: async function* () { yield { id: "p1", text: "hi" }; } }],
    open: o.open ?? (async (path) => Readable.from([Buffer.from(`bytes of ${path}`)])),
    upload: async (file) => {
      f.uploads++;
      if (o.upload) return o.upload(file, f);
      f.stored = await readFile(file);
    },
    remove: async () => {
      f.removed++;
      f.stored = null;
    },
    ready: async (size, exp) => {
      if (f.row.status === "ready") return false;
      f.row = { ...f.row, status: "ready", size, expires_at: exp.toISOString() };
      return true;
    },
    failed: async (error) => {
      if (f.row.status !== "ready") f.row = { ...f.row, status: "failed", error };
    },
    done: async () => {
      f.done++;
    },
  };
  return { f, steps };
}

async function tempBase() {
  return mkdtemp(join(tmpdir(), "export-test-"));
}

test("a workspace export: one JSON file per table, the media files and a README, uploaded whole", async () => {
  const tmp = await tempBase();
  const specs = only(["workspaces", "posts", "webhooks", "media"], WORKSPACE_TABLES);
  const seen: Seen = new Map();
  const needed = keysNeeded(specs);
  const who = { workspaceId: A, userId: ME };
  const { f, steps } = fake({ parts: specs.map((s) => ({ name: fileOf(s), rows: () => readTable(s, wrong, who, seen, needed) })) });
  assert.equal(await runExportWith(steps, { tmp, now: () => NOW }), "done");
  assert.equal(f.row.status, "ready");
  assert.equal(f.row.expires_at, new Date(NOW.getTime() + 24 * HOUR).toISOString());
  const zip = unzip(f.stored!);
  assert.deepEqual([...zip.keys()], ["workspace.json", "posts.json", "media.json", "webhooks.json", "files/m1-pic.png", "README.txt"]);
  const media = JSON.parse(zip.get("media.json")!.toString());
  assert.deepEqual(media, [{ id: "m1", workspace_id: A, path: `${A}/m1.png`, name: "pic.png", size: 4, file: "files/m1-pic.png" }]);
  assert.equal(zip.get("files/m1-pic.png")!.toString(), `bytes of ${A}/m1.png`);
  assert.doesNotMatch([...zip.values()].map((b) => b.toString()).join("\n"), /whsec_|theirs/);
  assert.match(zip.get("README.txt")!.toString(), /posts\.json: 1/);
  assert.equal(f.done, 1);
  assert.deepEqual(await readdir(tmp), []);
  await rm(tmp, { recursive: true });
});

test("a table read failing part way: failed, nothing uploaded, no temp files, and it can run again", async () => {
  const tmp = await tempBase();
  let broken = true;
  const parts: Part[] = [
    { name: "posts", rows: async function* () { yield { id: "p1" }; } },
    {
      name: "inbox_items",
      rows: async function* () {
        yield { id: "i1" };
        if (broken) throw new Error("inbox_items: connection reset");
        yield { id: "i2" };
      },
    },
  ];
  const { f, steps } = fake({ parts });
  await assert.rejects(runExportWith(steps, { tmp }), /connection reset/);
  assert.equal(f.row.status, "failed");
  assert.match(f.row.error!, /connection reset/);
  assert.equal(f.uploads, 0);
  assert.equal(f.stored, null);
  assert.equal(f.done, 0);
  assert.deepEqual(await readdir(tmp), []);
  // The job runs again: this time it finishes.
  broken = false;
  assert.equal(await runExportWith(steps, { tmp }), "done");
  assert.equal(f.row.status, "ready");
  assert.equal(f.row.error, null);
  assert.equal(JSON.parse(unzip(f.stored!).get("inbox_items.json")!.toString()).length, 2);
  assert.equal(f.done, 1);
  assert.deepEqual(await readdir(tmp), []);
  await rm(tmp, { recursive: true });
});

test("the upload failing part way removes the half file, marks it failed, and a retry works", async () => {
  const tmp = await tempBase();
  let fails = 1;
  const { f, steps } = fake({
    upload: async (file, s) => {
      const all = await readFile(file);
      s.stored = all.subarray(0, all.length >> 1);
      if (fails-- > 0) throw new Error("upload: 503 Service Unavailable");
      s.stored = all;
    },
  });
  await assert.rejects(runExportWith(steps, { tmp }), /503/);
  assert.equal(f.row.status, "failed");
  assert.equal(f.stored, null);
  assert.equal(f.removed, 1);
  assert.equal(f.done, 0);
  assert.deepEqual(await readdir(tmp), []);
  assert.equal(await runExportWith(steps, { tmp }), "done");
  assert.equal(unzip(f.stored!).get("posts.json")!.toString().includes('"p1"'), true);
  await rm(tmp, { recursive: true });
});

test("a media file failing mid-stream fails the export; one no longer stored is listed instead", async () => {
  const tmp = await tempBase();
  const media: Part = { name: "media", rows: async function* () { yield { id: "m1", path: "ws/m1.mp4", name: "clip.mp4" }; yield { id: "m2", path: "ws/m2.png", name: "gone.png" }; } };
  const cut = fake({
    parts: [media],
    open: async () =>
      new Readable({
        read() {
          this.push(Buffer.alloc(1024, 1));
          this.destroy(new Error("socket hang up"));
        },
      }),
  });
  await assert.rejects(runExportWith(cut.steps, { tmp }), /socket hang up/);
  assert.equal(cut.f.row.status, "failed");
  assert.equal(cut.f.uploads, 0);
  assert.deepEqual(await readdir(tmp), []);
  const gone = fake({ parts: [media], open: async (p) => (p.endsWith("m2.png") ? null : Readable.from([Buffer.from("video")])) });
  assert.equal(await runExportWith(gone.steps, { tmp }), "done");
  const zip = unzip(gone.f.stored!);
  assert.ok(zip.has("files/m1-clip.mp4"));
  assert.ok(!zip.has("files/m2-gone.png"));
  assert.match(zip.get("README.txt")!.toString(), /no longer in storage[\s\S]*files\/m2-gone\.png/);
  await rm(tmp, { recursive: true });
});

test("run twice, one after the other or at once: one ready export, one email", async () => {
  const tmp = await tempBase();
  const { f, steps } = fake();
  assert.equal(await runExportWith(steps, { tmp }), "done");
  assert.equal(await runExportWith(steps, { tmp }), "skipped");
  assert.equal(f.done, 1);
  assert.equal(f.uploads, 1);
  const two = fake();
  const res = await Promise.all([runExportWith(two.steps, { tmp }), runExportWith(two.steps, { tmp })]);
  assert.deepEqual(res, ["done", "done"]);
  assert.equal(two.f.row.status, "ready");
  assert.equal(two.f.done, 1);
  assert.ok(two.f.stored && unzip(two.f.stored).has("README.txt"));
  // A run whose upload fails after another run finished never deletes the finished file or marks it failed.
  const late = fake({
    upload: async (_file, s) => {
      s.row = { ...s.row, status: "ready", expires_at: linkExpiry(NOW).toISOString() };
      s.stored = Buffer.from("the other run's zip");
      throw new Error("upload: timeout");
    },
  });
  await assert.rejects(runExportWith(late.steps, { tmp }), /timeout/);
  assert.equal(late.f.row.status, "ready");
  assert.equal(late.f.removed, 0);
  assert.equal(late.f.stored!.toString(), "the other run's zip");
  assert.equal(late.f.done, 0);
  assert.deepEqual(await readdir(tmp), []);
  await rm(tmp, { recursive: true });
});

test("the link works for 24 hours, only for the person who asked, and a workspace one only while they own it", () => {
  const ready = row({ status: "ready", expires_at: linkExpiry(NOW).toISOString() });
  assert.equal(mayDownload(ready, ME, new Date(NOW.getTime() + 24 * HOUR - 1000)), "ok");
  assert.equal(mayDownload(ready, ME, new Date(NOW.getTime() + 24 * HOUR)), "expired");
  assert.equal(mayDownload(ready, ME, new Date(NOW.getTime() + 48 * HOUR)), "expired");
  assert.equal(mayDownload(ready, YOU, NOW), "missing");
  assert.equal(mayDownload({ ...ready, user_id: null }, ME, NOW), "missing");
  assert.equal(mayDownload(ready, ME, NOW, false), "missing");
  assert.equal(mayDownload({ ...ready, kind: "account", workspace_id: null }, ME, NOW, false), "ok");
  assert.equal(mayDownload(row({ status: "running" }), ME, NOW), "not_ready");
  assert.equal(mayDownload({ ...ready, expires_at: null }, ME, NOW), "expired");
  assert.equal(mayDownload(null, ME, NOW), "missing");
  assert.equal(EXPORT_RULES.linkMs, 24 * HOUR);
});

test("asking again waits on one running, starts a failed one again, and otherwise needs the day's limit", () => {
  const at = (h: number) => new Date(NOW.getTime() - h * HOUR).toISOString();
  assert.deepEqual(nextStep(null, NOW), { do: "new" });
  assert.deepEqual(nextStep({ id: "e", status: "running", created_at: at(1) }, NOW), { do: "wait", id: "e" });
  assert.deepEqual(nextStep({ id: "e", status: "failed", created_at: at(1) }, NOW), { do: "retry", id: "e" });
  assert.deepEqual(nextStep({ id: "e", status: "ready", created_at: at(1) }, NOW), { do: "new" });
  assert.deepEqual(nextStep({ id: "e", status: "queued", created_at: at(25) }, NOW), { do: "new" });
});

test("reads are tried 3 times with growing waits, then the error is thrown", async () => {
  const waits: number[] = [];
  let n = 0;
  assert.equal(await withRetry(async () => (++n < 3 ? Promise.reject(new Error("busy")) : "ok"), 3, 100, async (ms) => void waits.push(ms)), "ok");
  assert.deepEqual(waits, [100, 200]);
  await assert.rejects(withRetry(async () => Promise.reject(new Error("down")), 3, 1, async () => {}), /down/);
});
