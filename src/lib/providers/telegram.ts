import { PostError, call, isVideo, type Account, type MediaFile, type Provider, type Secret } from "./types";

// Telegram: one Capybaroar bot for every customer. People add it as an admin of their channel or group.
const botToken = () => process.env.TELEGRAM_BOT_TOKEN ?? "";
const method = (name: string) => `https://api.telegram.org/bot${botToken()}/${name}`;

type Res<T> = { ok: boolean; result: T; description?: string };
type Chat = { id: number; type: string; title?: string; username?: string; first_name?: string };
type Message = { message_id: number };

async function tg<T>(name: string, body: Record<string, unknown>, what: string): Promise<T> {
  const r = await call<Res<T>>(method(name), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, { what });
  if (!r.ok) throw new PostError(`${what}: ${r.description ?? "failed"}`);
  return r.result;
}

/** "https://t.me/name", "t.me/name", "name" or "@name" → "@name"; numeric ids stay as they are. */
function chatRef(raw: string) {
  const v = (raw ?? "").trim().replace(/^https?:\/\//i, "").replace(/^(www\.)?(t|telegram)\.me\//i, "").replace(/\/.*$/, "");
  if (/^-?\d+$/.test(v)) return v;
  const name = v.replace(/^@/, "");
  if (!/^[A-Za-z0-9_]{4,32}$/.test(name)) throw new PostError("Enter a channel like @yourchannel");
  return `@${name}`;
}

const isGif = (m: MediaFile) => m.mime === "image/gif";
const CAPTION = 1024;

/** Link to a message: public chats by username, private supergroups and channels by their id (members only). */
function link(chatId: string, username: unknown, id: number) {
  if (typeof username === "string" && username) return `https://t.me/${username}/${id}`;
  if (chatId.startsWith("-100")) return `https://t.me/c/${chatId.slice(4)}/${id}`;
  return null;
}

export const telegram: Provider = {
  network: "telegram",
  form: {
    configured: () => Boolean(botToken()),
    fields: [{ key: "chat", label: "Channel or group", placeholder: "@yourchannel" }],
    connect: async (values): Promise<Account[]> => {
      const ref = chatRef(values.chat);
      const me = await tg<{ id: number; username: string }>("getMe", {}, "Telegram bot");
      const notReachable = new PostError(`Add @${me.username} as an admin of the channel first`);
      const chat = await tg<Chat>("getChat", { chat_id: ref }, "Telegram channel").catch((e) => {
        if (e instanceof PostError) throw notReachable;
        throw e;
      });
      const member = await tg<{ status: string; can_post_messages?: boolean }>("getChatMember", { chat_id: chat.id, user_id: me.id }, "Telegram channel").catch((e) => {
        if (e instanceof PostError) throw notReachable;
        throw e;
      });
      if (member.status !== "administrator" && member.status !== "creator") throw notReachable;
      if (chat.type === "channel" && member.can_post_messages === false) throw new PostError(`Let @${me.username} post messages in the channel's admin rights`);
      return [
        {
          accountId: String(chat.id),
          name: chat.title || chat.first_name || chat.username || String(chat.id),
          username: chat.username ?? null,
          accessToken: "bot",
          extra: { username: chat.username ?? null, type: chat.type },
        },
      ];
    },
  },
  check: (p) => {
    if ([...p.text].length > 4096) return "Telegram posts are up to 4096 characters";
    if (p.media.length > 10) return "Telegram takes up to 10 files";
    if (p.media.length > 1 && p.media.some(isGif)) return "Telegram albums can't hold GIFs";
    // Verify: Telegram fetches files by url up to 5 MB for photos and 20 MB for other files.
    if (p.media.some((m) => !isVideo(m) && !isGif(m) && m.size > 5 * 1024 * 1024)) return "Telegram pictures must be under 5 MB";
    if (p.media.some((m) => (isVideo(m) || isGif(m)) && m.size > 20 * 1024 * 1024)) return "Telegram videos must be under 20 MB";
    if (!p.text.trim() && !p.media.length) return "Telegram posts need text or media";
    return null;
  },
  publish: async (s: Secret, chatId, p) => {
    const url = (id: number) => link(chatId, s.extra?.username, id);
    if (!p.media.length) {
      const m = await tg<Message>("sendMessage", { chat_id: chatId, text: p.text, link_preview_options: { is_disabled: false } }, "Telegram post");
      return { id: String(m.message_id), url: url(m.message_id) };
    }
    const fits = [...p.text].length <= CAPTION;
    const caption = fits && p.text ? { caption: p.text } : {};
    let first: number;
    if (p.media.length === 1) {
      const m = p.media[0];
      const [name, field] = isGif(m) ? ["sendAnimation", "animation"] : isVideo(m) ? ["sendVideo", "video"] : ["sendPhoto", "photo"];
      const msg = await tg<Message>(name, { chat_id: chatId, [field]: m.url, ...caption, ...(isVideo(m) ? { supports_streaming: true } : {}) }, "Telegram post");
      first = msg.message_id;
    } else {
      const media = p.media.slice(0, 10).map((m, i) => ({ type: isVideo(m) ? "video" : "photo", media: m.url, ...(i === 0 ? caption : {}) }));
      const msgs = await tg<Message[]>("sendMediaGroup", { chat_id: chatId, media }, "Telegram post");
      first = msgs[0].message_id;
    }
    const out = { id: String(first), url: url(first) };
    if (fits || !p.text) return out;
    // The text is too long for a caption: it follows as a reply. The post is already out, so never throw here.
    try {
      await tg<Message>("sendMessage", { chat_id: chatId, text: p.text, reply_parameters: { message_id: first }, link_preview_options: { is_disabled: false } }, "Telegram text");
      return out;
    } catch (e) {
      return { ...out, note: `The text after the media wasn't sent: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
  // Telegram lets a bot delete its messages for 48 hours; after that only an admin with "Delete messages" can, in a
  // channel or supergroup. A basic group or a private chat has no such right, so it's done in Telegram.
  unpublishable: (s, r) => {
    if (!/^\d+$/.test(r.id)) return "Capybaroar didn't keep this message's id";
    const old = r.at && Date.now() - r.at.getTime() > 48 * 3600000;
    return old && s.extra?.type !== "channel" && s.extra?.type !== "supergroup" ? "Delete it in Telegram" : null;
  },
  // deleteMessage for the first message. An album's other pictures and a long text's follow-up weren't kept.
  unpublish: async (_s, chatId, r) => {
    try {
      await tg<boolean>("deleteMessage", { chat_id: chatId, message_id: Number(r.id) }, "Telegram delete");
    } catch (e) {
      if (e instanceof PostError && /message to delete not found/i.test(e.message)) return;
      if (e instanceof PostError && /can't be deleted/i.test(e.message)) throw new PostError("Telegram won't let the bot delete this message. Delete it in Telegram.");
      throw e;
    }
    const more = r.media > 1 || (r.media > 0 && [...r.text].length > CAPTION);
    return more ? { note: "Only the first message was deleted. Delete the rest in Telegram." } : undefined;
  },
  // editMessageText for a text post, editMessageCaption for media (an album's caption is on its first message).
  // Text too long for a caption went out as a second message whose id wasn't kept, so that one is edited in Telegram.
  edit: async (_s, chatId, r, p) => {
    if (!/^\d+$/.test(r.id)) throw new PostError("Capybaroar didn't keep this message's id");
    const length = [...p.text].length;
    const message_id = Number(r.id);
    if (!r.media) {
      if (!p.text.trim()) throw new PostError("Telegram posts need text or media");
      if (length > 4096) throw new PostError("Telegram posts are up to 4096 characters");
    } else {
      if ([...r.text].length > CAPTION) throw new PostError("Telegram sent this text as its own message. Edit it in Telegram.");
      if (length > CAPTION) throw new PostError(`Telegram captions are up to ${CAPTION} characters`);
    }
    try {
      if (!r.media) await tg<Message | boolean>("editMessageText", { chat_id: chatId, message_id, text: p.text, link_preview_options: { is_disabled: false } }, "Telegram edit");
      else await tg<Message | boolean>("editMessageCaption", { chat_id: chatId, message_id, caption: p.text }, "Telegram edit");
    } catch (e) {
      // The same text again: nothing to change.
      if (e instanceof PostError && /message is not modified/i.test(e.message)) return;
      throw e;
    }
  },
  followers: async (_s, chatId) => {
    const n = await tg<number>("getChatMemberCount", { chat_id: chatId }, "Telegram members");
    return typeof n === "number" ? n : null;
  },
};
