import "server-only";
import { createHmac } from "node:crypto";
import { adminClient } from "./supabase/server";
import { safeMeta, type AuditEvent } from "./auditRules";

export type { AuditAction, AuditEvent } from "./auditRules";

// Recording the audit log (036_audit_log.sql). Call it right after the change it describes succeeds, and await it.

const ipSalt = () => process.env.AUDIT_SALT || process.env.BIO_SALT || process.env.TOKEN_KEY || "";
/** The IP as a keyed hash: the same address gives the same value, so repeats show, but the address isn't stored. */
const ipHash = (ip?: string | null) => (ip ? createHmac("sha256", ipSalt()).update(ip).digest("base64url").slice(0, 32) : null);

/** Writes one event, tried 3 times. Never throws: a failed write is logged, and the change it describes stands. */
export async function audit(ev: AuditEvent): Promise<boolean> {
  const row = {
    workspace_id: ev.workspaceId,
    actor_id: ev.actorId ?? null,
    actor_kind: ev.actorKind ?? (ev.actorId ? "user" : "system"),
    actor_label: ev.actorLabel?.slice(0, 200) ?? null,
    action: ev.action,
    target_type: ev.target?.type?.slice(0, 40) ?? null,
    target_id: ev.target?.id ? String(ev.target.id).slice(0, 100) : null,
    target_label: ev.target?.label?.slice(0, 200) ?? null,
    meta: safeMeta(ev.meta),
    ip_hash: ipHash(ev.ip),
  };
  for (let i = 1; i <= 3; i++) {
    const { error } = await adminClient().from("audit_events").insert(row);
    if (!error) return true;
    if (i === 3) {
      console.error("audit:", ev.action, error.message);
      return false;
    }
    await new Promise((r) => setTimeout(r, 200 * i));
  }
  return false;
}
