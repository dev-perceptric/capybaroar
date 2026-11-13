// What Capybaroar keeps and for how long, and the order a workspace is deleted in. Free of Supabase so tests run it.
// - Sign-in states last 1 hour, closed Inbox items 180 days, agent chats 365 days after their last message, finished
//   jobs 30 days. The hourly upkeep deletes what's older (prune.ts).
// - Deleting a workspace cancels its subscription first (a failure retries the job, so nobody is billed for a workspace
//   that's gone), then ends every channel's access on its network (best effort: one failure never stops the rest),
//   then deletes its files, and only then its rows, which takes everything else with them.

const HOUR = 3600000;
const DAY = 24 * HOUR;

export const RETENTION = {
  /** A sign-in that wasn't finished within this long can't be finished. */
  oauthStateMs: HOUR,
  inboxDoneDays: 180,
  agentChatDays: 365,
  jobsDoneDays: 30,
  /** A workspace deletion still not finished after this long is queued again. */
  deleteRetryMs: DAY,
};

/** Everything older than these times is deleted. */
export function cutoffs(now = new Date()) {
  const t = now.getTime();
  return {
    oauthStates: new Date(t - RETENTION.oauthStateMs),
    inboxDone: new Date(t - RETENTION.inboxDoneDays * DAY),
    agentChats: new Date(t - RETENTION.agentChatDays * DAY),
    jobsDone: new Date(t - RETENTION.jobsDoneDays * DAY),
    stuckDelete: new Date(t - RETENTION.deleteRetryMs),
  };
}

const before = (at: string | Date | null | undefined, cut: Date) => at != null && new Date(at).getTime() < cut.getTime();

/** The same rules as the deletes in prune.ts, one row at a time. */
export const expired = {
  oauthState: (r: { created_at: string | Date }, now = new Date()) => before(r.created_at, cutoffs(now).oauthStates),
  /** Only closed items go; an open one stays however old it is. */
  inboxItem: (r: { status: string; created_at: string | Date }, now = new Date()) => r.status === "done" && before(r.created_at, cutoffs(now).inboxDone),
  /** A chat's last activity is its newest message, or when it was made if it has none. */
  agentChat: (r: { created_at: string | Date; last_message_at?: string | Date | null }, now = new Date()) => before(r.last_message_at ?? r.created_at, cutoffs(now).agentChats),
  /** Waiting or running jobs never go. */
  job: (r: { done_at: string | Date | null }, now = new Date()) => before(r.done_at, cutoffs(now).jobsDone),
};

export type ChannelRef = { id: string; workspaceId: string; network: string; accountId: string };

/** Google's revoke ends the person's whole grant to the project: YouTube and Business Profile alike. */
const GOOGLE = new Set(["youtube", "gbp"]);
/** "accounts/1/locations/2" → "accounts/1/": one Business account's locations come from the same Google sign-in. */
const gbpAccount = (accountId: string) => /^accounts\/[^/]+\//.exec(accountId)?.[0] ?? null;

/**
 * Whether ending `c`'s token on the network would cut off a channel that stays: the same account connected elsewhere
 * (another workspace), another Google channel in the same workspace (one sign-in can hold several Business locations,
 * and Google's revoke ends them all), or another location of the same Business account anywhere. `others` are the
 * channels that stay; leave out the ones being deleted with `c`.
 */
export function revokeBlocked(c: ChannelRef, others: ChannelRef[]): boolean {
  const acct = c.network === "gbp" ? gbpAccount(c.accountId) : null;
  return others.some(
    (o) =>
      o.id !== c.id &&
      ((o.network === c.network && o.accountId === c.accountId) ||
        (GOOGLE.has(c.network) && GOOGLE.has(o.network) && o.workspaceId === c.workspaceId) ||
        (acct !== null && o.network === "gbp" && gbpAccount(o.accountId) === acct)),
  );
}

export type DeleteSteps = {
  /** False once the workspace is gone (a repeat of a finished job). */
  exists: () => Promise<boolean>;
  /** Cancels the Stripe subscription. Throws to retry. */
  cancelBilling: () => Promise<void>;
  channels: () => Promise<ChannelRef[]>;
  /** Ends one channel's access on its network. May throw; the rest still run. */
  revoke: (c: ChannelRef) => Promise<void>;
  /** Every stored file of the workspace. */
  files: () => Promise<string[]>;
  removeFiles: (paths: string[]) => Promise<void>;
  /** Deletes the workspace row; the rest goes with it. */
  deleteRows: () => Promise<void>;
};

export const FILE_BATCH = 100;

/** Deletes a workspace in the order above. Safe to run again after a failure part way. */
export async function deleteWorkspaceWith(s: DeleteSteps): Promise<{ deleted: boolean; channels: number; revokeFailed: number; files: number }> {
  if (!(await s.exists())) return { deleted: false, channels: 0, revokeFailed: 0, files: 0 };
  await s.cancelBilling();
  const chans = await s.channels();
  let revokeFailed = 0;
  for (const c of chans) {
    try {
      await s.revoke(c);
    } catch {
      revokeFailed++;
    }
  }
  const paths = [...new Set(await s.files())];
  for (let i = 0; i < paths.length; i += FILE_BATCH) await s.removeFiles(paths.slice(i, i + FILE_BATCH));
  await s.deleteRows();
  return { deleted: true, channels: chans.length, revokeFailed, files: paths.length };
}

export type AccountWorkspace = { workspaceId: string; name: string; role: string; members: number; owners: number };

/**
 * Deleting an account: refused while the person owns a workspace that others still use and no other owner would be
 * left to run it. Workspaces where they're the only member are deleted with the account.
 */
export function accountPlan(ws: AccountWorkspace[]): { blockedBy: string[]; deleteWorkspaces: string[]; leave: string[] } {
  const blockedBy = ws.filter((w) => w.role === "owner" && w.members > 1 && w.owners <= 1).map((w) => w.name);
  const deleteWorkspaces = ws.filter((w) => w.members <= 1).map((w) => w.workspaceId);
  const leave = ws.filter((w) => w.members > 1).map((w) => w.workspaceId);
  return { blockedBy, deleteWorkspaces, leave };
}
