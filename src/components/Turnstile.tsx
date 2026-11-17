"use client";

import { useEffect, useRef, useState } from "react";

// Cloudflare Turnstile: a bot check most people never see (it only shows when Cloudflare wants a click). It writes its
// one-time token into a hidden captchaToken field for the form's server action (src/lib/captcha.ts). Change `round`
// after each try to get a new token, since one works once.

type Api = { render(el: HTMLElement, o: Record<string, unknown>): string; remove(id: string): void };
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function load(): Promise<Api> {
  const w = window as unknown as { turnstile?: Api };
  if (w.turnstile) return Promise.resolve(w.turnstile);
  return new Promise((resolve, reject) => {
    let tag = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    if (!tag) {
      tag = document.createElement("script");
      tag.src = SCRIPT;
      tag.async = true;
      document.head.appendChild(tag);
    }
    tag.addEventListener("load", () => (w.turnstile ? resolve(w.turnstile) : reject(new Error("no turnstile"))));
    tag.addEventListener("error", () => reject(new Error("no turnstile")));
  });
}

export function Turnstile({ siteKey, round }: { siteKey: string; round: number }) {
  const box = useRef<HTMLDivElement>(null);
  // A token belongs to the round it was made in, so a new round starts with none.
  const [got, setGot] = useState({ round, value: "" });
  const token = got.round === round ? got.value : "";
  useEffect(() => {
    let id = "";
    let api: Api | null = null;
    let live = true;
    const set = (value: string) => live && setGot({ round, value });
    load()
      .then((t) => {
        if (!live || !box.current) return;
        api = t;
        id = t.render(box.current, {
          sitekey: siteKey,
          size: "flexible",
          appearance: "interaction-only",
          theme: "light",
          callback: (v: string) => set(v),
          "expired-callback": () => set(""),
          "error-callback": () => set(""),
        });
      })
      .catch(() => set(""));
    return () => {
      live = false;
      if (api && id) api.remove(id);
    };
  }, [siteKey, round]);
  return (
    <>
      <input type="hidden" name="captchaToken" value={token} />
      <div ref={box} className="empty:hidden" />
    </>
  );
}
