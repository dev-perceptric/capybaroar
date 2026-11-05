"use client";

import { creditBlock } from "@/lib/creditRules";
import { askConfirm, tell } from "./Dialogs";

/** When an AI action failed because the plan has no AI or credits ran short, asks to open Billing (and opens it).
 *  Returns true when it handled the message, so the caller shows nothing else. */
export async function creditGate(message: string | null | undefined, canManage = true): Promise<boolean> {
  const block = creditBlock(message);
  if (!block) return false;
  const title = block === "upgrade" ? "AI comes with paid plans" : "Out of credits";
  if (!canManage) {
    await tell(title, block === "upgrade" ? "Ask an owner or admin to upgrade." : "Ask an owner or admin to buy credits.");
    return true;
  }
  if (await askConfirm(title, { body: message ?? undefined, ok: block === "upgrade" ? "See plans" : "Buy credits" })) window.location.assign("/settings?tab=billing");
  return true;
}
