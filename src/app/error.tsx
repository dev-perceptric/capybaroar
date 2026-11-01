"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { isStaleError, reloadOnce } from "@/components/StaleTab";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const stale = isStaleError(error.message);
  useEffect(() => {
    if (stale) reloadOnce();
  }, [stale]);
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-[18px] font-semibold tracking-[-0.025em]">{stale ? "Capybaroar was updated" : "Something went wrong"}</h1>
      <p className="max-w-sm text-[13px] text-muted">{stale ? "Reloading to the new version." : error.message}</p>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        {!stale ? (
          <Button variant="ghost" onClick={reset}>
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
