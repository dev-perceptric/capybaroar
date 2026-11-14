#!/usr/bin/env node
// Quarterly access review. Prints a Markdown record of who can reach what, ready to save in the private compliance
// repo as records/access-review-YYYY-MM-DD.md. The record holds names and email addresses, so it is Confidential:
// never commit it to this public repo.
//
//   npm run -s access-review > ../capybaroar-compliance/records/access-review-2026-11-14.md
//   npm run access-review -- --out ../capybaroar-compliance/records/access-review-2026-11-14.md
//
// Reads everything from the environment. This file holds no secrets.
//   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)  required. The production Supabase URL.
//   SUPABASE_SERVICE_ROLE_KEY                   required. Read only: the script never writes.
//   GITHUB_TOKEN     optional. A token that can read the repos (and the org's members, to list them). Without it the
//                    GitHub part is skipped with a note.
//   GITHUB_REPOS     repos to list (dev-perceptric/capybaroar,dev-perceptric/capybaroar-compliance)
//   GITHUB_ORG       the org whose members to list (dev-perceptric)
//   DEPLOY_BRANCH    the branch that ships to production (claude/compassionate-bell-kidk43)
//   STAFF_EMAILS     our own addresses, comma separated, so staff accounts inside customer workspaces stand out
//   REVIEWER         the reviewer's name for the record ([Reviewer name])
//   STALE_DAYS       days without a sign-in before a member is listed (90)
//   --date YYYY-MM-DD  the review date (today, UTC)
//
// Every network call has a deadline and is tried again on a timeout, a network error, a 429 or a 5xx, with growing
// waits. The pure parts (rules, collecting, rendering) are exported for tests/accessReview.test.ts.
//
// Running cost: $0 a month at Beta (50 teams) and at Growth (500 teams). It runs on your computer four times a year,
// calls no AI and no paid service, and reads Supabase and GitHub within their normal limits.
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const DAY = 86_400_000;
const PAGE = 1000;
const DEFAULT_REPOS = ["dev-perceptric/capybaroar", "dev-perceptric/capybaroar-compliance"];
const DEFAULT_ORG = "dev-perceptric";
const DEFAULT_BRANCH = "claude/compassionate-bell-kidk43";
const ROLE_ORDER = { owner: 0, admin: 1, editor: 2, client: 3 };

// ---------------------------------------------------------------------------------------------------------------
// Rules

/** Whole days from an ISO time to `now`, or null when there is no time or it can't be read. */
export function daysSince(iso, now) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now - t) / DAY));
}

/** True when a person has not signed in for `days` days or more, or never signed in. */
export function isStale(lastSignIn, now, days = 90) {
  const d = daysSince(lastSignIn, now);
  return d === null || d >= days;
}

/** "on" with a verified factor, "unverified" when one was started and never finished, "off" with none. */
export function mfaState(factors) {
  const list = Array.isArray(factors) ? factors : [];
  if (list.some((f) => f?.status === "verified")) return "on";
  if (list.length) return "unverified";
  return "off";
}

/** A value made safe for one Markdown table cell: one line, no column breaks, no HTML. */
export function cell(v) {
  if (v === null || v === undefined || v === "") return "-";
  return String(v)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`/g, "'")
    .trim() || "-";
}

/** YYYY-MM-DD of an ISO time, or "never". */
export const day = (iso) => (iso ? String(iso).slice(0, 10) : "never");

/** The date three months after YYYY-MM-DD (the next quarterly review). */
export function plusMonths(date, months = 3) {
  const d = new Date(`${date}T00:00:00Z`);
  const want = d.getUTCMonth() + months;
  d.setUTCMonth(want);
  if (d.getUTCMonth() !== ((want % 12) + 12) % 12) d.setUTCDate(0); // 31 May + 3 months is 31 Aug; 30 Nov + 3 is 28 Feb
  return d.toISOString().slice(0, 10);
}

const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

/** A hiccup worth trying again: a timeout, a network failure, a 408, a 429 or a 5xx. */
export function transient(e) {
  const s = e?.status;
  if (s === 408 || s === 429 || (typeof s === "number" && s >= 500)) return true;
  if (s === 0) return true;
  if (["AuthRetryableFetchError", "AbortError", "TimeoutError", "FetchError"].includes(e?.name)) return true;
  const code = e?.code ?? e?.cause?.code;
  if (typeof code === "string" && /^(ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|EPIPE|UND_ERR)/.test(code)) return true;
  return /fetch failed|network|timed? ?out|socket hang up/i.test(String(e?.message ?? ""));
}

/** Runs fn, trying again on a hiccup with growing waits (0.5 s, 1 s, 2 s, 4 s). Other errors are thrown at once. */
export async function retry(fn, { tries = 5, sleep = sleepMs, base = 500 } = {}) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries || !transient(e)) throw e;
      await sleep(e?.retryAfterMs ?? base * 2 ** (i - 1));
    }
  }
}

/** Runs fn over items with at most `limit` at once, keeping the order. */
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Capybaroar app

/**
 * Supabase as the few reads the review needs. All reads, through the service role, paged until a page comes back
 * empty (so a server with a lower row cap than PAGE still returns every row).
 */
export function supabaseSource(db, { sleep } = {}) {
  const call = (what, fn) =>
    retry(async () => {
      const res = await fn();
      if (res.error) {
        throw Object.assign(new Error(`${what}: ${res.error.message}`), { status: res.status ?? res.error.status, code: res.error.code, name: res.error.name ?? "Error" });
      }
      return res.data;
    }, { sleep });
  const rows = async (table, select, order, filter = (q) => q) => {
    const out = [];
    for (let from = 0; ; ) {
      const data = await call(table, () => {
        let q = db.from(table).select(select);
        for (const col of order) q = q.order(col);
        return filter(q).range(from, from + PAGE - 1);
      });
      if (!data?.length) return out;
      out.push(...data);
      from += data.length;
    }
  };
  return {
    workspaces: () => rows("workspaces", "id, name, require_mfa, created_at", ["id"]),
    members: () => rows("members", "workspace_id, user_id, role, created_at", ["workspace_id", "user_id"]),
    apiKeys: () => rows("api_keys", "id, workspace_id, user_id, name, created_at, last_used_at", ["id"]),
    oauthGrants: () => rows("oauth_grants", "id, workspace_id, user_id, created_at, last_used_at, revoked_at, oauth_clients(name)", ["id"], (q) => q.is("revoked_at", null)),
    users: async () => {
      const out = [];
      for (let page = 1; page < 10_000; page++) {
        const data = await call("auth users", () => db.auth.admin.listUsers({ page, perPage: PAGE }));
        const users = data?.users ?? [];
        if (!users.length) break;
        out.push(...users);
      }
      return out;
    },
    factors: async (userId) => (await call("2FA factors", () => db.auth.admin.mfa.listFactors({ userId })))?.factors ?? [],
  };
}

/**
 * Collects the app part of the review from a source (supabaseSource, or a fake in tests).
 * `staff` is a list of our own email addresses.
 */
export async function collectApp(src, { now, staleDays = 90, staff = [] }) {
  const [workspaces, members, users, keys, grants] = await Promise.all([src.workspaces(), src.members(), src.users(), src.apiKeys(), src.oauthGrants()]);
  const staffSet = new Set(staff.map((s) => s.trim().toLowerCase()).filter(Boolean));
  const byId = new Map(users.map((u) => [u.id, u]));
  const email = (id) => byId.get(id)?.email || `(unknown user ${id})`;
  const isStaff = (id) => staffSet.has(String(byId.get(id)?.email ?? "").toLowerCase());

  // 2FA for each owner and admin, asked once per person.
  const managers = [...new Set(members.filter((m) => m.role === "owner" || m.role === "admin").map((m) => m.user_id))];
  const states = await mapLimit(managers, 4, async (id) => mfaState(await src.factors(id)));
  const mfa = new Map(managers.map((id, i) => [id, states[i]]));

  // The newest use of any key or app per person, since a key acts as the person who made it.
  const lastTokenUse = new Map();
  for (const r of [...keys, ...grants]) {
    if (r.revoked_at) continue;
    const prev = lastTokenUse.get(r.user_id);
    if (r.last_used_at && (!prev || r.last_used_at > prev)) lastTokenUse.set(r.user_id, r.last_used_at);
  }

  const stale = (iso, d = staleDays) => isStale(iso, now, d);
  const out = [];
  const sorted = [...workspaces].sort((a, b) => String(a.name).localeCompare(String(b.name)) || String(a.id).localeCompare(String(b.id)));
  for (const w of sorted) {
    const mine = members.filter((m) => m.workspace_id === w.id).sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || email(a.user_id).localeCompare(email(b.user_id)));
    const person = (m) => {
      const last = byId.get(m.user_id)?.last_sign_in_at ?? null;
      return { userId: m.user_id, email: email(m.user_id), role: m.role, lastSignIn: last, days: daysSince(last, now), staff: isStaff(m.user_id) };
    };
    const admins = mine.filter((m) => m.role === "owner" || m.role === "admin").map((m) => {
      const p = { ...person(m), mfa: mfa.get(m.user_id) ?? "off" };
      const flags = [];
      if (p.mfa !== "on") flags.push(p.mfa === "unverified" ? "2FA set up but never verified" : "2FA off");
      if (stale(p.lastSignIn)) flags.push(`no sign-in for ${staleDays} days`);
      if (p.staff) flags.push("staff account");
      return { ...p, flags };
    });
    const staleMembers = mine.filter((m) => stale(byId.get(m.user_id)?.last_sign_in_at)).map((m) => {
      const p = person(m);
      const used = lastTokenUse.get(m.user_id);
      return { ...p, tokenUsed: used && !stale(used) ? used : null };
    });
    const wsKeys = keys.filter((k) => k.workspace_id === w.id).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
      .map((k) => ({ name: k.name, owner: email(k.user_id), createdAt: k.created_at, lastUsed: k.last_used_at, unused: stale(k.last_used_at) }));
    const wsApps = grants.filter((g) => g.workspace_id === w.id && !g.revoked_at).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
      .map((g) => ({ name: g.oauth_clients?.name ?? "MCP app", owner: email(g.user_id), createdAt: g.created_at, lastUsed: g.last_used_at, unused: stale(g.last_used_at) }));
    out.push({
      id: w.id,
      name: w.name,
      requireMfa: !!w.require_mfa,
      memberCount: mine.length,
      hasOwner: mine.some((m) => m.role === "owner"),
      admins,
      stale: staleMembers,
      keys: wsKeys,
      apps: wsApps,
    });
  }
  const staffMemberships = members.filter((m) => isStaff(m.user_id)).map((m) => ({ email: email(m.user_id), role: m.role, workspace: workspaces.find((w) => w.id === m.workspace_id)?.name ?? m.workspace_id }));
  const all = (f) => out.reduce((n, w) => n + f(w), 0);
  return {
    workspaces: out,
    staffMemberships,
    totals: {
      workspaces: out.length,
      members: members.length,
      people: new Set(members.map((m) => m.user_id)).size,
      admins: all((w) => w.admins.length),
      adminsNoMfa: all((w) => w.admins.filter((a) => a.mfa !== "on").length),
      stale: all((w) => w.stale.length),
      keys: all((w) => w.keys.length),
      unusedKeys: all((w) => w.keys.filter((k) => k.unused).length),
      apps: all((w) => w.apps.length),
      unusedApps: all((w) => w.apps.filter((k) => k.unused).length),
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// GitHub

/** The rel="next" address from a GitHub Link header, or null. */
export function nextLink(header) {
  if (!header) return null;
  for (const part of header.split(",")) {
    const m = part.match(/<([^>]+)>\s*;\s*rel="?next"?/);
    if (m) return m[1];
  }
  return null;
}

/** A small GitHub REST client: retries hiccups, follows pages, and turns 403 and 404 into a note. */
export function githubClient(token, { fetchImpl = fetch, sleep = sleepMs, api = "https://api.github.com", timeoutMs = 20_000 } = {}) {
  const one = (url) =>
    retry(async () => {
      let res;
      try {
        res = await fetchImpl(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "access-review-script" },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (e) {
        throw Object.assign(new Error(`GitHub: ${e?.message ?? e}`), { status: 0, name: e?.name ?? "FetchError", code: e?.cause?.code });
      }
      const h = (k) => res.headers?.get?.(k) ?? null;
      // A spent rate limit answers 403 or 429 with remaining 0: wait for the reset, at most a minute.
      if ((res.status === 403 || res.status === 429) && h("x-ratelimit-remaining") === "0") {
        const reset = Number(h("x-ratelimit-reset")) * 1000;
        throw Object.assign(new Error("GitHub rate limit"), { status: 429, retryAfterMs: Math.min(60_000, Math.max(1000, reset - Date.now())) });
      }
      if (res.status === 429 || res.status >= 500) throw Object.assign(new Error(`GitHub HTTP ${res.status}`), { status: res.status });
      let body = null;
      try {
        body = res.status === 204 ? null : await res.json();
      } catch {
        body = null;
      }
      return { status: res.status, body, next: nextLink(h("link")), scopes: h("x-oauth-scopes") };
    }, { sleep });
  const why = (r) => `the token can't see this (HTTP ${r.status}${r.body?.message ? `: ${r.body.message}` : ""})`;
  return {
    /** One object, or { note } when the token can't see it. */
    async get(path) {
      const r = await one(`${api}${path}`);
      if (r.status === 401) throw Object.assign(new Error("GitHub rejected the token (HTTP 401)"), { status: 401 });
      if (r.status >= 400) return { note: why(r), status: r.status, body: r.body };
      return { data: r.body, scopes: r.scopes };
    },
    /** Every page of a list, or { note }. `pick` reads the list out of a page that wraps it. */
    async list(path, pick = (b) => b) {
      const out = [];
      let url = `${api}${path}${path.includes("?") ? "&" : "?"}per_page=100`;
      for (let i = 0; url && i < 100; i++) {
        const r = await one(url);
        if (r.status === 401) throw Object.assign(new Error("GitHub rejected the token (HTTP 401)"), { status: 401 });
        if (r.status >= 400) return { note: why(r), status: r.status };
        out.push(...(pick(r.body) ?? []));
        url = r.next;
      }
      return { data: out };
    },
  };
}

/** A collaborator's permission as one word: admin, maintain, write, triage or read. */
export function permissionOf(c) {
  if (c?.role_name) return c.role_name === "push" ? "write" : c.role_name === "pull" ? "read" : c.role_name;
  const p = c?.permissions ?? {};
  return p.admin ? "admin" : p.maintain ? "maintain" : p.push ? "write" : p.triage ? "triage" : p.pull ? "read" : "-";
}

/** Branch protection as short lines a reviewer can read. */
export function describeProtection(p) {
  if (!p) return ["not protected"];
  const lines = [];
  const reviews = p.required_pull_request_reviews;
  lines.push(reviews ? `pull request needed, ${reviews.required_approving_review_count ?? 0} approval(s)` : "no pull request needed");
  const checks = p.required_status_checks;
  const names = checks ? [...(checks.contexts ?? []), ...(checks.checks ?? []).map((c) => c.context)] : [];
  lines.push(checks ? `checks must pass: ${[...new Set(names)].join(", ") || "(none named)"}` : "no checks required");
  lines.push(p.enforce_admins?.enabled ? "admins follow the rules" : "admins can skip the rules");
  lines.push(p.allow_force_pushes?.enabled ? "force pushes allowed" : "force pushes blocked");
  lines.push(p.allow_deletions?.enabled ? "branch can be deleted" : "branch can't be deleted");
  return lines;
}

/** Collects the GitHub part. Returns { skipped } without a token. */
export async function collectGitHub({ token, repos = DEFAULT_REPOS, org = DEFAULT_ORG, branch = DEFAULT_BRANCH, fetchImpl, sleep } = {}) {
  if (!token) return { skipped: "GITHUB_TOKEN was not set, so GitHub was not read. Review it by hand in section 4." };
  const gh = githubClient(token, { fetchImpl, sleep });
  try {
    const me = await gh.get("/user");
    const out = { viewer: me.data?.login ?? null, scopes: me.scopes ?? null, org: null, repos: [] };

    const orgInfo = await gh.get(`/orgs/${encodeURIComponent(org)}`);
    if (orgInfo.note) {
      out.org = { name: org, note: orgInfo.status === 404 ? `${org} is a personal account, or the token can't see the org` : orgInfo.note };
    } else {
      const all = await gh.list(`/orgs/${encodeURIComponent(org)}/members`);
      const admins = await gh.list(`/orgs/${encodeURIComponent(org)}/members?role=admin`);
      const no2fa = await gh.list(`/orgs/${encodeURIComponent(org)}/members?filter=2fa_disabled`);
      const adminSet = new Set((admins.data ?? []).map((m) => m.login));
      out.org = {
        name: org,
        twoFactorRequired: orgInfo.data?.two_factor_requirement_enabled ?? null,
        members: all.data ? all.data.map((m) => ({ login: m.login, role: admins.data ? (adminSet.has(m.login) ? "owner" : "member") : "-" })).sort((a, b) => a.login.localeCompare(b.login)) : null,
        note: all.note ?? null,
        no2fa: no2fa.data ? no2fa.data.map((m) => m.login).sort() : null,
        no2faNote: no2fa.note ?? null,
      };
    }

    for (const full of repos) {
      const [owner, name] = full.split("/");
      const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
      const r = { name: full };
      const collabs = await gh.list(`${base}/collaborators?affiliation=all`);
      const outside = await gh.list(`${base}/collaborators?affiliation=outside`);
      const outsideSet = new Set((outside.data ?? []).map((c) => c.login));
      r.collaborators = collabs.data ? collabs.data.map((c) => ({ login: c.login, permission: permissionOf(c), outside: outside.data ? outsideSet.has(c.login) : null })).sort((a, b) => a.login.localeCompare(b.login)) : null;
      r.collaboratorsNote = collabs.note ?? null;
      const keys = await gh.list(`${base}/keys`);
      r.deployKeys = keys.data ? keys.data.map((k) => ({ title: k.title, readOnly: k.read_only, createdAt: k.created_at, lastUsed: k.last_used ?? null })) : null;
      r.deployKeysNote = keys.note ?? null;
      const secrets = await gh.list(`${base}/actions/secrets`, (b) => b?.secrets);
      r.secrets = secrets.data ? secrets.data.map((s) => ({ name: s.name, updatedAt: s.updated_at })) : null;
      r.secretsNote = secrets.note ?? null;
      if (full === repos[0]) {
        const b = encodeURIComponent(branch);
        const prot = await gh.get(`${base}/branches/${b}/protection`);
        r.branch = branch;
        if (prot.data) r.protection = describeProtection(prot.data);
        else if (prot.status === 404 && /not protected/i.test(prot.body?.message ?? "")) r.protection = describeProtection(null);
        else if (prot.status === 404 && /not found/i.test(prot.body?.message ?? "")) r.protection = ["branch not found"];
        else r.protectionNote = prot.note;
        const rules = await gh.get(`${base}/rules/branches/${b}`);
        r.rules = Array.isArray(rules.data) ? [...new Set(rules.data.map((x) => x.type))] : null;
        r.rulesNote = rules.note ?? null;
      }
      out.repos.push(r);
    }
    return out;
  } catch (e) {
    return { skipped: `GitHub could not be read: ${e?.message ?? e}. Review it by hand in section 4.` };
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Systems with no API we can use

export const MANUAL = [
  {
    name: "Hostinger hPanel",
    where: "hPanel, Account, Account sharing (and Security for 2FA)",
    look: "Every person with access to the account, and 2FA on each. The browser terminal and VPS snapshots are reached from here.",
  },
  {
    name: "VPS Linux users and SSH keys (45.90.109.7)",
    where: "On the server, as root or with sudo",
    look: "Users with a login shell, members of sudo and docker (docker is the same as root), and every key in each authorized_keys.",
    commands: [
      "getent passwd | awk -F: '$7 !~ /(nologin|false)$/ {print $1, $3, $6, $7}'",
      "getent group sudo docker",
      "for h in $(getent passwd | awk -F: '$7 !~ /(nologin|false)$/ {print $6}'); do echo \"== $h\"; [ -f \"$h/.ssh/authorized_keys\" ] && ssh-keygen -lf \"$h/.ssh/authorized_keys\"; done",
      "sshd -T | grep -Ei '^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication) '",
      "lastlog | grep -v 'Never logged in'",
    ],
  },
  {
    name: "Supabase Studio",
    where: "db.capybaroar.com (allowed IPs) or the SSH tunnel to port 3000",
    look: "Who knows the DASHBOARD_USERNAME and DASHBOARD_PASSWORD, and the IPs in CAPY_ADMIN_IPS in Caddy's settings.",
    commands: ["grep CAPY_ADMIN_IPS /etc/systemd/system/caddy.service.d/capybaroar.conf"],
  },
  { name: "Stripe", where: "Dashboard, Settings, Team and security", look: "Team members, their roles and 2FA. Restricted and secret API keys under Developers." },
  { name: "Anthropic console", where: "console.anthropic.com, Settings, Members and API keys", look: "Members and roles, and every API key with its last use." },
  { name: "fal.ai console", where: "fal.ai dashboard, Team and Keys", look: "Members, and every API key." },
  { name: "Backblaze B2", where: "Backblaze account, Application keys (and Group or members if used)", look: "Who can sign in, 2FA, and every application key with its bucket and rights. The backup key must have no deleteFiles." },
  { name: "Domain registrar and DNS", where: "[Registrar and DNS provider]", look: "Who can sign in, 2FA, registrar lock on, and any API tokens." },
  { name: "Google Cloud console", where: "console.cloud.google.com, IAM and admin, IAM (and APIs and services, Credentials)", look: "Principals and roles on the project, and the OAuth clients and their secrets." },
  { name: "Social network developer portals", where: "Meta, LinkedIn, TikTok, X, Pinterest, Reddit, Telegram BotFather", look: "Who has a role on each app, and 2FA on each account." },
  { name: "Password manager", where: "[Password manager]", look: "Who can open the shared vault, and that the backup age key and recovery codes are in it." },
  { name: "Mailbox for hello@capybaroar.com", where: "[Mailbox provider]", look: "Who can read the mailbox, forwarding rules, and 2FA." },
];

// ---------------------------------------------------------------------------------------------------------------
// Rendering

const table = (head, rows) => (rows.length ? [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`), ""] : []);
const ago = (iso, now) => {
  const d = daysSince(iso, now);
  return d === null ? "never" : `${day(iso)} (${d} days ago)`;
};
const mfaWord = { on: "on", off: "OFF", unverified: "not verified" };

/** The whole record as Markdown. */
export function renderReport({ date, generatedAt, reviewer = "[Reviewer name]", app, github, staleDays = 90, now }) {
  const t = app.totals;
  const L = [];
  L.push(`# Access review ${date}`, "");
  L.push(`Status: Record | Classification: Confidential (names and email addresses) | Reviewer: ${reviewer} | Review date: ${date} | Next review due: ${plusMonths(date, 3)}`, "");
  L.push(`Made by \`scripts/access-review.mjs\` at ${generatedAt}. Save it as \`records/access-review-${date}.md\` in the private compliance repo and nowhere public. Fill in section 4, list what you changed in section 5, and sign section 6.`, "");

  L.push("## Summary", "");
  const ghLine = github.skipped
    ? "skipped"
    : `${github.repos.map((r) => `${r.name}: ${r.collaborators ? r.collaborators.length : "?"} collaborators`).join("; ")}${github.org?.members ? `; ${github.org.members.length} org members` : ""}`;
  L.push(
    ...table(["Check", "Result"], [
      ["Workspaces", t.workspaces],
      ["Memberships (people)", `${t.members} (${t.people})`],
      ["Owners and admins", t.admins],
      ["Owners and admins without 2FA", t.adminsNoMfa],
      [`Members with no sign-in for ${staleDays} days`, t.stale],
      ["API keys", `${t.keys} (${t.unusedKeys} unused for ${staleDays} days)`],
      ["Connected OAuth apps", `${t.apps} (${t.unusedApps} unused for ${staleDays} days)`],
      ["Staff accounts in customer workspaces", app.staffMemberships.length],
      ["GitHub", ghLine],
    ]),
  );

  // 1. App
  L.push("## 1. Capybaroar app", "");
  L.push("These are customer accounts. Customers manage their own members, so we don't remove them. Look for staff accounts that shouldn't be there, owners and admins without 2FA, and anything that looks wrong. Tell the workspace owner when something needs their action.", "");
  if (app.staffMemberships.length) {
    L.push("### Staff accounts in workspaces", "");
    L.push(...table(["Email", "Workspace", "Role", "Keep"], app.staffMemberships.map((s) => [s.email, s.workspace, s.role, "[ ]"])));
  }
  if (!app.workspaces.length) L.push("No workspaces.", "");
  for (const w of app.workspaces) {
    L.push(`### ${cell(w.name)}`, "");
    L.push(`Workspace id \`${cell(w.id)}\`. ${w.memberCount} members. 2FA required by the owner: ${w.requireMfa ? "yes" : "no"}.${w.hasOwner ? "" : " **No owner.**"}`, "");
    L.push(...table(["Email", "Role", "Last sign-in", "2FA", "Flags"], w.admins.map((a) => [a.email, a.role, ago(a.lastSignIn, now), mfaWord[a.mfa] ?? a.mfa, a.flags.join(", ")])));
    if (!w.admins.length) L.push("No owners or admins.", "");
    if (w.stale.length) {
      L.push(`Members with no sign-in for ${staleDays} days:`, "");
      L.push(...table(["Email", "Role", "Last sign-in", "Key or app used lately"], w.stale.map((s) => [s.email, s.role, ago(s.lastSignIn, now), s.tokenUsed ? day(s.tokenUsed) : "no"])));
    } else {
      L.push(`No members without a sign-in for ${staleDays} days.`, "");
    }
  }

  // 2. GitHub
  L.push("## 2. GitHub", "");
  if (github.skipped) {
    L.push(github.skipped, "");
  } else {
    L.push(`Read as \`${cell(github.viewer)}\`${github.scopes ? ` with scopes ${cell(github.scopes)}` : ""}.`, "");
    const o = github.org;
    if (o) {
      L.push(`### Organization ${cell(o.name)}`, "");
      if (o.members) {
        if (o.twoFactorRequired !== null && o.twoFactorRequired !== undefined) L.push(`2FA required for members: ${o.twoFactorRequired ? "yes" : "no"}.`, "");
        L.push(...table(["Login", "Org role", "Keep"], o.members.map((m) => [m.login, m.role, "[ ]"])));
        L.push(o.no2fa ? (o.no2fa.length ? `Members without 2FA: ${o.no2fa.map(cell).join(", ")}.` : "Every member has 2FA on.") : `2FA status: ${cell(o.no2faNote)}.`, "");
      } else {
        L.push(`Members: ${cell(o.note)}.`, "");
      }
    }
    for (const r of github.repos) {
      L.push(`### ${cell(r.name)}`, "");
      if (r.collaborators) L.push(...table(["Login", "Permission", "Outside collaborator", "Keep"], r.collaborators.map((c) => [c.login, c.permission, c.outside === null ? "-" : c.outside ? "yes" : "no", "[ ]"])));
      else L.push(`Collaborators: ${cell(r.collaboratorsNote)}.`, "");
      if (r.deployKeys) L.push(r.deployKeys.length ? "Deploy keys:" : "No deploy keys.", "", ...table(["Title", "Read only", "Added", "Last used", "Keep"], r.deployKeys.map((k) => [k.title, k.readOnly ? "yes" : "no", day(k.createdAt), k.lastUsed ? day(k.lastUsed) : "-", "[ ]"])));
      else L.push(`Deploy keys: ${cell(r.deployKeysNote)}.`, "");
      if (r.secrets) L.push(r.secrets.length ? `Actions secrets (names only): ${r.secrets.map((s) => `${cell(s.name)} (updated ${day(s.updatedAt)})`).join(", ")}.` : "No Actions secrets.", "");
      else L.push(`Actions secrets: ${cell(r.secretsNote)}.`, "");
      if (r.branch) {
        L.push(`Deploy branch \`${cell(r.branch)}\`: ${r.protection ? r.protection.map(cell).join("; ") : cell(r.protectionNote)}.`, "");
        if (r.rules) L.push(r.rules.length ? `Ruleset rules on it: ${r.rules.map(cell).join(", ")}.` : "No ruleset rules on it.", "");
        else if (r.rulesNote) L.push(`Rulesets: ${cell(r.rulesNote)}.`, "");
      }
    }
  }

  // 3. Keys and apps
  L.push("## 3. API keys and connected OAuth apps", "");
  L.push(`A key or app acts as the person who made it, with their role and brands. "Unused" means no use for ${staleDays} days.`, "");
  const withTokens = app.workspaces.filter((w) => w.keys.length || w.apps.length);
  if (!withTokens.length) L.push("No API keys or connected apps.", "");
  for (const w of withTokens) {
    L.push(`### ${cell(w.name)}`, "");
    if (w.keys.length) L.push("API keys:", "", ...table(["Name", "Made by", "Created", "Last used", "Unused"], w.keys.map((k) => [k.name, k.owner, day(k.createdAt), day(k.lastUsed), k.unused ? "yes" : "no"])));
    if (w.apps.length) L.push("OAuth apps:", "", ...table(["App", "Approved by", "Approved", "Last used", "Unused"], w.apps.map((k) => [k.name, k.owner, day(k.createdAt), day(k.lastUsed), k.unused ? "yes" : "no"])));
  }

  // 4. Manual
  L.push("## 4. Systems checked by hand", "");
  L.push("These have no API this script can use. For each one, write down every person or key with access, its role, and whether 2FA is on.", "");
  for (const m of MANUAL) {
    L.push(`### ${m.name}`, "");
    L.push(`Where: ${m.where}. Look at: ${m.look}`, "");
    if (m.commands) L.push("```sh", ...m.commands, "```", "");
    L.push("- People and keys found:", "- 2FA on every account: [ ] yes  [ ] no, who:", "- [ ] reviewed, changes:", "");
  }

  // 5. Changes
  L.push("## 5. Changes made", "");
  L.push("| Date | System | Account or key | Change | Done by |", "|---|---|---|---|---|", "| | | | | |", "| | | | | |", "");

  // 6. Sign-off
  L.push("## 6. Sign-off", "");
  L.push("I checked every account and key above. Each one is still needed, or its change is listed in section 5.", "");
  L.push(`- Reviewer: ${reviewer}`, "- Role: Security lead", "- Date signed: [YYYY-MM-DD]", "- Signature: [signature]", `- Next review due: ${plusMonths(date, 3)}`, "");
  return L.join("\n");
}

// ---------------------------------------------------------------------------------------------------------------
// Running it

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") out.out = argv[++i];
    else if (argv[i] === "--date") out.date = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") out.help = true;
  }
  return out;
}

const list = (s) => String(s ?? "").split(",").map((x) => x.trim()).filter(Boolean);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: npm run -s access-review [-- --out FILE] [--date YYYY-MM-DD]. Settings are listed at the top of scripts/access-review.mjs.");
    return;
  }
  const env = process.env;
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("access-review: set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(2);
  }
  const date = args.date ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error("access-review: --date must be YYYY-MM-DD");
    process.exit(2);
  }
  const staleDays = Number(env.STALE_DAYS || 90);
  const now = Date.now();
  const { createClient } = await import("@supabase/supabase-js");
  const timedFetch = (input, init = {}) => fetch(input, { ...init, signal: init.signal ?? AbortSignal.timeout(30_000) });
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: timedFetch } });

  console.error("access-review: reading workspaces, members, sign-ins, 2FA, keys and apps");
  const app = await collectApp(supabaseSource(db), { now, staleDays, staff: list(env.STAFF_EMAILS) });
  console.error(env.GITHUB_TOKEN ? "access-review: reading GitHub" : "access-review: GITHUB_TOKEN not set, skipping GitHub");
  const github = await collectGitHub({
    token: env.GITHUB_TOKEN,
    repos: list(env.GITHUB_REPOS).length ? list(env.GITHUB_REPOS) : DEFAULT_REPOS,
    org: env.GITHUB_ORG || DEFAULT_ORG,
    branch: env.DEPLOY_BRANCH || DEFAULT_BRANCH,
  });
  const md = renderReport({ date, generatedAt: new Date(now).toISOString().replace(/\.\d+Z$/, "Z"), reviewer: env.REVIEWER || "[Reviewer name]", app, github, staleDays, now });
  if (args.out) {
    writeFileSync(args.out, md, { mode: 0o600 });
    console.error(`access-review: wrote ${args.out}`);
  } else {
    process.stdout.write(md);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`access-review: FAILED: ${e?.message ?? e}`);
    process.exit(1);
  });
}
