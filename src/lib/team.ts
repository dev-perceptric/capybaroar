import "server-only";
import { adminClient } from "./supabase/server";
import { assertCanAddMember } from "./billing";
import { hashToken, newToken, open, seal } from "./crypto";
import { appUrl } from "./channels";
import { emailsOf, sendEmail } from "./alerts";
import { LIMITS, hashed, retryIn, take } from "./limits";
import type { Ctx, Role } from "./session";
import { record } from "./auditActor";

// The people in a workspace and the invites waiting for them. Owners and admins manage both (checked by callers).
export type Member = { userId: string; name: string; email: string; role: Role; brandIds: string[] | null };
export type Invite = { id: string; email: string; role: Role; brandIds: string[] | null; expiresAt: string; link: string | null };

const INVITE_ROLES: Role[] = ["admin", "editor", "client"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inviteUrl = (token: string) => `${appUrl()}/invite/${token}`;

/** A member as an audit target: their email. */
const memberTarget = async (userId: string) => ({ type: "member", id: userId, label: (await emailsOf([userId]).catch(() => []))[0] ?? null });

/** Brand names for the log, or "All brands". */
async function brandNames(workspaceId: string, ids: string[] | null) {
  if (!ids) return "All brands";
  const { data } = await adminClient().from("brands").select("name").eq("workspace_id", workspaceId).in("id", ids);
  return (data ?? []).map((b) => b.name as string);
}

export async function listMembers(workspaceId: string): Promise<Member[]> {
  const db = adminClient();
  const { data, error } = await db.from("members").select("user_id, role, brand_ids").eq("workspace_id", workspaceId).order("created_at");
  if (error) throw new Error(error.message);
  const out: Member[] = [];
  for (const m of data ?? []) {
    const { data: u } = await db.auth.admin.getUserById(m.user_id as string);
    const email = u.user?.email ?? "";
    const name = (u.user?.user_metadata?.name as string | undefined) || email.split("@")[0] || "Member";
    out.push({ userId: m.user_id as string, name, email, role: m.role as Role, brandIds: (m.brand_ids as string[] | null) ?? null });
  }
  return out;
}

/** Invites not yet accepted and not expired, newest first. */
export async function listInvites(workspaceId: string): Promise<Invite[]> {
  const { data, error } = await adminClient()
    .from("invites")
    .select("id, email, role, brand_ids, expires_at, token")
    .eq("workspace_id", workspaceId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    let link: string | null = null;
    try {
      link = inviteUrl(open(r.token as string));
    } catch {
      // sealed with an older key: invite again for a new link
    }
    return { id: r.id as string, email: r.email as string, role: r.role as Role, brandIds: (r.brand_ids as string[] | null) ?? null, expiresAt: r.expires_at as string, link };
  });
}

/** Only this workspace's brands; null (or every brand) means all brands. */
async function cleanBrands(workspaceId: string, brandIds: string[] | null) {
  if (!brandIds) return null;
  const { data } = await adminClient().from("brands").select("id").eq("workspace_id", workspaceId);
  const all = (data ?? []).map((b) => b.id as string);
  const keep = [...new Set(brandIds)].filter((id) => all.includes(id));
  if (!keep.length) throw new Error("Pick at least one brand");
  return keep.length === all.length ? null : keep;
}

/** Invite someone by email. Emails the link when mail is set up; the link is returned either way. */
export async function createInvite(ctx: Ctx, input: { email: string; role: Role; brandIds: string[] | null }): Promise<{ link: string; emailed: boolean }> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 320) throw new Error("Enter an email address");
  if (!INVITE_ROLES.includes(input.role)) throw new Error("Pick a role");
  const brandIds = await cleanBrands(ctx.workspaceId, input.brandIds);
  const members = await listMembers(ctx.workspaceId);
  if (members.some((m) => m.email.toLowerCase() === email)) throw new Error(`${email} is already a member`);
  // At most 20 invites a workspace a day, and an address gets its invite and 3 more a day, from any workspace.
  // Checked before the open invite is replaced, so a refused one leaves it as it was.
  const ws = await take(`invite-ws:${ctx.workspaceId}`, LIMITS.inviteWorkspaceDay);
  if (ws) throw new Error(`Daily limit of ${LIMITS.inviteWorkspaceDay.max} invites reached. ${retryIn(ws)}`);
  const to = await take(hashed("invite-to", email), LIMITS.inviteAddressDay);
  if (to) throw new Error(`${email} was invited too many times today. ${retryIn(to)}`);
  const db = adminClient();
  // A new invite to the same address replaces the open one.
  await db.from("invites").delete().eq("workspace_id", ctx.workspaceId).eq("email", email).is("accepted_at", null);
  await assertCanAddMember(ctx.workspaceId, input.role);
  const token = newToken();
  const { error } = await db.from("invites").insert({ workspace_id: ctx.workspaceId, email, role: input.role, brand_ids: brandIds, token_hash: hashToken(token), token: seal(token), invited_by: ctx.userId });
  if (error) throw new Error(error.message);
  const link = inviteUrl(token);
  await record({ workspaceId: ctx.workspaceId, action: "member.invited", target: { type: "invite", label: email }, meta: { role: input.role, brands: await brandNames(ctx.workspaceId, brandIds).catch(() => null) } }, ctx);
  const emailed = await sendEmail([email], `${ctx.name} invited you to ${ctx.workspaceName} on Capybaroar`, {
    title: `Join ${ctx.workspaceName} on Capybaroar`,
    body: `${ctx.name} invited you to ${ctx.workspaceName}. The invite is open for 7 days.`,
    button: "Join",
    href: link,
  });
  return { link, emailed };
}

export async function revokeInvite(workspaceId: string, id: string) {
  const { data, error } = await adminClient().from("invites").delete().eq("id", id).eq("workspace_id", workspaceId).is("accepted_at", null).select("email, role");
  if (error) throw new Error(error.message);
  for (const r of data ?? []) await record({ workspaceId, action: "member.invite_withdrawn", target: { type: "invite", id, label: r.email as string }, meta: { role: r.role as string } });
}

async function memberRow(workspaceId: string, userId: string) {
  const { data } = await adminClient().from("members").select("role").eq("workspace_id", workspaceId).eq("user_id", userId).maybeSingle();
  if (!data) throw new Error("Member not found");
  return data.role as Role;
}

/** Change a member's role. The owner's role stays; nobody changes their own. */
export async function setMemberRole(ctx: Ctx, userId: string, role: Role) {
  if (!INVITE_ROLES.includes(role)) throw new Error("Pick a role");
  if (userId === ctx.userId) throw new Error("You can't change your own role");
  const cur = await memberRow(ctx.workspaceId, userId);
  if (cur === "owner") throw new Error("The owner's role can't change");
  if (cur === role) return;
  if (cur === "client") await assertCanAddMember(ctx.workspaceId, role);
  const { error } = await adminClient().from("members").update({ role }).eq("workspace_id", ctx.workspaceId).eq("user_id", userId);
  if (error) throw new Error(error.message);
  await record({ workspaceId: ctx.workspaceId, action: "member.role_changed", target: await memberTarget(userId), meta: { from: cur, to: role } }, ctx);
}

/** Which brands a member sees (null: all). Owners and admins always see every brand. */
export async function setMemberBrands(ctx: Ctx, userId: string, brandIds: string[] | null) {
  const cur = await memberRow(ctx.workspaceId, userId);
  if (cur === "owner") throw new Error("The owner sees every brand");
  const keep = await cleanBrands(ctx.workspaceId, brandIds);
  const { error } = await adminClient().from("members").update({ brand_ids: keep }).eq("workspace_id", ctx.workspaceId).eq("user_id", userId);
  if (error) throw new Error(error.message);
  await record({ workspaceId: ctx.workspaceId, action: "member.brands_changed", target: await memberTarget(userId), meta: { to: await brandNames(ctx.workspaceId, keep).catch(() => null) } }, ctx);
}

export async function removeMember(ctx: Ctx, userId: string) {
  if (userId === ctx.userId) throw new Error("You can't remove yourself");
  const role = await memberRow(ctx.workspaceId, userId);
  if (role === "owner") throw new Error("The owner can't be removed");
  const target = await memberTarget(userId);
  const { error } = await adminClient().from("members").delete().eq("workspace_id", ctx.workspaceId).eq("user_id", userId);
  if (error) throw new Error(error.message);
  await record({ workspaceId: ctx.workspaceId, action: "member.removed", target, meta: { role } }, ctx);
}

export type OpenInvite = { id: string; workspaceId: string; workspaceName: string; email: string; role: Role; inviter: string | null; state: "open" | "accepted" | "expired" };

/** The invite behind a link, or null when there is none (revoked or never existed). */
export async function inviteByToken(token: string): Promise<OpenInvite | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const db = adminClient();
  const { data } = await db.from("invites").select("id, workspace_id, email, role, invited_by, expires_at, accepted_at, workspaces(name)").eq("token_hash", hashToken(token)).maybeSingle();
  if (!data) return null;
  const inviter = data.invited_by ? ((await emailsOf([data.invited_by as string]))[0] ?? null) : null;
  return {
    id: data.id as string,
    workspaceId: data.workspace_id as string,
    workspaceName: (data.workspaces as unknown as { name: string }).name,
    email: data.email as string,
    role: data.role as Role,
    inviter,
    state: data.accepted_at ? "accepted" : new Date(data.expires_at as string).getTime() < Date.now() ? "expired" : "open",
  };
}

/** Join the invite's workspace as the signed-in user. Returns the workspace id. */
export async function acceptInvite(token: string, user: { id: string; email: string }): Promise<string> {
  const db = adminClient();
  const { data: inv } = await db.from("invites").select("id, workspace_id, email, role, brand_ids, expires_at, accepted_at, accepted_by").eq("token_hash", hashToken(token)).maybeSingle();
  if (!inv) throw new Error("This invite was withdrawn");
  const ws = inv.workspace_id as string;
  if (inv.accepted_at) {
    if (inv.accepted_by === user.id) return ws;
    throw new Error("This invite was already used");
  }
  if (new Date(inv.expires_at as string).getTime() < Date.now()) throw new Error("This invite has expired. Ask for a new one.");
  if ((inv.email as string).toLowerCase() !== user.email.toLowerCase()) throw new Error(`This invite is for ${inv.email}. Sign in with that address.`);
  const { data: already } = await db.from("members").select("role").eq("workspace_id", ws).eq("user_id", user.id).maybeSingle();
  if (!already) {
    await assertCanAddMember(ws, inv.role as string, false);
    const { error } = await db.from("members").insert({ workspace_id: ws, user_id: user.id, role: inv.role, brand_ids: inv.brand_ids ?? null });
    if (error && error.code !== "23505") throw new Error(error.message);
    if (!error) await record({ workspaceId: ws, action: "member.joined", target: { type: "member", id: user.id, label: user.email }, meta: { role: inv.role as string } }, { id: user.id, kind: "user", label: user.email });
  }
  await db.from("invites").update({ accepted_at: new Date().toISOString(), accepted_by: user.id }).eq("id", inv.id).is("accepted_at", null);
  return ws;
}
