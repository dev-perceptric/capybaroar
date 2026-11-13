// Uploads people make in the browser. They prove: what the browser says is only a claim, the stored file's first
// bytes and real size decide, a file that isn't what it claims (a page named photo.png, a PNG sent as a JPG, a HEIC
// picture sent as an MP4) is refused, size caps use the real size, only paths the app handed out are accepted, and
// ids that go into a filter string are plain UUIDs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_BYTES, MAX_PDF, checkClaim, isUploadPath, isUuid, judgeUpload } from "../src/lib/uploadRules";
import { sniffMime } from "../src/lib/api/net";

const pad = (...x: number[]) => new Uint8Array([...x, ...Array(48).fill(0)]);
const ascii = (s: string) => new Uint8Array([...Buffer.from(s, "latin1"), ...Array(48).fill(0)]);
const JPG = pad(0xff, 0xd8, 0xff, 0xe0);
const PNG = pad(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const GIF = ascii("GIF89a");
const WEBP = ascii("RIFF\0\0\0\0WEBPVP8 ");
const MP4 = ascii("\0\0\0\x20ftypisom");
const MOV = ascii("\0\0\0\x14ftypqt  ");
const PDF = ascii("%PDF-1.7");
const MB = 1024 * 1024;

test("a file that is what it claims is recorded with its sniffed type and real size", () => {
  for (const [claimed, head] of [["image/jpeg", JPG], ["image/png", PNG], ["image/gif", GIF], ["image/webp", WEBP], ["video/mp4", MP4], ["video/quicktime", MOV], ["application/pdf", PDF]] as const) {
    assert.deepEqual(judgeUpload(claimed, head, 1234), { mime: claimed, size: 1234 }, claimed);
  }
  // MP4 and MOV are one box format; browsers name them by the file's ending. The sniffed type is what's stored.
  assert.deepEqual(judgeUpload("video/quicktime", MP4, 10), { mime: "video/mp4", size: 10 });
  assert.deepEqual(judgeUpload("video/mp4", MOV, 10), { mime: "video/quicktime", size: 10 });
});

test("a file that isn't what it claims is refused", () => {
  const refused = (claimed: string, head: Uint8Array, re = /isn't the kind its name says|Use JPG/) => assert.throws(() => judgeUpload(claimed, head, 1000), re, claimed);
  refused("image/png", ascii("<!doctype html><script>alert(1)</script>"));
  refused("image/jpeg", ascii("<svg xmlns='http://www.w3.org/2000/svg' onload='x()'/>"));
  refused("application/pdf", ascii("#!/bin/sh\nrm -rf /"));
  refused("image/jpeg", PNG, /isn't the kind its name says/);
  refused("image/png", GIF, /isn't the kind its name says/);
  refused("application/pdf", JPG, /isn't the kind its name says/);
  refused("video/mp4", PDF, /isn't the kind its name says/);
  refused("image/jpeg", MP4, /isn't the kind its name says/);
  // Allowed for Capy's own files, never for uploads people make.
  refused("audio/mpeg", ascii("ID3\x04"));
  // Box-format files that aren't videos: HEIC and AVIF pictures, M4A audio.
  for (const brand of ["heic", "mif1", "avif", "M4A "]) {
    assert.equal(sniffMime(ascii(`\0\0\0\x18ftyp${brand}`)), null, brand);
    refused("video/mp4", ascii(`\0\0\0\x18ftyp${brand}`));
  }
  // An empty or unread start is nothing.
  refused("image/png", new Uint8Array(0));
});

test("size caps use the real size, not the size the browser said", () => {
  assert.throws(() => judgeUpload("video/mp4", MP4, MAX_BYTES + 1), /250 MB/);
  assert.throws(() => judgeUpload("application/pdf", PDF, MAX_PDF + 1), /100 MB/);
  assert.equal(judgeUpload("application/pdf", PDF, MAX_PDF).size, MAX_PDF);
  assert.equal(judgeUpload("video/mp4", MP4, MAX_BYTES).size, MAX_BYTES);
  assert.throws(() => judgeUpload("image/png", PNG, 0), /empty/);
  assert.throws(() => judgeUpload("image/png", PNG, Number.NaN), /empty/);
  assert.equal(MAX_BYTES, 250 * MB);
  assert.equal(MAX_PDF, 100 * MB);
});

test("the claim is checked before an upload link is handed out", () => {
  checkClaim({ type: "image/png", size: 10 });
  checkClaim({ type: "application/pdf", size: MAX_PDF });
  assert.throws(() => checkClaim({ type: "text/html", size: 10 }), /Use JPG/);
  assert.throws(() => checkClaim({ type: "image/svg+xml", size: 10 }), /Use JPG/);
  assert.throws(() => checkClaim({ type: ["image/png"], size: 10 }), /Use JPG/);
  assert.throws(() => checkClaim({ type: "image/png", size: "10" }), /empty/);
  assert.throws(() => checkClaim({ type: "image/png", size: -1 }), /empty/);
  assert.throws(() => checkClaim({ type: "video/mp4", size: MAX_BYTES + 1 }), /250 MB/);
  assert.throws(() => checkClaim({ type: "application/pdf", size: MAX_PDF + 1 }), /100 MB/);
});

test("only paths the app handed out for this workspace are accepted", () => {
  const ws = "6f1c2a7e-9b1d-4c3e-8f2a-1b2c3d4e5f60";
  const other = "0a1b2c3d-4e5f-4a1b-8c2d-3e4f5a6b7c8d";
  const id = "11111111-2222-4333-8444-555555555555";
  assert.equal(isUploadPath(ws, `${ws}/${id}-photo.jpg`), true);
  assert.equal(isUploadPath(ws, `${ws}/${id}-file`), true);
  for (const p of [`${other}/${id}-photo.jpg`, `${ws}/../${other}/${id}-photo.jpg`, `${ws}/${id}-..`, `${ws}/${id}-a/b.jpg`, `${ws}/photo.jpg`, `${ws}/${id}-`, `${ws}/${id}-${"a".repeat(81)}`, `${ws}x/${id}-a.jpg`, 42, null]) {
    assert.equal(isUploadPath(ws, p), false, String(p));
  }
});

test("ids that go into a filter string are plain UUIDs", () => {
  assert.equal(isUuid("11111111-2222-4333-8444-555555555555"), true);
  assert.equal(isUuid("11111111-2222-4333-8444-55555555555A"), true);
  for (const bad of ["", "1", "11111111-2222-4333-8444-555555555555}", "x},thread.cs.[{", '11111111-2222-4333-8444-555555555555"]}],id.neq.0', " 11111111-2222-4333-8444-555555555555", null, 7, {}]) {
    assert.equal(isUuid(bad), false, String(bad));
  }
});
