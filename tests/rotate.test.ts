// Key rotation: the rotation script must re-seal every column the app seals, in the right table and with the same
// extra data (AAD), or a rotation would leave values on the old key and break them when it's removed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const script = readFileSync(join(import.meta.dirname, "../scripts/rotate-token-key.mjs"), "utf8");
const listed = [...script.matchAll(/\{ table: "([a-z_]+)", id: "[a-z_]+", cols: \[([^\]]+)\]/g)].map((m) => ({ table: m[1], cols: [...m[2].matchAll(/"([a-z_]+)"/g)].map((c) => c[1]) }));
const has = (table: string, col: string) => listed.some((l) => l.table === table && l.cols.includes(col));

// Every `<table>` insert/update/upsert in src/lib that writes `<col>: seal(...)`.
function sealedColumns(): { table: string; col: string }[] {
  const out: { table: string; col: string }[] = [];
  const dir = join(import.meta.dirname, "../src/lib");
  const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".ts") ? [join(d, e.name)] : []));
  for (const f of walk(dir)) {
    const src = readFileSync(f, "utf8");
    // The table named right before the write, with only whitespace between them.
    for (const m of src.matchAll(/from\("([a-z_]+)"\)\s*\.(?:insert|update|upsert)\(([\s\S]{0,600}?)\)\s*[.;)]/g)) {
      for (const c of m[2].matchAll(/([a-z_]+): (?:[a-zA-Z.]+ \? )?seal\(/g)) out.push({ table: m[1], col: c[1] });
    }
  }
  return out;
}

test("the rotation script covers every sealed column in its real table", () => {
  const found = sealedColumns();
  assert.ok(found.length >= 6, `found only ${found.length} sealed columns: the scan is broken`);
  for (const { table, col } of found) {
    // oauth_states.input is short-lived (deleted within an hour) and documented as left out.
    if (table === "oauth_states") continue;
    assert.ok(has(table, col), `scripts/rotate-token-key.mjs doesn't re-seal ${table}.${col}`);
  }
});

test("columns sealed with extra data are re-sealed with the same extra data", () => {
  assert.match(script, /table: "subprocessor_subscribers"[^\n]*aad: \(row\) => `unsub:\$\{row\.email\}`/);
  assert.doesNotMatch(script, /table: "channels", id: "id", cols: \["access_token"/);
});
