import "server-only";
import { adminClient } from "./supabase/server";
import { enqueue } from "./jobs";
import { cutoffs } from "./retention";
import { pruneExports } from "./exports";
import { auditCutoff } from "./auditLogRules";

/**
 * Hourly: deletes what's past its keep time (retention.ts): unfinished sign-ins, closed Inbox items, idle agent
 * chats, finished jobs, and audit events past their 365 days (auditLogRules.ts). Each step runs even when one before
 * it failed; the failures are thrown together at the end. Also queues again a workspace deletion that hasn't finished in a day.
 */
export async function pruneOld(now = new Date()) {
  const c = cutoffs(now);
  const db = adminClient();
  const iso = (d: Date) => d.toISOString();
  const steps: [string, () => PromiseLike<{ error: { message: string } | null }>][] = [
    ["oauth_states", () => db.from("oauth_states").delete().lt("created_at", iso(c.oauthStates))],
    ["inbox_items", () => db.from("inbox_items").delete().eq("status", "done").lt("created_at", iso(c.inboxDone))],
    ["agent_chats", () => db.rpc("prune_agent_chats", { before: iso(c.agentChats) })],
    // Waiting and running jobs have no done_at, so they never match.
    ["jobs", () => db.from("jobs").delete().lt("done_at", iso(c.jobsDone))],
    // Exports past their 24 hours: the file, then the row (exports.ts).
    ["data_exports", () => pruneExports(now).then(() => ({ error: null }))],
    // A day past the keep time, so a clock a little ahead of the database's never asks the guard trigger (036) for a
    // row it still keeps, which would refuse the whole delete.
    ["audit_events", () => db.from("audit_events").delete().lt("created_at", iso(auditCutoff(now)))],
  ];
  const failed: string[] = [];
  for (const [what, run] of steps) {
    try {
      const { error } = await run();
      if (error) failed.push(`${what}: ${error.message}`);
    } catch (e) {
      failed.push(`${what}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  try {
    await requeueDeletes(iso(c.stuckDelete));
  } catch (e) {
    failed.push(`workspace deletes: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (failed.length) throw new Error(`prune: ${failed.join("; ")}`);
}

async function requeueDeletes(before: string) {
  const db = adminClient();
  const { data, error } = await db.from("workspaces").select("id").lt("deleting_at", before).limit(50);
  if (error) throw new Error(error.message);
  for (const w of data ?? []) {
    const { count, error: e } = await db.from("jobs").select("id", { count: "exact", head: true }).eq("kind", "workspace_delete").is("done_at", null).eq("payload->>workspaceId", w.id);
    if (e) throw new Error(e.message);
    if (!count) await enqueue("workspace_delete", { workspaceId: w.id as string });
  }
}
