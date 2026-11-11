#!/usr/bin/env node
// capybaroar: Capybaroar from the terminal. Add --json to any command for machine-readable output.
import { parseArgs } from "node:util";
import { accessToken, baseUrl, login, logout } from "./auth.js";

const { Capybaroar } = await import("@capybaroar/sdk").catch(() => import("../sdk/index.js"));

const HELP = `capybaroar <command> [options]

  login                         Sign in through the browser
  logout                        Forget the saved sign-in
  channels                      Your channels and their ids
  posts [--from ISO] [--to ISO] Posts in a range (the next 30 days by default)
  post <text> --to <channels>   Write a post. --to takes channel ids or networks (x,linkedin)
       [--at ISO|best] [--now] [--queue] [--draft]
       [--thread <text>]...     A thread's next posts, in order
       [--campaign <id>] [--media <id>]...
  delete <post id> [--everywhere]
  queue                         The next free queue time
  campaigns                     Campaigns with their counts
  analytics [--days 7|30|90]    Results for a period

  --json                        Print JSON
  CAPYBAROAR_API_KEY            Use an API key instead of signing in`;

const { values: o, positionals: args } = parseArgs({
  allowPositionals: true,
  options: {
    json: { type: "boolean" },
    from: { type: "string" },
    to: { type: "string" },
    at: { type: "string" },
    now: { type: "boolean" },
    queue: { type: "boolean" },
    draft: { type: "boolean" },
    thread: { type: "string", multiple: true },
    media: { type: "string", multiple: true },
    campaign: { type: "string" },
    everywhere: { type: "boolean" },
    days: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});

const out = (data, human) => console.log(o.json ? JSON.stringify(data, null, 2) : human(data));
const client = async () => new Capybaroar({ accessToken: await accessToken(), baseUrl: baseUrl() });

/** Channel ids, or networks that stand for every channel on them. */
async function channelIds(capy, spec) {
  const all = await capy.channels();
  const ids = [];
  for (const s of spec.split(",").map((x) => x.trim()).filter(Boolean)) {
    const hit = all.filter((c) => c.id === s || c.network === s.toLowerCase());
    if (!hit.length) throw new Error(`No channel or network called ${s}. Run capybaroar channels.`);
    ids.push(...hit.map((c) => c.id));
  }
  return [...new Set(ids)];
}

async function main() {
  const [cmd, ...rest] = args;
  if (!cmd || o.help) return console.log(HELP);
  if (cmd === "login") return login().then(() => console.log("Signed in."));
  if (cmd === "logout") return logout().then(() => console.log("Signed out."));
  const capy = await client();
  if (cmd === "channels") return out(await capy.channels(), (cs) => cs.map((c) => `${c.id}  ${c.network_name.padEnd(14)} ${c.name}${c.status === "reconnect" ? "  (reconnect)" : ""}`).join("\n") || "No channels yet");
  if (cmd === "posts") return out(await capy.posts({ from: o.from, to: o.to }), (ps) => ps.map((p) => `${p.id}  ${(p.publish_at ?? "").slice(0, 16).replace("T", " ")}  ${p.status.padEnd(10)} ${p.text.replace(/\s+/g, " ").slice(0, 60)}`).join("\n") || "No posts in this range");
  if (cmd === "post") {
    const text = rest.join(" ");
    if (!text || !o.to) throw new Error("Usage: capybaroar post <text> --to <channels>");
    const mode = o.draft ? "draft" : o.now ? "now" : o.queue ? "queue" : "schedule";
    const at = o.at ?? (mode === "schedule" || mode === "draft" ? "best" : undefined);
    const p = await capy.createPost({ channel_ids: await channelIds(capy, o.to), text, mode, ...(at ? { publish_at: at } : {}), ...(o.thread?.length ? { thread: o.thread } : {}), ...(o.media?.length ? { media_ids: o.media } : {}), ...(o.campaign ? { campaign_id: o.campaign } : {}) });
    return out(p, (x) => `${x.status === "draft" ? "Saved" : "Scheduled"} ${x.id} for ${x.publish_at ?? "now"}`);
  }
  if (cmd === "delete") {
    if (!rest[0]) throw new Error("Usage: capybaroar delete <post id> [--everywhere]");
    return out(await capy.deletePost(rest[0], { everywhere: !!o.everywhere }), () => "Deleted");
  }
  if (cmd === "queue") return out({ publish_at: await capy.nextQueueSlot() }, (x) => x.publish_at);
  if (cmd === "campaigns") return out(await capy.campaigns(), (cs) => cs.map((c) => `${c.id}  ${c.name}  ${c.scheduled} scheduled, ${c.published} published, ${c.engagements} engagements`).join("\n") || "No campaigns yet");
  if (cmd === "analytics") return out(await capy.analytics({ days: Number(o.days ?? 30) }), (a) => JSON.stringify(a, null, 2));
  throw new Error(`Unknown command ${cmd}. Run capybaroar --help.`);
}

main().catch((e) => {
  console.error(e.message ?? String(e));
  process.exit(1);
});
