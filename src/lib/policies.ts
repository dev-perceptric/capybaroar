import "server-only";
import { cache } from "react";
import { adminClient } from "./supabase/server";
import { policiesPublished, stillToAccept, type Policy } from "./policyRules";

/** What this person accepted so far (every version). */
export const acceptedBy = cache(async (userId: string) => {
  const { data, error } = await adminClient().from("policy_acceptances").select("document, version").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []) as { document: string; version: string }[];
});

/** The current documents this person still has to accept. On a database hiccup, nothing: never lock people out. */
export async function pendingFor(userId: string): Promise<{ pending: Policy[]; first: boolean }> {
  if (!policiesPublished()) return { pending: [], first: false };
  try {
    const had = await acceptedBy(userId);
    return { pending: stillToAccept(had), first: had.length === 0 };
  } catch (e) {
    console.error("policies:", e instanceof Error ? e.message : e);
    return { pending: [], first: false };
  }
}

/** Saves that this person accepted these versions. Saving the same acceptance twice is harmless. */
export async function recordAcceptance(userId: string, docs: Policy[], source: "signup" | "notice") {
  if (!docs.length) return;
  const { error } = await adminClient()
    .from("policy_acceptances")
    .upsert(
      docs.map((d) => ({ user_id: userId, document: d.doc, version: d.version, source })),
      { onConflict: "user_id,document,version", ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}
