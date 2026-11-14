"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button, Switch } from "./ui";
import { consentCookie, consentHidden, readConsent } from "@/lib/consentRules";

/** The cookie banner, the same choice as the website's (one cookie on .capybaroar.com). Shows until someone picks. */
const subscribe = (fn: () => void) => {
  window.addEventListener("cb-consent", fn);
  return () => window.removeEventListener("cb-consent", fn);
};
// On the server we can't see cookies, so nothing renders there; the browser then shows the banner if no choice is saved.
const chosen = () => (readConsent(document.cookie) ? "yes" : "no");
const serverChosen = () => "yes";

export function CookieConsent() {
  const path = usePathname() ?? "/";
  const saved = useSyncExternalStore(subscribe, chosen, serverChosen);
  const [reopened, setReopened] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const reopen = () => {
      setAnalytics(readConsent(document.cookie)?.analytics ?? false);
      setDetails(true);
      setReopened(true);
    };
    window.addEventListener("cb-consent-open", reopen);
    return () => window.removeEventListener("cb-consent-open", reopen);
  }, []);

  const open = saved === "no" || reopened;
  if (!open || consentHidden(path)) return null;

  const save = (a: boolean) => {
    document.cookie = consentCookie({ analytics: a }, location.hostname, location.protocol === "https:");
    window.dispatchEvent(new CustomEvent("cb-consent", { detail: { analytics: a } }));
    setReopened(false);
  };

  return (
    <section role="dialog" aria-labelledby="cc-title" className="fixed right-4 bottom-4 left-4 z-[60] rounded-2xl bg-panel p-5 text-[13px] shadow-modal sm:right-auto sm:w-[380px]">
      <h2 id="cc-title" className="text-[14px] font-semibold text-ink">
        Cookies
      </h2>
      <p className="mt-1 text-muted">We use cookies that keep you signed in and keep the app working. Analytics cookies stay off unless you allow them.</p>
      {details ? (
        <div className="mt-3">
          <div className="flex items-start gap-3 border-t border-line py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">Needed</p>
              <p className="text-muted">Sign-in, security and your settings</p>
            </div>
            <span className="rounded-sm bg-shell px-2 py-0.5 text-[12px] font-medium text-muted">Always on</span>
          </div>
          <div className="flex items-start gap-3 border-t border-line py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">Analytics</p>
              <p className="text-muted">Counts visits so we can improve the app</p>
            </div>
            <Switch on={analytics} label="Analytics" onChange={setAnalytics} />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="ghost" onClick={() => save(false)}>
              Reject all
            </Button>
            <Button onClick={() => save(analytics)}>Save</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => save(false)}>
            Reject all
          </Button>
          <Button variant="ghost" onClick={() => save(true)}>
            Accept all
          </Button>
          <button type="button" onClick={() => setDetails(true)} className="ml-auto px-1 font-medium text-ink underline underline-offset-2">
            Choose
          </button>
        </div>
      )}
    </section>
  );
}

/** Opens the banner again, with the choices shown (for a "Cookie settings" link). */
export const openCookieSettings = () => window.dispatchEvent(new Event("cb-consent-open"));
