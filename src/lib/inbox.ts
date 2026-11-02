import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { adminClient } from "./supabase/server";
import { providerOf } from "./providers";
import { AuthError, type InboxKind, type InboxRef } from "./providers/types";
import { networkOf, type NetworkId } from "./networks";
import { supabaseStore } from "./runner";
import { sendAlert } from "./alerts";
import { assertCanUseAgent } from "./billing";

// The Inbox screen: threads to answer, one thread's messages, and answering, liking, hiding and closing them.
// Reading from the networks happens in the runner (`inbox` jobs); here only what a person does.

const MODEL = "claude-opus-5-5";

export type InboxStatus = "open" | "done";

export type Item = {
  id: string;
  channel_id: string;
  kind: InboxKind;
  network_id: string;
  thread_id: string;
  parent_id: string | null;
  target_id: string | null;
  post_remote_id: string | null;
  post_url: string | null;
  post_text: string | null;
  url: string | null;
  author_id: string | null;
  author_name: string;
  author_handle: string | null;
  author_avatar: string | null;
  text: string;
  created_at: string;
  mine: boolean;
  status: InboxStatus;
  liked: boolean;
  like_ref: string | null;
  hidden: boolean;
  reply_text: string | null;
  replied_at: string | null;
  extra: Record<string, string>;
};

const COLS =
  "id, channel_id, kind, network_id, thread_id, parent_id, target_id, post_remote_id, post_url, post_text, url, author_id, author_name, author_handle, author_avatar, text, created_at, mine, status, liked, like_ref, hidden, reply_text, replied_at, extra";

/** One row in the list: a thread, shown by its newest message. */
export type ThreadRow = { key: string; channelId: string; threadId: string; last: Item; count: number; open: number };

export type Filters = { channelIds?: string[] | null; channelId?: string | null; kind?: InboxKind | null; status: InboxStatus; q?: string };

/** The newest threads that match. Reads the 400 newest matching items and groups them by thread. */
export async function listThreads(workspaceId: string, f: Filters): Promise<ThreadRow[]> {
  let q = adminClient().from("inbox_items").select(COLS).eq("workspace_id", workspaceId).eq("mine", false).eq("status", f.status).order("created_at", { ascending: false }).limit(400);
  if (f.channelId) q = q.eq("channel_id", f.channelId);
  if (f.channelIds) q = q.in("channel_id", f.channelIds);
  if (f.kind) q = q.eq("kind", f.kind);
  // Characters that mean something in PostgREST's or() and in LIKE patterns are dropped from the search.
  const term = (f.q ?? "").replace(/[%_,()*\\"'.:]/g, " ").trim().slice(0, 100);
  if (term) q = q.or(`text.ilike.%${term}%,author_name.ilike.%${term}%,author_handle.ilike.%${term}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = new Map<string, ThreadRow>();
  for (const it of (data ?? []) as Item[]) {
    const key = `${it.channel_id}:${it.thread_id}`;
    const r = rows.get(key);
    if (r) {
      r.count++;
      if (it.status === "open") r.open++;
    } else rows.set(key, { key, channelId: it.channel_id, threadId: it.thread_id, last: it, count: 1, open: it.status === "open" ? 1 : 0 });
  }
  return [...rows.values()];
}

export type Thread = { items: Item[]; post: { text: string | null; url: string | null } };

/** Every message in one thread, oldest first, with the post it's under. */
export async function getThread(workspaceId: string, channelId: string, threadId: string): Promise<Thread> {
  const db = adminClient();
  const { data, error } = await db.from("inbox_items").select(COLS).eq("workspace_id", workspaceId).eq("channel_id", channelId).eq("thread_id", threadId).order("created_at").limit(300);
  if (error) throw new Error(error.message);
  const items = (data ?? []) as Item[];
  const withPost = items.find((i) => i.target_id || i.post_url || i.post_text);
  let text = withPost?.post_text ?? null;
  let url = withPost?.post_url ?? null;
  if (withPost?.target_id) {
    const { data: t } = await db.from("post_targets").select("text, url, posts(text)").eq("id", withPost.target_id).eq("workspace_id", workspaceId).maybeSingle();
    if (t) {
      text = (t.text as string | null) ?? (t.posts as unknown as { text: string } | null)?.text ?? text;
      url = (t.url as string | null) ?? url;
    }
  }
  return { items, post: { text, url } };
}

/** The channel ids in these brands, or null for every channel. */
export async function channelsIn(workspaceId: string, scope: string[] | null): Promise<string[] | null> {
  if (!scope) return null;
  if (!scope.length) return [];
  const { data } = await adminClient().from("channels").select("id").eq("workspace_id", workspaceId).in("brand_id", scope);
  return (data ?? []).map((c) => c.id as string);
}

/** The channel an item belongs to, to check the person may act on it. */
export async function itemChannel(workspaceId: string, id: string): Promise<string | null> {
  const { data } = await adminClient().from("inbox_items").select("channel_id").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  return (data?.channel_id as string | undefined) ?? null;
}

/** Open items in the workspace (or these brands), for the sidebar. */
export async function openCount(workspaceId: string, scope: string[] | null = null): Promise<number> {
  const ids = await channelsIn(workspaceId, scope);
  if (ids && !ids.length) return 0;
  let q = adminClient().from("inbox_items").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "open").eq("mine", false);
  if (ids) q = q.in("channel_id", ids);
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

/** Whether anything ever arrived, to show the first screen until it does. */
export async function hasItems(workspaceId: string, channelIds: string[] | null = null): Promise<boolean> {
  if (channelIds && !channelIds.length) return false;
  let q = adminClient().from("inbox_items").select("id").eq("workspace_id", workspaceId);
  if (channelIds) q = q.in("channel_id", channelIds);
  const { data } = await q.limit(1);
  return Boolean(data?.length);
}

async function itemOf(workspaceId: string, id: string): Promise<Item> {
  const { data, error } = await adminClient().from("inbox_items").select(COLS).eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This message is gone");
  return data as Item;
}

type Chan = { id: string; workspace_id: string; network: NetworkId; account_id: string; name: string; avatar: string | null; status: string };

/** Runs one network call for an item's channel. A bad sign-in marks the channel for reconnecting, like publishing. */
async function onNetwork<T>(item: Item, run: (p: NonNullable<ReturnType<typeof providerOf>>, ch: Chan, ref: InboxRef, secret: Awaited<ReturnType<typeof supabaseStore.secret>>) => Promise<T>) {
  const { data: ch } = await adminClient().from("channels").select("id, workspace_id, network, account_id, name, avatar, status").eq("id", item.channel_id).maybeSingle();
  if (!ch) throw new Error("This channel was removed");
  const c = ch as Chan;
  if (c.status === "reconnect") throw new Error(`Reconnect ${c.name} first`);
  const p = providerOf(c.network);
  if (!p?.inbox) throw new Error(`${networkOf(c.network).name} has no Inbox`);
  const ref: InboxRef = {
    networkId: item.network_id,
    kind: item.kind,
    threadId: item.thread_id,
    parentId: item.parent_id,
    postRemoteId: item.post_remote_id,
    authorId: item.author_id,
    authorHandle: item.author_handle,
    likeRef: item.like_ref,
    extra: item.extra ?? {},
  };
  try {
    const secret = await supabaseStore.secret(c.id, p);
    return { out: await run(p, c, ref, secret), channel: c };
  } catch (e) {
    if (e instanceof AuthError) {
      await supabaseStore.reconnect(c.id);
      await sendAlert("reconnect", { channelId: c.id, workspaceId: c.workspace_id, channelName: c.name, network: c.network }, e.message);
      throw new Error(`Reconnect ${c.name}: ${e.message}`);
    }
    throw e;
  }
}

/** Answer an item on its network. The answer joins the thread, and the thread is done. */
export async function replyTo(workspaceId: string, userId: string, itemId: string, text: string) {
  const body = text.trim();
  if (!body) throw new Error("Write a reply");
  const item = await itemOf(workspaceId, itemId);
  const db = adminClient();
  const { out, channel } = await onNetwork(item, (p, ch, ref, secret) => {
    const limit = networkOf(ch.network).limit;
    if ([...body].length > limit) throw new Error(`${networkOf(ch.network).name} replies are up to ${limit.toLocaleString("en-US")} characters`);
    return p.inbox!.reply(secret, ch.account_id, ref, body);
  });
  const now = new Date().toISOString();
  // The reply is out: from here, saving it must not report a failure (sending again would answer twice).
  try {
    await db.from("inbox_items").update({ reply_text: body, replied_at: now, replied_by: userId, status: "done" }).eq("id", item.id);
    await db.from("inbox_items").update({ status: "done" }).eq("channel_id", item.channel_id).eq("thread_id", item.thread_id).eq("status", "open").eq("mine", false).lte("created_at", now);
    if (out.id)
      await db.from("inbox_items").upsert(
        {
          workspace_id: workspaceId,
          channel_id: item.channel_id,
          kind: item.kind === "dm" ? "dm" : "reply",
          network_id: out.id,
          thread_id: item.thread_id,
          parent_id: item.network_id,
          target_id: item.target_id,
          post_remote_id: item.post_remote_id,
          post_url: item.post_url,
          url: out.url ?? null,
          author_id: channel.account_id,
          author_name: channel.name,
          author_avatar: channel.avatar,
          text: body,
          created_at: now,
          mine: true,
          status: "done",
          replied_by: userId,
        },
        { onConflict: "channel_id,network_id", ignoreDuplicates: true },
      );
  } catch (e) {
    console.error("inbox reply save:", e instanceof Error ? e.message : e);
  }
}

export async function setLiked(workspaceId: string, itemId: string, on: boolean) {
  const item = await itemOf(workspaceId, itemId);
  const { out } = await onNetwork(item, (p, ch, ref, secret) => {
    if (!p.inbox!.like) throw new Error(`${networkOf(ch.network).name} doesn't allow likes from here`);
    return p.inbox!.like(secret, ch.account_id, ref, on);
  });
  const { error } = await adminClient().from("inbox_items").update({ liked: on, like_ref: on ? (out ?? null) : null }).eq("id", item.id);
  if (error) throw new Error(error.message);
}

export async function setHidden(workspaceId: string, itemId: string, on: boolean) {
  const item = await itemOf(workspaceId, itemId);
  await onNetwork(item, (p, ch, ref, secret) => {
    if (!p.inbox!.hide) throw new Error(`${networkOf(ch.network).name} doesn't allow hiding from here`);
    return p.inbox!.hide(secret, ch.account_id, ref, on);
  });
  const { error } = await adminClient().from("inbox_items").update({ hidden: on }).eq("id", item.id);
  if (error) throw new Error(error.message);
}

/** Mark a whole thread done, or open again. */
export async function setThreadStatus(workspaceId: string, channelId: string, threadId: string, status: InboxStatus) {
  const { error } = await adminClient().from("inbox_items").update({ status }).eq("workspace_id", workspaceId).eq("channel_id", channelId).eq("thread_id", threadId).eq("mine", false);
  if (error) throw new Error(error.message);
}

const SUGGEST = `You write replies to comments and messages that people sent to a brand's social media account, inside Capybaroar.
- Reply with the reply text only: no quotes, no notes, no options, no preamble.
- Keep it short: one or two sentences, like a person answering on the network. No hashtags. At most one emoji, only if the brand's posts use them.
- Write in the brand's voice, taken from its recent posts. Answer in the language the person wrote in.
- Never invent facts, prices, dates, links, policies, availability or promises. If an answer needs a fact you don't have, thank them and say the team will follow up, or ask them to send a direct message.
- Stay polite and calm, even when the message is rude. Don't argue.`;

/** A draft answer for the newest message in a thread, from Claude, for the person to edit before sending. */
export async function suggestReply(workspaceId: string, itemId: string): Promise<string> {
  await assertCanUseAgent(workspaceId);
  const item = await itemOf(workspaceId, itemId);
  const db = adminClient();
  const [{ items, post }, { data: ch }, { data: recent }] = await Promise.all([
    getThread(workspaceId, item.channel_id, item.thread_id),
    db.from("channels").select("name, network").eq("id", item.channel_id).single(),
    db.from("post_targets").select("text, posts(text)").eq("channel_id", item.channel_id).eq("status", "published").order("published_at", { ascending: false }).limit(5),
  ]);
  const network = ch ? networkOf(ch.network as NetworkId) : null;
  const voice = (recent ?? [])
    .map((r) => ((r.text as string | null) ?? (r.posts as unknown as { text: string } | null)?.text ?? "").trim())
    .filter(Boolean)
    .map((t) => `<post>${t.slice(0, 1200)}</post>`)
    .join("\n");
  const convo = items
    .slice(-20)
    .map((i) => `<message from="${i.mine ? "brand" : (i.author_name || "someone").replace(/"/g, "")}">${i.text.slice(0, 2000)}</message>`)
    .join("\n");
  const system = [SUGGEST, ch ? `The account is ${ch.name} on ${network?.name}. Replies there are up to ${network?.limit} characters.` : ""].filter(Boolean).join("\n");
  const content = [
    voice ? `The brand's recent posts:\n${voice}` : "",
    post.text ? `The post they're answering:\n<post>${post.text.slice(0, 2000)}</post>` : item.kind === "dm" ? "This is a direct message." : "",
    `The conversation, oldest first:\n${convo}`,
    "Write the brand's reply to the last message.",
  ]
    .filter(Boolean)
    .join("\n\n");
  const res = await new Anthropic().beta.messages.create({
    model: MODEL,
    // Thinking is always on with this model and counts toward max_tokens; low effort suits a short reply.
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content }],
    betas: ["server-side-fallback-2026-07-01"],
    ...({ fallbacks: "default", output_config: { effort: "low" } } as object),
  } as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (res.stop_reason === "refusal") throw new Error("Claude can't suggest a reply to this");
  const out = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("")
    .trim();
  if (!out) throw new Error("No reply came back, try again");
  return out;
}

/** Why reading stopped on a channel (a permission the network wants), by channel id. */
export async function inboxErrors(channelIds: string[]): Promise<Record<string, string>> {
  if (!channelIds.length) return {};
  const { data } = await adminClient().from("inbox_state").select("channel_id, error").in("channel_id", channelIds).not("error", "is", null);
  return Object.fromEntries((data ?? []).map((r) => [r.channel_id as string, r.error as string]));
}
