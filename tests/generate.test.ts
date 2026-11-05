// AI picture and video tests, against a fake fal that fails at random and an in-memory store that locks rows like
// claim_generations does (open, due, unlocked or lock older than 5 minutes).
// They prove: every request ends done or failed exactly once and nothing is left open; a request fal took is never
// sent again; a file is saved to the library once however often saving is retried; a crashed worker's request is
// taken over; a request that never finishes is cancelled after 30 minutes; fal's refusals fail at once with fal's
// message; and inputs, answers and plan limits follow the rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GIVE_UP_MS, LOCK_MS, checkLimits, falCall, fileName, genRequest, resultFile, statusStep, type GenKind } from "../src/lib/genRules";
import { BadFile, advance, runGenerations, setSaveRetryMs, type FalAnswer, type FalApi, type GenRow, type GenStore } from "../src/lib/generator";
import { handleMcp } from "../src/lib/api/mcp";
import { generationInput } from "../src/lib/api/input";
import type { Ops } from "../src/lib/api/types";

const PIC = "8f14e45f-ceea-467f-a0e6-2e1b4a1c9a11";

setSaveRetryMs([0, 0, 0]);

// A seeded random, so a failing run can be repeated.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

type MemRow = GenRow & { status: "queued" | "running" | "done" | "failed"; checkAfter: number; lockedAt: number | null; error: string | null; mediaId: string | null; endings: number };

class Memory implements GenStore {
  now = 0;
  rows: MemRow[] = [];
  library = new Map<string, string>(); // fixed place -> media id
  saves = 0;
  failSave = 0;
  failDone = 0;
  failStore = 0;
  random = Math.random;

  add(n: number, kind: GenKind = "image") {
    for (let i = 0; i < n; i++)
      this.rows.push({ id: `g${this.rows.length}`, workspaceId: "w", userId: "u", kind, prompt: `thing ${i}`, endpoint: kind === "image" ? "fal-ai/flux-2-pro" : "fal-ai/kling-video/v3/pro/text-to-video", input: { prompt: `thing ${i}` }, requestId: null, statusUrl: null, responseUrl: null, tries: 0, createdAt: this.now, status: "queued", checkAfter: this.now, lockedAt: null, error: null, mediaId: null, endings: 0 });
  }
  private row(id: string) {
    return this.rows.find((r) => r.id === id)!;
  }
  private hiccup() {
    if (this.random() < this.failStore) throw new Error("database busy");
  }
  async claim(_: string, n: number) {
    const due = this.rows.filter((r) => (r.status === "queued" || r.status === "running") && r.checkAfter <= this.now && (r.lockedAt === null || r.lockedAt < this.now - LOCK_MS)).slice(0, n);
    for (const r of due) r.lockedAt = this.now;
    return due.map((r) => ({ ...r }));
  }
  async submitted(id: string, s: { requestId: string; statusUrl: string; responseUrl: string }, checkAfter: number) {
    this.hiccup();
    Object.assign(this.row(id), { ...s, status: "running", tries: 0, checkAfter, lockedAt: null });
  }
  async later(id: string, checkAfter: number, tries: number) {
    this.hiccup();
    Object.assign(this.row(id), { checkAfter, tries, lockedAt: null });
  }
  async saveFile(row: GenRow) {
    if (this.random() < this.failSave) throw new Error("storage busy");
    const place = `ai-${row.id}`;
    if (!this.library.has(place)) {
      this.saves++;
      this.library.set(place, `m-${row.id}`);
    }
    return this.library.get(place)!;
  }
  async done(id: string, mediaId: string) {
    if (this.random() < this.failDone) throw new Error("database busy");
    const r = this.row(id);
    assert.ok(r.status !== "done" && r.status !== "failed", `${id} ended twice`);
    Object.assign(r, { status: "done", mediaId, lockedAt: null, endings: r.endings + 1 });
  }
  async failed(id: string, error: string) {
    this.hiccup();
    const r = this.row(id);
    assert.ok(r.status !== "done" && r.status !== "failed", `${id} ended twice`);
    Object.assign(r, { status: "failed", error, lockedAt: null, endings: r.endings + 1 });
  }
}

/** A fake fal: requests finish after a few looks; any call may hiccup; some prompts are refused. */
class FakeFal implements FalApi {
  jobs = new Map<string, { looks: number; need: number; prompt: string; kind: GenKind; refuse: boolean }>();
  cancelled: string[] = [];
  random = Math.random;
  hiccups = 0;
  refuse: (prompt: string) => boolean = () => false;
  never = false;
  private seq = 0;

  private hiccup(): FalAnswer | null {
    if (this.random() >= this.hiccups) return null;
    const pick = this.random();
    if (pick < 0.3) throw new Error("socket hang up");
    return { status: pick < 0.6 ? 429 : pick < 0.8 ? 503 : 504, body: { detail: "busy" } };
  }
  async submit(endpoint: string, input: Record<string, unknown>) {
    const h = this.hiccup();
    if (h) return h;
    const prompt = String(input.prompt);
    if (prompt.includes("blocked")) return { status: 422, body: { detail: [{ msg: "The prompt was flagged by the content checker" }] } };
    const id = `r${++this.seq}`;
    this.jobs.set(id, { looks: 0, need: 1 + Math.floor(this.random() * 4), prompt, kind: endpoint.includes("video") ? "video" : "image", refuse: this.refuse(prompt) });
    const base = `https://queue.fal.run/fal-ai/x/requests/${id}`;
    return { status: 200, body: { request_id: id, status_url: `${base}/status`, response_url: base } };
  }
  async get(url: string) {
    const h = this.hiccup();
    if (h) return h;
    const m = /requests\/(r\d+)(\/status)?$/.exec(url)!;
    const job = this.jobs.get(m[1]);
    if (!job) return { status: 404, body: { detail: "Not found" } };
    if (m[2]) {
      job.looks++;
      if (this.never || job.looks < job.need) return { status: 200, body: { status: job.looks === 1 ? "IN_QUEUE" : "IN_PROGRESS" } };
      return { status: 200, body: job.refuse ? { status: "COMPLETED", error: "Output didn't pass the safety check", error_type: "content_policy_violation" } : { status: "COMPLETED" } };
    }
    return { status: 200, body: job.kind === "image" ? { images: [{ url: `https://v3.fal.media/files/${m[1]}.jpg`, content_type: "image/jpeg" }] } : { video: { url: `https://v3.fal.media/files/${m[1]}.mp4`, content_type: "video/mp4" } } };
  }
  async cancel(url: string) {
    this.cancelled.push(url);
  }
}

async function drain(store: Memory, fal: FakeFal, step = 4000, max = 2000) {
  for (let i = 0; i < max && store.rows.some((r) => r.status === "queued" || r.status === "running"); i++) {
    await runGenerations(store, fal, "w1", 8, () => store.now);
    store.now += step;
  }
}

test("every request ends exactly once under random failures, fal takes each one once, and each file is saved once", async () => {
  for (let seed = 1; seed <= 40; seed++) {
    const r = rng(seed);
    const store = new Memory();
    const fal = new FakeFal();
    store.random = r;
    fal.random = r;
    fal.hiccups = 0.3;
    store.failSave = 0.3;
    store.failDone = 0.2;
    store.failStore = 0.1;
    fal.refuse = (p) => p.endsWith(" 3");
    store.add(10, "image");
    store.add(6, "video");
    store.rows[4].prompt = store.rows[4].input.prompt = "blocked thing";
    await drain(store, fal);
    for (const row of store.rows) {
      assert.ok(row.status === "done" || row.status === "failed", `seed ${seed}: ${row.id} left ${row.status}`);
      assert.equal(row.endings, 1, `seed ${seed}: ${row.id}`);
    }
    // Every request fal took is one a row kept, or one cancelled because its id couldn't be saved.
    const kept = new Set(store.rows.map((x) => x.requestId).filter(Boolean));
    for (const id of fal.jobs.keys()) assert.ok(kept.has(id) || fal.cancelled.some((c) => c.includes(`/${id}/cancel`)), `seed ${seed}: fal took ${id} and nobody kept or cancelled it`);
    const done = store.rows.filter((x) => x.status === "done");
    assert.equal(store.saves, done.length, `seed ${seed}: a file was saved twice`);
    for (const d of done) assert.equal(d.mediaId, `m-${d.id}`);
    assert.match(store.rows[4].error ?? "", /flagged by the content checker/, `seed ${seed}`);
    for (const row of store.rows.filter((x) => String(x.input.prompt).endsWith(" 3"))) {
      assert.equal(row.status, "failed", `seed ${seed}`);
      assert.match(row.error ?? "", /safety check/);
    }
  }
});

test("a crashed worker's request is taken over once its lock runs out", async () => {
  const store = new Memory();
  const fal = new FakeFal();
  store.add(3);
  // A worker claims them and dies before ending its turn.
  await store.claim("dead", 8);
  assert.equal((await store.claim("w2", 8)).length, 0, "locked rows aren't claimed");
  store.now += LOCK_MS + 1;
  await drain(store, fal);
  assert.ok(store.rows.every((r) => r.status === "done"));
  assert.equal(fal.jobs.size, 3);
});

test("a request that never finishes is cancelled after 30 minutes and fails", async () => {
  const store = new Memory();
  const fal = new FakeFal();
  fal.never = true;
  store.add(1, "video");
  await drain(store, fal, 15000, 400);
  const row = store.rows[0];
  assert.equal(row.status, "failed");
  assert.match(row.error ?? "", /longer than 30 minutes/);
  assert.deepEqual(fal.cancelled, [`${row.responseUrl}/cancel`]);
  assert.ok(store.now >= GIVE_UP_MS);
});

test("a file that isn't a picture or video fails at once instead of retrying", async () => {
  const store = new Memory();
  const fal = new FakeFal();
  store.saveFile = async () => {
    throw new BadFile("The link isn't a JPG, PNG, GIF, WebP, MP4 or MOV file");
  };
  store.add(1);
  await drain(store, fal);
  assert.equal(store.rows[0].status, "failed");
  assert.match(store.rows[0].error ?? "", /isn't a JPG/);
});

test("a saved request id is never sent again: later steps only look at its status", async () => {
  const store = new Memory();
  const fal = new FakeFal();
  store.add(1);
  let submits = 0;
  const submit = fal.submit.bind(fal);
  fal.submit = async (e, i) => {
    submits++;
    return submit(e, i);
  };
  const row = store.rows[0];
  assert.equal(await advance(store, fal, { ...row }, 0), "submitted");
  // Even a row read before the save (stale copy without the id) is claimed fresh from the store next round.
  await drain(store, fal);
  assert.equal(submits, 1);
  assert.equal(store.rows[0].status, "done");
});

test("requests are checked before anything is sent", () => {
  const img = genRequest({ kind: "image", prompt: "  A capybara at sunset  " });
  assert.deepEqual(img, { kind: "image", model: "flux-2-pro", prompt: "A capybara at sunset", aspect: "1:1", seconds: 5, sourceMediaId: null });
  const vid = genRequest({ kind: "video", prompt: "Waves", model: "seedance-2-fast", aspect: "9:16", seconds: 10, source_media_id: PIC });
  assert.deepEqual(vid, { kind: "video", model: "seedance-2-fast", prompt: "Waves", aspect: "9:16", seconds: 10, sourceMediaId: PIC });
  assert.equal(genRequest({ kind: "video", prompt: "x" }).model, "kling-3-pro");
  for (const [body, msg] of [
    [{ kind: "gif", prompt: "x" }, /kind must be/],
    [{ kind: "image", prompt: "   " }, /Describe what to make/],
    [{ kind: "image", prompt: "x".repeat(2001) }, /under 2,000/],
    [{ kind: "image", prompt: "x", model: "kling-3-pro" }, /model must be one of flux-2-pro, nano-banana-2/],
    [{ kind: "image", prompt: "x", aspect: "4:3" }, /aspect must be/],
    [{ kind: "video", prompt: "x", seconds: 7 }, /seconds must be 5 or 10/],
    [{ kind: "image", prompt: "x", source_media_id: PIC }, /for videos/],
    [{ kind: "video", prompt: "x", source_media_id: "nope" }, /picture's id/],
    [null, /kind must be/],
  ] as const)
    assert.throws(() => genRequest(body), msg);
  assert.throws(() => generationInput({ kind: "image" }), (e: Error & { status?: number }) => e.status === 400 && /Describe/.test(e.message));
});

test("each model gets the input its fal schema takes", () => {
  const r = (b: object) => genRequest({ prompt: "p", ...b });
  assert.deepEqual(falCall(r({ kind: "image", aspect: "9:16" }), null), { endpoint: "fal-ai/flux-2-pro", input: { prompt: "p", image_size: "portrait_16_9", output_format: "jpeg", enable_safety_checker: true } });
  assert.deepEqual(falCall(r({ kind: "image", model: "nano-banana-2", aspect: "16:9" }), null), { endpoint: "fal-ai/nano-banana-2", input: { prompt: "p", aspect_ratio: "16:9", resolution: "1K", num_images: 1, output_format: "jpeg" } });
  assert.deepEqual(falCall(r({ kind: "video", aspect: "1:1" }), null), { endpoint: "fal-ai/kling-video/v3/pro/text-to-video", input: { prompt: "p", aspect_ratio: "1:1", duration: "5", generate_audio: true } });
  assert.deepEqual(falCall(r({ kind: "video", seconds: 10, source_media_id: PIC }), "https://s.test/a.jpg"), { endpoint: "fal-ai/kling-video/v3/pro/image-to-video", input: { prompt: "p", start_image_url: "https://s.test/a.jpg", duration: "10", generate_audio: true } });
  assert.deepEqual(falCall(r({ kind: "video", model: "seedance-2-fast", aspect: "9:16" }), null), { endpoint: "bytedance/seedance-2.0/fast/text-to-video", input: { prompt: "p", aspect_ratio: "9:16", duration: "5", resolution: "720p", generate_audio: true } });
  assert.deepEqual(falCall(r({ kind: "video", model: "seedance-2-fast", source_media_id: PIC }), "https://s.test/a.jpg"), { endpoint: "bytedance/seedance-2.0/fast/image-to-video", input: { prompt: "p", image_url: "https://s.test/a.jpg", duration: "5", resolution: "720p", generate_audio: true } });
});

test("fal's answers are read the same way every time", () => {
  assert.deepEqual(statusStep(200, { status: "IN_QUEUE", queue_position: 3 }), { kind: "wait" });
  assert.deepEqual(statusStep(202, { status: "IN_PROGRESS" }), { kind: "wait" });
  assert.deepEqual(statusStep(200, { status: "COMPLETED", metrics: {} }), { kind: "fetch" });
  assert.deepEqual(statusStep(200, { status: "COMPLETED", error: "Runner crashed", error_type: "internal" }), { kind: "fail", error: "Runner crashed" });
  for (const s of [0, 408, 429, 500, 502, 503, 504]) assert.deepEqual(statusStep(s, null), { kind: "wait" }, String(s));
  assert.equal(statusStep(404, null).kind, "fail");
  assert.deepEqual(statusStep(401, { detail: "Invalid key" }), { kind: "fail", error: "Invalid key" });
  assert.deepEqual(resultFile("image", { images: [{ url: "https://v3.fal.media/a.jpg", content_type: "image/jpeg" }] }), { url: "https://v3.fal.media/a.jpg", mime: "image/jpeg" });
  assert.deepEqual(resultFile("video", { video: { url: "https://v3.fal.media/a.mp4" } }), { url: "https://v3.fal.media/a.mp4", mime: null });
  assert.throws(() => resultFile("image", { images: [] }), /no picture/);
  assert.throws(() => resultFile("video", { images: [{ url: "https://x.test/a.jpg" }] }), /no video/);
  assert.throws(() => resultFile("image", { images: [{ url: "http://v3.fal.media/a.jpg" }] }), /no picture/);
});

test("plan limits: pictures a month, seconds of video a month, and 4 at once", () => {
  const pro = { aiImages: 50, aiVideoSeconds: 30 };
  const none = { images: 0, videoSeconds: 0, open: 0 };
  assert.throws(() => checkLimits({ kind: "image", seconds: 5 }, none, { aiImages: 0, aiVideoSeconds: 0 }), /doesn't include AI pictures/);
  assert.throws(() => checkLimits({ kind: "video", seconds: 5 }, none, { aiImages: 0, aiVideoSeconds: 0 }), /doesn't include AI videos/);
  assert.doesNotThrow(() => checkLimits({ kind: "image", seconds: 5 }, { ...none, images: 49 }, pro));
  assert.throws(() => checkLimits({ kind: "image", seconds: 5 }, { ...none, images: 50 }, pro), /50 AI pictures a month/);
  assert.doesNotThrow(() => checkLimits({ kind: "video", seconds: 10 }, { ...none, videoSeconds: 20 }, pro));
  assert.throws(() => checkLimits({ kind: "video", seconds: 10 }, { ...none, videoSeconds: 25 }, pro), /5 seconds of AI video are left/);
  assert.throws(() => checkLimits({ kind: "video", seconds: 5 }, { ...none, videoSeconds: 30 }, pro), /30 seconds of AI video a month/);
  assert.throws(() => checkLimits({ kind: "image", seconds: 5 }, { ...none, open: 4 }, pro), /4 are being made already/);
  assert.equal(fileName("A Capybara, at sunset! On the beach today", "image/jpeg"), "a-capybara-at-sunset-on-the.jpg");
  assert.equal(fileName("!!!", "video/mp4"), "ai.mp4");
});

test("MCP: generate_media checks its input and get_generation reads one back", async () => {
  const calls: string[] = [];
  const ops = {
    generate: async (r) => {
      calls.push(`${r.kind}:${r.model}:${r.aspect}:${r.seconds}:${r.sourceMediaId ?? "-"}`);
      return { id: "g1", kind: r.kind, model: r.model, prompt: r.prompt, status: "running", error: null, media: null, created_at: "2026-11-05T00:00:00Z" };
    },
    generation: async (id) => ({ id, kind: "video", model: "kling-3-pro", prompt: "x", status: "failed", error: "busy", media: null, created_at: "2026-11-05T00:00:00Z" }),
  } as Partial<Ops> as Ops;
  const call = (name: string, args: unknown) => handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }, ops, "UTC") as Promise<{ result: { content: { text: string }[]; isError: boolean } }>;
  const ok = await call("generate_media", { kind: "video", prompt: "Waves", aspect: "9:16", source_media_id: PIC });
  assert.equal(ok.result.isError, false);
  assert.equal(JSON.parse(ok.result.content[0].text).generation.status, "running");
  assert.deepEqual(calls, [`video:kling-3-pro:9:16:5:${PIC}`]);
  const bad = await call("generate_media", { kind: "video", prompt: "Waves", seconds: 3 });
  assert.equal(bad.result.isError, true);
  assert.match(bad.result.content[0].text, /seconds must be 5 or 10/);
  assert.equal(calls.length, 1);
  const got = await call("get_generation", { id: PIC });
  assert.equal(JSON.parse(got.result.content[0].text).generation.error, "busy");
});
