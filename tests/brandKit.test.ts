// Brand kit: what it holds, the lines every AI writer gets, and the composer's checks. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { avoidedIn, cleanKit, isEmptyKit, kitPrompt, listOf, missingHashtags } from "../src/lib/brandKit";

test("lists split on commas and new lines, tidied and without repeats", () => {
  assert.deepEqual(listOf(" cheap,  guys\nsynergy, cheap ,"), ["cheap", "guys", "synergy"]);
  assert.deepEqual(listOf(["a", "b"]), ["a", "b"]);
  assert.deepEqual(listOf(undefined), []);
});

test("a kit is cleaned: hashtags get one #, no spaces, no repeats", () => {
  assert.deepEqual(cleanKit({ voice: "  Warm. ", avoid: "cheap, guys", hashtags: "crumbandco, ##Sour dough, #crumbandco" }), {
    voice: "Warm.",
    avoid: ["cheap", "guys"],
    hashtags: ["#crumbandco", "#Sourdough"],
  });
  assert.throws(() => cleanKit({ voice: "x".repeat(1501) }), /up to 1,500 characters/);
  assert.throws(() => cleanKit({ avoid: Array.from({ length: 31 }, (_, i) => `w${i}`).join(",") }), /Up to 30/);
  assert.equal(isEmptyKit(cleanKit({})), true);
});

test("the AI writer's lines name the voice, the words to avoid and the hashtags", () => {
  const p = kitPrompt({ voice: "Warm and plain.", avoid: ["cheap"], hashtags: ["#crumb"] }, "Crumb & Co.");
  assert.match(p, /Crumb & Co\.'s brand kit/);
  assert.match(p, /Voice: Warm and plain\./);
  assert.match(p, /Never use these words or phrases: cheap\./);
  assert.match(p, /#crumb/);
  assert.equal(kitPrompt({ voice: "", avoid: [], hashtags: [] }), "");
  assert.equal(kitPrompt(null), "");
});

test("words to avoid match whole words, whatever the case", () => {
  assert.deepEqual(avoidedIn("Our CHEAP bread, hey guys!", ["cheap", "guys", "synergy"]), ["cheap", "guys"]);
  assert.deepEqual(avoidedIn("cheaper than ever", ["cheap"]), []);
  assert.deepEqual(avoidedIn("best price (cheap)", ["cheap"]), ["cheap"]);
  assert.deepEqual(avoidedIn("100% natural", ["100%"]), ["100%"]);
});

test("missing hashtags are the brand's tags the text doesn't carry", () => {
  assert.deepEqual(missingHashtags("Fresh rye #Crumb today", ["#crumb", "#sourdough"]), ["#sourdough"]);
});
