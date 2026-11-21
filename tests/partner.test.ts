// The partner API (Morning Telos makes a brand per customer), brand keys and connect links. All pure: fake key
// lookups, an in-memory partner store and fake actions that leak on purpose. They prove: each key kind is told apart
// by its shape and its stored kind; a brand key acts as an editor of its one brand and a partner key works only on
// /api/partner; partner routes refuse no key, member keys, brand keys and another workspace's partner key; making a
// brand is safe to retry; deleting a brand revokes its keys; a connect link is one browser's for 24 hours; a brand
// key can't see or touch another brand or its channels through any MCP tool or REST action; and a partner disconnects
// one channel of its own brand only, the way the Channels page does, with channel.lost to its webhook.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ApiError, monthRange, partnerBrandInput, partnerHookInput } from "../src/lib/api/input";
import { BRAND_PREFIX, KEY_PREFIX, PARTNER_PREFIX, keyContext, keyKinds, looksLikeKey, partnerContext, shownPrefix, type KeyLookup, type KeyRow, type MemberRow } from "../src/lib/api/keyRules";
import { brandOnly } from "../src/lib/api/brandGuard";
import { TOOLS, callTool } from "../src/lib/api/mcp";
import { PARTNER_EVENTS, partnerBody, partnerChannelData, signStandard, standardHeaders, standardKey, newStandardSecret, STANDARD_SECRET } from "../src/lib/api/hookRules";
import { linkCallbackProblem } from "../src/lib/oauthState";
import {
  BrandTaken,
  LINK_TTL_MS,
  brandStatus,
  brandUsage,
  createPartnerBrand,
  deletePartnerBrand,
  disconnectPartnerChannel,
  getPartnerBrand,
  linkProblem,
  makeBrandKey,
  makeConnectLink,
  readConnectCookie,
  revokeBrandKeysOf,
  sha256,
  type ConnectLink,
  type PartnerBrand,
  type PartnerChannel,
  type PartnerStore,
} from "../src/lib/partnerRules";
import type { ApiChannel, ApiMedia, ApiPost, Ops } from "../src/lib/api/types";

const WS = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const WS2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OWNER = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OWNER2 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const BRAND_A = "a0000000-0000-4000-8000-00000000000a";
const BRAND_B = "b0000000-0000-4000-8000-00000000000b";

const keyOf = (prefix: string) => `${prefix}${randomBytes(32).toString("base64url")}`;
const rejects = (p: Promise<unknown>, status: number, re?: RegExp) => assert.rejects(p, (e: unknown) => e instanceof ApiError && e.status === status && (!re || re.test(e.message)));

// ---- key kinds

test("each key kind has its own shape, and the list shows enough to tell them apart", () => {
  const member = keyOf(KEY_PREFIX);
  const partner = keyOf(PARTNER_PREFIX);
  const brand = keyOf(BRAND_PREFIX);
  assert.deepEqual(keyKinds(member).includes("member"), true);
  assert.deepEqual(keyKinds(partner), ["partner"]);
  assert.ok(keyKinds(brand).includes("brand"));
  assert.ok(!keyKinds(partner).includes("member"), "a partner key never reads as a member key");
  assert.ok(!keyKinds(member).includes("partner"));
  for (const bad of ["", "cbr_", "cbr_short", `cb_partner_${"a".repeat(42)}`, `cbr_brand_${"a".repeat(44)}`, `xx_${"a".repeat(43)}`, `cbr_${"a".repeat(42)}!`]) assert.equal(looksLikeKey(bad), false, bad);
  assert.equal(shownPrefix(member).length, 12);
  assert.ok(shownPrefix(partner).startsWith("cb_partner_") && shownPrefix(partner).length === 19);
  assert.ok(shownPrefix(brand).startsWith("cbr_brand_") && shownPrefix(brand).length === 18);
});

// ---- key lookups

type Keys = Map<string, KeyRow>;
function lookupFor(keys: Keys, members: Map<string, MemberRow>, brands: Map<string, PartnerBrand>): KeyLookup {
  return {
    key: async (hash) => keys.get(hash) ?? null,
    member: async (ws, user) => members.get(`${ws}:${user}`) ?? null,
    brand: async (id) => {
      const b = brands.get(id);
      return b ? { id: b.id, workspace_id: b.workspace_id, external_id: b.external_id } : null;
    },
  };
}
const ws = { name: "Morning Telos", timezone: "UTC" };
const people = () =>
  new Map<string, MemberRow>([
    [`${WS}:${OWNER}`, { role: "owner", brand_ids: null, workspace: ws }],
    [`${WS2}:${OWNER2}`, { role: "owner", brand_ids: null, workspace: ws }],
  ]);
const brandRow = (id: string, workspace_id = WS, external_id: string | null = `mt-${id.slice(0, 4)}`): PartnerBrand => ({ id, workspace_id, name: `Brand ${id.slice(0, 1)}`, website: null, external_id });

function setup() {
  const keys: Keys = new Map();
  const members = people();
  const brands = new Map([BRAND_A, BRAND_B].map((id) => [id, brandRow(id)]));
  const add = (kind: KeyRow["kind"], over: Partial<KeyRow> = {}) => {
    const key = keyOf(kind === "partner" ? PARTNER_PREFIX : kind === "brand" ? BRAND_PREFIX : KEY_PREFIX);
    keys.set(sha256(key), { id: `k${keys.size}`, kind, workspace_id: WS, user_id: OWNER, brand_id: kind === "brand" ? BRAND_A : null, ...over });
    return key;
  };
  return { keys, members, brands, add, look: lookupFor(keys, members, brands) };
}

const ctxOf = (look: KeyLookup, key: string) => keyContext(look, key, sha256(key));
const partnerOf = (look: KeyLookup, key: string | null) => partnerContext(look, key, key ? sha256(key) : "");

test("a brand key is an editor of its one brand; a member key keeps its person's role and brands", async () => {
  const s = setup();
  const brand = await ctxOf(s.look, s.add("brand"));
  assert.equal(brand.role, "editor");
  assert.deepEqual(brand.brandIds, [BRAND_A]);
  assert.equal(brand.keyKind, "brand");
  assert.equal(brand.userId, OWNER);
  const owner = await ctxOf(s.look, s.add("member"));
  assert.equal(owner.role, "owner");
  assert.equal(owner.brandIds, null);
  assert.equal(owner.keyKind, "member");
  s.members.set(`${WS}:${OWNER2}`, { role: "editor", brand_ids: [BRAND_B], workspace: ws });
  const editor = await ctxOf(s.look, s.add("member", { user_id: OWNER2 }));
  assert.deepEqual(editor.brandIds, [BRAND_B]);
});

test("a brand key stops working when its brand is gone or its maker stops being an owner or admin", async () => {
  const s = setup();
  const key = s.add("brand");
  s.members.set(`${WS}:${OWNER}`, { role: "editor", brand_ids: null, workspace: ws });
  await rejects(ctxOf(s.look, key), 401, /no longer an owner or admin/);
  s.members.delete(`${WS}:${OWNER}`);
  await rejects(ctxOf(s.look, key), 401, /left the workspace/);
  s.members.set(`${WS}:${OWNER}`, { role: "admin", brand_ids: null, workspace: ws });
  assert.deepEqual((await ctxOf(s.look, key)).brandIds, [BRAND_A]);
  // A brand moved to (or named from) another workspace never counts.
  s.brands.set(BRAND_A, brandRow(BRAND_A, WS2));
  await rejects(ctxOf(s.look, key), 401, /brand was deleted/);
  s.brands.delete(BRAND_A);
  await rejects(ctxOf(s.look, key), 401, /brand was deleted/);
});

test("partner keys don't work on the REST API or MCP; unknown keys and stored kinds that don't match are refused", async () => {
  const s = setup();
  await rejects(ctxOf(s.look, s.add("partner")), 403, /\/api\/partner/);
  await rejects(ctxOf(s.look, keyOf(KEY_PREFIX)), 401, /deleted or never existed/);
  await rejects(ctxOf(s.look, "not a key"), 401);
  // A member-shaped key whose row says partner (a mix-up, or a forged row) is refused.
  const odd = keyOf(KEY_PREFIX);
  s.keys.set(sha256(odd), { id: "odd", kind: "partner", workspace_id: WS, user_id: OWNER, brand_id: null });
  await rejects(ctxOf(s.look, odd), 401);
  const broken: KeyLookup = { ...s.look, key: async () => Promise.reject(new Error("db down")) };
  await rejects(ctxOf(broken, keyOf(KEY_PREFIX)), 503);
});

test("partner routes refuse no key, a member key, a brand key and a partner key whose maker left", async () => {
  const s = setup();
  await rejects(partnerOf(s.look, null), 401);
  await rejects(partnerOf(s.look, s.add("member")), 401, /isn't a partner key/);
  await rejects(partnerOf(s.look, s.add("brand")), 401, /isn't a partner key/);
  const p = s.add("partner");
  assert.deepEqual(await partnerOf(s.look, p), { keyId: s.keys.get(sha256(p))!.id, workspaceId: WS, userId: OWNER });
  // A partner-shaped key stored as another kind.
  const forged = keyOf(PARTNER_PREFIX);
  s.keys.set(sha256(forged), { id: "f", kind: "brand", workspace_id: WS, user_id: OWNER, brand_id: BRAND_A });
  await rejects(partnerOf(s.look, forged), 401);
  s.members.set(`${WS}:${OWNER}`, { role: "editor", brand_ids: null, workspace: ws });
  await rejects(partnerOf(s.look, p), 401, /no longer an owner or admin/);
});

// ---- the partner store

class MemoryStore implements PartnerStore {
  brands = new Map<string, PartnerBrand>();
  keys = new Map<string, { brandId: string; workspaceId: string }>();
  links: (ConnectLink & { token_hash: string })[] = [];
  removed: string[] = [];
  race = false;
  n = 0;
  async brand(id: string) {
    return this.brands.get(id) ?? null;
  }
  async brandByExternal(workspaceId: string, externalId: string) {
    return [...this.brands.values()].find((b) => b.workspace_id === workspaceId && b.external_id === externalId) ?? null;
  }
  async addBrand(p: { workspaceId: string }, b: { name: string; website: string | null; externalId: string }) {
    const made: PartnerBrand = { id: `e${String(++this.n).padStart(7, "0")}-0000-4000-8000-000000000000`, workspace_id: p.workspaceId, name: b.name, website: b.website, external_id: b.externalId };
    if (this.race) {
      // Another request made it between the look and the insert.
      this.race = false;
      this.brands.set(made.id, made);
      throw new BrandTaken();
    }
    if ([...this.brands.values()].some((x) => x.workspace_id === p.workspaceId && x.external_id === b.externalId)) throw new BrandTaken();
    this.brands.set(made.id, made);
    return made;
  }
  async removeBrand(_p: unknown, b: PartnerBrand) {
    this.removed.push(b.id);
    this.brands.delete(b.id);
  }
  chans = new Map<string, PartnerChannel[]>([[BRAND_A, [{ id: "ch1", network: "instagram", name: "acme", status: "active" }]]]);
  disconnected: { brand: string; channel: string; workspace: string }[] = [];
  async channels(_ws: string, brandId: string) {
    return this.chans.get(brandId) ?? [];
  }
  async removeChannel(p: { workspaceId: string }, b: PartnerBrand, c: PartnerChannel) {
    const left = (this.chans.get(b.id) ?? []).filter((x) => x.id !== c.id);
    if (left.length === (this.chans.get(b.id) ?? []).length) return false;
    this.chans.set(b.id, left);
    this.disconnected.push({ brand: b.id, channel: c.id, workspace: p.workspaceId });
    return true;
  }
  async makeKey(p: { workspaceId: string }, b: PartnerBrand) {
    const key = keyOf(BRAND_PREFIX);
    this.keys.set(sha256(key), { brandId: b.id, workspaceId: p.workspaceId });
    return { key, prefix: shownPrefix(key) };
  }
  async revokeKeys(_ws: string, brandId: string) {
    for (const [h, k] of this.keys) if (k.brandId === brandId) this.keys.delete(h);
  }
  async addLink(row: { workspace_id: string; brand_id: string; created_by: string; token_hash: string; expires_at: string }) {
    this.links.push({ id: `l${this.links.length}`, claimed_at: null, browser_hash: null, ended_at: null, ...row });
  }
  async usage() {
    return { posts_published: 7, posts_created: 9, ai_files: 2, credits: 40 };
  }
}

const P = { keyId: "kp", workspaceId: WS, userId: OWNER };
const P2 = { keyId: "kp2", workspaceId: WS2, userId: OWNER2 };

test("making a brand is safe to retry: the same external_id answers 200 with the same brand, even in a race", async () => {
  const store = new MemoryStore();
  const input = partnerBrandInput({ name: "Acme Bakery", domain: "https://Acme.com/about", external_id: "ws_123" });
  const first = await createPartnerBrand(store, P, input);
  assert.equal(first.status, 201);
  assert.deepEqual(first.body, { id: first.body.id, name: "Acme Bakery", domain: "acme.com", external_id: "ws_123" });
  const again = await createPartnerBrand(store, P, { ...input, name: "Another name" });
  assert.equal(again.status, 200);
  assert.equal(again.body.id, first.body.id);
  assert.equal(store.brands.size, 1);
  // Another workspace with the same external_id gets its own brand.
  assert.equal((await createPartnerBrand(store, P2, input)).status, 201);
  // Two at once: the insert loses, and the answer is the brand the other one made.
  store.race = true;
  const raced = await createPartnerBrand(store, P, { ...input, externalId: "ws_456" });
  assert.equal(raced.status, 200);
  assert.equal(raced.body.external_id, "ws_456");
});

test("brand input: a name, an external_id and an optional domain, refused with 422", () => {
  const bad = (body: unknown, re: RegExp) => assert.throws(() => partnerBrandInput(body), (e: unknown) => e instanceof ApiError && e.status === 422 && re.test(e.message));
  bad({ domain: "a.com", external_id: "x" }, /name is required/);
  bad({ name: "x".repeat(61), external_id: "x" }, /up to 60/);
  bad({ name: "A" }, /external_id is required/);
  bad({ name: "A", external_id: "has space" }, /external_id/);
  bad({ name: "A", external_id: "x", domain: "not a domain" }, /domain/);
  bad({ name: "A", external_id: "x", domain: "localhost" }, /domain/);
  bad({ name: "A", external_id: "x", color: "red" }, /Unknown field "color"/);
  bad("nope", /JSON object/);
  assert.equal(partnerBrandInput({ name: " A ", external_id: "x", domain: null }).website, null);
  assert.equal(partnerBrandInput({ name: "A", external_id: "x", domain: "shop.acme.co.uk" }).website, "https://shop.acme.co.uk");
});

test("a partner key touches only brands it made in its own workspace", async () => {
  const store = new MemoryStore();
  const mine = (await createPartnerBrand(store, P, { name: "Mine", website: null, externalId: "m1" })).body.id;
  const theirs = (await createPartnerBrand(store, P2, { name: "Theirs", website: null, externalId: "t1" })).body.id;
  // A brand made in the app (no external_id) in the partner's own workspace.
  store.brands.set(BRAND_B, brandRow(BRAND_B, WS, null));
  for (const call of [getPartnerBrand, deletePartnerBrand, makeBrandKey, revokeBrandKeysOf] as const) {
    await rejects(call(store, P, theirs), 403);
    await rejects(call(store, P, BRAND_B), 403);
    await rejects(call(store, P, "f0000000-0000-4000-8000-00000000000f"), 404);
    await rejects(call(store, P, "../etc"), 404);
  }
  await rejects(makeConnectLink(store, P, theirs, "https://app.capybaroar.com"), 403);
  await rejects(brandUsage(store, P, theirs, monthRange("2026-11")), 403);
  assert.equal(store.brands.has(theirs), true);
  assert.ok((await getPartnerBrand(store, P, mine)).id === mine);
});

test("a brand shows its channels and a status", async () => {
  const store = new MemoryStore();
  store.brands.set(BRAND_A, brandRow(BRAND_A));
  assert.deepEqual(await getPartnerBrand(store, P, BRAND_A), {
    id: BRAND_A,
    name: "Brand a",
    domain: null,
    external_id: "mt-a000",
    status: "connected",
    channels: [{ id: "ch1", network: "instagram", name: "acme", status: "active" }],
  });
  assert.equal(brandStatus([]), "no_channels");
  assert.equal(brandStatus([{ id: "1", network: "x", name: "a", status: "active" }, { id: "2", network: "x", name: "b", status: "reconnect" }]), "needs_reconnect");
});

test("deleting a brand revokes its keys first; revoking keys leaves other brands' keys", async () => {
  const store = new MemoryStore();
  store.brands.set(BRAND_A, brandRow(BRAND_A));
  store.brands.set(BRAND_B, brandRow(BRAND_B));
  const a1 = await makeBrandKey(store, P, BRAND_A);
  await makeBrandKey(store, P, BRAND_A);
  const b1 = await makeBrandKey(store, P, BRAND_B);
  assert.ok(a1.key.startsWith("cbr_brand_") && a1.prefix === a1.key.slice(0, 18));
  assert.equal(store.keys.size, 3);
  await revokeBrandKeysOf(store, P, BRAND_B);
  assert.equal(store.keys.has(sha256(b1.key)), false);
  assert.equal(store.keys.size, 2);
  await deletePartnerBrand(store, P, BRAND_A);
  assert.equal(store.keys.size, 0);
  assert.deepEqual(store.removed, [BRAND_A]);
  await rejects(getPartnerBrand(store, P, BRAND_A), 404);
  // A revoked brand key no longer signs in.
  const s = setup();
  await rejects(ctxOf(s.look, a1.key), 401);
});

test("usage counts the month's posts that went out as tasks", async () => {
  const store = new MemoryStore();
  store.brands.set(BRAND_A, brandRow(BRAND_A));
  const u = await brandUsage(store, P, BRAND_A, monthRange("2026-02"));
  assert.deepEqual(u, { brand_id: BRAND_A, external_id: "mt-a000", month: "2026-02", tasks: 7, posts_published: 7, posts_created: 9, ai_files: 2, credits: 40 });
  const m = monthRange("2026-12");
  assert.equal(m.from.toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(m.to.toISOString(), "2027-01-01T00:00:00.000Z");
  assert.equal(monthRange(undefined, new Date("2026-11-17T10:00:00Z")).month, "2026-11");
  for (const bad of ["2026-13", "2026-1", "26-01", "november"]) assert.throws(() => monthRange(bad), (e: unknown) => e instanceof ApiError && e.status === 422);
});

// ---- disconnecting a channel

const CH_1 = "c1000000-0000-4000-8000-000000000001";
const CH_2 = "c2000000-0000-4000-8000-000000000002";
const CH_B = "cb000000-0000-4000-8000-00000000000b";
function withChannels() {
  const store = new MemoryStore();
  store.brands.set(BRAND_A, brandRow(BRAND_A));
  store.brands.set(BRAND_B, brandRow(BRAND_B));
  store.chans = new Map<string, PartnerChannel[]>([
    [BRAND_A, [{ id: CH_1, network: "instagram", name: "acme", status: "active" }, { id: CH_2, network: "linkedin", name: "Acme", status: "reconnect" }]],
    [BRAND_B, [{ id: CH_B, network: "x", name: "acme_b", status: "active" }]],
  ]);
  return store;
}

test("a partner disconnects one channel of its brand; the brand keeps the rest", async () => {
  const store = withChannels();
  await disconnectPartnerChannel(store, P, BRAND_A, CH_1.toUpperCase());
  assert.deepEqual(store.disconnected, [{ brand: BRAND_A, channel: CH_1, workspace: WS }]);
  const b = await getPartnerBrand(store, P, BRAND_A);
  assert.deepEqual(b.channels.map((c) => c.id), [CH_2]);
  assert.equal(b.status, "needs_reconnect");
  await disconnectPartnerChannel(store, P, BRAND_A, CH_2);
  assert.equal((await getPartnerBrand(store, P, BRAND_A)).status, "no_channels");
  assert.equal(store.chans.get(BRAND_B)!.length, 1, "another brand's channel stays");
});

test("disconnecting again, or a channel that was never the brand's, is 404 and removes nothing", async () => {
  const store = withChannels();
  await disconnectPartnerChannel(store, P, BRAND_A, CH_1);
  const gone = (p: Promise<unknown>) => assert.rejects(p, (e: unknown) => e instanceof ApiError && e.status === 404 && e.code === "not_found" && e.message === "Channel not found");
  await gone(disconnectPartnerChannel(store, P, BRAND_A, CH_1));
  await gone(disconnectPartnerChannel(store, P, BRAND_A, "f0000000-0000-4000-8000-00000000000f"));
  await gone(disconnectPartnerChannel(store, P, BRAND_A, "../ch1"));
  await gone(disconnectPartnerChannel(store, P, BRAND_A, "ch1"));
  // Another brand's channel, named under this brand.
  await gone(disconnectPartnerChannel(store, P, BRAND_A, CH_B));
  // Two at once: the store finds it already gone.
  const raced: PartnerStore = Object.assign(Object.create(store), { removeChannel: async () => false });
  await gone(disconnectPartnerChannel(raced, P, BRAND_A, CH_2));
  assert.deepEqual(store.disconnected.map((d) => d.channel), [CH_1]);
  assert.equal(store.chans.get(BRAND_B)!.length, 1);
});

test("a partner can't disconnect a channel of another workspace's brand or of a brand made in the app", async () => {
  const store = withChannels();
  const theirs = (await createPartnerBrand(store, P2, { name: "Theirs", website: null, externalId: "t1" })).body.id;
  store.chans.set(theirs, [{ id: CH_B, network: "x", name: "theirs", status: "active" }]);
  await rejects(disconnectPartnerChannel(store, P, theirs, CH_B), 403);
  store.brands.set(BRAND_B, brandRow(BRAND_B, WS, null));
  await rejects(disconnectPartnerChannel(store, P, BRAND_B, CH_B), 403);
  await rejects(disconnectPartnerChannel(store, P, "f0000000-0000-4000-8000-00000000000f", CH_1), 404, /Brand not found/);
  assert.deepEqual(store.disconnected, []);
  assert.equal(store.chans.get(theirs)!.length, 1);
});

test("a disconnect sends channel.lost with the brand, its external_id and the channel", () => {
  const data = partnerChannelData({ id: CH_1, brand_id: BRAND_A, network: "instagram", name: "acme" }, "ws_1");
  const body = JSON.parse(partnerBody("channel.lost", data, new Date("2026-11-21T12:00:00Z")));
  assert.deepEqual(body, { type: "channel.lost", timestamp: "2026-11-21T12:00:00.000Z", data: { brand_id: BRAND_A, external_id: "ws_1", channel: { id: CH_1, network: "instagram", name: "acme" } } });
  const read = (f: string) => readFileSync(join(import.meta.dirname, "..", f), "utf8");
  // The partner store, the Channels page and the event all run the one disconnect.
  const del = read("src/lib/workspaceDelete.ts");
  const fn = del.slice(del.indexOf("export async function disconnectChannel"));
  const at = (re: RegExp) => fn.search(re);
  assert.ok(at(/await revokeChannel\(ch\.id\)/) >= 0, "the network's access ends");
  assert.ok(at(/\.from\("channels"\)\.delete\(\)/) > at(/await revokeChannel/), "then the row goes");
  assert.ok(at(/if \(!data\?\.length\) return false;/) > at(/\.delete\(\)/), "nothing is sent when it was already gone");
  assert.ok(at(/await partnerChannelEvent\("channel\.lost", \[/) > at(/return false;/), "channel.lost goes out after the delete");
  assert.match(read("src/lib/partnerHooks.ts"), /emitPartner\(c\.workspace_id, type, partnerChannelData\(c, external\)\)/);
  assert.match(read("src/lib/partner.ts"), /async removeChannel\(p, b, c\) \{[\s\S]*?disconnectChannel\(p\.workspaceId,/);
  assert.match(read("src/app/(app)/channels/actions.ts"), /await disconnectChannel\(ctx\.workspaceId,/);
  const route = read("src/app/api/partner/brands/[id]/channels/[channelId]/route.ts");
  assert.match(route, /export const DELETE = partnerRoute<P>\(/, "the partner key and its rate limit");
  assert.match(route, /disconnectPartnerChannel\(partnerStore, partner, params\.id, params\.channelId\)/);
});

// ---- connect links

test("a connect link holds only its token's hash and works for 24 hours", async () => {
  const store = new MemoryStore();
  store.brands.set(BRAND_A, brandRow(BRAND_A));
  const now = Date.UTC(2026, 10, 17, 12);
  const r = await makeConnectLink(store, P, BRAND_A, "https://app.capybaroar.com/", now);
  const token = /^https:\/\/app\.capybaroar\.com\/connect\/([A-Za-z0-9_-]{43})$/.exec(r.url)?.[1];
  assert.ok(token, r.url);
  assert.equal(r.expires_at, new Date(now + LINK_TTL_MS).toISOString());
  const [link] = store.links;
  assert.equal(link.token_hash, sha256(token));
  assert.ok(!JSON.stringify(store.links).includes(token), "the token itself is never stored");
  assert.equal(link.brand_id, BRAND_A);
  assert.equal(linkProblem(link, null, now), null);
  assert.equal(linkProblem(link, null, now + LINK_TTL_MS - 1), null);
  assert.equal(linkProblem(link, null, now + LINK_TTL_MS), "expired");
  assert.equal(linkProblem(null, null, now), "gone");
});

test("a connect link is one browser's once claimed, and ends when it's closed", () => {
  const now = Date.UTC(2026, 10, 17, 12);
  const base: ConnectLink = { id: "l", workspace_id: WS, brand_id: BRAND_A, created_by: OWNER, expires_at: new Date(now + 3600000).toISOString(), claimed_at: null, browser_hash: null, ended_at: null };
  const secret = randomBytes(32).toString("base64url");
  const claimed = { ...base, claimed_at: new Date(now).toISOString(), browser_hash: sha256(secret) };
  assert.equal(linkProblem(claimed, sha256(secret), now), null);
  // Anyone else who gets the link later: another browser, or no cookie at all.
  assert.equal(linkProblem(claimed, sha256(randomBytes(32).toString("base64url")), now), "claimed");
  assert.equal(linkProblem(claimed, null, now), "claimed");
  assert.equal(linkProblem({ ...claimed, ended_at: new Date(now).toISOString() }, sha256(secret), now), "ended");
  assert.equal(linkProblem(claimed, sha256(secret), now + 3600000), "expired");
  // The cookie: "<link id>.<secret>", anything else is ignored.
  const id = "e0000001-0000-4000-8000-000000000000";
  assert.deepEqual(readConnectCookie(`${id}.${secret}`), { linkId: id, secret });
  for (const bad of [undefined, "", secret, `${id}`, `${id}.short`, `nope.${secret}`, `${id}.${secret}x`]) assert.equal(readConnectCookie(bad), null, String(bad));
});

test("a sign-in from a connect link finishes only in the browser that started it, within 15 minutes", () => {
  const at = new Date("2026-11-17T12:00:00Z");
  assert.equal(linkCallbackProblem({ state: "s1", cookieState: "s1", createdAt: at, now: at.getTime() + 60000 }), null);
  assert.match(linkCallbackProblem({ state: "s1", cookieState: null, createdAt: at, now: at.getTime() })!, /this browser/);
  assert.match(linkCallbackProblem({ state: "s1", cookieState: "s2", createdAt: at, now: at.getTime() })!, /this browser/);
  assert.match(linkCallbackProblem({ state: "s1", cookieState: "s1", createdAt: at, now: at.getTime() + 16 * 60000 })!, /expired/);
});

// ---- the partner webhook

/** Standard Webhooks verification written from the spec, independent of hookRules. */
function verify(secret: string, headers: Record<string, string>, body: string) {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const want = createHmac("sha256", key).update(`${headers["webhook-id"]}.${headers["webhook-timestamp"]}.${body}`).digest("base64");
  return headers["webhook-signature"].split(" ").some((p) => p === `v1,${want}`);
}

test("partner webhooks are signed the Standard Webhooks way", () => {
  // The example in the Standard Webhooks spec.
  assert.equal(signStandard("whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw", "msg_p5jXN8AQM9LWM0D4loKWxJek", 1614265330, '{"test": 2432232314}'), "v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=");
  const secret = newStandardSecret();
  assert.match(secret, STANDARD_SECRET);
  assert.equal(standardKey(secret).length, 32);
  const body = partnerBody("channel.connected", { brand_id: BRAND_A, external_id: "ws_1", channel: { id: "c1", network: "instagram", name: "acme" } }, new Date("2026-11-17T12:00:00Z"));
  assert.deepEqual(JSON.parse(body), { type: "channel.connected", timestamp: "2026-11-17T12:00:00.000Z", data: { brand_id: BRAND_A, external_id: "ws_1", channel: { id: "c1", network: "instagram", name: "acme" } } });
  const h = standardHeaders(secret, "msg_abc", body, 1763380800);
  assert.deepEqual(Object.keys(h).sort(), ["webhook-id", "webhook-signature", "webhook-timestamp"]);
  assert.equal(h["webhook-id"], "msg_abc");
  assert.equal(h["webhook-timestamp"], "1763380800");
  assert.ok(verify(secret, h, body));
  assert.ok(!verify(secret, h, body.replace("acme", "acmf")), "a changed body fails");
  assert.ok(!verify(newStandardSecret(), h, body), "another secret fails");
  assert.ok(!verify(secret, { ...h, "webhook-timestamp": "1763380801" }, body), "another time fails");
  assert.deepEqual([...PARTNER_EVENTS], ["channel.connected", "channel.lost"]);
});

test("the partner webhook takes a public https address and an optional whsec_ secret", () => {
  const ok = (s: string) => {
    try {
      standardKey(s);
      return true;
    } catch {
      return false;
    }
  };
  const bad = (body: unknown, re: RegExp) => assert.throws(() => partnerHookInput(body, ok), (e: unknown) => e instanceof ApiError && e.status === 422 && re.test(e.message));
  assert.equal(partnerHookInput({ url: "https://mt.example.com/hooks/capybaroar" }, ok).secret, null);
  const s = newStandardSecret();
  assert.equal(partnerHookInput({ url: "https://mt.example.com/h", secret: s }, ok).secret, s);
  bad({ url: "http://mt.example.com/h" }, /https/);
  bad({ url: "https://localhost/h" }, /public internet/);
  bad({ url: "https://10.0.0.1/h" }, /public internet/);
  bad({ url: "https://mt.example.com/h", secret: "hunter2" }, /whsec_/);
  bad({ url: "https://mt.example.com/h", secret: `whsec_${Buffer.alloc(8).toString("base64")}` }, /whsec_/);
  bad({ url: "https://mt.example.com/h", events: [] }, /Unknown field/);
});

// ---- a brand key across every action and tool

const chA = "c0000000-0000-4000-8000-00000000000a";
const chB = "c0000000-0000-4000-8000-00000000000b";
const pA = "d0000000-0000-4000-8000-00000000000a";
const pB = "d0000000-0000-4000-8000-00000000000b";
const cA = "e0000000-0000-4000-8000-00000000000a";
const cB = "e0000000-0000-4000-8000-00000000000b";
const gA = "f0000000-0000-4000-8000-00000000000a";
const gB = "f0000000-0000-4000-8000-00000000000b";
const mA = "10000000-0000-4000-8000-00000000000a";
const mB = "10000000-0000-4000-8000-00000000000b";
const mW = "10000000-0000-4000-8000-00000000000c";
const genA = "20000000-0000-4000-8000-00000000000a";
const genB = "20000000-0000-4000-8000-00000000000b";
const hook = "30000000-0000-4000-8000-000000000001";
const B_IDS = [BRAND_B, chB, pB, cB, gB, mB, mW, genB];

const channel = (id: string, brand: string): ApiChannel => ({ id, network: "x", network_name: "X", name: id, username: null, status: "active", brand_id: brand, character_limit: 280, needs_media: false, thread: true, settings: [] });
const post = (id: string, brand: string, channels: string[]): ApiPost => ({ id, status: "draft", text: "hi", publish_at: null, brand_id: brand, media_ids: [], thread: [], campaign_id: null, channels: channels.map((c) => ({ channel_id: c, status: "pending", text: null, settings: {}, url: null, error: null, deleted_at: null, thread_urls: [] })) });
const media = (id: string, brand: string | null): ApiMedia => ({ id, name: id, mime: "image/png", size: 1, alt: null, created_at: "", preview_url: null, brand_id: brand });
const gen = (id: string, brand: string) => ({ id, kind: "image" as const, brand_id: brand, model: "m", prompt: "p", status: "done" as const, error: null, media: null, credits: 1, reason: null, created_at: "" });
const brandOf = new Map([[chA, BRAND_A], [chB, BRAND_B], [pA, BRAND_A], [pB, BRAND_B], [mA, BRAND_A], [mB, BRAND_B]]);

/** Actions that ignore every filter and answer with both brands, as a bug would. Writes are logged. */
function leakyOps(writes: { op: string; ids: string[] }[]): Ops {
  const log = (op: string, ...ids: (string | null | undefined)[]) => writes.push({ op, ids: ids.filter((x): x is string => !!x) });
  return {
    brands: async () => [BRAND_A, BRAND_B].map((id) => ({ id, name: id, needs_approval: false })),
    channels: async () => [channel(chA, BRAND_A), channel(chB, BRAND_B)],
    channelGroups: async () => [
      { id: gA, name: "A", brand_id: BRAND_A, channel_ids: [chA, chB] },
      { id: gB, name: "B", brand_id: BRAND_B, channel_ids: [chB] },
    ],
    campaigns: async () => [cA, cB].map((id, i) => ({ id, name: id, color: "gray", brand_id: i ? BRAND_B : BRAND_A, scheduled: 0, published: 0, failed: 0, drafts: 0, engagements: 0 })),
    posts: async () => [post(pA, BRAND_A, [chA]), post(pB, BRAND_B, [chB])],
    post: async (id) => post(id, brandOf.get(id) ?? BRAND_B, [id === pA ? chA : chB]),
    create: async (f) => {
      log("create", ...(f.channelIds ?? []), ...(f.mediaIds ?? []), f.campaignId);
      return post(pA, brandOf.get(f.channelIds![0]) ?? BRAND_B, f.channelIds!);
    },
    update: async (id, f) => {
      log("update", id, ...(f.channelIds ?? []), ...(f.mediaIds ?? []), f.campaignId);
      return post(id, brandOf.get(id) ?? BRAND_B, f.channelIds ?? [chA]);
    },
    remove: async (id) => void log("remove", id),
    unpublish: async (id) => {
      log("unpublish", id);
      return { deleted: true, channels: [] };
    },
    media: async () => [media(mA, BRAND_A), media(mB, BRAND_B), media(mW, null)],
    nextSlot: async () => "2030-01-01T09:00:00.000Z",
    analytics: async (days) => ({
      days,
      since: "",
      current: { posts: 2, reach: 0, engagements: 0, engagement_rate: null, posts_with_results: 0 },
      previous: { posts: 0, reach: 0, engagements: 0, engagement_rate: null, posts_with_results: 0 },
      best_times: [],
      formats: [],
      top_posts: [chA, chB].map((c, i) => ({ id: i ? pB : pA, channel_id: c, published_at: "", text: "", url: null, engagements: 1, engagement_rate: null })),
    }),
    uploadFromLink: async () => {
      log("upload");
      return media(mB, BRAND_B);
    },
    generate: async (r) => {
      log("generate", r.sourceMediaId);
      return { ...gen(genA, BRAND_A), credits_charged: 1, credits_left: 1 };
    },
    generation: async (id) => gen(id, id === genA ? BRAND_A : BRAND_B),
    credits: async () => ({ plan: "agency", plan_credits: 1, plan_credits_left: 1, bought_credits_left: 0, credits_left: 1, refills_at: null }),
    webhooks: async () => [{ id: hook, url: "https://x.example.com", events: [], enabled: true, failures: 0, last_status: null, last_error: null, last_delivered_at: null, created_at: "" }],
    createWebhook: async () => {
      log("createWebhook");
      return { webhook: (await leakyOps(writes).webhooks())[0], secret: "s" };
    },
    setWebhook: async () => {
      log("setWebhook");
      return (await leakyOps(writes).webhooks())[0];
    },
    deleteWebhook: async () => void log("deleteWebhook"),
    testWebhook: async () => void log("testWebhook"),
  };
}

const deps = { mediaBrands: async (ids: string[]) => new Map(ids.filter((id) => brandOf.has(id) || id === mW).map((id) => [id, id === mW ? null : brandOf.get(id)!])) };
const AT = "2030-01-02T09:00:00-05:00";

/** Every MCP tool, called the way that would reach brand B if anything leaked. */
const ATTACKS: Record<string, Record<string, unknown>[]> = {
  list_brands: [{}],
  list_channels: [{}, { brand_id: BRAND_B }],
  list_channel_groups: [{}],
  list_campaigns: [{}],
  list_posts: [{}, { brand_id: BRAND_B }],
  get_post: [{ id: pB }],
  create_posts: [
    { posts: [{ channel_ids: [chB], text: "hi", publish_at: AT }] },
    { posts: [{ channel_ids: [chA, chB], text: "hi", publish_at: AT }] },
    { posts: [{ channel_ids: [chA], text: "hi", publish_at: AT, media_ids: [mB] }] },
    { posts: [{ channel_ids: [chA], text: "hi", publish_at: AT, media_ids: [mW] }] },
    { posts: [{ channel_ids: [chA], text: "hi", publish_at: AT, thread: [{ text: "2", media_ids: [mB] }] }] },
    { posts: [{ channel_ids: [chA], text: "hi", publish_at: AT, settings: { [chA]: { cover: mB } } }] },
    { posts: [{ channel_ids: [chA], text: "hi", publish_at: AT, campaign_id: cB }] },
  ],
  update_post: [{ id: pB, text: "x" }, { id: pA, channel_ids: [chB] }, { id: pA, media_ids: [mB] }, { id: pA, campaign_id: cB }],
  delete_post: [{ id: pB }, { id: pB, everywhere: true }],
  list_media: [{}],
  upload_media: [{ url: "https://files.example.com/a.png" }],
  generate_media: [{ kind: "image", prompt: "a cake", source_media_id: mB }],
  get_generation: [{ id: genB }],
  get_credits: [{}],
  next_queue_slot: [{}],
  get_analytics: [{}, { channel_id: chB }],
  list_webhooks: [{}],
  create_webhook: [{ url: "https://hooks.example.com/x", events: ["post.published"] }],
  set_webhook: [{ id: hook, enabled: false }],
  test_webhook: [{ id: hook }],
  delete_webhook: [{ id: hook }],
};

test("a brand key can't see or touch another brand, its channels, posts, files or the workspace's webhooks through any tool", async () => {
  assert.deepEqual(Object.keys(ATTACKS).sort(), TOOLS.map((t) => t.name).sort(), "every MCP tool is attacked");
  const writes: { op: string; ids: string[] }[] = [];
  const ops = brandOnly(leakyOps(writes), BRAND_A, deps);
  for (const [tool, calls] of Object.entries(ATTACKS)) {
    for (const args of calls) {
      let out: unknown;
      try {
        out = await callTool(ops, tool, args);
      } catch (e) {
        out = { error: e instanceof Error ? e.message : String(e) };
      }
      const text = JSON.stringify(out);
      const failed = typeof out === "object" && out !== null && "error" in out;
      if (!failed && tool !== "create_posts") for (const b of B_IDS) assert.ok(!text.includes(b), `${tool} ${JSON.stringify(args)} showed ${b}: ${text}`);
      // A refused create still answers per post, never with another brand's post.
      if (tool === "create_posts") for (const r of (out as { results?: { ok: boolean }[] }).results ?? []) assert.equal(r.ok, false, `${tool} ${JSON.stringify(args)}`);
    }
  }
  for (const w of writes) for (const b of B_IDS) assert.ok(!w.ids.includes(b), `${w.op} reached ${b}`);
  assert.ok(!writes.some((w) => /Webhook/.test(w.op)), "webhooks are never reached");
  // The upload landed outside the brand (the fake puts it in B): refused, not shown.
  assert.ok(writes.some((w) => w.op === "upload"));
});

test("a brand key still works on its own brand", async () => {
  const writes: { op: string; ids: string[] }[] = [];
  const ops = brandOnly(leakyOps(writes), BRAND_A, deps);
  assert.deepEqual((await ops.brands()).map((b) => b.id), [BRAND_A]);
  assert.deepEqual((await ops.channels(null)).map((c) => c.id), [chA]);
  assert.deepEqual((await ops.channels(BRAND_A)).map((c) => c.id), [chA]);
  assert.deepEqual(await ops.channelGroups(), [{ id: gA, name: "A", brand_id: BRAND_A, channel_ids: [chA] }]);
  assert.deepEqual((await ops.campaigns()).map((c) => c.id), [cA]);
  assert.deepEqual((await ops.posts(new Date(), new Date(), null)).map((p) => p.id), [pA]);
  assert.deepEqual((await ops.media()).map((m) => m.id), [mA]);
  assert.equal((await ops.post(pA)).id, pA);
  const made = await ops.create({ channelIds: [chA], text: "hi", mediaIds: [mA], campaignId: cA, mode: "draft", publishAt: "2030-01-02T14:00:00.000Z" });
  assert.equal(made.brand_id, BRAND_A);
  await ops.update(pA, { text: "new", settings: { [chA]: { cover: mA } } });
  await ops.remove(pA);
  await ops.unpublish(pA, null);
  assert.equal((await ops.generation(genA)).id, genA);
  assert.equal((await ops.generate({ kind: "image", model: "m", prompt: "p", aspect: "1:1", seconds: 5, sourceMediaId: mA, credits: 1, why: "" })).id, genA);
  const a = await ops.analytics(30, null);
  assert.deepEqual(a.top_posts.map((p) => p.channel_id), [chA]);
  assert.equal((await ops.analytics(7, chA)).days, 7);
  assert.deepEqual(writes.map((w) => w.op), ["create", "update", "remove", "unpublish", "generate"]);
});

test("the brand guard covers every action", () => {
  const ops = brandOnly(leakyOps([]), BRAND_A, deps);
  assert.deepEqual(Object.keys(ops).sort(), Object.keys(leakyOps([])).sort());
});
