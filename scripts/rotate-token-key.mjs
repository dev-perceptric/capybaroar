#!/usr/bin/env node
// Re-seals every stored secret with the current key (TOKEN_KEY_CURRENT), through the same tables and the same sealing
// code the app uses (src/lib/sealing.ts). Dry run by default: it opens every value and counts what would change.
//
//   npx tsx scripts/rotate-token-key.mjs            # dry run
//   npx tsx scripts/rotate-token-key.mjs --apply    # write
//
// Needs NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, and the keys exactly as the app has
// them: TOKEN_KEYS with the old and the new key, TOKEN_KEY_CURRENT naming the new one, and TOKEN_KEY while v1 values
// exist. Steps: add the new key to TOKEN_KEYS everywhere and deploy (still sealing with the old one), set
// TOKEN_KEY_CURRENT to it and deploy, run this with --apply, run it again (it should find nothing to do), then
// remove the old key. Each row is written only if its value hasn't changed since it was read, so a token refreshed
// by the publisher mid-run is never overwritten; the next run picks it up.
import { createClient } from "@supabase/supabase-js";
import { envKeyring, resealWith, sealedKid } from "../src/lib/sealing.ts";

// Every sealed column. `aad` must match what the app passes to seal()/open() for that column, and `extra` names any
// other columns it needs. tests/rotate.test.ts checks this list against every seal() call in src/lib, so a new sealed
// column can't be missed. Not here on purpose: oauth_states.input (sealed with "oauth:<state>"), which is deleted
// within an hour; keep the old key for at least an hour after switching TOKEN_KEY_CURRENT.
const COLUMNS = [
  { table: "channel_secrets", id: "channel_id", cols: ["access_token", "refresh_token"] },
  { table: "webhooks", id: "id", cols: ["secret"] },
  { table: "invites", id: "id", cols: ["token"] },
  { table: "review_links", id: "brand_id", cols: ["token"] },
  { table: "reports", id: "id", cols: ["token"] },
  { table: "subprocessor_subscribers", id: "id", cols: ["unsub_sealed"], extra: ["email"], aad: (row) => `unsub:${row.email}` },
];
const PAGE = 500;

const apply = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("rotate: set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}
const ring = envKeyring();
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** A Supabase call, tried again on a timeout, network error, 429 or 5xx, with growing waits. */
async function retry(what, fn) {
  for (let i = 0; ; i++) {
    const res = await Promise.resolve()
      .then(fn)
      .catch((e) => ({ error: { message: e?.message ?? String(e) }, status: 0 }));
    const transient = res.error && (!res.status || res.status === 429 || res.status >= 500);
    if (!res.error || !transient || i >= 4) {
      if (res.error) throw new Error(`${what}: ${res.error.message}`);
      return res;
    }
    await sleep(500 * 2 ** i);
  }
}

console.log(`rotate: current key ${ring.current}; keys ${[...ring.keys.keys()].join(", ")}; ${apply ? "APPLY" : "dry run"}`);
let failed = 0;
for (const { table, id, cols, aad, extra = [] } of COLUMNS) {
  const tally = { rows: 0, current: 0, resealed: 0, changed: 0, broken: 0, byKid: {} };
  for (let from = 0; ; from += PAGE) {
    const { data } = await retry(`${table} read`, () =>
      db.from(table).select([id, ...cols, ...extra].join(", ")).order(id).range(from, from + PAGE - 1),
    );
    for (const row of data ?? []) {
      tally.rows++;
      for (const col of cols) {
        const old = row[col];
        if (typeof old !== "string" || !old) continue;
        const kid = sealedKid(old) ?? "unknown";
        tally.byKid[kid] = (tally.byKid[kid] ?? 0) + 1;
        let next;
        try {
          next = resealWith(ring, old, aad?.(row));
        } catch (e) {
          tally.broken++;
          console.error(`rotate: ${table}.${col} ${row[id]} does not open: ${e.message}`);
          continue;
        }
        if (next === null) {
          tally.current++;
          continue;
        }
        if (!apply) {
          tally.resealed++;
          continue;
        }
        const { data: written } = await retry(`${table}.${col} ${row[id]} write`, () =>
          db.from(table).update({ [col]: next }).eq(id, row[id]).eq(col, old).select(id),
        );
        if (written?.length) tally.resealed++;
        else tally.changed++; // changed by the app since it was read; the next run re-seals it
      }
    }
    if (!data || data.length < PAGE) break;
  }
  failed += tally.broken;
  const kids = Object.entries(tally.byKid).map(([k, n]) => `${k}=${n}`).join(" ") || "none";
  console.log(
    `rotate: ${table}: ${tally.rows} rows, values by key ${kids}; ${tally.current} already current, ` +
      `${tally.resealed} ${apply ? "re-sealed" : "to re-seal"}, ${tally.changed} changed meanwhile, ${tally.broken} do not open`,
  );
}
if (failed) {
  console.error(`rotate: ${failed} values do not open with the configured keys; keep the old keys until they are fixed or deleted`);
  process.exit(1);
}
console.log(apply ? "rotate: done. Run it again to confirm nothing is left, then remove the old key." : "rotate: dry run done. Add --apply to write.");
