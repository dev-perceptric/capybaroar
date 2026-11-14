// The quarterly access review (scripts/access-review.mjs): the 90-day rule, 2FA flags, retries, GitHub paging and
// the Markdown record, all with fakes. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DAY,
  cell,
  collectApp,
  collectGitHub,
  daysSince,
  describeProtection,
  isStale,
  mfaState,
  nextLink,
  permissionOf,
  plusMonths,
  renderReport,
  retry,
  transient,
  MANUAL,
} from "../scripts/access-review.mjs";

const NOW = Date.parse("2026-11-14T12:00:00Z");
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();
const noSleep = async () => {};

test("the 90-day rule: never signed in and 90 days or more are stale, 89 days is not", () => {
  assert.equal(isStale(null, NOW), true);
  assert.equal(isStale("", NOW), true);
  assert.equal(isStale("not a date", NOW), true);
  assert.equal(isStale(ago(89), NOW), false);
  assert.equal(isStale(ago(90), NOW), true);
  assert.equal(isStale(ago(400), NOW), true);
  assert.equal(isStale(ago(0), NOW), false);
  assert.equal(isStale(ago(29), NOW, 30), false);
  assert.equal(isStale(ago(30), NOW, 30), true);
  assert.equal(daysSince(ago(12), NOW), 12);
  assert.equal(daysSince(new Date(NOW + DAY).toISOString(), NOW), 0);
});

test("2FA: a verified factor is on, a started one is not verified, none is off", () => {
  assert.equal(mfaState([{ factor_type: "totp", status: "verified" }]), "on");
  assert.equal(mfaState([{ factor_type: "totp", status: "unverified" }, { factor_type: "totp", status: "verified" }]), "on");
  assert.equal(mfaState([{ factor_type: "totp", status: "unverified" }]), "unverified");
  assert.equal(mfaState([]), "off");
  assert.equal(mfaState(undefined), "off");
});

test("table cells stay one cell: pipes, new lines and HTML are made safe", () => {
  assert.equal(cell("a | b"), "a \\| b");
  assert.equal(cell("line\nbreak"), "line break");
  assert.equal(cell("<script>x</script>"), "&lt;script&gt;x&lt;/script&gt;");
  assert.equal(cell(null), "-");
  assert.equal(cell(""), "-");
  assert.equal(cell("`code`"), "'code'");
});

test("next review is three months on, at the end of a short month", () => {
  assert.equal(plusMonths("2026-11-14"), "2027-02-14");
  assert.equal(plusMonths("2026-11-30"), "2027-02-28");
  assert.equal(plusMonths("2027-05-31"), "2027-08-31");
});

test("retry tries hiccups again with growing waits and stops at once on other errors", async () => {
  const waits: number[] = [];
  let n = 0;
  const v = await retry(
    async () => {
      if (++n < 3) throw Object.assign(new Error("busy"), { status: 503 });
      return "ok";
    },
    { sleep: async (ms: number) => void waits.push(ms) },
  );
  assert.equal(v, "ok");
  assert.deepEqual(waits, [500, 1000]);

  let m = 0;
  await assert.rejects(
    retry(async () => {
      m++;
      throw Object.assign(new Error("bad request"), { status: 400 });
    }, { sleep: noSleep }),
    /bad request/,
  );
  assert.equal(m, 1);

  let k = 0;
  await assert.rejects(retry(async () => { k++; throw Object.assign(new Error("fetch failed"), { status: 0 }); }, { sleep: noSleep, tries: 4 }), /fetch failed/);
  assert.equal(k, 4);

  assert.equal(transient({ status: 429 }), true);
  assert.equal(transient({ name: "TimeoutError" }), true);
  assert.equal(transient({ code: "ECONNRESET" }), true);
  assert.equal(transient({ status: 404, message: "Not found" }), false);
});

// A fake Supabase source: two workspaces, a staff account, keys and apps.
function fakeSource() {
  const users = [
    { id: "u-owner", email: "owner@acme.test", last_sign_in_at: ago(2) },
    { id: "u-admin", email: "admin@acme.test", last_sign_in_at: ago(120) },
    { id: "u-editor", email: "editor@acme.test", last_sign_in_at: null },
    { id: "u-client", email: "client@acme.test", last_sign_in_at: ago(10) },
    { id: "u-staff", email: "Founder@Capybaroar.com", last_sign_in_at: ago(1) },
    { id: "u-bot", email: "bot@beta.test", last_sign_in_at: ago(200) },
  ];
  const factors: Record<string, unknown[]> = {
    "u-owner": [{ factor_type: "totp", status: "verified" }],
    "u-admin": [{ factor_type: "totp", status: "unverified" }],
    "u-bot": [],
  };
  const asked: string[] = [];
  return {
    asked,
    src: {
      workspaces: async () => [
        { id: "w2", name: "Beta | Studio", require_mfa: false },
        { id: "w1", name: "Acme", require_mfa: true },
      ],
      members: async () => [
        { workspace_id: "w1", user_id: "u-editor", role: "editor" },
        { workspace_id: "w1", user_id: "u-admin", role: "admin" },
        { workspace_id: "w1", user_id: "u-owner", role: "owner" },
        { workspace_id: "w1", user_id: "u-client", role: "client" },
        { workspace_id: "w1", user_id: "u-staff", role: "admin" },
        { workspace_id: "w2", user_id: "u-bot", role: "owner" },
        { workspace_id: "w2", user_id: "u-owner", role: "admin" },
      ],
      users: async () => users,
      factors: async (id: string) => {
        asked.push(id);
        return factors[id] ?? [];
      },
      apiKeys: async () => [
        { id: "k1", workspace_id: "w2", user_id: "u-bot", name: "Zapier", created_at: ago(300), last_used_at: ago(3) },
        { id: "k2", workspace_id: "w1", user_id: "u-owner", name: "Old script", created_at: ago(300), last_used_at: null },
      ],
      oauthGrants: async () => [
        { id: "g1", workspace_id: "w1", user_id: "u-owner", created_at: ago(40), last_used_at: ago(5), revoked_at: null, oauth_clients: { name: "Claude" } },
        { id: "g2", workspace_id: "w1", user_id: "u-owner", created_at: ago(40), last_used_at: ago(5), revoked_at: ago(1), oauth_clients: { name: "Revoked app" } },
      ],
    },
  };
}

test("collecting the app: owners and admins with 2FA flags, stale members, staff, keys and apps", async () => {
  const { src, asked } = fakeSource();
  const app = await collectApp(src, { now: NOW, staleDays: 90, staff: ["founder@capybaroar.com"] });

  // Sorted by name; 2FA asked once per owner or admin.
  assert.deepEqual(app.workspaces.map((w: { name: string }) => w.name), ["Acme", "Beta | Studio"]);
  assert.deepEqual([...asked].sort(), ["u-admin", "u-bot", "u-owner", "u-staff"]);

  const acme = app.workspaces[0];
  assert.equal(acme.requireMfa, true);
  assert.deepEqual(acme.admins.map((a: { email: string }) => a.email), ["owner@acme.test", "admin@acme.test", "Founder@Capybaroar.com"]);
  const [owner, admin, staff] = acme.admins;
  assert.equal(owner.mfa, "on");
  assert.deepEqual(owner.flags, []);
  assert.equal(admin.mfa, "unverified");
  assert.deepEqual(admin.flags, ["2FA set up but never verified", "no sign-in for 90 days"]);
  assert.deepEqual(staff.flags, ["2FA off", "staff account"]);

  // Every role counts for the 90-day list; never signed in counts too.
  assert.deepEqual(acme.stale.map((s: { email: string }) => s.email).sort(), ["admin@acme.test", "editor@acme.test"]);

  // Keys and apps: revoked apps left out, unused ones marked.
  assert.deepEqual(acme.keys.map((k: { name: string; unused: boolean }) => [k.name, k.unused]), [["Old script", true]]);
  assert.deepEqual(acme.apps.map((a: { name: string }) => a.name), ["Claude"]);

  // A stale owner whose key is still in use is shown as such.
  const beta = app.workspaces[1];
  assert.equal(beta.stale[0].email, "bot@beta.test");
  assert.equal(beta.stale[0].tokenUsed, ago(3));
  assert.equal(beta.admins[0].mfa, "off");

  assert.deepEqual(app.staffMemberships, [{ email: "Founder@Capybaroar.com", role: "admin", workspace: "Acme" }]);
  assert.equal(app.totals.admins, 5);
  assert.equal(app.totals.adminsNoMfa, 3);
  assert.equal(app.totals.stale, 3);
  assert.equal(app.totals.keys, 2);
  assert.equal(app.totals.unusedKeys, 1);
  assert.equal(app.totals.apps, 1);
});

test("GitHub is skipped with a note when there is no token", async () => {
  const gh = await collectGitHub({ token: "" });
  assert.match(gh.skipped, /GITHUB_TOKEN was not set/);
});

// A fake GitHub: paging, a hiccup, and calls the token can't see.
function fakeGitHub() {
  const calls: string[] = [];
  let hiccup = true;
  const res = (status: number, body: unknown, headers: Record<string, string> = {}) => ({
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    json: async () => body,
  });
  const fetchImpl = async (url: string) => {
    const path = url.replace("https://api.github.com", "");
    calls.push(path);
    if (path === "/user") return res(200, { login: "founder" }, { "x-oauth-scopes": "repo, read:org" });
    if (path === "/orgs/dev-perceptric") return res(200, { login: "dev-perceptric", two_factor_requirement_enabled: false });
    if (path.startsWith("/orgs/dev-perceptric/members?filter=2fa_disabled")) return res(403, { message: "Must be an owner" });
    if (path.startsWith("/orgs/dev-perceptric/members?role=admin")) return res(200, [{ login: "founder" }]);
    if (path.startsWith("/orgs/dev-perceptric/members")) {
      if (hiccup) {
        hiccup = false;
        return res(502, { message: "Bad gateway" });
      }
      return res(200, [{ login: "founder" }, { login: "helper" }]);
    }
    if (path.includes("/collaborators?affiliation=outside")) return res(200, [{ login: "contractor" }]);
    if (path.includes("/collaborators?affiliation=all") && path.includes("page=2")) return res(200, [{ login: "contractor", role_name: "pull" }]);
    if (path.includes("/collaborators?affiliation=all")) {
      return res(200, [{ login: "founder", role_name: "admin" }], { link: `<https://api.github.com${path}&page=2>; rel="next", <https://api.github.com${path}&page=2>; rel="last"` });
    }
    if (path.endsWith("/keys?per_page=100")) return res(403, { message: "Resource not accessible by personal access token" });
    if (path.includes("/actions/secrets")) return res(200, { total_count: 1, secrets: [{ name: "GHCR_TOKEN", updated_at: "2026-10-01T00:00:00Z" }] });
    if (path.endsWith("/protection")) return res(404, { message: "Branch not protected" });
    if (path.includes("/rules/branches/")) return res(200, []);
    return res(404, { message: "Not Found" });
  };
  return { fetchImpl, calls };
}

test("GitHub: pages are followed, hiccups retried, and what the token can't see becomes a note", async () => {
  const { fetchImpl, calls } = fakeGitHub();
  const gh = await collectGitHub({ token: "t", repos: ["dev-perceptric/capybaroar"], fetchImpl, sleep: noSleep });
  assert.equal(gh.viewer, "founder");
  assert.deepEqual(gh.org.members, [{ login: "founder", role: "owner" }, { login: "helper", role: "member" }]);
  assert.equal(gh.org.no2fa, null);
  assert.match(gh.org.no2faNote, /HTTP 403/);
  const repo = gh.repos[0];
  assert.deepEqual(repo.collaborators, [
    { login: "contractor", permission: "read", outside: true },
    { login: "founder", permission: "admin", outside: false },
  ]);
  assert.equal(repo.deployKeys, null);
  assert.match(repo.deployKeysNote, /HTTP 403/);
  assert.deepEqual(repo.secrets, [{ name: "GHCR_TOKEN", updatedAt: "2026-10-01T00:00:00Z" }]);
  assert.deepEqual(repo.protection, ["not protected"]);
  assert.ok(calls.some((c) => c.includes("/branches/claude%2Fcompassionate-bell-kidk43/protection")));
  assert.equal(calls.filter((c) => c.startsWith("/orgs/dev-perceptric/members?per_page")).length, 2, "the 502 was tried again");
});

test("GitHub: a rejected token skips the section with a note", async () => {
  const fetchImpl = async () => ({ status: 401, headers: { get: () => null }, json: async () => ({ message: "Bad credentials" }) });
  const gh = await collectGitHub({ token: "bad", fetchImpl, sleep: noSleep });
  assert.match(gh.skipped, /rejected the token/);
});

test("GitHub helpers: Link paging, permissions and branch protection", () => {
  assert.equal(nextLink('<https://x/a?page=2>; rel="next", <https://x/a?page=5>; rel="last"'), "https://x/a?page=2");
  assert.equal(nextLink('<https://x/a?page=5>; rel="last"'), null);
  assert.equal(nextLink(null), null);
  assert.equal(permissionOf({ role_name: "push" }), "write");
  assert.equal(permissionOf({ permissions: { pull: true, triage: true } }), "triage");
  const lines = describeProtection({
    required_pull_request_reviews: { required_approving_review_count: 1 },
    required_status_checks: { contexts: ["checks"], checks: [{ context: "checks" }] },
    enforce_admins: { enabled: false },
    allow_force_pushes: { enabled: false },
    allow_deletions: { enabled: false },
  });
  assert.deepEqual(lines, ["pull request needed, 1 approval(s)", "checks must pass: checks", "admins can skip the rules", "force pushes blocked", "branch can't be deleted"]);
});

test("the record has every section, safe cells, the manual checklist and a sign-off", async () => {
  const { src } = fakeSource();
  const app = await collectApp(src, { now: NOW, staleDays: 90, staff: ["founder@capybaroar.com"] });
  const md = renderReport({ date: "2026-11-14", generatedAt: "2026-11-14T12:00:00Z", reviewer: "Pat", app, github: { skipped: "GITHUB_TOKEN was not set, so GitHub was not read." }, staleDays: 90, now: NOW });

  for (const h of ["# Access review 2026-11-14", "## Summary", "## 1. Capybaroar app", "## 2. GitHub", "## 3. API keys and connected OAuth apps", "## 4. Systems checked by hand", "## 5. Changes made", "## 6. Sign-off"]) {
    assert.ok(md.includes(h), `missing ${h}`);
  }
  assert.match(md, /Classification: Confidential/);
  assert.match(md, /Next review due: 2027-02-14/);
  assert.match(md, /### Beta \\\| Studio/);
  assert.match(md, /\| admin@acme\.test \| admin \| \d{4}-\d{2}-\d{2} \(120 days ago\) \| not verified \| 2FA set up but never verified, no sign-in for 90 days \|/);
  assert.match(md, /\| editor@acme\.test \| editor \| never \| no \|/);
  assert.match(md, /\| bot@beta\.test \| owner \| .* \| \d{4}-\d{2}-\d{2} \|/);
  assert.match(md, /\| Owners and admins without 2FA \| 3 \|/);
  assert.match(md, /### Staff accounts in workspaces/);
  assert.match(md, /GITHUB_TOKEN was not set/);
  assert.match(md, /\| Old script \| owner@acme\.test \| .* \| never \| yes \|/);
  assert.ok(!md.includes("Revoked app"));

  // One checklist per manual system, each with a "reviewed, changes" line.
  assert.equal(md.split("- [ ] reviewed, changes:").length - 1, MANUAL.length);
  for (const name of ["Hostinger hPanel", "VPS Linux users and SSH keys", "Supabase Studio", "Stripe", "Anthropic console", "fal.ai console", "Backblaze B2", "Domain registrar and DNS", "Google Cloud console"]) {
    assert.ok(md.includes(`### ${name}`), `missing manual system ${name}`);
  }
  assert.match(md, /getent passwd/);
  assert.match(md, /authorized_keys/);
  assert.match(md, /- Reviewer: Pat/);
  assert.match(md, /- Signature: \[signature\]/);

  // Every table row has the same number of cells as its header.
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("|---")) continue;
    const cols = (s: string) => s.replace(/\\\|/g, "").split("|").length;
    const want = cols(lines[i - 1]);
    for (let j = i + 1; j < lines.length && lines[j].startsWith("|"); j++) assert.equal(cols(lines[j]), want, `row ${j}: ${lines[j]}`);
  }
});
