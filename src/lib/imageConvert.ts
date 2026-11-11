// HEIC, HEIF and AVIF photos become JPEG in the browser before they upload, so every network takes them. The browser
// decodes what it can (AVIF everywhere, HEIC in Safari); otherwise HEIC is read with heic-to, loaded only when needed.

const CONVERT = /^image\/(heic|heif|avif)$/;
const EXT = /\.(heic|heif|avif)$/i;

/** Whether this file is one we turn into a JPEG first (some browsers give HEIC files no type, so the name counts too). */
export const needsJpeg = (f: { type: string; name: string }) => CONVERT.test(f.type) || (!f.type && EXT.test(f.name));

/** The file name with a .jpg ending. */
export const jpegName = (name: string) => name.replace(EXT, "") + ".jpg";

async function viaCanvas(blob: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0);
  bmp.close();
  return new Promise((ok, no) => canvas.toBlob((b) => (b ? ok(b) : no(new Error("Couldn't convert the picture"))), "image/jpeg", 0.92));
}

/** A JPEG copy of a HEIC, HEIF or AVIF photo; any other file comes back as it is. */
export async function toUploadable(file: File): Promise<File> {
  if (!needsJpeg(file)) return file;
  let jpeg: Blob;
  try {
    jpeg = await viaCanvas(file);
  } catch {
    if (/avif/i.test(file.type) || /\.avif$/i.test(file.name)) throw new Error(`Couldn't read ${file.name}. Save it as JPG and try again.`);
    const { heicTo } = await import("heic-to/next");
    jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
  }
  return new File([jpeg], jpegName(file.name), { type: "image/jpeg", lastModified: file.lastModified });
}
