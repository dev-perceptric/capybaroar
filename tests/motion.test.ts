// CapyMotion: Claude's plan is checked before it renders (kinds, limits, lengths, scenes that can't work dropped), the
// requests and credits, the props the scene kit gets, and a real frame when a Chromium and the built scene kit are on
// the machine (npm run build makes motion-bundle/).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { MAX_SCENES, MAX_SECONDS, cleanPlan, cleanScene, fitSize, motionCredits, motionProps, motionPrompt, totalFrames, MOTION_SKILL } from "../src/lib/capy/motionRules";
import { cleanStyle } from "../src/lib/capy/styleRules";
import { genRequest } from "../src/lib/genRules";

test("a scene is checked: unknown kinds, missing parts and a photo without a photo are dropped", () => {
  assert.equal(cleanScene({ kind: "explode" }, false), null);
  assert.equal(cleanScene({ kind: "title" }, false), null);
  assert.equal(cleanScene({ kind: "bars", items: ["a"], values: [1] }, false), null);
  assert.equal(cleanScene({ kind: "list", items: ["one"] }, false), null);
  assert.equal(cleanScene({ kind: "photo", headline: "x" }, false), null);
  assert.ok(cleanScene({ kind: "photo", headline: "x" }, true));
  assert.equal(cleanScene({ kind: "stat", value: "abc" }, false), null);
  const bars = cleanScene({ kind: "bars", headline: "When", items: ["Mon", "Tue", "Wed"], values: [3, 5] }, false)!;
  assert.deepEqual(bars.items, ["Mon", "Tue"]);
  assert.deepEqual(bars.values, [3, 5]);
});

test("words are cut to their limits and odd lengths get the default", () => {
  const s = cleanScene({ kind: "title", headline: "x".repeat(200), kicker: "k".repeat(80), seconds: 99 }, false)!;
  assert.equal(s.headline.length, 64);
  assert.equal(s.kicker.length, 30);
  assert.equal(s.seconds, 3);
  assert.equal(cleanScene({ kind: "title", headline: "Hi", seconds: 2.3 }, false)!.seconds, 2.5);
  assert.equal(cleanScene({ kind: "stat", value: "73%", headline: "x" }, false)!.value, 73);
});

test("a plan keeps at most 8 scenes and 30 seconds, and an empty one fails", () => {
  const many = { scenes: Array.from({ length: 20 }, () => ({ kind: "title", headline: "Hi", seconds: 3 })) };
  const p = cleanPlan(many, false);
  assert.ok(p.length <= MAX_SCENES);
  assert.ok(p.reduce((n, s) => n + s.seconds, 0) <= MAX_SECONDS);
  assert.equal(totalFrames(p), p.length * 90);
  assert.throws(() => cleanPlan({ scenes: [{ kind: "nope" }] }, false), /empty/);
  assert.throws(() => cleanPlan(null, false), /empty/);
});

test("CapyMotion requests: tall by default, website and photo allowed, fixed credits", () => {
  const r = genRequest({ kind: "motion", prompt: "73% of owners check cash flow weekly", website: "ledgerly.com" });
  assert.equal(r.model, "capy-motion");
  assert.equal(r.aspect, "9:16");
  assert.equal(r.credits, motionCredits());
  assert.equal(r.credits, 20);
  assert.equal(r.website, "ledgerly.com");
  assert.equal(genRequest({ kind: "motion", prompt: "x", aspect: "4:5" }).aspect, "4:5");
});

test("the scene kit gets the brand: yellow on white words use the ink, the fonts it has", () => {
  const style = cleanStyle({ bg: "#FFFFFF", accent: "#FFD202", headFont: "fraunces", headWeight: 700, bodyFont: "dm-sans" });
  const p = motionProps(style, "1:1", cleanPlan({ scenes: [{ kind: "title", headline: "Hi" }] }, false), "Lumen", "lumen.example", null);
  assert.equal(p.colors.accentText, style.ink);
  assert.equal(p.fonts.headFile, "fraunces");
  assert.deepEqual(p.fonts.bodyWeights, [400, 500, 700]);
  assert.match(motionPrompt({ prompt: "x", aspect: "9:16", brandName: "Lumen", look: "warm", photo: false, handle: "" }), /don't use the photo scene/);
  assert.match(MOTION_SKILL, /Never invent a statistic/);
});

test("headline sizes shrink as words grow, never under the least", () => {
  assert.equal(fitSize("Hi", 150, 80), 150);
  assert.ok(fitSize("A much longer headline here", 150, 80) < 150);
  assert.equal(fitSize("x".repeat(500), 150, 80), 80);
});

const chrome = process.env.CHROMIUM_PATH || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : "");
const bundle = existsSync("motion-bundle/index.html");

test("a real frame from the built scene kit", { skip: !(chrome && bundle) && "needs a Chromium and npm run build" }, async () => {
  const { renderStill, selectComposition } = await import("@remotion/renderer");
  const { SAMPLE } = await import("../src/motion/sample");
  const props = { ...SAMPLE, aspect: "1:1" as const, scenes: SAMPLE.scenes.slice(0, 2) };
  const opts = { serveUrl: "motion-bundle", browserExecutable: chrome, chromeMode: "chrome-for-testing" as const, chromiumOptions: { gl: "swangle" as const }, logLevel: "error" as const };
  const composition = await selectComposition({ ...opts, id: "CapyMotion", inputProps: props });
  assert.equal(composition.width, 1080);
  assert.equal(composition.height, 1080);
  assert.equal(composition.durationInFrames, totalFrames(props.scenes));
  const { buffer } = await renderStill({ ...opts, composition, inputProps: props, frame: 60, imageFormat: "png" });
  assert.ok(buffer && buffer.length > 10000);
});
