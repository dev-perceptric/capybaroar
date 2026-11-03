import "server-only";
import { randomBytes } from "node:crypto";
import { hostname } from "node:os";
import { adminClient } from "./supabase/server";
import { open as unseal, seal } from "./crypto";
import { HOOK_TIMEOUT_MS, HOOK_TRIES, MAX_HOOKS, afterDelivery, afterTry, sign, type HookEvent } from "./api/hookRules";
import { BlockedAddress, safeRequest } from "./api/fetchSafe";

// Webhooks: tell a workspace's own URLs what happened. emit() only writes deliveries and never throws, so nothing
// that emits can fail because of a webhook. deliverDue() runs on its own loop, ten at a time side by side.
const WORKER = `${hostname()}:${process.pid}`;

export type WebhookRow = { id: string; url: string; events: string[]; enabled: boolean; failures: number; last_status: number | null; last_error: string | null; last_delivered_at: string | null; created_at: string };
const COLS = "id, url, events, enabled, failures, last_status, last_error, last_delivered_at, created_at";

export async function listWebhooks(workspaceId: string): Promise<WebhookRow[]> {
  const { data, error } = await adminClient().from("webhooks").select(COLS).eq("workspace_id", workspaceId).order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as WebhookRow[];
}

/** Add a webhook. Its signing secret comes back once. */
export async function createWebhook(workspaceId: string, userId: string, url: URL, events: string[]): Promise<{ webhook: WebhookRow; secret: string }> {
  const db = adminClient();
  const { count } = await db.from("webhooks").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId);
  if ((count ?? 0) >= MAX_HOOKS) throw new Error(`A workspace can have up to ${MAX_HOOKS} webhooks. Delete one first.`);
  const secret = `whsec_${randomBytes(24).toString("base64url")}`;
  const { data, error } = await db.from("webhooks").insert({ workspace_id: workspaceId, created_by: userId, url: url.toString(), events, secret: seal(secret) }).select(COLS).single();
  if (error) throw new Error(error.message);
  return { webhook: data as WebhookRow, secret };
}

export async function deleteWebhook(workspaceId: string, id: string) {
  const { data, error } = await adminClient().from("webhooks").delete().eq("id", id).eq("workspace_id", workspaceId).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Webhook not found");
}

/** Turn a webhook on or off. On again starts its failure count over. */
export async function setWebhookOn(workspaceId: string, id: string, on: boolean) {
  const { data, error } = await adminClient().from("webhooks").update({ enabled: on, ...(on ? { failures: 0 } : {}) }).eq("id", id).eq("workspace_id", workspaceId).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Webhook not found");
}

const body = (type: string, workspaceId: string, data: Record<string, unknown>) => {
  const id = `evt_${randomBytes(12).toString("hex")}`;
  return { id, text: JSON.stringify({ id, type, created_at: new Date().toISOString(), workspace_id: workspaceId, data }) };
};

/** Send a ping to one webhook now, whatever events it has, to check the URL works. */
export async function testWebhook(workspaceId: string, id: string) {
  const { data: h } = await adminClient().from("webhooks").select("id").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (!h) throw new Error("Webhook not found");
  const b = body("ping", workspaceId, { message: "A test from Capybaroar" });
  const { error } = await adminClient().from("webhook_deliveries").insert({ webhook_id: id, workspace_id: workspaceId, event: "ping", event_id: b.id, body: b.text, max_attempts: 1 });
  if (error) throw new Error(error.message);
}

/** Queue this event for every webhook of the workspace that wants it. Never throws. */
export async function emit(workspaceId: string, type: HookEvent, data: Record<string, unknown>) {
  try {
    const db = adminClient();
    const { data: hooks, error } = await db.from("webhooks").select("id, events").eq("workspace_id", workspaceId).eq("enabled", true);
    if (error) throw new Error(error.message);
    const want = (hooks ?? []).filter((h) => (h.events as string[]).includes(type));
    if (!want.length) return;
    const b = body(type, workspaceId, data);
    const { error: e2 } = await db.from("webhook_deliveries").insert(want.map((h) => ({ webhook_id: h.id, workspace_id: workspaceId, event: type, event_id: b.id, body: b.text, max_attempts: HOOK_TRIES })));
    if (e2) throw new Error(e2.message);
  } catch (e) {
    console.error(`[webhooks] couldn't queue ${type}:`, e instanceof Error ? e.message : e);
  }
}

type Delivery = { id: number; webhook_id: string; event: string; event_id: string; body: string; attempts: number; max_attempts: number };

async function deliverOne(d: Delivery) {
  const db = adminClient();
  const { data: h } = await db.from("webhooks").select("url, secret, enabled, failures").eq("id", d.webhook_id).maybeSingle();
  if (!h || (!h.enabled && d.event !== "ping")) {
    await db.from("webhook_deliveries").update({ done_at: new Date().toISOString(), locked_at: null, error: "The webhook is off or was deleted" }).eq("id", d.id);
    return;
  }
  let status: number | null = null;
  let error: string | null = null;
  try {
    const res = await safeRequest(new URL(h.url as string), {
      method: "POST",
      body: d.body,
      timeoutMs: HOOK_TIMEOUT_MS,
      headers: { "content-type": "application/json", "capybaroar-event": d.event, "capybaroar-delivery": d.event_id, "capybaroar-signature": sign(unseal(h.secret as string), d.body) },
    });
    res.body.resume();
    status = res.status;
    if (status < 200 || status >= 300) error = `Answered ${status}`;
  } catch (e) {
    error = e instanceof BlockedAddress ? e.message : `Couldn't reach it: ${e instanceof Error ? e.message : String(e)}`;
  }
  const next = afterTry(d.attempts, status);
  const tries = Math.min(d.max_attempts, HOOK_TRIES);
  const now = new Date().toISOString();
  if (!next.done && d.attempts < tries) {
    await db.from("webhook_deliveries").update({ run_after: new Date(Date.now() + next.waitMs).toISOString(), locked_at: null, status, error }).eq("id", d.id);
    await db.from("webhooks").update({ last_status: status, last_error: error }).eq("id", d.webhook_id);
    return;
  }
  const ok = next.done && next.ok;
  await db.from("webhook_deliveries").update({ done_at: now, locked_at: null, status, error }).eq("id", d.id);
  // A test ping says how the URL answered, without counting toward turning the webhook off.
  if (d.event === "ping") {
    await db.from("webhooks").update({ last_status: status, last_error: error, ...(ok ? { last_delivered_at: now } : {}) }).eq("id", d.webhook_id);
    return;
  }
  const f = afterDelivery(h.failures as number, ok);
  await db
    .from("webhooks")
    .update({ failures: f.failures, last_status: status, last_error: error, ...(ok ? { last_delivered_at: now } : {}), ...(f.off ? { enabled: false } : {}) })
    .eq("id", d.webhook_id);
}

/** Claim due deliveries and send them side by side. Returns how many were claimed. */
export async function deliverDue(n = 10): Promise<number> {
  const { data, error } = await adminClient().rpc("claim_webhook_deliveries", { worker: WORKER, n });
  if (error) throw new Error(error.message);
  const list = (data ?? []) as Delivery[];
  await Promise.all(list.map((d) => deliverOne(d).catch((e) => console.error("[webhooks] delivery", d.id, e instanceof Error ? e.message : e))));
  return list.length;
}

/** Finished deliveries are history: keep a week. */
export async function pruneDeliveries() {
  await adminClient().from("webhook_deliveries").delete().lt("done_at", new Date(Date.now() - 7 * 86400000).toISOString());
}
