"use server";

import { redirect } from "next/navigation";
import { getCtx } from "@/lib/session";
import { appUrl } from "@/lib/channels";
import { backTo, cleanAuthorize, mcpUrlOf } from "@/lib/oauth/rules";
import { connectableWorkspaces, createCode, getClient } from "@/lib/oauth/store";

/** Allow or Cancel on the consent page. Everything is checked again here, since the form came from the browser. */
export async function decide(form: FormData) {
  const q = Object.fromEntries(["client_id", "redirect_uri", "response_type", "code_challenge", "code_challenge_method", "state", "resource"].map((k) => [k, String(form.get(k) ?? "") || undefined]));
  const client = await getClient(q.client_id ?? "");
  const c = cleanAuthorize(q, client?.redirectUris ?? null, mcpUrlOf(appUrl()));
  if (!c.ok) {
    if (c.redirect) redirect(backTo(q.redirect_uri!, { error: c.error, error_description: c.description, state: q.state ?? "" }));
    throw new Error(c.description);
  }
  const { ask } = c;
  if (form.get("decision") !== "allow") redirect(backTo(ask.redirectUri, { error: "access_denied", error_description: "You cancelled", state: ask.state }));
  const ctx = await getCtx();
  const workspaceId = String(form.get("workspace") ?? "");
  const allowed = await connectableWorkspaces(ctx.userId);
  if (!allowed.some((w) => w.id === workspaceId)) throw new Error("Pick a workspace you can use");
  const code = await createCode({ clientId: ask.clientId, workspaceId, userId: ctx.userId, redirectUri: ask.redirectUri, challenge: ask.challenge, resource: ask.resource });
  redirect(backTo(ask.redirectUri, { code, state: ask.state }));
}
