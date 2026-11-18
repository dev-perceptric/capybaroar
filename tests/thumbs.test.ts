// Thumbnails for library tiles. They prove: only pictures (and not huge ones) get one, a thumbnail lives in the
// workspace's own folder at a path an upload can never claim, tiles show the thumbnail and fall back to the original,
// deleting a file removes its thumbnail too, a thumbnail is kept only when it's smaller than the original, and the
// renderer makes real WebP files, upright and never enlarged.
import { test } from "node:test";
import assert from "node:assert/strict";
import { THUMB_MAX_SOURCE, THUMB_WIDTH, keepThumb, renderThumb, storedPaths, thumbPathOf, thumbable, tilePath } from "../src/lib/thumbRules";
import { isUploadPath } from "../src/lib/uploadRules";

const WS = "11111111-2222-4333-8444-555555555555";
const ORIGINAL = `${WS}/66666666-7777-4888-9999-000000000000-photo.jpg`;

test("pictures get a thumbnail; videos, audio, PDFs and huge files don't", () => {
  for (const m of ["image/jpeg", "image/png", "image/gif", "image/webp"]) assert.equal(thumbable(m, 1000), true, m);
  for (const m of ["video/mp4", "video/quicktime", "audio/mpeg", "application/pdf", "image/svg+xml", "", null, undefined]) assert.equal(thumbable(m, 1000), false, String(m));
  assert.equal(thumbable("image/jpeg"), true);
  assert.equal(thumbable("image/jpeg", THUMB_MAX_SOURCE), true);
  assert.equal(thumbable("image/jpeg", THUMB_MAX_SOURCE + 1), false);
});

test("a thumbnail sits in the workspace's thumbs folder, at a path uploads can't name", () => {
  const t = thumbPathOf(ORIGINAL);
  assert.equal(t, `${WS}/thumbs/66666666-7777-4888-9999-000000000000-photo.jpg.webp`);
  assert.ok(t.startsWith(`${WS}/`));
  assert.equal(isUploadPath(WS, ORIGINAL), true);
  assert.equal(isUploadPath(WS, t), false);
  // AI files saved at a fixed name work the same way.
  assert.equal(thumbPathOf(`${WS}/ai-abc-cat.png`), `${WS}/thumbs/ai-abc-cat.png.webp`);
  assert.throws(() => thumbPathOf("no-folder.jpg"));
  assert.throws(() => thumbPathOf("/x.jpg"));
  assert.throws(() => thumbPathOf(`${WS}/`));
});

test("a tile shows the thumbnail, or the original when there's none", () => {
  assert.equal(tilePath({ path: ORIGINAL, thumb_path: thumbPathOf(ORIGINAL) }), thumbPathOf(ORIGINAL));
  assert.equal(tilePath({ path: ORIGINAL, thumb_path: null }), ORIGINAL);
  assert.equal(tilePath({ path: ORIGINAL }), ORIGINAL);
  assert.equal(tilePath({ path: ORIGINAL, thumb_path: "" }), ORIGINAL);
});

test("deleting removes the original and its thumbnail", () => {
  const a = { path: ORIGINAL, thumb_path: thumbPathOf(ORIGINAL) };
  const b = { path: `${WS}/clip.mp4`, thumb_path: null };
  assert.deepEqual(storedPaths([a, b]), [ORIGINAL, thumbPathOf(ORIGINAL), `${WS}/clip.mp4`]);
  assert.deepEqual(storedPaths([]), []);
});

test("a thumbnail is kept only when it's smaller than the original", () => {
  assert.equal(keepThumb(20_000, 3_000_000), true);
  assert.equal(keepThumb(5_000, 5_000), false);
  assert.equal(keepThumb(6_000, 5_000), false);
  assert.equal(keepThumb(0, 5_000), false);
});

test("the thumbnail is a WebP 480 wide at most, keeps the shape, is never enlarged, and is turned upright", async () => {
  const sharp = (await import("sharp")).default;
  const picture = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: { r: 200, g: 120, b: 40 } } });

  const big = await sharp(await renderThumb(await picture(1200, 800).jpeg().toBuffer())).metadata();
  assert.equal(big.format, "webp");
  assert.equal(big.width, THUMB_WIDTH);
  assert.equal(big.height, 320);

  const small = await sharp(await renderThumb(await picture(200, 100).png().toBuffer())).metadata();
  assert.equal(small.width, 200);
  assert.equal(small.height, 100);

  // A phone photo stored sideways with EXIF orientation 6 (turn 90 degrees) comes out upright: tall, not wide.
  const sideways = await picture(1600, 900).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const upright = await sharp(await renderThumb(sideways)).metadata();
  assert.equal(upright.width, THUMB_WIDTH);
  assert.equal(upright.height, Math.round((1600 / 900) * THUMB_WIDTH));

  // A GIF gives its first frame.
  const gif = await sharp(await renderThumb(await picture(600, 600).gif().toBuffer())).metadata();
  assert.equal(gif.format, "webp");
  assert.equal(gif.width, THUMB_WIDTH);

  await assert.rejects(renderThumb(new Uint8Array([1, 2, 3, 4])));
});
