// The arguments of a read (src/lib/read.ts, src/app/api/app/[read]/route.ts), as they travel in the address: a JSON
// array, at most 8 KB. Pure, so tests/read.test.ts runs it.

export const MAX_ARGS = 8192;

/** The arguments from ?a=, or null when they aren't a JSON array within the size limit. No ?a= means none. */
export function readArgs(raw: string | null): unknown[] | null {
  if (raw === null || raw === "") return [];
  if (raw.length > MAX_ARGS) return null;
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/** The address of a read. */
export const readUrl = (name: string, args: unknown[]) => `/api/app/${encodeURIComponent(name)}${args.length ? `?a=${encodeURIComponent(JSON.stringify(args))}` : ""}`;
