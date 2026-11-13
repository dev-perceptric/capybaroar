import "server-only";
import { adminClient } from "./supabase/server";
import { readSecret } from "./channels";
import { providerOf } from "./providers";
import { stripe } from "./billing";
import { enqueue } from "./jobs";
import { accountPlan, deleteWorkspaceWith, revokeBlocked, type AccountWorkspace, type ChannelRef } from "./retention";

// Deleting a workspace or an account (rules and order in retention.ts). The request removes everyone's access at
// once; a "workspace_delete" job does the rest, so a slow network or Stripe never holds up the person.

const BUCKET = "media";
const GOOGLE = ["youtube", "gbp"];

type Row = { id: string; workspace_id: string; network: string; account_id: string };
const ref = (r: Row): ChannelRef => ({ id: r.id, workspaceId: r.workspace_id, network: r.network, accountId: r.account_id });

/**
 * Ends a channel's access on its network, unless a channel that stays still relies on the same sign-in
 * (revokeBlocked). `leaving` are the channels deleted with it. Never throws: true when the network said yes.
 */
export async function revokeChannel(id: string, leaving: Set<string> = new Set([id])): Promise<boolean> {
  try {
    const db = adminClient();
    const { data: ch } = await db.from("channels").select("id, workspace_id, network, account_id").eq("id", id).maybeSingle();
    const p = ch ? providerOf(ch.network as string) : null;
    if (!ch || !p?.revoke) return false;
    const c = ref(ch as Row);
    const cols = "id, workspace_id, network, account_id";
    const looks = [db.from("channels").select(cols).eq("network", c.network).eq("account_id", c.accountId).neq("id", id)];
    if (GOOGLE.includes(c.network)) looks.push(db.from("channels").select(cols).eq("workspace_id", c.workspaceId).in("network", GOOGLE).neq("id", id));
    const acct = c.network === "gbp" ? /^accounts\/[^/]+\//.exec(c.accountId)?.[0] : null;
    if (acct) looks.push(db.from("channels").select(cols).eq("network", "gbp").like("account_id", `${acct}%`).neq("id", id));
    const others: ChannelRef[] = [];
    for (const r of await Promise.all(looks)) {
      // Not sure who else uses this sign-in: leave it alone.
      if (r.error) return false;
      for (const o of (r.data ?? []) as Row[]) if (!leaving.has(o.id)) others.push(ref(o));
    }
    if (revokeBlocked(c, others)) return false;
    await p.revoke(await readSecret(id));
    return true;
  } catch {
    // The token may already be gone; deleting still goes ahead.
    return false;
  }
}

/** Cancels every live subscription of the workspace's Stripe customer. An already cancelled one counts as done. */
async function cancelBilling(workspaceId: string) {
  const s = stripe();
  if (!s) return;
  const { data, error } = await adminClient().from("workspaces").select("stripe_customer_id, stripe_subscription_id").eq("id", workspaceId).maybeSingle();
  if (error) throw new Error(error.message);
  const subs = new Set<string>();
  if (data?.stripe_subscription_id) subs.add(data.stripe_subscription_id as string);
  if (data?.stripe_customer_id) {
    for await (const sub of s.subscriptions.list({ customer: data.stripe_customer_id as string, status: "all", limit: 100 })) {
      if (sub.status !== "canceled" && sub.status !== "incomplete_expired") subs.add(sub.id);
    }
  }
  for (const id of subs) {
    try {
      await s.subscriptions.cancel(id);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "resource_missing" || /canceled/i.test(e instanceof Error ? e.message : "")) continue;
      throw e;
    }
  }
}

/** Every file under the workspace's folder in Storage, and every path its media rows name. */
async function filesOf(workspaceId: string) {
  const db = adminClient();
  const out: string[] = [];
  const dirs = [workspaceId];
  while (dirs.length) {
    const dir = dirs.pop()!;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.storage.from(BUCKET).list(dir, { limit: 1000, offset });
      if (error) throw new Error(error.message);
      // A folder has no id.
      for (const f of data ?? []) (f.id ? out : dirs).push(`${dir}/${f.name}`);
      if ((data ?? []).length < 1000) break;
    }
  }
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("media").select("path").eq("workspace_id", workspaceId).order("id").range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) out.push(r.path as string);
    if ((data ?? []).length < 1000) break;
  }
  return out;
}

/** The "workspace_delete" job. Throws to retry; a repeat after it finished does nothing. */
export async function runWorkspaceDelete(payload: Record<string, string>) {
  const id = payload.workspaceId;
  if (!id) return;
  const db = adminClient();
  let leaving = new Set<string>();
  const r = await deleteWorkspaceWith({
    exists: async () => {
      const { data, error } = await db.from("workspaces").select("id").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return !!data;
    },
    cancelBilling: () => cancelBilling(id),
    channels: async () => {
      const { data, error } = await db.from("channels").select("id, workspace_id, network, account_id").eq("workspace_id", id);
      if (error) throw new Error(error.message);
      const rows = ((data ?? []) as Row[]).map(ref);
      leaving = new Set(rows.map((c) => c.id));
      return rows;
    },
    revoke: async (c) => {
      await revokeChannel(c.id, leaving);
    },
    files: () => filesOf(id),
    removeFiles: async (paths) => {
      const { error } = await db.storage.from(BUCKET).remove(paths);
      if (error) throw new Error(error.message);
    },
    deleteRows: async () => {
      const { error } = await db.from("workspaces").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
  });
  if (r.deleted) console.log(`workspace ${id} deleted: ${r.channels} channels (${r.revokeFailed} not revoked), ${r.files} files`);
}

/**
 * Starts deleting a workspace: marks it, takes everyone out (members, invites, review links, so the app, API keys and
 * connected apps stop working at once) and queues the job.
 */
export async function requestWorkspaceDelete(workspaceId: string) {
  const db = adminClient();
  const { error } = await db.from("workspaces").update({ deleting_at: new Date().toISOString() }).eq("id", workspaceId);
  if (error) throw new Error(error.message);
  for (const t of ["members", "invites", "review_links"]) {
    const { error: e } = await db.from(t).delete().eq("workspace_id", workspaceId);
    if (e) throw new Error(e.message);
  }
  await enqueue("workspace_delete", { workspaceId });
}

/** The workspaces a person belongs to, with how many members and owners each has. */
async function accountWorkspaces(userId: string): Promise<AccountWorkspace[]> {
  const db = adminClient();
  const { data: mine, error } = await db.from("members").select("workspace_id, role, workspaces(name)").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const ids = (mine ?? []).map((m) => m.workspace_id as string);
  if (!ids.length) return [];
  const { data: all, error: e2 } = await db.from("members").select("workspace_id, role").in("workspace_id", ids);
  if (e2) throw new Error(e2.message);
  return (mine ?? []).map((m) => {
    const here = (all ?? []).filter((a) => a.workspace_id === m.workspace_id);
    return {
      workspaceId: m.workspace_id as string,
      name: (m.workspaces as unknown as { name: string } | null)?.name ?? "a workspace",
      role: m.role as string,
      members: here.length,
      owners: here.filter((a) => a.role === "owner").length,
    };
  });
}

/**
 * Deletes a person's account: workspaces where they're the only member go with it, they leave the rest, then their
 * sign-in is deleted. Returns the workspaces that block it (owned, used by others, no other owner) without changing
 * anything.
 */
export async function deleteAccount(userId: string): Promise<{ blockedBy: string[] }> {
  const plan = accountPlan(await accountWorkspaces(userId));
  if (plan.blockedBy.length) return { blockedBy: plan.blockedBy };
  for (const id of plan.deleteWorkspaces) await requestWorkspaceDelete(id);
  const db = adminClient();
  const { error } = await db.from("members").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
  const { error: e2 } = await db.auth.admin.deleteUser(userId);
  if (e2) throw new Error(e2.message);
  return { blockedBy: [] };
}
