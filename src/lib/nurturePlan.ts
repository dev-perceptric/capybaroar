// Which getting-started email a new workspace's maker gets next, if any. Pure, so tests/nurture.test.ts walks
// every path. The sender (src/lib/nurture.ts) loads the state; the words live in src/lib/nurtureMail.ts.
//
// Day  Email      Sends when
// 0    welcome    15 minutes after the workspace is made
// 1    channel    no channel yet
// 2    first      a channel, but no post scheduled or sent
// 3    live       a post went out
// 5    ai         AI credits unused, on a plan with AI (the trial has it)
// 7    bio        no link-in-bio page
// 11   ending     3 days or fewer left on the Pro trial
// 14   over       the trial ended in the last 3 days
// 14   help       on Free and not seen in the last 7 days
// 21+  away       not seen for 21 days and nothing scheduled, at most once every 90 days
//
// At most one a day, only 9:00 to 18:00 in the workspace's time zone (the welcome goes out right away). Paying
// workspaces only get the setup emails (channel to bio).

export const NURTURE_STEPS = ["welcome", "channel", "first", "live", "ai", "bio", "ending", "over", "help", "away"] as const;
export type NurtureStep = (typeof NURTURE_STEPS)[number];

export type NurtureState = {
  ageHours: number;
  /** The plan whose limits apply: a running trial counts as Pro (billing.ts effectivePlan). */
  plan: "free" | "creator" | "pro" | "agency";
  trial: boolean;
  paid: boolean;
  daysLeft: number;
  /** Hours since the trial ended, or null when it hasn't. */
  trialEndedHours: number | null;
  channels: number;
  scheduled: number;
  published: number;
  /** AI generations ever started. */
  generations: number;
  bio: boolean;
  /** Days since the person was last seen, or null when never recorded. */
  idleDays: number | null;
  /** The hour now in the workspace's time zone, 0 to 23. */
  localHour: number;
  /** Steps already sent (away only counts when sent in the last 90 days). */
  sent: ReadonlySet<string>;
  /** A getting-started email went to this person in the last 20 hours. */
  sentRecently: boolean;
};

export function pickStep(s: NurtureState): NurtureStep | null {
  const days = s.ageHours / 24;
  const due = (k: NurtureStep) => !s.sent.has(k);
  if (due("welcome") && s.ageHours >= 0.25 && days < 2) return "welcome";
  if (s.sentRecently || s.localHour < 9 || s.localHour >= 18) return null;

  if (due("channel") && s.channels === 0 && days >= 1 && days < 5) return "channel";
  if (due("first") && s.channels > 0 && s.scheduled + s.published === 0 && days >= 2 && days < 6) return "first";
  if (due("live") && s.published > 0 && days >= 2 && days < 8) return "live";
  if (due("ai") && s.plan !== "free" && s.generations === 0 && s.channels > 0 && days >= 5 && days < 10) return "ai";
  if (due("bio") && !s.bio && s.channels > 0 && days >= 7 && days < 12) return "bio";
  if (s.paid) return null;

  if (due("ending") && s.trial && s.daysLeft >= 1 && s.daysLeft <= 3) return "ending";
  if (due("over") && s.plan === "free" && s.trialEndedHours !== null && s.trialEndedHours < 72) return "over";
  if (due("help") && s.plan === "free" && days >= 14 && days < 18 && (s.idleDays === null || s.idleDays > 7)) return "help";
  if (due("away") && days >= 21 && s.published > 0 && s.scheduled === 0 && s.idleDays !== null && s.idleDays >= 21) return "away";
  return null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The next open queue slots from now, like "Tue 9:00 AM". `queue` holds { day: 0-6, time: "HH:MM" } in the workspace's zone. */
export function nextSlots(queue: unknown, nowDay: number, nowMinutes: number, count = 3): string[] {
  const slots = (Array.isArray(queue) ? queue : [])
    .map((q) => q as { day?: unknown; time?: unknown })
    .filter((q) => typeof q.day === "number" && typeof q.time === "string" && /^\d{1,2}:\d{2}$/.test(q.time))
    .map((q) => {
      const [h, m] = (q.time as string).split(":").map(Number);
      const ahead = (((q.day as number) - nowDay + 7) % 7) * 1440 + h * 60 + m - nowMinutes;
      return { ahead: ahead <= 0 ? ahead + 7 * 1440 : ahead, day: q.day as number, h, m };
    })
    .sort((a, b) => a.ahead - b.ahead);
  return slots.slice(0, count).map((s) => `${DAYS[s.day]} ${((s.h + 11) % 12) + 1}:${String(s.m).padStart(2, "0")} ${s.h < 12 ? "AM" : "PM"}`);
}
