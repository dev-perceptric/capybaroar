// Campaigns: names, colors, brands, counts, the CSV column and the API. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { CAMPAIGN_TONES, cleanName, cleanTone, countCampaigns, fitsBrand, nextTone } from "../src/lib/campaignRules";
import { parseBulk, type BulkChannel } from "../src/lib/bulk";
import { ApiError, postFields } from "../src/lib/api/input";
import { handleMcp } from "../src/lib/api/mcp";
import type { Ops } from "../src/lib/api/types";

test("names are tidied and kept short; colors fall back to violet", () => {
  assert.equal(cleanName("  Spring   launch "), "Spring launch");
  assert.throws(() => cleanName("   "), /Name the campaign/);
  assert.throws(() => cleanName("x".repeat(61)), /up to 60 characters/);
  assert.equal(cleanTone("green"), "green");
  assert.equal(cleanTone("chartreuse"), "violet");
});

test("a new campaign takes the next color nobody uses", () => {
  assert.equal(nextTone([]), "violet");
  assert.equal(nextTone(["violet", "green"]), "amber");
  assert.ok(CAMPAIGN_TONES.includes(nextTone([...CAMPAIGN_TONES])));
});

test("a campaign holds posts of its own brand, or of any brand when it belongs to the workspace", () => {
  assert.equal(fitsBrand(null, "b1"), true);
  assert.equal(fitsBrand("b1", "b1"), true);
  assert.equal(fitsBrand("b1", "b2"), false);
});

test("counts per campaign by status, with engagements", () => {
  const m = countCampaigns([
    { campaign_id: "c1", status: "scheduled", engagement: 0 },
    { campaign_id: "c1", status: "review", engagement: 0 },
    { campaign_id: "c1", status: "published", engagement: 40 },
    { campaign_id: "c1", status: "partial", engagement: 2 },
    { campaign_id: "c1", status: "failed", engagement: 0 },
    { campaign_id: "c1", status: "draft", engagement: 0 },
    { campaign_id: null, status: "published", engagement: 99 },
  ]);
  assert.deepEqual(m.get("c1"), { scheduled: 2, published: 2, failed: 1, drafts: 1, engagements: 42 });
  assert.equal(m.size, 1);
});

test("bulk CSV reads a campaign column", () => {
  const ch: BulkChannel[] = [{ id: "c", name: "Crumb", network: "x", brand_id: null, status: "active" }];
  const { rows } = parseBulk(`date,time,channels,text,campaign\n2099-01-02,09:00,X,Hello,  Winter  launch \n2099-01-03,09:00,X,Hi,\n2099-01-04,09:00,X,Yo,${"y".repeat(61)}\n`, ch, "UTC");
  assert.equal(rows[0].campaign, "Winter launch");
  assert.equal(rows[1].campaign, null);
  assert.match(rows[2].errors.join(" "), /Campaign names are up to 60 characters/);
});

test("the API takes campaign_id, or null to take a post out of its campaign", () => {
  const A = "11111111-1111-4111-8111-111111111111";
  assert.equal(postFields({ channel_ids: [A], mode: "now", campaign_id: A }, false).campaignId, A);
  assert.equal(postFields({ campaign_id: null }, true).campaignId, null);
  assert.throws(() => postFields({ campaign_id: "nope" }, true), (e: unknown) => e instanceof ApiError && /campaign_id/.test(e.message));
});

test("MCP: list_campaigns returns the campaigns", async () => {
  const ops = { campaigns: async () => [{ id: "c1", name: "Launch", color: "green", brand_id: null, scheduled: 1, published: 2, failed: 0, drafts: 0, engagements: 5 }] } as Partial<Ops> as Ops;
  const r = (await handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_campaigns", arguments: {} } }, ops, "UTC")) as { result: { content: { text: string }[]; isError: boolean } };
  assert.equal(r.result.isError, false);
  assert.equal(JSON.parse(r.result.content[0].text).campaigns[0].name, "Launch");
});

test("bulk CSV matches other tools' column names", () => {
  const ch: BulkChannel[] = [{ id: "c", name: "Crumb", network: "x", brand_id: null, status: "active" }];
  const { rows } = parseBulk(`Scheduled At,Profile,Message,Tag\n2099-01-02 09:00,X,Hello there,Launch\n`, ch, "UTC");
  assert.deepEqual([rows[0].errors, rows[0].text, rows[0].channelIds, rows[0].campaign, rows[0].at], [[], "Hello there", ["c"], "Launch", "2099-01-02T09:00:00.000Z"]);
});
