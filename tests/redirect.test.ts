// Where people go after signing in, and whose IP the sign-in limits count. They prove: `next` only ever leads to a path
// on this site (tabs, backslashes, protocol-relative and full addresses, encoded slashes all fall back to /calendar),
// ordinary paths keep their query, and the client IP comes only from a header our own proxy sets.
import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "../src/proxy";
import { trustedIp } from "../src/lib/clientIp";

process.env.APP_URL = "https://app.capybaroar.com";

test("safeNext refuses anything that could leave the site", () => {
  const bad = [
    "//x",
    "//evil.com/calendar",
    "/\\x",
    "/\\/evil.com",
    "\\\\evil.com",
    "/\t/x",
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r/evil.com",
    " /x",
    "/ /x",
    "/%2F/evil.com",
    "/%5c/evil.com",
    "https://x",
    "https://app.capybaroar.com.evil.com/",
    "http:evil.com",
    "javascript:alert(1)",
    "x",
    "",
    null,
    undefined,
    "/" + "a".repeat(3000),
  ];
  for (const v of bad) assert.equal(safeNext(v), "/calendar", JSON.stringify(v));
});

test("safeNext keeps paths on this site, with their query", () => {
  assert.equal(safeNext("/calendar?a=b"), "/calendar?a=b");
  assert.equal(safeNext("/invite/abc"), "/invite/abc");
  assert.equal(safeNext("/oauth/authorize?client_id=cbc_1&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb&state=s"), "/oauth/authorize?client_id=cbc_1&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb&state=s");
  // Encoded characters stay encoded: the browser doesn't turn them into a new address.
  assert.equal(safeNext("/%09/x"), "/%09/x");
  assert.equal(safeNext("/a/../settings"), "/settings");
  for (const v of ["/%09/x", "/calendar?a=b", "/a/../settings"]) assert.equal(new URL(safeNext(v), process.env.APP_URL).origin, "https://app.capybaroar.com");
});

const h = (o: Record<string, string>) => ({ get: (n: string) => o[n.toLowerCase()] ?? null });

test("the client IP comes from the header our proxy sets, never from what the visitor sent", () => {
  // On Fly: Fly-Client-IP only.
  assert.equal(trustedIp(h({ "fly-client-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9", "x-real-ip": "8.8.8.8" }), { FLY_APP_NAME: "web" }), "1.2.3.4");
  assert.equal(trustedIp(h({ "x-forwarded-for": "9.9.9.9" }), { FLY_APP_NAME: "web" }), "");
  // Behind Caddy: X-Real-IP, else the address the proxy appended last.
  assert.equal(trustedIp(h({ "x-real-ip": "5.6.7.8", "x-forwarded-for": "9.9.9.9, 5.6.7.8", "fly-client-ip": "6.6.6.6" }), {}), "5.6.7.8");
  assert.equal(trustedIp(h({ "x-forwarded-for": "9.9.9.9, 5.6.7.8" }), {}), "5.6.7.8");
  // A header named in CLIENT_IP_HEADER wins.
  assert.equal(trustedIp(h({ "cf-connecting-ip": "7.7.7.7", "x-real-ip": "5.6.7.8" }), { CLIENT_IP_HEADER: "CF-Connecting-IP" }), "7.7.7.7");
  assert.equal(trustedIp(h({}), {}), "");
});
