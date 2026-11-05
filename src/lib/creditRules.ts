// Credits, the pure half: prices, packs, refill periods, what Claude's tokens cost in credits, and the small
// decisions around them (alerts, automatic top-ups, the usage list). No Supabase and no fetch, so tests run it as it
// is. The ledger itself is SQL (025_credits.sql) and its server side is credits.ts.
//
// - 1 credit is 1 cent of price to the customer (packs sell at about $1 for 100).
// - Every action is priced at MARKUP times what it costs us, so our cost stays at 40% of the price or less whatever
//   people make. tests/credits.test.ts fails if a price drops under that.

export const MARKUP = 2.5;

/** Credit packs people can buy on a paid plan. They last LOT_MONTHS. */
export const PACKS = [
  { credits: 1000, price: 12 },
  { credits: 5000, price: 50 },
  { credits: 20000, price: 160 },
] as const;
export type PackSize = (typeof PACKS)[number]["credits"];
export const packOf = (credits: unknown) => PACKS.find((p) => p.credits === credits) ?? null;
export const LOT_MONTHS = 12;

/** A trial is 14 days of Pro with this many credits (at most $0.80 of cost). */
export const TRIAL_CREDITS = 200;
/** No one action may cost more (an 8-second Veo video is 800). */
export const MAX_ACTION = 1000;

/** Rewrite, fit to a network, suggested reply, caption. */
export const WRITE_CREDITS = 4;
/** Build a link-in-bio page with AI. */
export const BIO_CREDITS = 50;
/** What an agent message holds when it starts, and holds again each time it uses that much. */
export const AGENT_HOLD = 200;
/** The least an agent message costs. */
export const AGENT_MIN = 2;

/** Automatic top-ups buy a pack when what's left falls under this. */
export const AUTO_TOPUP_BELOW = 200;
/** A hold older than this was left by a server that stopped mid-action. */
export const STALE_HOLD_MINUTES = 90;

// Claude Opus token prices in dollars per million tokens. Check: confirm on Anthropic's pricing page.
export const CLAUDE = { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 };

export type TokenUse = { input_tokens?: number | null; output_tokens?: number | null; cache_creation_input_tokens?: number | null; cache_read_input_tokens?: number | null };

/** What one Claude answer costs us, in cents. */
export function claudeCents(u: TokenUse | null | undefined) {
  if (!u) return 0;
  const n = (x: number | null | undefined) => (typeof x === "number" && x > 0 ? x : 0);
  const usd = (n(u.input_tokens) * CLAUDE.input + n(u.output_tokens) * CLAUDE.output + n(u.cache_creation_input_tokens) * CLAUDE.cacheWrite + n(u.cache_read_input_tokens) * CLAUDE.cacheRead) / 1e6;
  return usd * 100;
}

/** Credits for a cost in cents: MARKUP times the cost, rounded up. */
export const priceOf = (cents: number) => (cents <= 0 ? 0 : Math.ceil(Math.round(cents * MARKUP * 1e6) / 1e6));

/** Credits for one Claude answer. */
export const claudeCredits = (u: TokenUse | null | undefined) => priceOf(claudeCents(u));

// Refill periods

const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/** The anchor moved by `months`, on the same day of the month (or the month's last day) and time. */
export function addMonths(anchor: Date, months: number) {
  const total = anchor.getUTCFullYear() * 12 + anchor.getUTCMonth() + months;
  const y = Math.floor(total / 12);
  const m = total - y * 12;
  const d = Math.min(anchor.getUTCDate(), daysIn(y, m));
  return new Date(Date.UTC(y, m, d, anchor.getUTCHours(), anchor.getUTCMinutes(), anchor.getUTCSeconds()));
}

/** The monthly period `now` falls in, counted from the anchor (the day the subscription started). Yearly plans refill
 *  monthly too. key names it by its first day. */
export function periodOf(anchor: Date, now: Date): { key: string; start: Date; next: Date } {
  let m = (now.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (now.getUTCMonth() - anchor.getUTCMonth());
  while (addMonths(anchor, m).getTime() > now.getTime()) m--;
  while (addMonths(anchor, m + 1).getTime() <= now.getTime()) m++;
  const start = addMonths(anchor, m);
  return { key: start.toISOString().slice(0, 10), start, next: addMonths(anchor, m + 1) };
}

export const TRIAL_PERIOD = "trial";

export type PeriodInfo = { period: string; total: number; refillAt: string | null };

/** The plan-credit period a workspace is in now and what it comes to. A trial is one period of TRIAL_CREDITS; a
 *  paid plan refills monthly from its anchor (the subscription's start, else its renewal date, else the day the
 *  workspace was made); a plan without credits has none. */
export function periodFor(o: { credits: number; trial: boolean; anchor: string | null }, now: Date): PeriodInfo {
  if (o.credits <= 0) return { period: "none", total: 0, refillAt: null };
  if (o.trial) return { period: TRIAL_PERIOD, total: TRIAL_CREDITS, refillAt: null };
  const a = o.anchor ? new Date(o.anchor) : null;
  const p = periodOf(a && !Number.isNaN(a.getTime()) ? a : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), now);
  return { period: p.key, total: o.credits, refillAt: p.next.toISOString() };
}

/** What a period's plan credits should come to, and the grant still owed: an upgrade mid-period adds the difference
 *  at once; a downgrade changes nothing until the next period. */
export const grantOwed = (target: number, granted: number) => Math.max(0, target - granted);
export const grantKey = (period: string, target: number) => `plan:${period}:${target}`;

// Errors from the ledger

/** The line every AI action answers with on a plan without AI. The app shows it with a button to the plans. */
export const NO_AI = "Your plan doesn't include AI. Upgrade to use it.";

/** What a message means for credits: the plan has no AI (upgrade), credits ran short (buy more), or neither. */
export function creditBlock(message: string | null | undefined): "upgrade" | "buy" | null {
  if (!message) return null;
  if (message === NO_AI) return "upgrade";
  if (/out of credits|credits ran out|has used its credits|credits and \d[\d,]* (are|is) left|this brand has \d/i.test(message)) return "buy";
  return null;
}

export type CreditRefusal = { code: "out_of_credits" | "brand_limit"; left: number };

/** Reads the ledger's refusals (raised as out_of_credits or brand_limit with what's left as the detail). */
export function refusalOf(e: { message?: string | null; details?: string | null } | null | undefined): CreditRefusal | null {
  const m = e?.message ?? "";
  const code = m.includes("out_of_credits") ? "out_of_credits" : m.includes("brand_limit") ? "brand_limit" : null;
  if (!code) return null;
  const left = Number(e?.details);
  return { code, left: Number.isFinite(left) && left > 0 ? Math.floor(left) : 0 };
}

/** The line people see when credits run short. */
export function refusalText(r: CreditRefusal, need: number) {
  if (r.code === "brand_limit") return r.left ? `This costs ${need} credits and this brand has ${r.left} left this month` : "This brand has used its credits for this month";
  return r.left ? `This costs ${need} credits and ${r.left} are left` : "You're out of credits. Buy more in Settings, Billing.";
}

// Alerts and automatic top-ups

/** The alert a period has reached: 100 when its plan credits are used, 80 at 80% used, else null. */
export function alertLevel(total: number, left: number): 80 | 100 | null {
  if (total <= 0) return null;
  if (left <= 0) return 100;
  if (left <= total * 0.2) return 80;
  return null;
}

/** Whether to buy a pack now: it's on, what's left is low, and this month's automatic packs haven't reached the cap. */
export function topUpDue(o: { pack: number | null; max: number; left: number; boughtThisMonth: number }) {
  return !!o.pack && o.left < AUTO_TOPUP_BELOW && o.boughtThisMonth < o.max;
}

// The usage list

export type Entry = { key: string; kind: "grant" | "hold" | "release" | "charge"; bucket: "plan" | "bought"; amount: number; tool: string | null; model: string | null; note: string | null; brand_id: string | null; user_id: string | null; post_id: string | null; created_at: string };

export type UsageRow = { key: string; at: string; what: string; tool: string | null; model: string | null; brandId: string | null; userId: string | null; postId: string | null; credits: number };

const TOOL_NAMES: Record<string, string> = {
  image: "Picture",
  video: "Video",
  audio: "Audio",
  agent: "Agent",
  rewrite: "Rewrite",
  caption: "Caption",
  reply: "Suggested reply",
  bio: "Link in bio",
};
export const toolName = (tool: string | null) => (tool ? (TOOL_NAMES[tool] ?? tool) : "AI");

/** One row per action from ledger entries: what it charged (spends) or added (grants, as a positive number). Holds
 *  still open show as what they hold, so the list adds up to the balance. Newest first. */
export function usageRows(entries: Entry[]): UsageRow[] {
  const by = new Map<string, UsageRow & { charged: boolean; open: number }>();
  for (const e of [...entries].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    let r = by.get(e.key);
    if (!r) {
      const grant = e.kind === "grant";
      r = { key: e.key, at: e.created_at, what: grant ? (e.note ?? (e.key.startsWith("plan:") ? "Plan credits" : "Bought credits")) : toolName(e.tool), tool: e.tool, model: e.model, brandId: e.brand_id, userId: e.user_id, postId: e.post_id, credits: 0, charged: false, open: 0 };
      by.set(e.key, r);
    }
    if (e.kind === "grant") r.credits += e.amount;
    else if (e.kind === "charge") {
      r.charged = true;
      r.credits += e.amount;
    } else r.open += e.amount;
  }
  return [...by.values()]
    .map(({ charged, open, ...r }) => ({ ...r, credits: charged ? r.credits : r.credits + open }))
    .filter((r) => r.credits !== 0)
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** One CSV field. Numbers stay numbers; text that a spreadsheet would run as a formula gets a ' in front. */
const cell = (v: string | number | null) => {
  if (typeof v === "number") return String(v);
  const raw = v ?? "";
  const s = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r']/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** The usage list as CSV, with names for people and brands. */
export function usageCsv(rows: UsageRow[], names: { users: Record<string, string>; brands: Record<string, string> }) {
  const head = ["Date", "What", "Model", "Brand", "Person", "Post", "Credits"];
  const lines = rows.map((r) => [r.at, r.what, r.model, r.brandId ? (names.brands[r.brandId] ?? "") : "", r.userId ? (names.users[r.userId] ?? "") : "", r.postId, r.credits].map(cell).join(","));
  return [head.join(","), ...lines].join("\r\n") + "\r\n";
}
