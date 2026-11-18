// The getting-started emails with sample data, for a look before a change ships.
//   npx tsx scripts/nurture-previews.ts   writes email-previews/nurture-*.html (ignored by git)
import { mkdirSync, writeFileSync } from "node:fs";
import { aiMail, awayMail, bioMail, channelMail, endingMail, firstPostMail, helpMail, liveMail, overMail, welcomeMail } from "../src/lib/nurtureMail";

const app = "https://app.capybaroar.com";
const foot = { unsubscribe: `${app}/api/email/tips?t=sample`, settings: `${app}/settings?tab=account` };
const ends = new Date("2026-12-02T12:00:00Z");

const samples = {
  "01-welcome": welcomeMail(
    {
      steps: [
        { title: "Make your workspace", done: true },
        { title: "Connect a channel", done: true },
        { title: "Schedule your first post", done: false },
        { title: "Let Capy write a post", done: false },
        { title: "Make your link in bio", done: false },
      ],
      trialEnds: ends,
      credits: 200,
      url: `${app}/calendar`,
    },
    foot,
  ),
  "02-channel": channelMail({ url: `${app}/channels` }, foot),
  "03-first": firstPostMail({ slot: "Tue 9:00 AM", ai: true, url: `${app}/calendar` }, foot),
  "04-live": liveMail(
    {
      published: 1,
      channels: 3,
      scheduled: 4,
      next: [
        { line: "Our spring menu is here, and it's all about citrus", when: "Thu 9:00 AM" },
        { line: "Behind the scenes with our pastry team", when: "Fri 12:30 PM" },
        { line: "Weekend brunch is back", when: "Sat 10:00 AM" },
      ],
      url: `${app}/calendar`,
    },
    foot,
  ),
  "05-ai": aiMail({ credits: 200, url: `${app}/agents` }, foot),
  "06-bio": bioMail({ name: "Northwind Kitchen", url: `${app}/bio` }, foot),
  "07-ending": endingMail({ days: 3, ends, channels: 5, url: `${app}/settings?tab=billing` }, foot),
  "08-over": overMail(
    {
      cols: ["Free", "Creator", "Pro"],
      rows: [
        { label: "Channels", values: ["3", "8", "30"] },
        { label: "Posts a month", values: ["30", "Unlimited", "Unlimited"] },
        { label: "AI credits a month", values: ["None", "1,000", "2,500"] },
        { label: "Team", values: ["Just you", "Just you", "5"] },
        { label: "Price a month", values: ["$0", "$29", "$49"] },
      ],
      pick: 1,
      price: 29,
      url: `${app}/settings?tab=billing`,
      stayUrl: `${app}/calendar`,
    },
    foot,
  ),
  "09-help": helpMail({ url: `${app}/calendar`, sign: { name: "Sam Reed", role: "Founder, Capybaroar" } }, foot),
  "10-away": awayMail({ lastPost: "23 days ago", published: 14, slots: ["Tue 9:00 AM", "Thu 5:30 PM", "Sat 10:00 AM"], url: `${app}/calendar` }, foot),
};

mkdirSync("email-previews", { recursive: true });
for (const [name, m] of Object.entries(samples)) {
  writeFileSync(`email-previews/nurture-${name}.html`, m.html);
  writeFileSync(`email-previews/nurture-${name}.txt`, `Subject: ${m.subject}\n\n${m.text}\n`);
}
console.log(`Wrote ${Object.keys(samples).length} previews to email-previews/.`);
