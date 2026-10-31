"use client";

import type { IconName } from "lucide-react/dynamic";
import { lazy, Suspense } from "react";

// Icons people pick for objects, fields and choices: any of Lucide's line icons (by name, loaded one by one) or
// any emoji. A stored icon is a Lucide name like "building-2", or the emoji itself. Lucide's catalog of names loads
// after the page shows, so it never holds up the first screen; the picker lives in IconPicker.tsx.

/** A stored icon is a Lucide name (lowercase words and dashes) or an emoji. */
export const isLucide = (name: string | null | undefined): name is IconName => Boolean(name && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name));

/** Lucide's icon by name, downloaded on first use. Unknown names draw nothing. */
export const LucideIcon = lazy(() => import("lucide-react/dynamic").then((m) => ({ default: m.DynamicIcon })));

/** An icon by its stored name, an emoji, or the fallback when there's neither. */
export function AppIcon({ name, size = 14, fallback = null, className = "", stroke = 1.8 }: { name?: string | null; size?: number; fallback?: React.ReactNode; className?: string; stroke?: number }) {
  if (!name) return <>{fallback}</>;
  const room = <span style={{ width: size, height: size }} className="inline-block shrink-0" />;
  if (isLucide(name))
    return (
      <Suspense fallback={room}>
        <LucideIcon name={name} size={size} strokeWidth={stroke} className={`shrink-0 ${className}`} aria-hidden fallback={() => room} />
      </Suspense>
    );
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center leading-none ${className}`} style={{ width: size + 2, height: size + 2, fontSize: size }}>
      {name}
    </span>
  );
}
