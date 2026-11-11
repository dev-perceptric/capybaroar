#!/usr/bin/env node
// Capybaroar's MCP server over stdio, for apps that start a command instead of taking a link. Each JSON-RPC message
// from the app goes to the hosted server (https://app.capybaroar.com/api/mcp) with your API key, and the answer comes
// back on stdout. Set CAPYBAROAR_API_KEY (Settings, API and MCP).
import { createInterface } from "node:readline";
import { forward } from "./forward.js";

const key = process.env.CAPYBAROAR_API_KEY;
const url = `${(process.env.CAPYBAROAR_URL || "https://app.capybaroar.com").replace(/\/+$/, "")}/api/mcp`;
if (!key) {
  console.error("Set CAPYBAROAR_API_KEY to an API key from Capybaroar: Settings, API and MCP.");
  process.exit(1);
}

// Answers go out in the order the messages came in.
let queue = Promise.resolve();
createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  const answer = forward(line, { key, url });
  queue = queue.then(async () => {
    const a = await answer;
    if (a) process.stdout.write(JSON.stringify(a) + "\n");
  });
});
