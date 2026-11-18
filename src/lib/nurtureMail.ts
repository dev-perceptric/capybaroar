// Getting-started emails (src/lib/nurture.ts): the layout and the words. Pure, so tests/nurture.test.ts and
// scripts/nurture-previews.ts run it. Each email opens with a yellow hero (the brand's one accent, always a fill with
// ink on it): a kicker, the title and one big visual. Then one short list on white and the dark gray pill button.
// Built for mail apps: tables, inline styles, a PNG wordmark, light only. Which one goes out when: nurturePlan.ts.

const FONT = "Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const INK = "#0A0A0A";
const BODY = "#525252";
const FAINT = "#8A8A8A";
const LINE = "#EDEDED";
const SHELL = "#F5F5F5";
const BRAND = "#333333";
const YELLOW = "#FFD202";
const ON_YELLOW = "#262209";
const YELLOW_SOFT = "#FFF6C7";
const LOGO = "https://capybaroar.com/brand/wordmark-light@2x.png";

export type Mail = { subject: string; html: string; text: string };
export type Foot = { unsubscribe: string; settings: string };
export type Sign = { name: string; role?: string };

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const n = (x: number) => Math.round(x).toLocaleString("en-US");
const plural = (x: number, one: string, many = `${one}s`) => `${n(x)} ${x === 1 ? one : many}`;
const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const table = (inner: string, style = "") => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${style}">${inner}</table>`;

/** Badge tones (soft fill, deep text). */
const TAGS = { green: ["#E3F4EC", "#086444"], yellow: [YELLOW_SOFT, ON_YELLOW], gray: ["#EDEDED", "#262626"], blue: ["#E2EFFD", "#1E4F9A"], purple: ["#E9E3FD", "#5429D6"] } as const;
type Tone = keyof typeof TAGS;
const tag = (text: string, tone: Tone) =>
  `<span style="display:inline-block;background:${TAGS[tone][0]};color:${TAGS[tone][1]};font-family:${FONT};font-size:12px;line-height:18px;font-weight:500;border-radius:6px;padding:1px 8px;white-space:nowrap">${esc(text)}</span>`;

/** Each network's own color, for its dot. */
const NET: Record<string, string> = {
  LinkedIn: "#0A66C2", Instagram: "#E1306C", Facebook: "#1877F2", TikTok: "#111111", YouTube: "#FF0000", X: "#111111", Threads: "#111111",
  Pinterest: "#E60023", Bluesky: "#0085FF", Mastodon: "#6364FF", "Google Business": "#34A853", Reddit: "#FF4500",
};

// ─────────────── hero visuals (ink on yellow) ───────────────

function big(value: string, label: string) {
  return `<div style="font-family:${FONT};font-size:64px;line-height:66px;font-weight:700;letter-spacing:-0.045em;color:${ON_YELLOW};font-variant-numeric:tabular-nums">${esc(value)}</div>
<div style="padding-top:6px;font-family:${FONT};font-size:14px;line-height:20px;color:${ON_YELLOW};opacity:0.75">${esc(label)}</div>`;
}

function stats(items: { n: string; label: string }[]) {
  const w = Math.floor(100 / Math.max(1, items.length));
  const td = items
    .map((i, k) => `<td width="${w}%" valign="top" style="padding:0 ${k < items.length - 1 ? 6 : 0}px 0 0">${table(`<tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;border-radius:14px;padding:14px 10px 12px 12px"><div style="font-family:${FONT};font-size:26px;line-height:32px;font-weight:700;letter-spacing:-0.03em;color:${INK};font-variant-numeric:tabular-nums">${esc(i.n)}</div><div style="margin-top:2px;font-family:${FONT};font-size:12px;line-height:16px;color:${BODY}">${esc(i.label)}</div></td></tr>`)}</td>`)
    .join("");
  return table(`<tr>${td}</tr>`);
}

function progress(done: number, total: number, label: string) {
  const pct = Math.min(100, Math.max(4, Math.round((done / (total || 1)) * 100)));
  return `<div style="padding-bottom:10px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:600;color:${ON_YELLOW}">${esc(label)}</div>
${table(`<tr><td width="${pct}%" bgcolor="${ON_YELLOW}" style="background:${ON_YELLOW};height:8px;border-radius:4px;font-size:0;line-height:0">&nbsp;</td>${pct < 100 ? `<td bgcolor="#E6BD00" style="background:#E6BD00;height:8px;border-radius:4px;font-size:0;line-height:0">&nbsp;</td>` : ""}</tr>`)}`;
}

/** A post as a little card, the way the calendar shows one. */
function postCard(when: string, line: string) {
  return table(
    `<tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;border-radius:14px;padding:16px">
<div style="font-family:${FONT};font-size:12px;line-height:16px;font-weight:600;color:${BODY}">${esc(when)}</div>
<div style="padding-top:8px;font-family:${FONT};font-size:15px;line-height:22px;color:${INK}">${esc(line)}</div>
${table(`<tr><td width="70%" style="padding-top:12px"><div style="height:8px;border-radius:4px;background:${LINE};font-size:0;line-height:0">&nbsp;</div></td><td></td></tr><tr><td width="45%" style="padding-top:8px"><div style="height:8px;border-radius:4px;background:${LINE};font-size:0;line-height:0">&nbsp;</div></td><td></td></tr>`)}
</td></tr>`,
  );
}

/** A link-in-bio page in miniature. */
function bioCard(name: string) {
  const row = `<tr><td style="padding-top:8px"><div style="height:30px;line-height:30px;border-radius:999px;background:${SHELL};font-size:0">&nbsp;</div></td></tr>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="220"><tr><td bgcolor="#FFFFFF" align="center" style="background:#FFFFFF;border-radius:16px;padding:18px 16px">
<div style="width:44px;height:44px;line-height:44px;border-radius:22px;background:${ON_YELLOW};color:${YELLOW};font-family:${FONT};font-size:16px;font-weight:700;text-align:center;margin:0 auto">${esc(name.slice(0, 1).toUpperCase())}</div>
<div style="padding-top:8px;font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:${INK}">${esc(name)}</div>
${table(row + row + row)}
</td></tr></table>`;
}

function person(name: string, role?: string) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td><div style="width:52px;height:52px;line-height:52px;border-radius:26px;background:${ON_YELLOW};color:${YELLOW};font-family:${FONT};font-size:18px;font-weight:700;text-align:center">${esc(ini)}</div></td>
<td style="padding-left:14px"><div style="font-family:${FONT};font-size:15px;line-height:22px;font-weight:600;color:${ON_YELLOW}">${esc(name)}</div>${role ? `<div style="font-family:${FONT};font-size:13px;line-height:18px;color:${ON_YELLOW};opacity:0.75">${esc(role)}</div>` : ""}</td></tr></table>`;
}

// ─────────────── body parts ───────────────

function steps(items: { title: string; done: boolean }[]) {
  return table(
    items
      .map((s, i) => {
        const mark = s.done
          ? `<div style="width:24px;height:24px;line-height:24px;border-radius:12px;background:${YELLOW};color:${ON_YELLOW};font-family:${FONT};font-size:13px;font-weight:700;text-align:center">&#10003;</div>`
          : `<div style="width:22px;height:22px;line-height:22px;border-radius:12px;border:1px solid #DADADA;color:${FAINT};font-family:${FONT};font-size:12px;font-weight:600;text-align:center">${i + 1}</div>`;
        return `<tr><td width="38" style="padding:11px 0;border-top:1px solid ${LINE}">${mark}</td><td style="padding:11px 0;border-top:1px solid ${LINE};font-family:${FONT};font-size:14px;line-height:20px;font-weight:500;color:${s.done ? FAINT : INK}">${esc(s.title)}</td></tr>`;
      })
      .join(""),
  );
}

function tagged(rows: { main: string; tag: string; tone: Tone }[]) {
  return table(rows.map((r) => `<tr><td style="padding:12px 0;border-top:1px solid ${LINE};font-family:${FONT};font-size:14px;line-height:20px;font-weight:500;color:${INK}">${esc(r.main)}</td><td align="right" style="padding:12px 0 12px 16px;border-top:1px solid ${LINE}">${tag(r.tag, r.tone)}</td></tr>`).join(""));
}

function rows(items: { main: string; side?: string }[]) {
  return table(items.map((r) => `<tr><td style="padding:12px 0;border-top:1px solid ${LINE};font-family:${FONT};font-size:14px;line-height:20px;font-weight:500;color:${INK}">${esc(r.main)}</td>${r.side ? `<td align="right" valign="top" style="padding:12px 0 12px 16px;border-top:1px solid ${LINE};font-family:${FONT};font-size:13px;line-height:20px;color:${FAINT};white-space:nowrap">${esc(r.side)}</td>` : ""}</tr>`).join(""));
}

/** Networks as chips with their color, wrapping on a phone. */
function networks(names: string[]) {
  return `<div style="font-size:0;line-height:0">${names
    .map((nm) => `<span style="display:inline-block;margin:0 6px 8px 0;border:1px solid ${LINE};border-radius:999px;padding:6px 12px;white-space:nowrap"><span style="display:inline-block;width:8px;height:8px;border-radius:8px;background:${NET[nm] ?? INK};vertical-align:middle"></span><span style="padding-left:6px;font-family:${FONT};font-size:13px;line-height:18px;font-weight:500;color:${INK};vertical-align:middle">${esc(nm)}</span></span>`)
    .join("")}</div>`;
}

function compare(cols: string[], body: { label: string; values: string[] }[], pick: number) {
  const w = Math.floor(60 / Math.max(1, cols.length));
  const head = `<tr><td style="padding:0 0 10px"></td>${cols.map((c, i) => `<td width="${w}%" align="center" style="padding:0 4px 10px;font-family:${FONT};font-size:13px;line-height:18px;font-weight:600;color:${i === pick ? ON_YELLOW : FAINT}">${i === pick ? `<span style="display:inline-block;background:${YELLOW};color:${ON_YELLOW};border-radius:999px;padding:3px 10px">${esc(c)}</span>` : esc(c)}</td>`).join("")}</tr>`;
  return table(
    head +
      body
        .map((r) => `<tr><td style="padding:11px 0;border-top:1px solid ${LINE};font-family:${FONT};font-size:13px;line-height:18px;color:${FAINT}">${esc(r.label)}</td>${r.values.map((v, i) => `<td align="center" style="padding:11px 4px;border-top:1px solid ${LINE};font-family:${FONT};font-size:14px;line-height:20px;color:${INK};font-weight:${i === pick ? 600 : 400}">${esc(v)}</td>`).join("")}</tr>`)
        .join(""),
  );
}

const label = (t: string) => `<p style="margin:0 0 4px;font-family:${FONT};font-size:13px;line-height:18px;font-weight:500;color:${FAINT}">${esc(t)}</p>`;
const para = (t: string) => `<p style="margin:0;font-family:${FONT};font-size:15px;line-height:24px;color:${BODY}">${esc(t)}</p>`;
const note = (html: string) => `<p style="margin:16px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${FAINT}">${html}</p>`;

function button(text: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0"><tr><td bgcolor="${BRAND}" style="background:${BRAND};border-radius:999px"><a href="${esc(href)}" target="_blank" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:15px;line-height:18px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:999px">${esc(text)}&nbsp;&nbsp;&rarr;</a></td></tr></table>`;
}

// ─────────────── the whole email ───────────────

function layout(o: { preheader: string; kicker: string; title: string; sub?: string; visual?: string; body: string; button: { label: string; url: string }; after?: string }, f: Foot) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:${SHELL};-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${SHELL}">${esc(o.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${SHELL}" style="background:${SHELL}"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
<tr><td style="padding:0 4px 22px"><img src="${LOGO}" width="136" alt="Capybaroar" style="display:block;border:0;width:136px;height:auto"></td></tr>
<tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;border-radius:20px;box-shadow:0 0 0 1px #E6E6E6,0 24px 48px -24px rgba(0,0,0,0.18)">
${table(`<tr><td bgcolor="${YELLOW}" style="background:${YELLOW};border-radius:20px 20px 0 0;padding:32px 32px 30px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px"><tr><td bgcolor="${ON_YELLOW}" style="background:${ON_YELLOW};border-radius:999px;padding:5px 12px;font-family:${FONT};font-size:12px;line-height:16px;font-weight:600;color:${YELLOW}">${esc(o.kicker)}</td></tr></table>
<h1 style="margin:0;font-family:${FONT};font-size:30px;line-height:36px;font-weight:700;letter-spacing:-0.03em;color:${ON_YELLOW}">${esc(o.title)}</h1>
${o.sub ? `<p style="margin:10px 0 0;font-family:${FONT};font-size:15px;line-height:22px;color:${ON_YELLOW};opacity:0.8">${esc(o.sub)}</p>` : ""}
${o.visual ? `<div style="padding-top:26px">${o.visual}</div>` : ""}
</td></tr>
<tr><td style="padding:28px 32px 36px">${o.body}${button(o.button.label, o.button.url)}${o.after ?? ""}</td></tr>`)}
</td></tr>
<tr><td style="padding:22px 4px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${FAINT}">You get getting-started tips because you made this workspace. <a href="${esc(f.unsubscribe)}" style="color:${BODY};text-decoration:underline">Turn them off</a>&nbsp;&nbsp;<a href="${esc(f.settings)}" style="color:${BODY};text-decoration:underline">Settings</a><br><br>Capybaroar, every social channel from one calendar.</td></tr>
</table></td></tr></table></body></html>`;
}

function mail(o: Parameters<typeof layout>[0] & { subject: string; text: string[] }, f: Foot): Mail {
  return {
    subject: o.subject,
    html: layout(o, f),
    text: [o.title, ...(o.sub ? [o.sub] : []), "", ...o.text, "", `${o.button.label}: ${o.button.url}`, "", "--", "You get getting-started tips because you made this workspace.", `Turn them off: ${f.unsubscribe}`].join("\n"),
  };
}

// ─────────────── the emails ───────────────

export function welcomeMail(w: { steps: { title: string; done: boolean }[]; trialEnds?: Date | null; credits?: number; url: string }, f: Foot): Mail {
  const done = w.steps.filter((s) => s.done).length;
  return mail(
    {
      subject: "Welcome to Capybaroar. Here's your first week.",
      preheader: "Connect a channel, schedule a post, let Capy write the rest.",
      kicker: "Welcome to Capybaroar",
      title: "Every channel, one calendar. Let's go.",
      sub: w.trialEnds ? `Pro is free until ${day(w.trialEnds)}${w.credits ? `, with ${n(w.credits)} AI credits` : ""}. No card needed.` : "Here's your first week.",
      visual: progress(done, w.steps.length, `${done} of ${w.steps.length} done`),
      body: steps(w.steps),
      button: { label: "Open Capybaroar", url: w.url },
      text: w.steps.map((s, i) => `${s.done ? "[x]" : `${i + 1}.`} ${s.title}`),
    },
    f,
  );
}

export const NETWORKS = ["LinkedIn", "Instagram", "Facebook", "TikTok", "YouTube", "X", "Threads", "Pinterest", "Bluesky", "Mastodon"];

export function channelMail(c: { url: string }, f: Foot): Mail {
  return mail(
    {
      subject: "Connect your first channel in 30 seconds",
      preheader: "One click to sign in, then post there from your calendar.",
      kicker: "Connect a channel",
      title: "Connect your first channel",
      sub: "Sign in to the network. That's the whole setup.",
      visual: big("30 sec", "to connect a channel"),
      body: label("Pick the one you post on most") + networks(NETWORKS),
      button: { label: "Connect a channel", url: c.url },
      text: [`Works with ${NETWORKS.join(", ")} and more.`],
    },
    f,
  );
}

export function firstPostMail(p: { slot: string | null; ai: boolean; url: string }, f: Foot): Mail {
  return mail(
    {
      subject: "Your first post is one click away",
      preheader: p.slot ? `Your next open slot is ${p.slot}.` : "Write it once and send it to every channel.",
      kicker: "Your first post",
      title: "Schedule your first post",
      sub: "Write it once. It goes to every channel you pick.",
      visual: postCard(p.slot ? `Next open slot: ${p.slot}` : "Your first post", "Your words here, sized for each network"),
      body: tagged([
        { main: "One post, every channel", tag: "Quick", tone: "green" },
        { main: "Pick a time or use your queue", tag: "Your call", tone: "gray" },
        ...(p.ai ? [{ main: "Or let Capy write the first one", tag: "AI", tone: "yellow" as Tone }] : []),
      ]),
      button: { label: "Schedule a post", url: p.url },
      text: [p.slot ? `Your next open slot is ${p.slot}.` : "Write it once and send it to every channel."],
    },
    f,
  );
}

export function liveMail(l: { published: number; channels: number; scheduled: number; next: { line: string; when: string }[]; url: string }, f: Foot): Mail {
  return mail(
    {
      subject: l.published === 1 ? "Your first post is live" : `${plural(l.published, "post")} live so far`,
      preheader: l.scheduled ? `${plural(l.scheduled, "more post")} in the queue.` : "Fill the week ahead while you're here.",
      kicker: "You're live",
      title: l.published === 1 ? "Your first post is live" : "You're posting from one calendar",
      sub: l.scheduled ? "Here's what's next." : "Your queue is empty. Fill the week ahead.",
      visual: stats([
        { n: n(l.published), label: "Posts out" },
        { n: n(l.channels), label: l.channels === 1 ? "Channel" : "Channels" },
        { n: n(l.scheduled), label: "Scheduled" },
      ]),
      body: l.next.length ? label("Coming up") + rows(l.next.slice(0, 3).map((x) => ({ main: x.line, side: x.when }))) : para("A week of posts takes about ten minutes. Capy can draft them from one idea."),
      button: { label: "Open your calendar", url: l.url },
      text: [`${plural(l.published, "post")} out, ${plural(l.channels, "channel")}, ${n(l.scheduled)} scheduled.`, ...l.next.slice(0, 3).map((x) => `- ${x.line}, ${x.when}`)],
    },
    f,
  );
}

export function aiMail(a: { credits: number; url: string }, f: Foot): Mail {
  return mail(
    {
      subject: `You have ${n(a.credits)} AI credits waiting`,
      preheader: "Capy writes a week of posts from one idea.",
      kicker: "Meet Capy",
      title: "Let Capy write your week",
      sub: "One idea in, a week of posts out, sized for each network.",
      visual: big(n(a.credits), "AI credits ready to use"),
      body: tagged([
        { main: "A week of posts from one idea", tag: "Writing", tone: "yellow" },
        { main: "Rewrite one post for every network", tag: "Writing", tone: "yellow" },
        { main: "Images and short videos", tag: "Media", tone: "purple" },
      ]),
      button: { label: "Try Capy", url: a.url },
      text: [`You have ${n(a.credits)} AI credits. Capy writes posts, rewrites them for each network and makes images and short videos.`],
    },
    f,
  );
}

export function bioMail(b: { name: string; url: string }, f: Foot): Mail {
  return mail(
    {
      subject: "One link for everything you post",
      preheader: "A link-in-bio page that updates with your posts.",
      kicker: "Link in bio",
      title: "One link for everything you post",
      sub: "Your links, products and latest posts on one page.",
      visual: bioCard(b.name),
      body: tagged([
        { main: "Shows your latest posts", tag: "Automatic", tone: "green" },
        { main: "Your colors and fonts", tag: "Yours", tone: "gray" },
        { main: "Views and clicks", tag: "Tracked", tone: "blue" },
      ]),
      button: { label: "Make your link in bio", url: b.url },
      text: ["A link-in-bio page with your links, products and latest posts. It updates when you post."],
    },
    f,
  );
}

export function endingMail(e: { days: number; ends: Date; channels: number; url: string }, f: Foot): Mail {
  const left = plural(e.days, "day");
  return mail(
    {
      subject: `${left} left on your Capybaroar Pro trial`,
      preheader: `Pro ends ${day(e.ends)}. Your posts and channels stay either way.`,
      kicker: "Pro trial",
      title: `${left} left on Pro`,
      sub: `Your trial ends ${day(e.ends)}. Your posts stay either way.`,
      visual: big(String(e.days), `${e.days === 1 ? "day" : "days"} of Pro left`),
      body:
        label("Free doesn't include") +
        tagged([
          { main: "Capy's writing, images and videos", tag: "Creator", tone: "gray" },
          { main: e.channels > 3 ? `More than 3 channels (you have ${e.channels})` : "More than 3 channels", tag: "Creator", tone: "gray" },
          { main: "More than 30 posts a month", tag: "Creator", tone: "gray" },
          { main: "Approvals, reports and a team", tag: "Pro", tone: "gray" },
        ]),
      button: { label: "Pick a plan", url: e.url },
      text: [`Your Pro trial ends ${day(e.ends)}.`, "Free doesn't include AI, more than 3 channels, more than 30 posts a month, approvals, reports or a team."],
    },
    f,
  );
}

export function overMail(o: { cols: string[]; rows: { label: string; values: string[] }[]; pick: number; price: number; url: string; stayUrl: string }, f: Foot): Mail {
  return mail(
    {
      subject: "Your Pro trial ended. Your posts are safe.",
      preheader: "You're on Free now. Nothing was deleted.",
      kicker: "Trial over",
      title: "Your trial ended. Your posts are safe.",
      sub: "You're on Free now. Nothing was deleted.",
      visual: big("Free", "is where you are now"),
      body: compare(o.cols, o.rows, o.pick),
      button: { label: `Get ${o.cols[o.pick]}, $${n(o.price)} a month`, url: o.url },
      after: note(`<a href="${esc(o.stayUrl)}" style="color:${BODY};text-decoration:underline">Stay on Free</a>&nbsp;&nbsp;Two months free when you pay yearly.`),
      text: ["You're on Free now. Nothing was deleted.", o.cols.join(" | "), ...o.rows.map((r) => `${r.label}: ${r.values.join(" | ")}`)],
    },
    f,
  );
}

export function helpMail(h: { url: string; sign?: Sign | null }, f: Foot): Mail {
  return mail(
    {
      subject: "Want a hand setting up Capybaroar?",
      preheader: "Reply and we'll set it up with you.",
      kicker: "We can help",
      title: "Want us to set it up with you?",
      sub: "Just reply to this email.",
      ...(h.sign ? { visual: person(h.sign.name, h.sign.role) } : {}),
      body: para("Tell us where you post and how often. We'll connect your channels with you and send back a first week of posts to start from."),
      button: { label: "Open Capybaroar", url: h.url },
      text: ["Reply and tell us where you post and how often. We'll set it up with you."],
    },
    f,
  );
}

export function awayMail(a: { lastPost: string | null; published: number; slots: string[]; url: string }, f: Foot): Mail {
  return mail(
    {
      subject: "Your queue is empty",
      preheader: a.lastPost ? `Your last post went out ${a.lastPost}.` : "Nothing is scheduled. Fill the week ahead.",
      kicker: "While you were away",
      title: "Your queue ran dry",
      sub: a.lastPost ? `Your last post went out ${a.lastPost}.` : "Nothing is scheduled right now.",
      visual: stats([
        { n: n(a.published), label: "Posts last month" },
        { n: "0", label: "Scheduled now" },
      ]),
      body: a.slots.length ? label("Open slots this week") + rows(a.slots.slice(0, 3).map((s) => ({ main: s, side: "Open" }))) : para("Capy can draft a week of posts from one idea."),
      button: { label: "Fill your queue", url: a.url },
      text: [`${plural(a.published, "post")} last month, 0 scheduled now.`, ...a.slots.slice(0, 3).map((s) => `- ${s}, open`)],
    },
    f,
  );
}
