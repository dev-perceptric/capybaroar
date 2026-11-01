"use client";

import { useEffect } from "react";

// A tab opened before an update calls server code that no longer exists, so its buttons hang. This reloads it:
// when it comes back into view (or every 5 minutes) and a newer build is running, and right away when a server
// action fails because the build changed. At most one reload a minute, so it can't loop.
const MINE = process.env.NEXT_PUBLIC_BUILD ?? "";

export const isStaleError = (msg: string) => /Server Action|server action|Server Reference|ChunkLoadError|Loading chunk/i.test(msg);

export function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem("stale-reload") ?? 0);
    if (Date.now() - last < 60000) return;
    sessionStorage.setItem("stale-reload", String(Date.now()));
  } catch {
    // storage blocked: reload anyway
  }
  window.location.reload();
}

export function StaleTab() {
  useEffect(() => {
    let stopped = false;
    const check = async () => {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        const { build } = (await r.json()) as { build: string };
        if (build && MINE && build !== MINE) reloadOnce();
      } catch {
        // offline or deploying: try again later
      }
    };
    const onError = (e: PromiseRejectionEvent | ErrorEvent) => {
      const msg = String((e as PromiseRejectionEvent).reason?.message ?? (e as ErrorEvent).message ?? "");
      if (isStaleError(msg)) reloadOnce();
    };
    const t = setInterval(check, 5 * 60000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("unhandledrejection", onError);
    window.addEventListener("error", onError);
    return () => {
      stopped = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("unhandledrejection", onError);
      window.removeEventListener("error", onError);
    };
  }, []);
  return null;
}
