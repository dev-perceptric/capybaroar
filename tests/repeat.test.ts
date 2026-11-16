// Repeating posts, tags and the calendar's time zone: the pure rules (repeat.ts, tagRules.ts, viewZone.ts) and the API
// fields. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { REPEATS, isRepeat, nextRepeat, repeatAt, repeatsBetween } from "../src/lib/repeat";
import { cleanTagIds, cleanTagName, cleanTagTone, nextTagTone } from "../src/lib/tagRules";
import { fromWall, toWall, zoneName } from "../src/lib/viewZone";
import { ApiError, postFields } from "../src/lib/api/input";

const NY = "America/New_York";

test("repeats keep the wall-clock time through daylight saving", () => {
  // 9 AM in New York on Saturday Nov 1 2026 (EDT); clocks go back on Nov 1 at 2 AM, so take Oct 31.
  const at = new Date("2026-10-31T13:00:00Z");
  assert.equal(repeatAt(at, "1d", NY, 1).toISOString(), "2026-11-01T14:00:00.000Z");
  assert.equal(repeatAt(at, "1w", NY, 1).toISOString(), "2026-11-07T14:00:00.000Z");
  assert.equal(repeatAt(at, "3d", NY, 2).toISOString(), "2026-11-06T14:00:00.000Z");
});

test("monthly repeats keep the day, or the month's last day when it's shorter", () => {
  const jan31 = new Date("2027-01-31T10:00:00Z");
  assert.equal(repeatAt(jan31, "1m", "UTC", 1).toISOString(), "2027-02-28T10:00:00.000Z");
  assert.equal(repeatAt(jan31, "1m", "UTC", 2).toISOString(), "2027-03-31T10:00:00.000Z");
  assert.equal(repeatAt(new Date("2027-12-15T10:00:00Z"), "1m", "UTC", 1).toISOString(), "2028-01-15T10:00:00.000Z");
});

test("the next repeat is the first after now: one copy after downtime, never a burst", () => {
  const at = new Date("2026-11-01T09:00:00Z");
  assert.equal(nextRepeat(at, "1d", "UTC", new Date("2026-11-01T09:01:00Z")).toISOString(), "2026-11-02T09:00:00.000Z");
  // Ten days down: the next copy is tomorrow's, not ten copies.
  assert.equal(nextRepeat(at, "1d", "UTC", new Date("2026-11-11T12:00:00Z")).toISOString(), "2026-11-12T09:00:00.000Z");
  // Within a minute of the next time: the one after, so it never lands in the past.
  assert.equal(nextRepeat(at, "1d", "UTC", new Date("2026-11-02T08:59:30Z")).toISOString(), "2026-11-03T09:00:00.000Z");
});

test("the calendar draws the repeats that fall in its range", () => {
  const at = new Date("2026-11-02T09:00:00Z");
  const got = repeatsBetween(at, "2d", "UTC", new Date("2026-11-05T00:00:00Z"), new Date("2026-11-12T00:00:00Z")).map((d) => d.toISOString().slice(0, 10));
  assert.deepEqual(got, ["2026-11-06", "2026-11-08", "2026-11-10"]);
  assert.equal(repeatsBetween(at, "1d", "UTC", at, new Date("2027-11-01T00:00:00Z"), 10).length, 10);
  assert.ok(isRepeat("2w") && !isRepeat("3w") && !isRepeat(null));
  assert.equal(Object.keys(REPEATS).length, 9);
});

test("tags: names tidied and checked, colors kept to the set, at most 10 on a post", () => {
  assert.equal(cleanTagName("  Behind   the scenes "), "Behind the scenes");
  assert.throws(() => cleanTagName("  "), /Name the tag/);
  assert.throws(() => cleanTagName("x".repeat(41)), /up to 40/);
  assert.equal(cleanTagTone("pink"), "pink");
  assert.equal(cleanTagTone("#ff0000"), "sky");
  assert.equal(nextTagTone([]), "sky");
  assert.notEqual(nextTagTone(["sky"]), "sky");
  assert.deepEqual(cleanTagIds(["a", "b", "a"]), ["a", "b"]);
  assert.throws(() => cleanTagIds(Array.from({ length: 11 }, (_, i) => String(i))), /up to 10 tags/);
});

test("the calendar's time zone: wall clocks and back", () => {
  const at = new Date("2026-11-16T15:30:00Z");
  const w = toWall(at, NY);
  assert.deepEqual([w.getFullYear(), w.getMonth(), w.getDate(), w.getHours(), w.getMinutes()], [2026, 10, 16, 10, 30]);
  assert.equal(fromWall(w, NY).toISOString(), at.toISOString());
  // A slot picked on the calendar (Tuesday 9 AM in Tokyo) is that instant.
  assert.equal(fromWall(new Date(2026, 10, 17, 9, 0), "Asia/Tokyo").toISOString(), "2026-11-17T00:00:00.000Z");
  assert.equal(toWall(at, null), at);
  assert.equal(zoneName("America/Los_Angeles"), "Los Angeles");
});

test("the API takes tag_ids and repeat, and checks them", () => {
  const A = "11111111-1111-4111-8111-111111111111";
  const f = postFields({ channel_ids: [A], mode: "now", text: "hi", tag_ids: [A, A], repeat: "1w" }, false);
  assert.deepEqual(f.tagIds, [A]);
  assert.equal(f.repeat, "1w");
  assert.equal(postFields({ repeat: null }, true).repeat, null);
  const bad = (body: unknown, re: RegExp) => assert.throws(() => postFields(body, true), (e: unknown) => e instanceof ApiError && re.test(e.message));
  bad({ repeat: "weekly" }, /repeat must be one of 1d/);
  bad({ tag_ids: ["nope"] }, /tag_ids must be an id/);
  bad({ tag_ids: Array.from({ length: 11 }, (_, i) => `11111111-1111-4111-8111-${String(i).padStart(12, "0")}`) }, /up to 10 ids/);
});
