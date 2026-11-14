"use server";

import { getCtx } from "@/lib/session";
import { acceptedNow } from "@/lib/policyRules";
import { recordAcceptance } from "@/lib/policies";

/** Records that the signed-in person accepted the current versions they were shown. */
export async function acceptPolicies(sent: Record<string, string>): Promise<{ error?: string }> {
  const ctx = await getCtx();
  const docs = acceptedNow(sent);
  if (!docs) return { error: "These terms changed again. Reload the page." };
  try {
    await recordAcceptance(ctx.userId, docs, "notice");
    return {};
  } catch {
    return { error: "Couldn't save that. Try again." };
  }
}
