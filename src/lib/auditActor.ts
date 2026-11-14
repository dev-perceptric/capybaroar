import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { audit } from "./audit";
import { trustedIp } from "./clientIp";
import { adminClient, userClient } from "./supabase/server";
import { recordSafely, type Actor } from "./auditLogRules";
import type { AuditEvent } from "./auditRules";

// Who a change is recorded as. The shared lib functions call record() right after their change succeeds, so the app,
// the REST API, MCP and the agent all log the same way. The actor is, in order:
// 1. the one a request runs as (runAs: the API marks key and app requests, so they log as "api" or "app"),
// 2. the one the caller passes (a Ctx, or SYSTEM for Stripe),
// 3. the signed-in person of the request, from the session cookie,
// 4. otherwise the system.

export type { Actor } from "./auditLogRules";
export { SYSTEM } from "./auditLogRules";

const store = new AsyncLocalStorage<Actor>();

/** Run `fn` with every event it records credited to `actor`. */
export const runAs = <T,>(actor: Actor, fn: () => Promise<T>): Promise<T> => store.run(actor, fn);

/** The person behind a Ctx (or anything with a user id and email). */
export const userActor = (p: { userId: string; email?: string | null; name?: string | null }): Actor => ({ id: p.userId, kind: "user", label: p.email || p.name || null });

/** The client IP of the request being served, or null outside a request. */
export async function requestIp(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    return trustedIp(await headers()) || null;
  } catch {
    return null;
  }
}

async function sessionActor(): Promise<Actor | null> {
  try {
    const { data } = await (await userClient()).auth.getClaims();
    const c = data?.claims;
    return c?.sub ? { id: c.sub, kind: "user", label: (c.email as string | undefined) || null } : null;
  } catch {
    return null;
  }
}

type Who = Actor | { userId: string; email?: string | null; name?: string | null } | null | undefined;
const asActor = (w: Who): Actor | null => (!w ? null : "kind" in w ? w : userActor(w));

/** Record one event, after the change it describes succeeded. Never throws and never waits more than 5 seconds. */
export function record(ev: Omit<AuditEvent, "actorId" | "actorKind" | "actorLabel" | "ip">, by?: Who): Promise<boolean> {
  return recordSafely(ev, {
    actor: async () => store.getStore() ?? asActor(by) ?? (await sessionActor()),
    labelOf: async (id) => (await adminClient().auth.admin.getUserById(id)).data.user?.email ?? null,
    ip: requestIp,
    write: audit,
  });
}

/** A post as a target: its first words, read before it's deleted. Never throws. */
export async function postTarget(workspaceId: string, postId: string) {
  try {
    const { data } = await adminClient().from("posts").select("text").eq("id", postId).eq("workspace_id", workspaceId).maybeSingle();
    return { type: "post", id: postId, label: snippet((data?.text as string | undefined) ?? "") };
  } catch {
    return { type: "post", id: postId, label: null };
  }
}

export const snippet = (text: string, n = 80) => {
  const t = text.replace(/\s+/g, " ").trim();
  return !t ? null : t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
