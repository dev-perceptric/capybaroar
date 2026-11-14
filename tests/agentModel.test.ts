// Picking a model in the agent's chat box: only a real model of the kind picked is used (anything else means Capy
// picks), and the agent is told to use it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickedModel, systemPrompt } from "../src/lib/agentTools";
import { MODELS } from "../src/lib/genRules";

test("only a real model of the picked kind is used", () => {
  assert.equal(pickedModel("nano-banana-2", "image"), "nano-banana-2");
  assert.equal(pickedModel("veo-3.1", "video"), "veo-3.1");
  assert.equal(pickedModel("veo-3.1", "image"), null);
  assert.equal(pickedModel("nano-banana-2", "auto"), null);
  assert.equal(pickedModel("made-up", "image"), null);
  assert.equal(pickedModel(42, "image"), null);
  assert.equal(pickedModel(undefined, "audio"), null);
});

test("the agent is told which model the user picked, and nothing when Capy picks", () => {
  const now = new Date("2026-11-14T00:00:00Z");
  const withModel = systemPrompt(true, "UTC", now, "image", "", "ideogram-v3");
  assert.match(withModel, /generate_media kind "image"\) with Ideogram V3 \(generate_media model "ideogram-v3"\)/);
  const capyPicks = systemPrompt(true, "UTC", now, "image", "", null);
  assert.doesNotMatch(capyPicks, /generate_media model "/);
  // Without AI media set up, no media instructions at all.
  assert.doesNotMatch(systemPrompt(false, "UTC", now, "image", "", "ideogram-v3"), /Ideogram/);
});

test("every model has a kind the chat box can show", () => {
  for (const m of MODELS) assert.ok(["image", "video", "audio"].includes(m.kind), m.id);
});
