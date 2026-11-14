// The audit log, the pure half: which actions exist, how they read, and the CSV download. No Supabase, so tests run it.

/** Every action the log records, with how Settings shows it. Add new ones here first. */
export const AUDIT_ACTIONS = {
  "auth.sign_in": "Signed in",
  "auth.sign_in_failed": "Sign-in failed",
  "auth.password_reset": "Reset their password",
  "auth.mfa_enabled": "Turned on 2FA",
  "auth.mfa_disabled": "Turned off 2FA",
  "auth.mfa_required": "Changed the 2FA rule",
  "member.invited": "Invited someone",
  "member.invite_withdrawn": "Withdrew an invite",
  "member.joined": "Joined the workspace",
  "member.role_changed": "Changed a role",
  "member.brands_changed": "Changed someone's brands",
  "member.removed": "Removed someone",
  "member.left": "Left the workspace",
  "brand.created": "Added a brand",
  "brand.renamed": "Renamed a brand",
  "brand.deleted": "Deleted a brand",
  "brand.approval_changed": "Changed approvals",
  "brand.review_link_changed": "Changed a review link",
  "channel.connected": "Connected a channel",
  "channel.removed": "Removed a channel",
  "channel.moved": "Moved a channel to a brand",
  "post.deleted": "Deleted a post",
  "post.deleted_everywhere": "Deleted a post on the networks",
  "post.edited_live": "Edited a published post",
  "media.deleted": "Deleted a file",
  "api_key.created": "Made an API key",
  "api_key.deleted": "Deleted an API key",
  "app.connected": "Connected an app",
  "app.disconnected": "Disconnected an app",
  "webhook.created": "Added a webhook",
  "webhook.changed": "Changed a webhook",
  "webhook.deleted": "Deleted a webhook",
  "billing.plan_changed": "Changed the plan",
  "billing.limit_changed": "Changed a credit limit",
  "workspace.renamed": "Renamed the workspace",
  "workspace.settings_changed": "Changed workspace settings",
  "workspace.deletion_requested": "Asked to delete the workspace",
  "data.exported": "Exported data",
  "account.deleted": "Deleted their account",
} as const;
export type AuditAction = keyof typeof AUDIT_ACTIONS;
export const isAuditAction = (v: string): v is AuditAction => v in AUDIT_ACTIONS;
export const actionLabel = (a: string) => (isAuditAction(a) ? AUDIT_ACTIONS[a] : a);

export type AuditEvent = {
  workspaceId: string | null;
  actorId?: string | null;
  actorKind?: "user" | "api" | "app" | "review_link" | "system";
  actorLabel?: string | null;
  action: AuditAction;
  target?: { type: string; id?: string | null; label?: string | null } | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
};

const SECRET = /(token|secret|password|key|authorization|cookie)/i;
/** Meta without anything that looks like a secret, with short values, so the log never stores a credential. */
export function safeMeta(meta: Record<string, unknown> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta).slice(0, 20)) {
    if (SECRET.test(k)) continue;
    if (v == null || typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (typeof v === "string") out[k] = v.slice(0, 200);
    else if (Array.isArray(v)) out[k] = v.slice(0, 20).map((x) => (typeof x === "string" ? x.slice(0, 100) : x));
    else out[k] = JSON.stringify(v).slice(0, 200);
  }
  return out;
}

export type AuditRow = { created_at: string; actor_label: string | null; actor_kind: string; action: string; target_type: string | null; target_label: string | null; meta: Record<string, unknown> };

/** One CSV cell: quoted, with formulas defused so a spreadsheet never runs what someone typed into a name. */
export function csvCell(v: unknown): string {
  let s = v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function auditCsv(rows: AuditRow[]): string {
  const head = ["Time (UTC)", "Who", "Kind", "Action", "Target type", "Target", "Details"];
  const lines = rows.map((r) => [r.created_at, r.actor_label ?? "", r.actor_kind, actionLabel(r.action), r.target_type ?? "", r.target_label ?? "", Object.keys(r.meta ?? {}).length ? r.meta : ""].map(csvCell).join(","));
  return [head.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}
