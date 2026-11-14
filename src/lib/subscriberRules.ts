// Subprocessor change notices, the pure half: which addresses are accepted, and the links. No Supabase, so tests run it.

/** A plain email address, trimmed and lowercased, or null. Kept simple on purpose: the confirm email proves it works. */
export function cleanEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (s.length < 6 || s.length > 254) return null;
  if (!/^[^\s@<>()"',;:]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(s)) return null;
  return s;
}

/** A token from a link: base64url and the right length, or null. */
export const cleanToken = (v: unknown): string | null => (typeof v === "string" && /^[A-Za-z0-9_-]{32}$/.test(v) ? v : null);

/** Where the subscribe, confirm and unsubscribe steps send the browser back to. */
export const backTo = (site: string, state: "check" | "yes" | "off" | "error") => `${site.replace(/\/$/, "")}/subprocessors?subscribed=${state}`;
