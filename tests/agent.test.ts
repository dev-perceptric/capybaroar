// Agent tool tests. They prove: the agent has every action the API and the MCP server have (so a new action can't be
// left out), the media actions appear only when AI media is set up, every tool has a valid object schema, what the
// agent sends to generate_media passes the app's checks, and the chat names each action.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ATTACHED, ATTACH_TOOL, actionLabel, agentTools, attachedNames, capyChoice, systemPrompt } from "../src/lib/agentTools";
import { TOOLS } from "../src/lib/api/mcp";
import { genRequest } from "../src/lib/genRules";

test("the agent has every API and MCP action, and the media ones only with AI media", () => {
  const all = TOOLS.map((t) => t.name);
  const withAi = agentTools(true).map((t) => t.name);
  const without = agentTools(false).map((t) => t.name);
  assert.deepEqual(withAi.sort(), [...all, ATTACH_TOOL.name].sort());
  assert.deepEqual(without.sort(), all.filter((n) => n !== "generate_media" && n !== "get_generation").sort());
  for (const ai of [true, false]) {
    const names = agentTools(ai).map((t) => t.name);
    assert.equal(new Set(names).size, names.length);
    for (const t of agentTools(ai)) {
      assert.equal((t.input_schema as { type: string }).type, "object", t.name);
      assert.ok(t.description && t.description.length > 20, t.name);
    }
  }
});

test("the instructions ask before deleting and keep drafts by default; media rules only with AI media", () => {
  const p = systemPrompt(true, "America/New_York", new Date("2026-11-05T12:00:00Z"));
  assert.match(p, /wait for the user to say yes/);
  assert.match(p, /drafts unless the user clearly asks/);
  assert.match(p, /America\/New_York/);
  assert.match(p, /attach_when_done/);
  assert.doesNotMatch(systemPrompt(false, "UTC", new Date()), /generate_media/);
});

test("what the agent sends to generate_media passes the app's checks", () => {
  assert.equal(genRequest({ kind: "image", prompt: "A capybara reading on a beach at sunset", aspect: "1:1" }).model, "flux-2-pro");
  assert.equal(genRequest({ kind: "audio", prompt: "Welcome to our grand opening" }).model, "elevenlabs-turbo");
  assert.equal(genRequest({ kind: "video", prompt: "Slow push-in", model: "seedance-2-fast", aspect: "9:16", seconds: 10 }).seconds, 10);
  assert.throws(() => genRequest({ kind: "image", prompt: "x", model: "kling-3-pro" }), /model must be/);
});

test("the chat names each action and stays quiet for reads", () => {
  assert.equal(actionLabel("create_posts", { posts: [{}, {}] }), "Saved 2 posts");
  assert.equal(actionLabel("create_posts", { posts: [{}] }), "Saved 1 post");
  assert.equal(actionLabel("save_posts", { posts: [{}, {}, {}] }), "Saved 3 posts");
  assert.equal(actionLabel("delete_post", { id: "x", everywhere: true }), "Deleted a post everywhere");
  assert.equal(actionLabel("set_webhook", { enabled: false }), "Turned a webhook off");
  for (const read of ["list_channels", "list_posts", "get_post", "list_media", "get_analytics", "next_queue_slot", "get_generation"]) assert.equal(actionLabel(read, {}), null, read);
});

test("the chat box's Capy choice tells the agent what to make, and Capy picks the model", () => {
  assert.equal(capyChoice("video"), "video");
  assert.equal(capyChoice("audio"), "audio");
  assert.equal(capyChoice("gif"), "auto");
  assert.equal(capyChoice(undefined), "auto");
  assert.match(systemPrompt(true, "UTC", new Date(), "video"), /picked CapyVideo: make a video \(generate_media kind "video"\)/);
  assert.match(systemPrompt(true, "UTC", new Date(), "auto"), /Leave model out so Capy picks/);
  assert.doesNotMatch(systemPrompt(true, "UTC", new Date(), "auto"), /For this message the user picked/);
  assert.doesNotMatch(systemPrompt(false, "UTC", new Date(), "audio"), /CapyAudio/);
});

test("files added with + come back as chips with their names", () => {
  assert.deepEqual(attachedNames(`${ATTACHED}storefront.jpg (media id 8f14e45f-ceea-467f-a0e6-2e1b4a1c9a11), logo, final.png (media id 9f14e45f-ceea-467f-a0e6-2e1b4a1c9a11)`), ["storefront.jpg", "logo, final.png"]);
  assert.equal(attachedNames("Write 5 posts"), null);
});
