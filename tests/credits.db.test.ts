// The credit ledger's SQL (025_credits.sql) on a real Postgres. They prove: two servers spending at once never take
// the same credit, a retried hold, charge, grant or settle never counts twice, a failed action gives everything back,
// spends take plan credits first and then the lot that ends soonest, ended lots and old periods don't count, brand
// limits hold, and the sweep finds holds a stopped server left behind.
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
const port = 54000 + Math.floor(Math.random() * 900);

const run = (cmd: string, args: string[]) => {
  const [bin, ...rest] = [...asPg, cmd, ...args];
  return execFileSync(bin, rest, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
};

/** Runs SQL and returns the rows, tab-separated. Throws Postgres's error. */
function sql(q: string): string[][] {
  const out = execFileSync(psqlBin!, ["-h", dir, "-p", String(port), "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-tA", "-F", "\t", "-c", q], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return out
    .split("\n")
    .filter((l) => l.length)
    .map((l) => l.split("\t"));
}
const one = (q: string) => sql(q)[0]?.[0] ?? null;
const num = (q: string) => Number(one(q));

/** Runs SQL in its own psql process, for racing several at once. Resolves with its output or its error. */
function sqlAsync(q: string): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    const p = spawn(psqlBin!, ["-h", dir, "-p", String(port), "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-tA", "-c", q]);
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("close", (code) => resolve({ ok: code === 0, out: out.trim() }));
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
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'w',
  created_at timestamptz not null default now(),
  plan text not null default 'free' check (plan in ('free', 'pro', 'agency'))
);
create table public.brands (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces on delete cascade, name text not null default 'b');
create table public.alerts (
  id bigserial primary key,
  workspace_id uuid not null references public.workspaces on delete cascade,
  kind text not null check (kind in ('post_failed', 'reconnect')),
  ref text not null,
  sent_at timestamptz not null default now(),
  unique (kind, ref)
);
`;

before(() => {
  if (!ready) return;
  dir = mkdtempSync(join(tmpdir(), "credits-pg-"));
  chmodSync(dir, 0o777);
  const data = join(dir, "data");
  run(initdb!, ["-D", data, "-U", "postgres", "--auth=trust", "-E", "UTF8"]);
  run(pgCtl!, ["-D", data, "-o", `-p ${port} -k ${dir} -c listen_addresses='' -c fsync=off`, "-w", "-l", join(dir, "log"), "start"]);
  sql(STUB);
  const migration = readFileSync(join(import.meta.dirname, "../supabase/migrations/025_credits.sql"), "utf8");
  execFileSync(psqlBin!, ["-h", dir, "-p", String(port), "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-q"], { input: migration, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
});

after(() => {
  if (!ready || !dir) return;
  try {
    run(pgCtl!, ["-D", join(dir, "data"), "-m", "immediate", "stop"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const newWs = (plan = "pro") => one(`insert into public.workspaces (plan) values ('${plan}') returning id`)!;
const grantPlan = (ws: string, period: string, n: number, key = `plan:${period}:${n}`) => one(`select public.credit_grant('${ws}', '${key}', 'plan', '${period}', ${n}, null)`);
const grantLot = (ws: string, key: string, n: number, ends = "now() + interval '12 months'") => one(`select public.credit_grant('${ws}', '${key}', 'bought', null, ${n}, ${ends})`);
const left = (ws: string, period: string) => sql(`select plan, bought from public.credit_left('${ws}', '${period}')`)[0].map(Number);
const take = (ws: string, key: string, n: number, period: string, o: { kind?: string; seq?: number; partial?: boolean; brand?: string } = {}) =>
  num(`select public.credit_take('${ws}', '${key}', '${o.kind ?? "hold"}', ${o.seq ?? 0}, ${n}, '${period}', ${o.partial ? "true" : "false"}, ${o.brand ? `'${o.brand}'` : "null"}, null, 'image', 'flux-2-pro', null, null)`);
const settleSql = (ws: string, key: string, n: number, period: string) => num(`select public.credit_settle('${ws}', '${key}', ${n}, '${period}', null)`);

test("plans: Creator joins the plans the database accepts", { skip }, () => {
  const ws = newWs("creator");
  assert.equal(one(`select plan from public.workspaces where id = '${ws}'`), "creator");
  assert.throws(() => newWs("gold"), /workspaces_plan_check/);
});

test("a grant is made once per key, and a period's plan credits are only that period's", { skip }, () => {
  const ws = newWs();
  assert.equal(grantPlan(ws, "2026-10-20", 1000), "t");
  assert.equal(grantPlan(ws, "2026-10-20", 1000), "f");
  assert.deepEqual(left(ws, "2026-10-20"), [1000, 0]);
  // A new period starts from its own grant: nothing rolls over.
  assert.deepEqual(left(ws, "2026-11-20"), [0, 0]);
  grantPlan(ws, "2026-11-20", 1000);
  assert.deepEqual(left(ws, "2026-11-20"), [1000, 0]);
  assert.throws(() => one(`select public.credit_grant('${ws}', 'x', 'plan', null, 10, null)`), /plan credits need a period/);
  assert.throws(() => one(`select public.credit_grant('${ws}', 'y', 'bought', null, 10, null)`), /bought credits need an end date/);
  assert.throws(() => one(`select public.credit_grant('${ws}', 'z', 'plan', 'p', 0, null)`), /more than 0/);
});

test("a hold takes all or nothing, a retry never takes twice, and a failed action gives everything back", { skip }, () => {
  const ws = newWs();
  const p = "2026-10-20";
  grantPlan(ws, p, 100);
  assert.equal(take(ws, "gen:a", 40, p), 40);
  // The same key and seq again (a retry after a lost answer) returns the first hold.
  assert.equal(take(ws, "gen:a", 40, p), 40);
  assert.deepEqual(left(ws, p), [60, 0]);
  assert.throws(() => take(ws, "gen:b", 61, p), /out_of_credits/);
  assert.deepEqual(left(ws, p), [60, 0]);
  // Partial takes what there is.
  assert.equal(take(ws, "agent:c", 200, p, { partial: true }), 60);
  assert.deepEqual(left(ws, p), [0, 0]);
  // Failed: settle with 0 gives it all back; settling again changes nothing.
  assert.equal(settleSql(ws, "gen:a", 0, p), 0);
  assert.equal(settleSql(ws, "gen:a", 0, p), 0);
  assert.deepEqual(left(ws, p), [40, 0]);
  // Done: the charge is made once however often it's settled.
  assert.equal(settleSql(ws, "agent:c", 25, p), 25);
  assert.equal(settleSql(ws, "agent:c", 25, p), 25);
  assert.equal(settleSql(ws, "agent:c", 999, p), 25);
  assert.deepEqual(left(ws, p), [75, 0]);
  // A key that never held anything is never charged (a request from before the ledger).
  assert.equal(settleSql(ws, "gen:old", 210, p), 0);
  assert.deepEqual(left(ws, p), [75, 0]);
});

test("an agent can hold again under one key; settling charges what it used, up to what's left", { skip }, () => {
  const ws = newWs();
  const p = "2026-10-20";
  grantPlan(ws, p, 500);
  assert.equal(take(ws, "agent:x", 200, p, { partial: true }), 200);
  assert.equal(take(ws, "agent:x", 200, p, { partial: true, seq: 1 }), 200);
  assert.equal(take(ws, "agent:x", 200, p, { partial: true, seq: 2 }), 100);
  assert.deepEqual(left(ws, p), [0, 0]);
  // It used 520: the holds come back and it's charged what's there (500).
  assert.equal(settleSql(ws, "agent:x", 520, p), 500);
  assert.deepEqual(left(ws, p), [0, 0]);
  assert.equal(num(`select count(*) from public.credit_entries where workspace_id = '${ws}' and key = 'agent:x' and kind = 'release'`), 3);
});

test("spends take plan credits first, then the lot that ends soonest; ended lots don't count", { skip }, () => {
  const ws = newWs();
  const p = "2026-10-20";
  grantPlan(ws, p, 50);
  grantLot(ws, "topup:late", 100, "now() + interval '11 months'");
  grantLot(ws, "topup:soon", 100, "now() + interval '1 month'");
  grantLot(ws, "topup:ended", 500, "now() - interval '1 day'");
  assert.deepEqual(left(ws, p), [50, 200]);
  assert.equal(take(ws, "gen:a", 120, p), 120);
  const parts = sql(`select e.bucket, coalesce(g.key, ''), -e.amount from public.credit_entries e left join public.credit_entries g on g.id = e.lot where e.workspace_id = '${ws}' and e.key = 'gen:a' order by e.id`);
  assert.deepEqual(parts, [
    ["plan", "", "50"],
    ["bought", "topup:soon", "70"],
  ]);
  assert.equal(take(ws, "gen:b", 50, p), 50);
  assert.deepEqual(left(ws, p), [0, 80]);
  assert.throws(() => take(ws, "gen:c", 81, p), /out_of_credits/);
  // Giving a hold back returns it to the lots it came from.
  settleSql(ws, "gen:a", 0, p);
  assert.deepEqual(left(ws, p), [50, 150]);
});

test("two servers spending at once never take the same credit", { skip }, async () => {
  const ws = newWs();
  const p = "2026-10-20";
  grantPlan(ws, p, 100);
  grantLot(ws, "topup:1", 50);
  // 40 racing holds of 10 against 150 credits: exactly 15 win.
  const runs = await Promise.all(
    Array.from({ length: 40 }, (_, i) => sqlAsync(`select public.credit_take('${ws}', 'gen:r${i}', 'hold', 0, 10, '${p}', false, null, null, 'image', null, null, null)`)),
  );
  const won = runs.filter((r) => r.ok).length;
  assert.equal(won, 15);
  for (const r of runs.filter((x) => !x.ok)) assert.match(r.out, /out_of_credits/);
  assert.deepEqual(left(ws, p), [0, 0]);
  assert.equal(num(`select -sum(amount) from public.credit_entries where workspace_id = '${ws}' and kind = 'hold'`), 150);
  // The same hold sent by 10 servers at once is taken once.
  const ws2 = newWs();
  grantPlan(ws2, p, 100);
  const same = await Promise.all(Array.from({ length: 10 }, () => sqlAsync(`select public.credit_take('${ws2}', 'gen:same', 'hold', 0, 30, '${p}', false, null, null, 'image', null, null, null)`)));
  assert.ok(same.every((r) => r.ok && r.out === "30"));
  assert.deepEqual(left(ws2, p), [70, 0]);
  // Settles racing each other charge once.
  const settles = await Promise.all(Array.from({ length: 10 }, () => sqlAsync(`select public.credit_settle('${ws2}', 'gen:same', 30, '${p}', null)`)));
  assert.ok(settles.every((r) => r.ok && r.out === "30"));
  assert.deepEqual(left(ws2, p), [70, 0]);
  assert.equal(num(`select count(*) from public.credit_entries where workspace_id = '${ws2}' and key = 'gen:same' and kind = 'charge'`), 1);
});

test("a brand limit holds per period, and releases count back", { skip }, () => {
  const ws = newWs("agency");
  const p = "2026-10-20";
  grantPlan(ws, p, 1000);
  const b = one(`insert into public.brands (workspace_id) values ('${ws}') returning id`)!;
  const other = one(`insert into public.brands (workspace_id) values ('${ws}') returning id`)!;
  sql(`update public.brands set credit_limit = 100 where id = '${b}'`);
  assert.equal(take(ws, "gen:a", 80, p, { brand: b }), 80);
  assert.throws(() => take(ws, "gen:b", 30, p, { brand: b }), /brand_limit/);
  assert.equal(take(ws, "gen:c", 30, p, { brand: other }), 30);
  assert.equal(take(ws, "agent:d", 200, p, { brand: b, partial: true }), 20);
  settleSql(ws, "gen:a", 0, p);
  assert.equal(take(ws, "gen:e", 50, p, { brand: b }), 50);
  // A new period starts the brand's count over.
  grantPlan(ws, "2026-11-20", 1000);
  assert.equal(take(ws, "gen:f", 100, "2026-11-20", { brand: b }), 100);
  assert.deepEqual(
    sql(`select brand_id, used from public.credit_brand_used('${ws}', '${p}') order by used`).map(([id, n]) => [id === b ? "b" : "other", Number(n)]),
    [
      ["other", 30],
      ["b", 70],
    ],
  );
});

test("the sweep finds holds a stopped server left behind, and only those", { skip }, () => {
  const ws = newWs();
  const p = "2026-10-20";
  grantPlan(ws, p, 1000);
  take(ws, "gen:stuck", 10, p);
  take(ws, "gen:fresh", 10, p);
  take(ws, "gen:done", 10, p);
  settleSql(ws, "gen:done", 10, p);
  take(ws, "gen:failed", 10, p);
  settleSql(ws, "gen:failed", 0, p);
  sql(`update public.credit_entries set created_at = now() - interval '2 hours' where workspace_id = '${ws}' and key in ('gen:stuck', 'gen:done', 'gen:failed')`);
  const stale = sql(`select key from public.credit_stale_holds(interval '90 minutes') where workspace_id = '${ws}'`).map((r) => r[0]);
  assert.deepEqual(stale, ["gen:stuck"]);
});

test("ledger rows must have the right sign, and only the server role may call the functions", { skip }, () => {
  const ws = newWs();
  assert.throws(() => sql(`insert into public.credit_entries (workspace_id, key, kind, bucket, period, amount) values ('${ws}', 'bad', 'hold', 'plan', 'p', 5)`), /check/);
  assert.throws(() => sql(`insert into public.credit_entries (workspace_id, key, kind, bucket, period, amount) values ('${ws}', 'bad', 'grant', 'plan', 'p', -5)`), /check/);
  assert.equal(one(`select has_function_privilege('authenticated', 'public.credit_take(uuid, text, text, int, int, text, boolean, uuid, uuid, text, text, uuid, text)', 'execute')`), "f");
  assert.equal(one(`select has_function_privilege('anon', 'public.credit_grant(uuid, text, text, text, int, timestamptz, text)', 'execute')`), "f");
  assert.equal(one(`select has_function_privilege('service_role', 'public.credit_settle(uuid, text, int, text, uuid)', 'execute')`), "t");
  assert.equal(one(`select relrowsecurity from pg_class where relname = 'credit_entries'`), "t");
});
