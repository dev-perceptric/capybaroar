// Getting-started emails (049): when each one goes out, and what it says. src/lib/nurturePlan.ts, nurtureMail.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { nextSlots, pickStep, type NurtureState } from "../src/lib/nurturePlan";
import { aiMail, awayMail, bioMail, channelMail, endingMail, firstPostMail, helpMail, liveMail, overMail, welcomeMail } from "../src/lib/nurtureMail";

const base: NurtureState = { ageHours: 1, plan: "pro", trial: true, paid: false, daysLeft: 13, trialEndedHours: null, channels: 0, scheduled: 0, published: 0, generations: 0, bio: false, idleDays: 0, localHour: 10, sent: new Set(), sentRecently: false };
const at = (days: number, more: Partial<NurtureState> = {}, sent: string[] = ["welcome"]): NurtureState => ({ ...base, ageHours: days * 24, sent: new Set(sent), ...more });

test("the welcome goes out 15 minutes in, at any hour, and never after 2 days", () => {
  assert.equal(pickStep({ ...base, ageHours: 0.1 }), null);
  assert.equal(pickStep({ ...base, ageHours: 0.3, localHour: 3 }), "welcome");
  assert.notEqual(pickStep({ ...base, ageHours: 50 }), "welcome");
});

test("later steps wait for working hours and a quiet day", () => {
  assert.equal(pickStep(at(1, { localHour: 8 })), null);
  assert.equal(pickStep(at(1, { localHour: 18 })), null);
  assert.equal(pickStep(at(1, { sentRecently: true })), null);
  assert.equal(pickStep(at(1)), "channel");
});

test("each setup step is skipped once it's done", () => {
  assert.equal(pickStep(at(2, { channels: 1 })), "first");
  assert.equal(pickStep(at(2, { channels: 1, scheduled: 2 })), null);
  assert.equal(pickStep(at(3, { channels: 1, published: 1 }, ["welcome", "first"])), "live");
  assert.equal(pickStep(at(5, { channels: 1, published: 1 }, ["welcome", "live"])), "ai");
  assert.equal(pickStep(at(5, { channels: 1, published: 1, generations: 3 }, ["welcome", "live"])), null);
  assert.equal(pickStep(at(7, { channels: 1, published: 1, generations: 3 }, ["welcome", "live"])), "bio");
  assert.equal(pickStep(at(7, { channels: 1, published: 1, generations: 3, bio: true }, ["welcome", "live"])), null);
});

test("the trial emails: 3 days left, then the trial-over email within 3 days of the end", () => {
  const done = ["welcome", "channel", "first", "live", "ai", "bio"];
  assert.equal(pickStep(at(11, { daysLeft: 3 }, done)), "ending");
  assert.equal(pickStep(at(11, { daysLeft: 4 }, done)), null);
  const free = { plan: "free" as const, trial: false, daysLeft: 0 };
  assert.equal(pickStep(at(14, { ...free, trialEndedHours: 5 }, [...done, "ending"])), "over");
  assert.equal(pickStep(at(17, { ...free, trialEndedHours: 80, idleDays: 1 }, [...done, "ending"])), null);
});

test("quiet people on Free get help, and an empty queue gets a nudge after 21 days away", () => {
  const free = { plan: "free" as const, trial: false, daysLeft: 0 };
  const done = ["welcome", "channel", "first", "live", "ai", "bio", "ending", "over"];
  assert.equal(pickStep(at(15, { ...free, idleDays: 9 }, done)), "help");
  assert.equal(pickStep(at(15, { ...free, idleDays: 2 }, done)), null);
  assert.equal(pickStep(at(30, { ...free, published: 12, idleDays: 22 }, [...done, "help"])), "away");
  assert.equal(pickStep(at(30, { ...free, published: 12, scheduled: 3, idleDays: 22 }, [...done, "help"])), null);
});

test("paying workspaces get the setup emails and nothing about plans", () => {
  const paid = { plan: "creator" as const, trial: false, paid: true, daysLeft: 0 };
  assert.equal(pickStep(at(1, paid)), "channel");
  assert.equal(pickStep(at(14, { ...paid, channels: 2, published: 9, generations: 4, bio: true, idleDays: 30 })), null);
  assert.equal(pickStep(at(30, { ...paid, channels: 2, published: 9, idleDays: 30 }, ["welcome", "live", "ai", "bio"])), null);
});

test("queue slots read in order from now, in 12-hour time", () => {
  const queue = [{ day: 2, time: "09:00" }, { day: 4, time: "17:30" }, { day: 1, time: "08:15" }];
  // Monday 10:00: Monday's 8:15 has passed, so it comes last.
  assert.deepEqual(nextSlots(queue, 1, 600), ["Tue 9:00 AM", "Thu 5:30 PM", "Mon 8:15 AM"]);
  assert.deepEqual(nextSlots([], 1, 600), []);
  assert.deepEqual(nextSlots("nonsense", 1, 600), []);
});

const foot = { unsubscribe: "https://app.capybaroar.com/api/email/tips?t=x", settings: "https://app.capybaroar.com/settings?tab=account" };
const url = "https://app.capybaroar.com/calendar";
const all = {
  welcome: welcomeMail({ steps: [{ title: "Make your workspace", done: true }, { title: "Connect a channel", done: false }], trialEnds: new Date("2026-12-02T12:00:00Z"), credits: 200, url }, foot),
  channel: channelMail({ url }, foot),
  first: firstPostMail({ slot: "Tue 9:00 AM", ai: true, url }, foot),
  live: liveMail({ published: 1, channels: 2, scheduled: 4, next: [{ line: "Our spring menu is here", when: "Thu 9:00 AM" }], url }, foot),
  ai: aiMail({ credits: 200, url }, foot),
  bio: bioMail({ name: "Northwind", url }, foot),
  ending: endingMail({ days: 3, ends: new Date("2026-12-02T12:00:00Z"), channels: 5, url }, foot),
  over: overMail({ cols: ["Free", "Creator", "Pro"], rows: [{ label: "Channels", values: ["3", "8", "30"] }], pick: 1, price: 29, url, stayUrl: url }, foot),
  help: helpMail({ url, sign: { name: "Sam Reed", role: "Founder" } }, foot),
  away: awayMail({ lastPost: "23 days ago", published: 14, slots: ["Tue 9:00 AM"], url }, foot),
};

test("every getting-started email has the yellow hero, one button, a plain-text copy and a way to turn it off", () => {
  for (const [name, m] of Object.entries(all)) {
    assert.ok(m.subject.length > 10 && !/[\r\n]/.test(m.subject), name);
    assert.match(m.html, /bgcolor="#FFD202" style="background:#FFD202;border-radius:20px 20px 0 0/, `${name} hero`);
    assert.match(m.html, /bgcolor="#333333"/, `${name} button`);
    assert.match(m.text, /Turn them off: https:\/\/app\.capybaroar\.com\/api\/email\/tips/, `${name} text footer`);
    assert.doesNotMatch(m.html + m.text + m.subject, /·|gradient|undefined|NaN/, name);
  }
});

test("the emails carry the workspace's real numbers", () => {
  assert.equal(all.welcome.subject, "Welcome to Capybaroar. Here's your first week.");
  assert.match(all.welcome.text, /Pro is free until Dec 2, with 200 AI credits\. No card needed\./);
  assert.match(all.first.text, /Your next open slot is Tue 9:00 AM\./);
  assert.equal(all.live.subject, "Your first post is live");
  assert.match(all.live.text, /- Our spring menu is here, Thu 9:00 AM/);
  assert.equal(all.ai.subject, "You have 200 AI credits waiting");
  assert.match(all.ending.text, /Your Pro trial ends Dec 2\./);
  assert.match(all.ending.html, /More than 3 channels \(you have 5\)/);
  assert.match(all.over.html, /Get Creator, \$29 a month/);
  assert.match(all.help.html, />SR</);
  assert.match(all.away.text, /14 posts last month, 0 scheduled now\./);
});
