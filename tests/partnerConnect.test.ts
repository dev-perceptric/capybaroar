// White-label connect: a partner shows its own connect page and sends its customer straight to the network's sign-in.
// All pure: an in-memory partner store and connect store, a fake network exchange and fake saves. They prove: the
// networks list names only what's set up, with a kind; a start answers the network's own address and keeps only the
// state's hash, for 30 minutes, once; it refuses an unknown network, another partner's brand and a return_url off
// the allowed hosts; the callback always goes back to the partner's return_url with cb_status (connected, error
// with a short reason, or pick), never with a token or the network's own text, and leaves every other sign-in (the
// app's, connect links') alone; a pick lists names and pictures only, connects the chosen ones with the same checks,
// and works once, for 30 minutes, for that partner only; and the channel.connected webhook still goes out.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ApiError, partnerConnectInput, partnerPickInput, returnHosts, returnUrl } from "../src/lib/api/input";
import { sha256, type PartnerBrand, type PartnerChannel, type PartnerStore } from "../src/lib/partnerRules";
import {
  CONNECT_TTL_MS,
  ConnectRefused,
  PICK_TTL_MS,
  partnerCallback,
  partnerNetworkList,
  pickConnect,
  pickOptions,
  returnTo,
  startPartnerConnect,
  type ConnectSession,
  type ConnectStore,
  type FinishDeps,
  type Kept,
  type NewSession,
} from "../src/lib/partnerConnectRules";
import { NoAccounts, PostError, type Account } from "../src/lib/providers/types";

const WS = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const WS2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OWNER = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OWNER2 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const BRAND_A = "a0000000-0000-4000-8000-00000000000a";
const BRAND_APP = "a0000000-0000-4000-8000-0000000000ab";
const BRAND_OTHER = "b0000000-0000-4000-8000-00000000000b";
const P = { keyId: "kp", workspaceId: WS, userId: OWNER };
const P2 = { keyId: "kp2", workspaceId: WS2, userId: OWNER2 };
const HOSTS = ["chat.morningtelos.com"];
const NETWORKS = ["linkedin", "linkedin-page", "facebook", "instagram", "x"];
const RETURN = "https://chat.morningtelos.com/connect/done?ws=w1";
const NOW = Date.UTC(2026, 10, 20, 12);

const rejects = (p: Promise<unknown>, status: number, code?: string) => assert.rejects(p, (e: unknown) => e instanceof ApiError && e.status === status && (!code || e.code === code));

/** The brands a partner can touch: BRAND_A is the partner's, BRAND_APP was made in the app, BRAND_OTHER is another workspace's. */
function brands(): PartnerStore {
  const rows = new Map<string, PartnerBrand>([
    [BRAND_A, { id: BRAND_A, workspace_id: WS, name: "Acme", website: null, external_id: "mt-1" }],
    [BRAND_APP, { id: BRAND_APP, workspace_id: WS, name: "Own", website: null, external_id: null }],
    [BRAND_OTHER, { id: BRAND_OTHER, workspace_id: WS2, name: "Other", website: null, external_id: "mt-2" }],
  ]);
  const no = () => Promise.reject(new Error("not used"));
  return { brand: async (id) => rows.get(id) ?? null, brandByExternal: no, addBrand: no, removeBrand: no, channels: async () => [], removeChannel: no, makeKey: no, revokeKeys: no, addLink: no, usage: no };
}

type Row = NewSession & { kept: Kept; used_at: string | null; pick_hash: string | null; pick_accounts: Account[] | null; pick_expires_at: string | null; picked_at: string | null };
const view = (r: Row): ConnectSession => ({ id: r.id, workspace_id: r.workspace_id, brand_id: r.brand_id, created_by: r.created_by, network: r.network, return_url: r.return_url, expires_at: r.expires_at, used_at: r.used_at, pick_expires_at: r.pick_expires_at, picked_at: r.picked_at });

class MemoryConnects implements ConnectStore {
  rows: Row[] = [];
  async add(row: NewSession, kept: Kept) {
    this.rows.push({ ...row, kept, used_at: null, pick_hash: null, pick_accounts: null, pick_expires_at: null, picked_at: null });
  }
  async byState(h: string) {
    const r = this.rows.find((x) => x.state_hash === h);
    return r ? view(r) : null;
  }
  async use(id: string, now: Date) {
    const r = this.rows.find((x) => x.id === id && !x.used_at && new Date(x.expires_at) > now);
    if (!r) return null;
    r.used_at = now.toISOString();
    return r.kept;
  }
  async setPick(id: string, h: string, accounts: Account[], at: string) {
    Object.assign(this.rows.find((x) => x.id === id)!, { pick_hash: h, pick_accounts: accounts, pick_expires_at: at });
  }
  async byPick(h: string) {
    const r = this.rows.find((x) => x.pick_hash === h);
    return r ? { ...view(r), accounts: r.pick_accounts ?? [] } : null;
  }
  async usePick(id: string, now: Date) {
    const r = this.rows.find((x) => x.id === id && !x.picked_at && x.pick_expires_at && new Date(x.pick_expires_at) > now);
    if (!r) return false;
    r.picked_at = now.toISOString();
    r.pick_accounts = null;
    return true;
  }
}

/** A fake network: the sign-in address carries the state like a real one does. */
const authUrl = async (network: string, state: string) => ({ url: `https://www.${network}.example/oauth?state=${state}&client_id=cb`, keep: {} });
const stateOf = (url: string) => new URL(url).searchParams.get("state")!;

const acct = (id: string, name = `Page ${id}`, avatar: string | null = null): Account => ({ accountId: id, name, avatar, accessToken: `SECRET-TOKEN-${id}`, refreshToken: `SECRET-REFRESH-${id}` });

/** Fake finishing: records saves; `refuse` and `exchangeWith` choose what the network and the checks do. */
function finisher(o: { accounts?: Account[]; exchangeWith?: () => Promise<Account[]>; refuse?: ConnectRefused } = {}) {
  const saved: { brand: string; workspace: string; network: string; ids: string[] }[] = [];
  const logs: string[] = [];
  const exchanged: { code: string; kept: Kept }[] = [];
  const d: FinishDeps & { now: number } = {
    now: NOW,
    exchange: async (_n, code, kept) => {
      exchanged.push({ code, kept });
      return o.exchangeWith ? o.exchangeWith() : (o.accounts ?? [acct("1")]);
    },
    check: async () => {
      if (o.refuse) throw o.refuse;
    },
    save: async (s, accounts): Promise<PartnerChannel[]> => {
      saved.push({ brand: s.brand_id, workspace: s.workspace_id, network: s.network, ids: accounts.map((a) => a.accountId) });
      return accounts.map((a) => ({ id: `ch-${a.accountId}`, network: s.network, name: a.name, status: "active" }));
    },
    log: (m) => logs.push(m),
  };
  return { d, saved, logs, exchanged };
}

async function started(cs: MemoryConnects, network = "linkedin", over: { now?: number; returnUrl?: string } = {}) {
  const r = await startPartnerConnect(brands(), cs, P, BRAND_A, { network, return_url: over.returnUrl ?? RETURN }, { networks: NETWORKS, hosts: HOSTS, authUrl, now: over.now ?? NOW });
  return { url: r.url, state: stateOf(r.url), body: r };
}

const query = (url: string) => Object.fromEntries(new URL(url).searchParams);

// ---- the networks list

test("the networks list names the networks set up here, each with a kind", () => {
  assert.deepEqual(partnerNetworkList(["linkedin", "linkedin-page", "facebook", "instagram", "threads", "tiktok", "youtube", "x", "pinterest"]), {
    networks: [
      { id: "linkedin", name: "LinkedIn", kind: "profile" },
      { id: "linkedin-page", name: "LinkedIn Page", kind: "page" },
      { id: "facebook", name: "Facebook", kind: "page" },
      { id: "instagram", name: "Instagram", kind: "page" },
      { id: "threads", name: "Threads", kind: "profile" },
      { id: "tiktok", name: "TikTok", kind: "profile" },
      { id: "youtube", name: "YouTube", kind: "page" },
      { id: "x", name: "X", kind: "profile" },
      { id: "pinterest", name: "Pinterest", kind: "profile" },
    ],
  });
  // Only what the server has set up: nothing set up, nothing listed.
  assert.deepEqual(partnerNetworkList([]), { networks: [] });
  assert.deepEqual(partnerNetworkList(["x"]).networks.map((n) => n.id), ["x"]);
});

test("the networks route lists the same networks a connect link offers", () => {
  const src = readFileSync(join(import.meta.dirname, "../src/app/api/partner/networks/route.ts"), "utf8");
  assert.match(src, /partnerRoute\(/);
  assert.match(src, /partnerNetworkList\(linkNetworks\(\)\)/);
});

// ---- return_url

test("return_url is https on an allowed host exactly, so the callback is never an open redirect", () => {
  assert.deepEqual(returnHosts(" chat.morningtelos.com, App.Example.com  bad_host,localhost "), ["chat.morningtelos.com", "app.example.com"]);
  assert.deepEqual(returnHosts(undefined), []);
  assert.equal(returnUrl(RETURN, HOSTS), RETURN);
  assert.equal(returnUrl("https://CHAT.morningtelos.com/x", HOSTS), "https://chat.morningtelos.com/x");
  for (const bad of [
    "http://chat.morningtelos.com/x",
    "https://evil.example/x",
    "https://chat.morningtelos.com.evil.example/x",
    "https://evil.chat.morningtelos.com/x",
    "https://morningtelos.com/x",
    "https://chat.morningtelos.com:8443/x",
    "https://user:pw@chat.morningtelos.com/x",
    "https://chat.morningtelos.com/x#frag",
    "javascript:alert(1)",
    "//chat.morningtelos.com/x",
    "/connect/done",
    "",
    null,
    42,
    `https://chat.morningtelos.com/${"a".repeat(2001)}`,
  ])
    assert.throws(() => returnUrl(bad, HOSTS), (e: unknown) => e instanceof ApiError && e.status === 422, String(bad));
  // No hosts set: nothing is allowed.
  assert.throws(() => returnUrl(RETURN, []), (e: unknown) => e instanceof ApiError && e.status === 422);
});

test("start input: a network set up here and a return_url, nothing else", () => {
  assert.deepEqual(partnerConnectInput({ network: "x", return_url: RETURN }, NETWORKS, HOSTS), { network: "x", returnUrl: RETURN });
  const bad = (body: unknown, re: RegExp) => assert.throws(() => partnerConnectInput(body, NETWORKS, HOSTS), (e: unknown) => e instanceof ApiError && e.status === 422 && re.test(e.message));
  bad({ network: "myspace", return_url: RETURN }, /network must be one of/);
  bad({ network: "youtube", return_url: RETURN }, /network must be one of/);
  bad({ return_url: RETURN }, /network/);
  bad({ network: "x" }, /return_url is required/);
  bad({ network: "x", return_url: RETURN, brand_id: BRAND_OTHER }, /Unknown field "brand_id"/);
  bad("x", /JSON object/);
  assert.deepEqual(partnerPickInput({ ids: ["1", "2", "1"] }), ["1", "2"]);
  for (const b of [{}, { ids: [] }, { ids: "1" }, { ids: [1] }, { ids: [""] }, { ids: ["1"], all: true }, { ids: Array.from({ length: 101 }, (_, i) => String(i)) }])
    assert.throws(() => partnerPickInput(b), (e: unknown) => e instanceof ApiError && e.status === 422, JSON.stringify(b));
});

// ---- start

test("a start answers the network's own sign-in and keeps only the state's hash, for 30 minutes", async () => {
  const cs = new MemoryConnects();
  const { url, state, body } = await started(cs, "facebook");
  assert.deepEqual(Object.keys(body), ["url"]);
  assert.ok(url.startsWith("https://www.facebook.example/oauth?"), url);
  assert.ok(!url.includes("capybaroar"), "no Capybaroar page in between");
  assert.match(state, /^[A-Za-z0-9_-]{43}$/);
  const [row] = cs.rows;
  assert.equal(row.state_hash, sha256(state));
  assert.ok(!JSON.stringify(cs.rows).includes(state), "the state itself is never stored");
  assert.equal(row.brand_id, BRAND_A);
  assert.equal(row.workspace_id, WS);
  assert.equal(row.created_by, OWNER);
  assert.equal(row.key_id, "kp");
  assert.equal(row.network, "facebook");
  assert.equal(row.return_url, RETURN);
  assert.equal(row.expires_at, new Date(NOW + CONNECT_TTL_MS).toISOString());
  assert.equal(CONNECT_TTL_MS, 30 * 60 * 1000);
  assert.match(row.kept.verifier, /^[A-Za-z0-9_-]{43}$/);
  // Each start is its own sign-in.
  const again = await started(cs, "facebook");
  assert.notEqual(again.state, state);
});

test("a start refuses a bad network, another partner's brand, an app brand and a bad return host", async () => {
  const cs = new MemoryConnects();
  const o = { networks: NETWORKS, hosts: HOSTS, authUrl, now: NOW };
  const go = (p: typeof P, brand: string, body: unknown) => startPartnerConnect(brands(), cs, p, brand, body, o);
  await rejects(go(P, BRAND_A, { network: "myspace", return_url: RETURN }), 422);
  await rejects(go(P, BRAND_OTHER, { network: "x", return_url: RETURN }), 403);
  await rejects(go(P2, BRAND_A, { network: "x", return_url: RETURN }), 403);
  await rejects(go(P, BRAND_APP, { network: "x", return_url: RETURN }), 403);
  await rejects(go(P, "f0000000-0000-4000-8000-00000000000f", { network: "x", return_url: RETURN }), 404);
  await rejects(go(P, "../etc", { network: "x", return_url: RETURN }), 404);
  await rejects(go(P, BRAND_A, { network: "x", return_url: "https://evil.example/" }), 422);
  await rejects(go(P, BRAND_A, { network: "x", return_url: "http://chat.morningtelos.com/" }), 422);
  assert.equal(cs.rows.length, 0, "nothing is started");
});

// ---- the callback

test("a profile network connects at once and goes back with cb_status=connected", async () => {
  const cs = new MemoryConnects();
  const { state } = await started(cs, "linkedin");
  const f = finisher({ accounts: [acct("p1", "Ada")] });
  const to = await partnerCallback(cs, { network: "linkedin", state, code: "the-code", error: null }, f.d);
  assert.ok(to);
  assert.equal(to.split("?")[0], "https://chat.morningtelos.com/connect/done");
  assert.deepEqual(query(to), { ws: "w1", network: "linkedin", cb_status: "connected" });
  assert.deepEqual(f.saved, [{ brand: BRAND_A, workspace: WS, network: "linkedin", ids: ["p1"] }]);
  assert.equal(f.exchanged[0].code, "the-code");
  assert.equal(f.exchanged[0].kept.verifier, cs.rows[0].kept.verifier, "the exchange gets the start's verifier");
});

test("a state works once: the second callback goes back with reason=used and saves nothing", async () => {
  const cs = new MemoryConnects();
  const { state } = await started(cs);
  const f = finisher();
  await partnerCallback(cs, { network: "linkedin", state, code: "c", error: null }, f.d);
  const again = await partnerCallback(cs, { network: "linkedin", state, code: "c", error: null }, f.d);
  assert.deepEqual(query(again!), { ws: "w1", network: "linkedin", cb_status: "error", reason: "used" });
  assert.equal(f.saved.length, 1);
  // Two callbacks at once: only one gets the state.
  const cs2 = new MemoryConnects();
  const s2 = await started(cs2);
  const f2 = finisher();
  const both = await Promise.all([1, 2].map(() => partnerCallback(cs2, { network: "linkedin", state: s2.state, code: "c", error: null }, f2.d)));
  assert.deepEqual(both.map((u) => query(u!).cb_status).sort(), ["connected", "error"]);
  assert.equal(f2.saved.length, 1);
});

test("a state expires after 30 minutes", async () => {
  const cs = new MemoryConnects();
  const { state } = await started(cs);
  const f = finisher();
  f.d.now = NOW + CONNECT_TTL_MS;
  const to = await partnerCallback(cs, { network: "linkedin", state, code: "c", error: null }, f.d);
  assert.deepEqual(query(to!), { ws: "w1", network: "linkedin", cb_status: "error", reason: "expired" });
  assert.equal(f.exchanged.length, 0, "the code is never exchanged");
  f.d.now = NOW + CONNECT_TTL_MS - 1000;
  const cs2 = new MemoryConnects();
  const s2 = await started(cs2);
  assert.equal(query((await partnerCallback(cs2, { network: "linkedin", state: s2.state, code: "c", error: null }, f.d))!).cb_status, "connected");
});

test("errors go back as one short reason, never the network's text, a token or a Capybaroar page", async () => {
  const cases: { f: ReturnType<typeof finisher>; q: { code: string | null; error: string | null }; network?: string; reason: string }[] = [
    { f: finisher(), q: { code: null, error: "access_denied" }, reason: "cancelled" },
    { f: finisher(), q: { code: null, error: "server_error<script>" }, reason: "failed" },
    { f: finisher(), q: { code: null, error: null }, reason: "failed" },
    { f: finisher({ exchangeWith: () => Promise.reject(new Error("LinkedIn sign-in: invalid code SECRET-TOKEN-9")) }), q: { code: "c", error: null }, reason: "failed" },
    { f: finisher({ exchangeWith: () => Promise.reject(new NoAccounts("No Facebook Pages were shared with Capybaroar")) }), q: { code: "c", error: null }, reason: "no_accounts" },
    { f: finisher({ exchangeWith: () => Promise.reject(new PostError("Facebook sign-in: bad request")) }), q: { code: "c", error: null }, reason: "failed" },
    { f: finisher({ accounts: [] }), q: { code: "c", error: null }, reason: "no_accounts" },
    { f: finisher({ refuse: new ConnectRefused("taken", "This account is already connected to another brand") }), q: { code: "c", error: null }, reason: "taken" },
    { f: finisher({ refuse: new ConnectRefused("plan_limit", "Your plan allows 5 channels. Upgrade to add more.") }), q: { code: "c", error: null }, reason: "plan_limit" },
    // The network in the address isn't the one the sign-in was started for.
    { f: finisher(), q: { code: "c", error: null }, network: "x", reason: "failed" },
  ];
  for (const c of cases) {
    const cs = new MemoryConnects();
    const { state } = await started(cs);
    const to = await partnerCallback(cs, { network: c.network ?? "linkedin", state, ...c.q }, c.f.d);
    assert.ok(to!.startsWith("https://chat.morningtelos.com/connect/done?"), to!);
    assert.deepEqual(query(to!), { ws: "w1", network: "linkedin", cb_status: "error", reason: c.reason }, JSON.stringify(c.q));
    assert.ok(!to!.includes(state) && !to!.includes("SECRET") && !to!.includes("script"), to!);
    assert.equal(c.f.saved.length, 0);
  }
  // A store that fails half way still sends the person back to the partner.
  const cs = new MemoryConnects();
  const { state } = await started(cs, "facebook");
  cs.setPick = () => Promise.reject(new Error("db down"));
  const to = await partnerCallback(cs, { network: "facebook", state, code: "c", error: null }, finisher({ accounts: [acct("1"), acct("2")] }).d);
  assert.deepEqual(query(to!), { ws: "w1", network: "facebook", cb_status: "error", reason: "failed" });
});

test("cb_ values already in the return_url are replaced, the partner's own query stays", () => {
  const to = returnTo("https://chat.morningtelos.com/c?ws=1&cb_status=connected&pick=x", { cb_status: "error", network: "x", reason: "used" });
  assert.deepEqual(query(to), { ws: "1", cb_status: "error", network: "x", reason: "used" });
});

test("other sign-ins are left alone: app and connect link states fall through to the callback as before", async () => {
  const cs = new MemoryConnects();
  await started(cs);
  const f = finisher();
  for (const state of [null, "", "short", "a".repeat(32), "x".repeat(43), "../../etc/passwd"]) assert.equal(await partnerCallback(cs, { network: "linkedin", state, code: "c", error: null }, f.d), null, String(state));
  assert.equal(f.exchanged.length + f.saved.length, 0);
  assert.equal(cs.rows[0].used_at, null, "an unknown state uses nothing up");
  // The callback still runs the connect link and app branches after the white-label one.
  const src = readFileSync(join(import.meta.dirname, "../src/app/integrations/social/[network]/route.ts"), "utf8");
  const at = (s: string) => src.indexOf(s);
  assert.ok(at("partnerCallback(") > 0 && at("partnerCallback(") < at("linkSession(linkCookie)"), "white-label first");
  assert.ok(at('backTo("/connect")') > 0 && at('.eq("connect_link_id", link.id)') > 0, "the connect link branch is still there");
  assert.ok(at('.is("connect_link_id", null)') > 0, "the app branch still refuses connect link states");
  assert.match(src, /NextResponse\.redirect\(partner, 302\)/);
});

// ---- picks

async function picked(network = "facebook", accounts = [acct("101", "Bakery", "https://cdn.example/1.png"), acct("102", "Cafe")]) {
  const cs = new MemoryConnects();
  const { state } = await started(cs, network);
  const f = finisher({ accounts });
  const to = await partnerCallback(cs, { network, state, code: "c", error: null }, f.d);
  return { cs, f, to: to!, token: query(to!).pick };
}

test("several Pages go back with cb_status=pick and a one-time token kept only as a hash", async () => {
  const { cs, f, to, token } = await picked();
  assert.deepEqual(query(to), { ws: "w1", network: "facebook", cb_status: "pick", pick: token });
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(f.saved.length, 0, "nothing is connected before the pick");
  assert.equal(cs.rows[0].pick_hash, sha256(token));
  assert.ok(!JSON.stringify(cs.rows).includes(token));
  assert.equal(cs.rows[0].pick_expires_at, new Date(NOW + PICK_TTL_MS).toISOString());
  assert.ok(!to.includes("SECRET"));
});

test("a pick lists names and pictures only, never the network's tokens", async () => {
  const { cs, token } = await picked();
  const out = await pickOptions(brands(), cs, P, token, NOW);
  assert.deepEqual(out, { network: "facebook", options: [{ id: "101", name: "Bakery", picture: "https://cdn.example/1.png" }, { id: "102", name: "Cafe" }] });
  assert.ok(!JSON.stringify(out).includes("SECRET"));
  // Reading it twice is fine: only connecting uses it up.
  assert.deepEqual(await pickOptions(brands(), cs, P, token, NOW), out);
});

test("a pick connects the chosen ones into the brand, once", async () => {
  const { cs, token } = await picked();
  const f = finisher();
  const out = await pickConnect(brands(), cs, P, token, { ids: ["102"] }, f.d, NOW + 60000);
  assert.deepEqual(out, { channels: [{ id: "ch-102", network: "facebook", name: "Cafe", status: "active" }] });
  assert.deepEqual(f.saved, [{ brand: BRAND_A, workspace: WS, network: "facebook", ids: ["102"] }]);
  assert.equal(cs.rows[0].pick_accounts, null, "the tokens of the ones not picked are dropped");
  await rejects(pickConnect(brands(), cs, P, token, { ids: ["101"] }, f.d, NOW + 60000), 410, "used");
  await rejects(pickOptions(brands(), cs, P, token, NOW + 60000), 410, "used");
  assert.equal(f.saved.length, 1);
});

test("two picks at once connect only once", async () => {
  const { cs, token } = await picked();
  const f = finisher();
  const r = await Promise.allSettled([1, 2].map(() => pickConnect(brands(), cs, P, token, { ids: ["101", "102"] }, f.d, NOW)));
  assert.deepEqual(r.map((x) => x.status).sort(), ["fulfilled", "rejected"]);
  assert.equal(f.saved.length, 1);
});

test("a pick is the partner's and its brand's, for 30 minutes, and refuses ids it didn't list", async () => {
  const { cs, token } = await picked();
  const f = finisher();
  await rejects(pickOptions(brands(), cs, P2, token, NOW), 404, "not_found");
  await rejects(pickConnect(brands(), cs, P2, token, { ids: ["101"] }, f.d, NOW), 404, "not_found");
  await rejects(pickOptions(brands(), cs, P, "x".repeat(43), NOW), 404);
  await rejects(pickOptions(brands(), cs, P, "../etc", NOW), 404);
  await rejects(pickConnect(brands(), cs, P, token, { ids: ["999"] }, f.d, NOW), 422);
  await rejects(pickConnect(brands(), cs, P, token, { ids: [] }, f.d, NOW), 422);
  await rejects(pickOptions(brands(), cs, P, token, NOW + PICK_TTL_MS), 410, "expired");
  await rejects(pickConnect(brands(), cs, P, token, { ids: ["101"] }, f.d, NOW + PICK_TTL_MS), 410, "expired");
  // A brand that stopped being the partner's (made in the app now, say) can't be connected through it.
  const moved: PartnerStore = { ...brands(), brand: async (id) => (id === BRAND_A ? { id, workspace_id: WS, name: "Acme", website: null, external_id: null } : null) };
  await rejects(pickOptions(moved, cs, P, token, NOW), 403);
  assert.equal(f.saved.length, 0);
  // Still unused after all that.
  assert.equal((await pickConnect(brands(), cs, P, token, { ids: ["101"] }, f.d, NOW)).channels.length, 1);
});

test("a pick keeps the normal flow's checks: plan limit and accounts in another brand, and stays usable after", async () => {
  const { cs, token } = await picked();
  await rejects(pickConnect(brands(), cs, P, token, { ids: ["101", "102"] }, finisher({ refuse: new ConnectRefused("plan_limit", "Your plan allows 5 channels.") }).d, NOW), 409, "plan_limit");
  await rejects(pickConnect(brands(), cs, P, token, { ids: ["101"] }, finisher({ refuse: new ConnectRefused("taken", "This account is already connected to another brand") }).d, NOW), 409, "taken");
  const f = finisher();
  assert.equal((await pickConnect(brands(), cs, P, token, { ids: ["102"] }, f.d, NOW)).channels.length, 1);
});

test("one shared account never needs a pick", async () => {
  const { to, f } = await picked("facebook", [acct("101")]);
  assert.equal(query(to).cb_status, "connected");
  assert.deepEqual(f.saved[0].ids, ["101"]);
});

// ---- the real wiring

test("every white-label connect saves through saveAccounts, which sends channel.connected to the partner", () => {
  const read = (f: string) => readFileSync(join(import.meta.dirname, "../src/lib", f), "utf8");
  const connect = read("partnerConnect.ts");
  assert.match(connect, /save\(s, accounts\) \{\s*const saved = await saveAccounts\(s\.workspace_id, s\.network as NetworkId, accounts, s\.brand_id\)/);
  assert.match(connect, /assertCanAddChannel\(/, "the plan's channel limit");
  assert.match(connect, /new ConnectRefused\("taken"/, "an account in another brand stays there");
  const channels = read("channels.ts");
  const fn = channels.slice(channels.indexOf("export async function saveAccounts"), channels.indexOf("export async function readSecret"));
  assert.match(fn, /assertCanAddChannel\(/);
  assert.match(fn, /await partnerChannelEvent\("channel\.connected", connected\)/);
  // The routes go through the partner door: the key and its rate limit.
  for (const r of ["partner/networks/route.ts", "partner/brands/[id]/connect/start/route.ts", "partner/connect/pick/[token]/route.ts"]) {
    const src = readFileSync(join(import.meta.dirname, "../src/app/api", r), "utf8");
    assert.match(src, /partnerRoute(<P>)?\(/, r);
  }
});

test("the table is server-only and its sealed columns are re-sealed on rotation", () => {
  const sql = readFileSync(join(import.meta.dirname, "../supabase/migrations/051_partner_connect.sql"), "utf8");
  assert.match(sql, /alter table public\.partner_connects enable row level security;/);
  assert.doesNotMatch(sql, /create policy/);
  assert.match(sql, /revoke all on public\.partner_connects from anon, authenticated;/);
  assert.match(sql, /state_hash text not null unique/);
  assert.doesNotMatch(sql, /\bstate text|\bpick_token\b/, "no plain token column");
});
