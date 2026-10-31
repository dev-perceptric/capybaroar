import "server-only";
import { adminClient } from "./supabase/server";

/** Follower counts and post outcomes for the last 30 days. */
export async function last30(workspaceId: string) {
  const db = adminClient();
  const since = new Date(Date.now() - 30 * 86400000);
  const [{ data: metrics }, { data: targets }] = await Promise.all([
    db.from("metrics").select("channel_id, day, followers").eq("workspace_id", workspaceId).gte("day", since.toISOString().slice(0, 10)).order("day"),
    db
      .from("post_targets")
      .select("channel_id, status, posts!inner(publish_at)")
      .eq("workspace_id", workspaceId)
      .in("status", ["published", "failed"])
      .gte("posts.publish_at", since.toISOString()),
  ]);
  return {
    metrics: (metrics ?? []) as { channel_id: string; day: string; followers: number | null }[],
    targets: (targets ?? []) as unknown as { channel_id: string; status: "published" | "failed" }[],
  };
}
