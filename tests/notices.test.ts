// Subprocessor change notices: a new vendor is announced once, only while its start date is ahead, and the shipped
// list never promises a start date sooner than the notice period allows.
import { test } from "node:test";
import assert from "node:assert/strict";
import SUBS from "../compliance/subprocessors.json";
import { isLive, toAnnounce, tooSoon, type SubsFile } from "../src/lib/noticeRules";

const v = (id: string, starts?: string, active = true) => ({ id, name: id, purpose: "p", data: "d", location: "US", active, ...(starts ? { starts } : {}) });
const file = (list: ReturnType<typeof v>[], updated = "2026-11-14"): SubsFile => ({ updated, notice_days: 30, subprocessors: list });

test("announce each future start once", () => {
  const f = file([v("old"), v("new", "2026-12-20"), v("past", "2026-11-01")]);
  assert.deepEqual(toAnnounce(f, [], "2026-11-14").map((x) => x.id), ["new"]);
  assert.deepEqual(toAnnounce(f, [{ vendor_id: "new", starts: "2026-12-20" }], "2026-11-14"), []);
  // A moved start date is a new notice.
  assert.deepEqual(toAnnounce(file([v("new", "2027-01-10")]), [{ vendor_id: "new", starts: "2026-12-20" }], "2026-11-14").map((x) => x.id), ["new"]);
});

test("a start date sooner than the notice period is caught", () => {
  assert.deepEqual(tooSoon(file([v("a", "2026-12-01")])).map((x) => x.id), ["a"]);
  assert.deepEqual(tooSoon(file([v("a", "2026-12-14")])), []);
});

test("vendors show in the main list only once they start", () => {
  assert.equal(isLive(v("a", "2026-12-20"), "2026-11-14"), false);
  assert.equal(isLive(v("a", "2026-12-20"), "2026-12-20"), true);
  assert.equal(isLive(v("a"), "2026-11-14"), true);
  assert.equal(isLive(v("a", undefined, false), "2026-11-14"), false);
});

test("the shipped subprocessor list gives every new vendor the full notice", () => {
  assert.deepEqual(tooSoon(SUBS as unknown as SubsFile), []);
});
