import "server-only";
import { adminClient } from "./supabase/server";

export type JobKind = "publish" | "metrics";

export async function enqueue(kind: JobKind, payload: Record<string, unknown>, runAfter = new Date()) {
  const { error } = await adminClient().from("jobs").insert({ kind, payload, run_after: runAfter.toISOString() });
  if (error) throw new Error(error.message);
}

/** Stop pending jobs for a post (it was rescheduled or deleted). */
export async function cancelPostJobs(postId: string) {
  const { error } = await adminClient().from("jobs").update({ done_at: new Date().toISOString(), last_error: "cancelled" }).eq("kind", "publish").is("done_at", null).eq("payload->>postId", postId);
  if (error) throw new Error(error.message);
}
