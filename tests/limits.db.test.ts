// The shared limit counters and their upkeep (032_auth_limits.sql) on a real Postgres. They prove: many servers
// counting at once never lose a hit and exactly `max` get through, a weighted hit counts its weight, windows are
// separate, and upkeep drops old counters and apps never approved after a week but keeps approved and new ones.
//
// It starts its own Postgres from the binaries on this machine (initdb and pg_ctl, run as the postgres user when the
// tests run as root) and skips when there are none.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function findBin(name: string): string | null {
  const r = spawnSync("which", [name], { encoding: "utf8" });
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  const root = "/usr/lib/postgresql";
  if (!existsSync(root)) return null;
  for (const v of readdirSync(root).sort().reverse()) {
    const p = join(root, v, "bin", name);
    if (existsSync(p)) return p;
  }
  return null;
}

const initdb = findBin("initdb");
const pgCtl = findBin("pg_ctl");
const psqlBin = findBin("psql");
const root = process.getuid?.() === 0;
const asPg = root && spawnSync("id", ["postgres"]).status === 0 ? ["runuser", "-u", "postgres", "--"] : [];
const ready = !!(initdb && pgCtl && psqlBin) && (!root || asPg.length > 0);
const skip = ready ? false : "no Postgres binaries here";

let dir = "";
const port = 55000 + Math.floor(Math.random() * 900);

const run = (cmd: string, args: string[]) => {
  const [bin, ...rest] = [...asPg, cmd, ...args];
  return execFileSync(bin, rest, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
};
const conn = () => ["-h", dir, "-p", String(port), "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"];

function sql(q: string): string[][] {
  const out = execFileSync(psqlBin!, [...conn(), "-tA", "-F", "\t", "-c", q], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return out
    .split("\n")
    .filter((l) => l.length)
    .map((l) => l.split("\t"));
}
const num = (q: string) => Number(sql(q)[0]?.[0]);

function sqlAsync(q: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn(psqlBin!, [...conn(), "-tA", "-c", q]);
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("close", (code) => (code === 0 ? resolve(out.trim()) : reject(new Error(out))));
  });
}

const STUB = `
create extension if not exists pgcrypto;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;
create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid());
create table public.workspaces (id uuid primary key default gen_random_uuid());
`;

const load = (file: string) => execFileSync(psqlBin!, [...conn(), "-q"], { input: readFileSync(join(import.meta.dirname, "../supabase/migrations", file), "utf8"), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });

before(() => {
  if (!ready) return;
  dir = mkdtempSync(join(tmpdir(), "limits-pg-"));
  chmodSync(dir, 0o777);
  const data = join(dir, "data");
  run(initdb!, ["-D", data, "-U", "postgres", "--auth=trust", "-E", "UTF8"]);
  run(pgCtl!, ["-D", data, "-o", `-p ${port} -k ${dir} -c listen_addresses='' -c fsync=off`, "-w", "-l", join(dir, "log"), "start"]);
  sql(STUB);
  load("026_oauth.sql");
  load("032_auth_limits.sql");
  // Running it twice changes nothing.
  load("032_auth_limits.sql");
});

after(() => {
  if (!ready || !dir) return;
  try {
    run(pgCtl!, ["-D", join(dir, "data"), "-m", "immediate", "stop"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("servers counting at once: exactly max get through, every hit is counted", { skip }, async () => {
  const results = await Promise.all(Array.from({ length: 40 }, () => sqlAsync("select public.take_rate('race', 3600, 25)")));
  assert.equal(results.filter((r) => r === "0").length, 25);
  for (const r of results.filter((x) => x !== "0")) assert.ok(Number(r) >= 1 && Number(r) <= 3600, r);
  assert.equal(num("select sum(count) from public.rate_counts where bucket = 'race'"), 40);
});

test("a weighted hit counts its weight; buckets and windows are separate", { skip }, () => {
  assert.equal(num("select public.take_rate('w', 3600, 120, 100)"), 0);
  assert.ok(num("select public.take_rate('w', 3600, 120, 25)") > 0);
  assert.equal(num("select public.take_rate('other', 3600, 120, 25)"), 0);
  sql("insert into public.rate_counts (bucket, window_start, count) values ('old', now() - interval '1 hour 30 minutes', 999)");
  assert.equal(num("select public.take_rate('old', 3600, 5)"), 0);
});

test("upkeep drops old counters and week-old apps nobody approved, and keeps the rest", { skip }, () => {
  sql("insert into public.rate_counts (bucket, window_start, count) values ('stale', now() - interval '3 days', 1)");
  const ws = sql("insert into public.workspaces default values returning id")[0][0];
  const user = sql("insert into auth.users default values returning id")[0][0];
  sql(`insert into public.oauth_clients (id, redirect_uris, created_at) values
    ('cbc_old_unused', '{https://a.test/cb}', now() - interval '8 days'),
    ('cbc_old_used', '{https://a.test/cb}', now() - interval '8 days'),
    ('cbc_new', '{https://a.test/cb}', now() - interval '1 day')`);
  sql(`insert into public.oauth_grants (client_id, workspace_id, user_id, revoked_at) values ('cbc_old_used', '${ws}', '${user}', now())`);
  sql("select public.prune_limits()");
  assert.equal(num("select count(*) from public.rate_counts where bucket = 'stale'"), 0);
  assert.ok(num("select count(*) from public.rate_counts where bucket = 'race'") > 0);
  assert.deepEqual(
    sql("select id from public.oauth_clients order by id").map((r) => r[0]),
    ["cbc_new", "cbc_old_used"],
  );
});

test("signed-in users and visitors can't touch the counters", { skip }, () => {
  assert.equal(sql("select has_function_privilege('anon', 'public.take_rate(text, int, int, int)', 'execute')")[0][0], "f");
  assert.equal(sql("select has_function_privilege('authenticated', 'public.prune_limits()', 'execute')")[0][0], "f");
  assert.equal(sql("select has_table_privilege('authenticated', 'public.rate_counts', 'select')")[0][0], "f");
});
