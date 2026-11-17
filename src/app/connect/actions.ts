"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { claimLink, cookieAge, endLink, linkSession } from "@/lib/partner";
import { CONNECT_COOKIE, LINK_MESSAGES, readConnectCookie } from "@/lib/partnerRules";

/** Claim a connect link for this browser: from now on only this browser can use it. */
export async function startLink(token: string): Promise<{ error?: string }> {
  const r = await claimLink(token);
  if ("problem" in r) return { error: LINK_MESSAGES[r.problem].title };
  (await cookies()).set(CONNECT_COOKIE, `${r.link.id}.${r.secret}`, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: cookieAge(r.link) });
  redirect("/connect");
}

/** Close the link. The page then says it's done. */
export async function finishLink(): Promise<void> {
  const s = await linkSession(readConnectCookie((await cookies()).get(CONNECT_COOKIE)?.value));
  if ("link" in s) await endLink(s.link.id);
  redirect("/connect");
}
