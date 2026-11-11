// Queue presets, best times as queue slots, and publish_at "best" in the API. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { QUEUE_PRESETS, nextBestTime, pickBest, slotsFromBest } from "../src/lib/queue";
import { postFields } from "../src/lib/api/input";

test("presets: weekdays at 9 (5), morning and lunch (10), every day twice (14)", () => {
  assert.equal(QUEUE_PRESETS.weekdays.slots.length, 5);
  assert.ok(QUEUE_PRESETS.weekdays.slots.every((s) => s.day >= 1 && s.day <= 5 && s.time === "09:00"));
  assert.equal(QUEUE_PRESETS.lunch.slots.length, 10);
  assert.equal(QUEUE_PRESETS.daily.slots.length, 14);
});

test("best hours wait for 10 posts with results, skip hours with one post, and rank by engagement", () => {
  const cell = (day: number, hour: number, posts: number, engagement: number) => ({ day, hour, posts, engagement });
  assert.deepEqual(pickBest([cell(1, 9, 5, 10), cell(2, 9, 4, 20)]), []);
  const cells = [cell(1, 9, 4, 10), cell(2, 12, 4, 30), cell(3, 18, 1, 99), cell(5, 8, 3, 20)];
  assert.deepEqual(pickBest(cells, 2), [{ day: 2, hour: 12 }, { day: 5, hour: 8 }]);
});

test("best hours become sorted queue slots", () => {
  assert.deepEqual(slotsFromBest([{ day: 5, hour: 8 }, { day: 2, hour: 12 }, { day: 2, hour: 9 }]), [{ day: 2, time: "09:00" }, { day: 2, time: "12:00" }, { day: 5, time: "08:00" }]);
});

test("the next best time is at least 30 minutes away, in the workspace's time zone", () => {
  // Monday 2026-11-09, 08:45 in New York (13:45 UTC). Best: Monday 9 AM and Tuesday 9 AM there.
  const now = new Date("2026-11-09T13:45:00Z");
  const best = [{ day: 1, hour: 9 }, { day: 2, hour: 9 }];
  assert.equal(nextBestTime(best, "America/New_York", now)!.toISOString(), "2026-11-10T14:00:00.000Z");
  assert.equal(nextBestTime(best, "America/New_York", new Date("2026-11-09T13:00:00Z"))!.toISOString(), "2026-11-09T14:00:00.000Z");
  assert.equal(nextBestTime([], "UTC", now), null);
});

test("the API takes publish_at best", () => {
  const A = "11111111-1111-4111-8111-111111111111";
  assert.equal(postFields({ channel_ids: [A], mode: "schedule", publish_at: "best" }, false).publishAt, "best");
});

import { pickPopular } from "../src/lib/queue";

test("popular hours across accounts need 200 posts on the network and 5 in the hour", () => {
  const cell = (day: number, hour: number, posts: number, engagement: number) => ({ day, hour, posts, engagement });
  assert.deepEqual(pickPopular([cell(1, 9, 150, 10), cell(2, 9, 40, 20)]), []);
  const cells = [cell(1, 9, 150, 10), cell(2, 12, 50, 30), cell(3, 18, 4, 99), cell(5, 8, 20, 20)];
  assert.deepEqual(pickPopular(cells), [{ day: 2, hour: 12 }, { day: 5, hour: 8 }, { day: 1, hour: 9 }]);
});
