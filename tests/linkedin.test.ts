// LinkedIn: PDF document posts (shown as a carousel), visibility and resharing. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { PROVIDERS } from "../src/lib/providers";
import { linkedinMediaProblem, postBody, setDocWait } from "../src/lib/providers/linkedin";
import { NETWORKS } from "../src/lib/networks";
import { sniffMime } from "../src/lib/api/net";
import { PostError, type MediaFile, type Publishable, type Secret } from "../src/lib/providers/types";

setDocWait(5, 0);
const secret: Secret = { accessToken: "tok", refreshToken: null, expiresAt: null, extra: {} };
const file = (mime: string, name = "f"): MediaFile => ({ url: "https://cdn.example.com/" + name, mime, size: 10, name, bytes: async () => Buffer.from("%PDF-1.7") });
const pdf = file("application/pdf", "Bread guide.pdf");
const pic = file("image/jpeg", "a.jpg");
const vid = file("video/mp4", "a.mp4");

test("only LinkedIn takes PDFs", () => {
  assert.deepEqual(NETWORKS.filter((n) => n.documents).map((n) => n.id), ["linkedin", "linkedin-page"]);
});

test("a PDF goes alone, a video goes alone, and pictures stop at 20", () => {
  assert.equal(linkedinMediaProblem({ media: [pdf] }), null);
  assert.equal(linkedinMediaProblem({ media: [pdf, pic] }), "LinkedIn takes one PDF on its own");
  assert.equal(linkedinMediaProblem({ media: [vid, pic] }), "LinkedIn takes one video, or pictures only");
  assert.equal(linkedinMediaProblem({ media: Array.from({ length: 21 }, () => pic) }), "LinkedIn takes up to 20 pictures");
  assert.equal(linkedinMediaProblem({ media: Array.from({ length: 20 }, () => pic) }), null);
});

test("visibility and resharing come from the settings; a Page always posts to anyone", () => {
  const p = (settings: Record<string, string>): Publishable => ({ text: "hi", media: [], settings });
  const person = postBody("urn:li:person:1", p({ visibility: "CONNECTIONS", reshare: "off" }), undefined);
  assert.equal(person.visibility, "CONNECTIONS");
  assert.equal(person.isReshareDisabledByAuthor, true);
  assert.equal(postBody("urn:li:person:1", p({}), undefined).visibility, "PUBLIC");
  assert.equal(postBody("urn:li:person:1", p({ visibility: "weird" }), undefined).visibility, "PUBLIC");
  assert.equal(postBody("urn:li:person:1", p({}), undefined).isReshareDisabledByAuthor, false);
  assert.equal(postBody("urn:li:organization:9", p({ visibility: "CONNECTIONS" }), undefined).visibility, "PUBLIC");
});

async function run(p: Publishable, statuses: string[]) {
  const real = globalThis.fetch;
  const sent: { url: string; init: RequestInit }[] = [];
  let checks = 0;
  globalThis.fetch = (async (u: string | URL | Request, init: RequestInit = {}) => {
    const url = String(u);
    sent.push({ url, init });
    if (url.includes("/rest/documents?action=initializeUpload")) return Response.json({ value: { uploadUrl: "https://upload.example.com/doc", document: "urn:li:document:D1" } });
    if (url.startsWith("https://upload.example.com")) return new Response(null, { status: 201 });
    if (url.includes("/rest/documents/")) return Response.json({ status: statuses[Math.min(checks++, statuses.length - 1)] });
    if (url.endsWith("/rest/posts")) return new Response(null, { status: 201, headers: { "x-restli-id": "urn:li:share:7" } });
    return Response.json({});
  }) as typeof fetch;
  try {
    return { out: await PROVIDERS.linkedin.publish(secret, "abc", p), sent };
  } finally {
    globalThis.fetch = real;
  }
}

test("a PDF is uploaded, waited for, and posted with its title", async () => {
  const { out, sent } = await run({ text: "Our guide", media: [pdf], settings: {} }, ["PROCESSING", "PROCESSING", "AVAILABLE"]);
  assert.equal(out.id, "urn:li:share:7");
  const body = JSON.parse(String(sent.find((s) => s.url.endsWith("/rest/posts"))!.init.body));
  assert.deepEqual(body.content, { media: { title: "Bread guide", id: "urn:li:document:D1" } });
  assert.equal(sent.filter((s) => s.url.includes("/rest/documents/")).length, 3);
  const named = await run({ text: "x", media: [pdf], settings: { doc_title: "  June recipes " } }, ["AVAILABLE"]);
  assert.equal(JSON.parse(String(named.sent.find((s) => s.url.endsWith("/rest/posts"))!.init.body)).content.media.title, "June recipes");
});

test("a PDF LinkedIn can't read fails for good; one still processing is retried later", async () => {
  await assert.rejects(run({ text: "x", media: [pdf], settings: {} }, ["PROCESSING_FAILED"]), (e: unknown) => e instanceof PostError && /couldn't read this PDF/.test((e as Error).message));
  await assert.rejects(run({ text: "x", media: [pdf], settings: {} }, ["PROCESSING"]), (e: unknown) => !(e instanceof PostError) && /still reading/.test((e as Error).message));
});

test("a PDF from a link is recognised by its first bytes", () => {
  assert.equal(sniffMime(new Uint8Array(Buffer.from("%PDF-1.7\n"))), "application/pdf");
  assert.equal(sniffMime(new Uint8Array(Buffer.from("%PDX-1.7\n"))), null);
});
