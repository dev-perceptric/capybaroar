"use client";

import type { DrawingKind } from "./Drawing";
import { Empty } from "./ui";

// The first screen of a tool, before there's anything to show. Like Twenty: the page stays blank, with one drawing in
// the middle, a short title ("Add your first note"), one line under it and the button that makes the first one.

export function ToolIntro({ drawing, title, lead, action }: { drawing: DrawingKind; title: string; lead?: string; action?: React.ReactNode }) {
  return (
    <Empty drawing={drawing} title={title} action={action}>
      {lead}
    </Empty>
  );
}
