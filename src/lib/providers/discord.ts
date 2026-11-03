import { AuthError, PostError, type Account, type Provider } from "./types";

// Discord: a channel webhook (Server settings, Integrations, Webhooks). No bot and no sign-in.
const HOOK = /^https:\/\/(?:discord\.com|discordapp\.com)\/api\/(?:v\d+\/)?webhooks\/(\d+)\/([\w-]+)\/?$/;
// Verify: Discord's default upload limit is 10 MB per file on servers without boosts (it was 25 MB before 2024).
const MAX_FILE = 10 * 1024 * 1024;
const MAX_FILES = 10;

type Webhook = { id: string; name?: string | null; channel_id?: string; guild_id?: string | null };
type Message = { id: string; channel_id: string; guild_id?: string };

async function errorOf(res: Response, what: string) {
  const text = (await res.text()).slice(0, 300);
  let msg = text;
  try {
    msg = (JSON.parse(text) as { message?: string }).message ?? text;
  } catch {
    // not JSON
  }
  return `${what}: ${res.status} ${msg}`;
}

export const discord: Provider = {
  network: "discord",
  form: {
    configured: () => true,
    fields: [{ key: "webhook", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/...", secret: true }],
    connect: async (values): Promise<Account[]> => {
      const url = (values.webhook ?? "").trim().split(/[?#]/)[0];
      if (!HOOK.test(url)) throw new PostError("Enter a Discord webhook URL, like https://discord.com/api/webhooks/...");
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (res.status === 401 || res.status === 403 || res.status === 404) throw new PostError("This Discord webhook doesn't exist or was deleted");
      if (!res.ok) throw new Error(await errorOf(res, "Discord webhook"));
      const w = (await res.json()) as Webhook;
      return [
        {
          accountId: w.id,
          name: w.name || "Discord webhook",
          accessToken: url,
          extra: { channel_id: w.channel_id ?? null, guild_id: w.guild_id ?? null },
        },
      ];
    },
  },
  check: (p) => {
    if ([...p.text].length > 2000) return "Discord messages are up to 2000 characters";
    if (p.media.length > MAX_FILES) return "Discord takes up to 10 files";
    if (p.media.some((m) => m.size > MAX_FILE)) return "Discord files must be under 10 MB";
    if (!p.text.trim() && !p.media.length) return "Discord messages need text or files";
    return null;
  },
  publish: async (s, _accountId, p) => {
    const files = p.media.slice(0, MAX_FILES);
    const fd = new FormData();
    const attachments = files.map((m, i) => ({ id: i, filename: m.name, ...(m.alt?.trim() ? { description: m.alt.trim().slice(0, 1024) } : {}) }));
    fd.append("payload_json", JSON.stringify({ content: p.text, attachments }));
    for (const [i, m] of files.entries()) {
      const bytes = await m.bytes();
      if (bytes.length > MAX_FILE) throw new PostError(`Discord files must be under 10 MB (${m.name})`);
      fd.append(`files[${i}]`, new Blob([new Uint8Array(bytes)], { type: m.mime }), m.name);
    }
    const res = await fetch(`${s.accessToken}?wait=true`, { method: "POST", body: fd, signal: AbortSignal.timeout(120000) });
    if (!res.ok) {
      const msg = await errorOf(res, "Discord post");
      // A deleted webhook answers 404 (Unknown Webhook): the channel must be connected again.
      if (res.status === 401 || res.status === 404) throw new AuthError(msg);
      if (res.status === 400 || res.status === 403 || res.status === 413 || res.status === 422) throw new PostError(msg);
      throw new Error(msg);
    }
    // The message is out: a body we can't read must not turn into a retry.
    const m = (await res.json().catch(() => null)) as Message | null;
    if (!m?.id) return { id: `${s.extra?.channel_id ?? "discord"}:${Date.now()}`, url: null, note: "Discord didn't return the message id" };
    const guild = m.guild_id ?? (typeof s.extra?.guild_id === "string" ? s.extra.guild_id : null);
    return { id: m.id, url: guild ? `https://discord.com/channels/${guild}/${m.channel_id}/${m.id}` : null };
  },
  // Without the message id (publish kept "{channel}:{time}") there is nothing to delete.
  unpublishable: (_s, r) => (/^\d+$/.test(r.id) ? null : "Discord didn't return this message's id"),
  // DELETE /webhooks/{id}/{token}/messages/{message.id}: 204. A 404 is either the message (10008, already deleted)
  // or the webhook itself (10015, the channel must be connected again).
  unpublish: async (s, _accountId, r) => {
    const res = await fetch(`${s.accessToken.replace(/\/$/, "")}/messages/${r.id}`, { method: "DELETE", signal: AbortSignal.timeout(30000) });
    if (res.ok) return;
    const body = await res.text();
    let code = 0;
    try {
      code = Number((JSON.parse(body) as { code?: number }).code ?? 0);
    } catch {
      // not JSON
    }
    if (res.status === 404 && code === 10008) return;
    const msg = `Discord delete: ${res.status} ${body.slice(0, 300)}`;
    if (res.status === 401 || (res.status === 404 && code === 10015)) throw new AuthError(msg);
    if (res.status === 403) throw new PostError(msg);
    throw new Error(msg);
  },
};
