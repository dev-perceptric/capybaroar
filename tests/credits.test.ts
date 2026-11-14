// Credit rules. They prove: every action is priced at 2.5 times its cost or more (so margin holds whatever people
// make), packs keep a margin, Claude's tokens turn into credits the same way, refill periods count monthly from the
// subscription's day (short months included), the ledger's refusals read as lines people can act on, and the usage
// list adds up to what the ledger holds. The ledger's SQL is covered by tests/credits.db.test.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODELS, genRequest } from "../src/lib/genRules";
import {
  AGENT_MIN,
  BIO_CREDITS,
  MARKUP,
  MAX_ACTION,
  NO_AI,
  PACKS,
  TRIAL_CREDITS,
  WRITE_CREDITS,
  addMonths,
  alertLevel,
  claudeCents,
  claudeCredits,
  creditBlock,
  grantKey,
  grantOwed,
  packOf,
  periodFor,
  periodOf,
  priceOf,
  refusalOf,
  refusalText,
  topUpDue,
  usageCsv,
  usageRows,
  type Entry,
} from "../src/lib/creditRules";

test("every model is priced at 2.5 times what it costs us, or more", () => {
  const prompts = [1, 10, 79, 80, 999, 1000, 1001, 1999, 4999, 5000].map((n) => "x".repeat(n));
  for (const m of MODELS)
    for (const seconds of [5, 10] as const)
      for (const prompt of prompts) {
        const cost = m.cost({ prompt, seconds });
        const price = m.credits({ prompt, seconds });
        assert.ok(Number.isInteger(price) && price > 0, `${m.id} has a whole price`);
        assert.ok(price + 1e-9 >= cost * MARKUP, `${m.id} at ${seconds}s, ${prompt.length} characters: ${price} credits for ${cost} cents`);
        assert.ok(price <= MAX_ACTION, `${m.id} fits under the cap for one action`);
      }
});

test("Capy's picks are priced from the same list", () => {
  assert.equal(genRequest({ kind: "image", prompt: "A capybara at sunset" }).credits, 6);
  assert.equal(genRequest({ kind: "video", prompt: "Waves on a beach" }).credits, 168);
  assert.equal(genRequest({ kind: "video", prompt: "Waves on a beach", seconds: 10 }).credits, 336);
});

test("packs keep a margin and are the only sizes sold", () => {
  for (const p of PACKS) {
    const costUsd = (p.credits / MARKUP) / 100;
    // The biggest pack is a bulk discount: it still makes at least 1.5 times its cost.
    assert.ok(p.price >= costUsd * 1.5, `${p.credits} for $${p.price} costs us at most $${costUsd}`);
  }
  assert.deepEqual(packOf(5000), { credits: 5000, price: 50 });
  assert.equal(packOf(4999), null);
  assert.equal(packOf("1000"), null);
});

test("Claude's tokens become credits at the same markup", () => {
  assert.equal(claudeCents(null), 0);
  assert.equal(claudeCredits({ input_tokens: 0, output_tokens: 0 }), 0);
  // 10,000 in and 1,000 out: $0.075, so 7.5 cents, so 15 credits.
  assert.equal(claudeCents({ input_tokens: 10000, output_tokens: 1000 }), 7.5);
  assert.equal(claudeCredits({ input_tokens: 10000, output_tokens: 1000 }), 15);
  // Cache reads cost a tenth of input; cache writes a quarter more.
  assert.equal(claudeCredits({ cache_read_input_tokens: 100000 }), 10);
  assert.equal(claudeCredits({ cache_creation_input_tokens: 8000 }), 10);
  // Missing or broken numbers count as nothing.
  assert.equal(claudeCredits({ input_tokens: -5, output_tokens: null }), 0);
  assert.equal(priceOf(3), 6);
  assert.equal(priceOf(16.8 * 5), 168);
  assert.equal(priceOf(0), 0);
  assert.ok(AGENT_MIN >= 1 && WRITE_CREDITS > 0 && BIO_CREDITS > 0 && TRIAL_CREDITS === 200);
});

test("refill periods count monthly from the subscription's day, short months included", () => {
  const a = new Date("2026-01-31T15:00:00Z");
  assert.equal(addMonths(a, 1).toISOString(), "2026-02-28T15:00:00.000Z");
  assert.equal(addMonths(a, 3).toISOString(), "2026-04-30T15:00:00.000Z");
  assert.equal(addMonths(new Date("2027-12-31T00:00:00Z"), 2).toISOString(), "2028-02-29T00:00:00.000Z");
  assert.equal(addMonths(a, -1).toISOString(), "2025-12-31T15:00:00.000Z");

  const p = periodOf(a, new Date("2026-03-10T00:00:00Z"));
  assert.equal(p.key, "2026-02-28");
  assert.equal(p.next.toISOString(), "2026-03-31T15:00:00.000Z");
  // The very instant of a refill starts the new period.
  assert.equal(periodOf(a, new Date("2026-03-31T15:00:00Z")).key, "2026-03-31");
  assert.equal(periodOf(a, new Date("2026-03-31T14:59:59Z")).key, "2026-02-28");
  // An anchor years back still lands on the right month.
  assert.equal(periodOf(new Date("2020-05-15T08:00:00Z"), new Date("2026-11-05T12:00:00Z")).key, "2026-10-15");
  // An anchor later than now (a fresh subscription seen by a server with a slow clock) counts back.
  assert.equal(periodOf(new Date("2026-11-06T00:00:00Z"), new Date("2026-11-05T00:00:00Z")).key, "2026-10-06");
});

test("a workspace's period: none without credits, one trial period, else monthly from its anchor", () => {
  const now = new Date("2026-11-05T12:00:00Z");
  assert.deepEqual(periodFor({ credits: 0, trial: false, anchor: null }, now), { period: "none", total: 0, refillAt: null });
  assert.deepEqual(periodFor({ credits: 2500, trial: true, anchor: "2026-11-01T00:00:00Z" }, now), { period: "trial", total: TRIAL_CREDITS, refillAt: null });
  assert.deepEqual(periodFor({ credits: 2500, trial: false, anchor: "2026-09-20T10:00:00Z" }, now), { period: "2026-10-20", total: 2500, refillAt: "2026-11-20T10:00:00.000Z" });
  // No anchor (or a broken one): the calendar month.
  assert.equal(periodFor({ credits: 1000, trial: false, anchor: null }, now).period, "2026-11-01");
  assert.equal(periodFor({ credits: 1000, trial: false, anchor: "soon" }, now).period, "2026-11-01");
});

test("an upgrade mid-period adds the difference; a downgrade waits for the next period", () => {
  assert.equal(grantOwed(1000, 0), 1000);
  assert.equal(grantOwed(2500, 1000), 1500);
  assert.equal(grantOwed(1000, 2500), 0);
  assert.equal(grantKey("2026-10-20", 2500), "plan:2026-10-20:2500");
});

test("the ledger's refusals read as lines people can act on", () => {
  assert.deepEqual(refusalOf({ message: "out_of_credits", details: "37" }), { code: "out_of_credits", left: 37 });
  assert.deepEqual(refusalOf({ message: "brand_limit", details: "0" }), { code: "brand_limit", left: 0 });
  assert.equal(refusalOf({ message: "permission denied" }), null);
  assert.equal(refusalOf(null), null);
  assert.equal(refusalText({ code: "out_of_credits", left: 37 }, 210), "This costs 210 credits and 37 are left");
  assert.equal(refusalText({ code: "out_of_credits", left: 0 }, 8), "You're out of credits. Buy more in Settings, Billing.");
  assert.equal(refusalText({ code: "brand_limit", left: 0 }, 8), "This brand has used its credits for this month");
  // The app turns each into the right button.
  assert.equal(creditBlock(NO_AI), "upgrade");
  assert.equal(creditBlock("This costs 210 credits and 37 are left"), "buy");
  assert.equal(creditBlock("You're out of credits. Buy more in Settings, Billing."), "buy");
  assert.equal(creditBlock("This brand has used its credits for this month"), "buy");
  assert.equal(creditBlock("I stopped here because the credits ran out."), "buy");
  assert.equal(creditBlock("Write something first"), null);
  assert.equal(creditBlock(undefined), null);
});

test("alerts at 80% and 100% of plan credits; automatic top-ups only when on, low and under the cap", () => {
  assert.equal(alertLevel(1000, 201), null);
  assert.equal(alertLevel(1000, 200), 80);
  assert.equal(alertLevel(1000, 1), 80);
  assert.equal(alertLevel(1000, 0), 100);
  assert.equal(alertLevel(0, 0), null);
  assert.equal(topUpDue({ pack: 1000, max: 2, left: 150, boughtThisMonth: 1 }), true);
  assert.equal(topUpDue({ pack: 1000, max: 2, left: 150, boughtThisMonth: 2 }), false);
  assert.equal(topUpDue({ pack: 1000, max: 2, left: 200, boughtThisMonth: 0 }), false);
  assert.equal(topUpDue({ pack: null, max: 2, left: 0, boughtThisMonth: 0 }), false);
});

const e = (over: Partial<Entry>): Entry => ({ key: "k", kind: "charge", bucket: "plan", amount: 0, tool: null, model: null, note: null, brand_id: null, user_id: null, post_id: null, created_at: "2026-11-05T10:00:00Z", ...over });

test("the usage list shows one row per action, adding up to the balance", () => {
  const entries: Entry[] = [
    e({ key: "plan:2026-10-20:2500", kind: "grant", amount: 2500, note: "Pro credits", created_at: "2026-11-01T00:00:00Z" }),
    e({ key: "topup:cs_1", kind: "grant", bucket: "bought", amount: 1000, note: "1,000 credits", created_at: "2026-11-02T00:00:00Z" }),
    // A video: held, given back, charged (split over plan and bought credits).
    e({ key: "gen:a", kind: "hold", amount: -210, tool: "video", model: "kling-3-pro", created_at: "2026-11-03T00:00:00Z" }),
    e({ key: "gen:a", kind: "release", amount: 210, tool: "video", model: "kling-3-pro", created_at: "2026-11-03T00:05:00Z" }),
    e({ key: "gen:a", kind: "charge", amount: -200, tool: "video", model: "kling-3-pro", created_at: "2026-11-03T00:05:00Z" }),
    e({ key: "gen:a", kind: "charge", bucket: "bought", amount: -10, tool: "video", model: "kling-3-pro", created_at: "2026-11-03T00:05:00Z" }),
    // A failed picture: held and given back, so nothing to show.
    e({ key: "gen:b", kind: "hold", amount: -8, tool: "image", created_at: "2026-11-04T00:00:00Z" }),
    e({ key: "gen:b", kind: "release", amount: 8, tool: "image", created_at: "2026-11-04T00:01:00Z" }),
    // An agent message still running: shows what it holds.
    e({ key: "agent:c", kind: "hold", amount: -200, tool: "agent", created_at: "2026-11-05T00:00:00Z" }),
  ];
  const rows = usageRows(entries);
  assert.deepEqual(
    rows.map((r) => [r.key, r.what, r.credits]),
    [
      ["agent:c", "Agent", -200],
      ["gen:a", "Video", -210],
      ["topup:cs_1", "1,000 credits", 1000],
      ["plan:2026-10-20:2500", "Pro credits", 2500],
    ],
  );
  const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
  assert.equal(sum(rows.map((r) => r.credits)), sum(entries.map((x) => x.amount)));
});

test("the usage CSV keeps numbers as numbers and can't run as a spreadsheet formula", () => {
  const csv = usageCsv(
    [
      { key: "a", at: "2026-11-05T10:00:00Z", what: "Picture", tool: "image", model: "FLUX.2 Pro", brandId: "b1", userId: "u1", postId: null, credits: -8 },
      { key: "b", at: "2026-11-05T11:00:00Z", what: "=HYPERLINK(\"x\")", tool: null, model: null, brandId: null, userId: null, postId: null, credits: 1000 },
    ],
    { users: { u1: "sam@example.com" }, brands: { b1: "Cafe, North" } },
  );
  const lines = csv.trim().split("\r\n");
  assert.equal(lines[0], "Date,What,Model,Brand,Person,Post,Credits");
  assert.equal(lines[1], '2026-11-05T10:00:00Z,Picture,FLUX.2 Pro,"Cafe, North",sam@example.com,,-8');
  assert.equal(lines[2], `2026-11-05T11:00:00Z,"'=HYPERLINK(""x"")",,,,,1000`);
});
