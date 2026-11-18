import type { ReadName, Reads } from "./appReads";
import { readUrl } from "./readRules";

/**
 * Calls one of the app's reads (src/lib/appReads.ts) over GET, so it runs alongside other reads and saves instead of
 * queuing behind them like a server action. Same arguments and result as the function itself. A hiccup (network, 5xx)
 * is tried again twice with growing waits; anything else, or signed out, throws.
 */
export async function read<K extends ReadName>(name: K, ...args: Parameters<Reads[K]>): Promise<Awaited<ReturnType<Reads[K]>>> {
  const url = readUrl(name, args);
  for (let i = 0; ; i++) {
    let res: Response | null = null;
    try {
      res = await fetch(url, { credentials: "same-origin", headers: { Accept: "application/json" }, cache: "no-store" });
    } catch (e) {
      if (i >= 2) throw e;
    }
    if (res) {
      const json = (res.headers.get("content-type") ?? "").includes("application/json");
      if (res.ok && json) return (await res.json()) as Awaited<ReturnType<Reads[K]>>;
      if (res.status < 500 || i >= 2) throw new Error(res.redirected || !json ? "Sign in again" : `Couldn't load (${res.status})`);
    }
    await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }
}
