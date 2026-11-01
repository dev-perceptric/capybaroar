import "server-only";
import nodemailer from "nodemailer";
import { adminClient } from "./supabase/server";
import { appUrl } from "./channels";
import { networkOf, type NetworkId } from "./networks";
import type { TargetCtx } from "./publisher";

// Emails owners and admins when a post fails or a channel needs reconnecting. Each failure is sent once
// (alerts table); a channel's reconnect alert at most once a day. Off until SMTP_HOST is set.
let transport: nodemailer.Transporter | null = null;
const mailer = () =>
  (transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  }));

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function html(title: string, body: string, button: string, href: string) {
  return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;color:#0A0A0A;max-width:520px">
<p style="font-size:13px;font-weight:600;letter-spacing:.18em">CAPYBAROAR</p>
<h1 style="font-size:20px;font-weight:600">${esc(title)}</h1>
<p style="font-size:14px;color:#737373;line-height:1.5">${esc(body)}</p>
<p><a href="${href}" style="display:inline-block;background:#FFE100;color:#0A0A0A;border:1px solid #0A0A0A;padding:10px 16px;text-decoration:none;font-weight:600;font-size:13px">${esc(button)}</a></p>
</div>`;
}

export async function sendAlert(kind: "post_failed" | "reconnect", t: Pick<TargetCtx, "workspaceId" | "channelId" | "channelName" | "network"> & { id?: string; postId?: string }, error: string) {
  if (!process.env.SMTP_HOST) return;
  try {
    const db = adminClient();
    const ref = kind === "post_failed" ? t.id! : `${t.channelId}:${new Date().toISOString().slice(0, 10)}`;
    const { error: dup } = await db.from("alerts").insert({ workspace_id: t.workspaceId, kind, ref });
    if (dup) return; // already sent
    const { data: members } = await db.from("members").select("user_id").eq("workspace_id", t.workspaceId).in("role", ["owner", "admin"]);
    const emails: string[] = [];
    for (const m of members ?? []) {
      const { data } = await db.auth.admin.getUserById(m.user_id as string);
      if (data.user?.email) emails.push(data.user.email);
    }
    if (!emails.length) return;
    const net = networkOf(t.network as NetworkId)?.name ?? t.network;
    const mail =
      kind === "post_failed"
        ? { subject: `A post to ${t.channelName} didn't go out`, html: html(`A post to ${t.channelName} (${net}) didn't go out`, error, "Open the calendar", `${appUrl()}/calendar`) }
        : { subject: `Reconnect ${t.channelName}`, html: html(`Reconnect ${t.channelName} (${net})`, `${net} stopped accepting posts from Capybaroar: ${error}. Scheduled posts to it wait until you reconnect.`, "Reconnect", `${appUrl()}/channels`) };
    await mailer().sendMail({ from: process.env.ALERT_FROM || process.env.SMTP_USER, to: emails, ...mail });
  } catch (e) {
    console.error("alert:", e instanceof Error ? e.message : e);
  }
}
