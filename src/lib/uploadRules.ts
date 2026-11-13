// What people may upload, judged by the stored file itself, never by what the browser said. Pure, so tests cover it.
import { sniffMime } from "./api/net";

export const MAX_BYTES = 250 * 1024 * 1024;
export const ALLOWED = /^(image\/(jpeg|png|gif|webp)|video\/(mp4|quicktime)|audio\/(mpeg|wav|ogg)|application\/pdf)$/;
/** LinkedIn takes documents up to 100 MB. */
export const MAX_PDF = 100 * 1024 * 1024;
/** What people may upload themselves; audio comes from CapyAudio. */
export const UPLOADS = /^(image\/(jpeg|png|gif|webp)|video\/(mp4|quicktime)|application\/pdf)$/;
/** Bytes read from the start of a stored file to tell what it is. */
export const HEAD_BYTES = 64;

const KINDS = "Use JPG, PNG, GIF, WebP, MP4, MOV or PDF";
const VIDEO = /^video\/(mp4|quicktime)$/;

export const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** The size and type a browser says, checked before it gets an upload link. */
export function checkClaim(file: { type: unknown; size: unknown }) {
  if (typeof file.type !== "string" || !UPLOADS.test(file.type)) throw new Error(KINDS);
  if (typeof file.size !== "number" || !Number.isFinite(file.size) || file.size <= 0) throw new Error("The file is empty");
  if (file.size > MAX_BYTES) throw new Error("Files are up to 250 MB");
  if (file.type === "application/pdf" && file.size > MAX_PDF) throw new Error("PDFs are up to 100 MB");
}

/** The only paths prepareUpload hands out: `<workspace>/<uuid>-<clean name>`. */
export function isUploadPath(workspaceId: string, path: unknown): path is string {
  if (typeof path !== "string" || !path.startsWith(`${workspaceId}/`)) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[\w.-]{1,80}$/i.test(path.slice(workspaceId.length + 1)) && !path.includes("..");
}

/**
 * What a stored upload really is, from its first bytes and its real size. Refuses anything that isn't one of the
 * kinds people upload, or isn't the kind the browser said (MP4 and MOV count as one: the same box format, and
 * browsers name them by the file's ending). Returns the type and size to record.
 */
export function judgeUpload(claimed: string, head: Uint8Array, size: number): { mime: string; size: number } {
  const real = sniffMime(head);
  if (!real || !UPLOADS.test(real)) throw new Error(KINDS);
  if (real !== claimed && !(VIDEO.test(real) && VIDEO.test(claimed))) throw new Error(`The file isn't the kind its name says. ${KINDS}`);
  if (!(size > 0)) throw new Error("The file is empty");
  if (size > MAX_BYTES) throw new Error("Files are up to 250 MB");
  if (real === "application/pdf" && size > MAX_PDF) throw new Error("PDFs are up to 100 MB");
  return { mime: real, size };
}
