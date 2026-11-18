// Small pictures for tiles (the Media grid, the composer's library, pickers). No database or storage here, so tests
// cover it; makeThumb in src/lib/media.ts saves them.

/** Thumbnails are this wide (never wider than the original), kept to the original's shape. */
export const THUMB_WIDTH = 480;
export const THUMB_QUALITY = 75;
export const THUMB_MIME = "image/webp";
/** Larger originals aren't read for a thumbnail; their tiles show the original. */
export const THUMB_MAX_SOURCE = 50 * 1024 * 1024;

/** Pictures that get a thumbnail. Videos, audio and PDFs don't. */
export const thumbable = (mime: unknown, size?: number): boolean =>
  typeof mime === "string" && /^image\/(jpeg|png|gif|webp)$/.test(mime) && !(typeof size === "number" && size > THUMB_MAX_SOURCE);

/**
 * Where an original's thumbnail is stored: `<workspace>/<name>` keeps it at `<workspace>/thumbs/<name>.webp`, in the
 * same bucket and the workspace's own folder (so deleting the workspace removes it), in a subfolder upload paths can
 * never name (isUploadPath allows no "/" after the workspace).
 */
export function thumbPathOf(path: string): string {
  const i = path.indexOf("/");
  if (i <= 0 || i === path.length - 1) throw new Error("Not a media path");
  return `${path.slice(0, i)}/thumbs/${path.slice(i + 1)}.webp`;
}

/** A picture's thumbnail: turned upright from its EXIF, THUMB_WIDTH wide at most (never enlarged), WebP. GIFs give their first frame. */
export async function renderThumb(original: Uint8Array): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(original, { failOn: "none" }).rotate().resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: THUMB_QUALITY }).toBuffer();
}

/** Whether a made thumbnail is worth keeping: a picture already smaller than its thumbnail shows itself. */
export const keepThumb = (thumbBytes: number, originalBytes: number): boolean => thumbBytes > 0 && thumbBytes < originalBytes;

/** The stored file a tile shows: the thumbnail when there is one, else the original. */
export const tilePath = (row: { path: string; thumb_path?: string | null }): string => row.thumb_path || row.path;

/** Every stored file of these rows (originals and thumbnails), for deleting. */
export const storedPaths = (rows: { path: string; thumb_path?: string | null }[]): string[] => rows.flatMap((r) => (r.thumb_path ? [r.path, r.thumb_path] : [r.path]));
