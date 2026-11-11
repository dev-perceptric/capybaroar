// OAuth for the MCP server (Claude's connectors directory): registration, redirect matching, PKCE, the sign-in request
// checks, the discovery documents and the tools the directory connection hides. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  CLAUDE_CALLBACK,
  DIRECTORY_HIDDEN,
  authorizationServer,
  backTo,
  challengeHeader,
  cleanAuthorize,
  cleanRegistration,
  isAccessToken,
  newAccessToken,
  newRefreshToken,
  pkceOk,
  protectedResource,
  redirectMatches,
  redirectProblem,
} from "../src/lib/oauth/rules";
import { handleMcp } from "../src/lib/api/mcp";
import type { Ops } from "../src/lib/api/types";

const BASE = "https://app.capybaroar.com";
const MCP = `${BASE}/api/mcp`;
const verifier = "a".repeat(20) + "B".repeat(20) + "-._~123";
const challenge = createHash("sha256").update(verifier).digest("base64url");

test("registration takes https and loopback redirects only, as a public client", () => {
  const ok = cleanRegistration({ client_name: "Claude", redirect_uris: [CLAUDE_CALLBACK, "http://localhost/callback", "http://127.0.0.1:33418/callback"] });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.name, "Claude");
  assert.equal(cleanRegistration({ redirect_uris: [] }).ok, false);
  assert.equal(cleanRegistration({ redirect_uris: ["http://evil.example.com/cb"] }).ok, false);
  assert.equal(cleanRegistration({ redirect_uris: ["javascript:alert(1)"] }).ok, false);
  assert.equal(cleanRegistration({ redirect_uris: ["https://x.example.com/cb#frag"] }).ok, false);
  assert.equal(cleanRegistration({ redirect_uris: [CLAUDE_CALLBACK], token_endpoint_auth_method: "client_secret_basic" }).ok, false);
  const unnamed = cleanRegistration({ redirect_uris: [CLAUDE_CALLBACK] });
  assert.ok(unnamed.ok && unnamed.name === "MCP app");
  assert.equal(redirectProblem("https://claude.ai/api/mcp/auth_callback"), null);
});

test("redirects match exactly, and loopback addresses may use any port", () => {
  const reg = [CLAUDE_CALLBACK, "http://localhost/callback", "http://127.0.0.1/callback"];
  assert.ok(redirectMatches(reg, CLAUDE_CALLBACK));
  assert.ok(redirectMatches(reg, "http://localhost:51234/callback"));
  assert.ok(redirectMatches(reg, "http://127.0.0.1:9/callback"));
  assert.ok(!redirectMatches(reg, "https://claude.ai/api/mcp/auth_callback/x"));
  assert.ok(!redirectMatches(reg, "http://localhost:51234/other"));
  assert.ok(!redirectMatches(reg, "https://localhost:51234/callback"), "loopback port freedom is for http only");
  assert.ok(!redirectMatches(reg, "http://evil.com/callback"));
});

test("PKCE: only the verifier that made the S256 challenge passes", () => {
  assert.ok(pkceOk(verifier, challenge));
  assert.ok(!pkceOk(verifier + "x", challenge));
  assert.ok(!pkceOk("short", challenge));
  assert.ok(!pkceOk(undefined, challenge));
});

test("the sign-in request is checked, and a bad client or redirect is never redirected to", () => {
  const reg = [CLAUDE_CALLBACK];
  const good = { client_id: "cbc_x", redirect_uri: CLAUDE_CALLBACK, response_type: "code", code_challenge: challenge, code_challenge_method: "S256", state: "s1", resource: MCP };
  const ok = cleanAuthorize(good, reg, MCP);
  assert.ok(ok.ok && ok.ask.state === "s1" && ok.ask.resource === MCP);
  const noClient = cleanAuthorize(good, null, MCP);
  assert.ok(!noClient.ok && !noClient.redirect);
  const badRedirect = cleanAuthorize({ ...good, redirect_uri: "https://evil.example.com/cb" }, reg, MCP);
  assert.ok(!badRedirect.ok && !badRedirect.redirect);
  const plain = cleanAuthorize({ ...good, code_challenge_method: "plain" }, reg, MCP);
  assert.ok(!plain.ok && plain.redirect && plain.error === "invalid_request");
  const noPkce = cleanAuthorize({ ...good, code_challenge: undefined }, reg, MCP);
  assert.ok(!noPkce.ok && noPkce.redirect);
  const token = cleanAuthorize({ ...good, response_type: "token" }, reg, MCP);
  assert.ok(!token.ok && token.error === "unsupported_response_type");
  const other = cleanAuthorize({ ...good, resource: "https://other.example.com/mcp" }, reg, MCP);
  assert.ok(!other.ok && other.error === "invalid_target");
  assert.ok(cleanAuthorize({ ...good, resource: `${MCP}/` }, reg, MCP).ok, "a trailing slash on the resource is fine");
});

test("the redirect back carries the code and the app's state", () => {
  const u = new URL(backTo(CLAUDE_CALLBACK, { code: "c1", state: "s1" }));
  assert.equal(u.searchParams.get("code"), "c1");
  assert.equal(u.searchParams.get("state"), "s1");
});

test("discovery documents point at each other and at the MCP server", () => {
  const pr = protectedResource(BASE);
  assert.equal(pr.resource, MCP);
  assert.deepEqual(pr.authorization_servers, [BASE]);
  const as = authorizationServer(BASE);
  assert.equal(as.issuer, BASE);
  assert.deepEqual(as.code_challenge_methods_supported, ["S256"]);
  assert.ok(as.registration_endpoint.endsWith("/api/oauth/register"));
  assert.deepEqual(as.token_endpoint_auth_methods_supported, ["none"]);
  assert.equal(challengeHeader(BASE), `Bearer resource_metadata="${BASE}/.well-known/oauth-protected-resource"`);
});

test("tokens have their own prefixes, so they never pass for API keys", () => {
  const a = newAccessToken();
  assert.ok(isAccessToken(a));
  assert.ok(!isAccessToken(newRefreshToken()));
  assert.ok(!isAccessToken("cbr_" + a.slice(4)));
});

test("the directory connection doesn't list or run the AI media tools", async () => {
  const ops = {} as Ops;
  const list = (await handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/list" }, ops, "UTC", { hide: DIRECTORY_HIDDEN })) as { result: { tools: { name: string }[] } };
  const names = list.result.tools.map((t) => t.name);
  assert.ok(!names.includes("generate_media") && !names.includes("get_generation"));
  assert.ok(names.includes("create_posts"));
  const full = (await handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/list" }, ops, "UTC")) as { result: { tools: { name: string }[] } };
  assert.ok(full.result.tools.some((t) => t.name === "generate_media"), "keys keep every tool");
  const call = (await handleMcp({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "generate_media", arguments: {} } }, ops, "UTC", { hide: DIRECTORY_HIDDEN })) as { error: { code: number } };
  assert.equal(call.error.code, -32602);
});

test("every tool has a title and a read-only or destructive hint (directory rule)", async () => {
  const list = (await handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/list" }, {} as Ops, "UTC")) as { result: { tools: { name: string; title: string; annotations: Record<string, boolean> }[] } };
  for (const t of list.result.tools) {
    assert.ok(t.title, `${t.name} has a title`);
    assert.ok(t.name.length <= 64);
    assert.equal(typeof t.annotations.readOnlyHint, "boolean", `${t.name} readOnlyHint`);
    assert.equal(typeof t.annotations.destructiveHint, "boolean", `${t.name} destructiveHint`);
  }
});

test("apps that sign in see securitySchemes on every tool (ChatGPT); key users don't", async () => {
  const signed = (await handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/list" }, {} as Ops, "UTC", { hide: DIRECTORY_HIDDEN, oauth: true })) as { result: { tools: { securitySchemes?: unknown[] }[] } };
  assert.ok(signed.result.tools.length && signed.result.tools.every((t) => JSON.stringify(t.securitySchemes) === JSON.stringify([{ type: "oauth2", scopes: ["mcp"] }])));
  const keyed = (await handleMcp({ jsonrpc: "2.0", id: 1, method: "tools/list" }, {} as Ops, "UTC")) as { result: { tools: { securitySchemes?: unknown[] }[] } };
  assert.ok(keyed.result.tools.every((t) => t.securitySchemes === undefined));
});
