/** Moving between posts in the post editor: the posts on screen, in the order they go out. Pure, so it's tested. */

type Timed = { id: string; publish_at: string | null };

/** Where this post sits among the posts with a time, and the ones just before and after it. Posts with no time are left out. */
export function neighbors<T extends Timed>(posts: T[], id: string): { index: number; total: number; prev: T | null; next: T | null } | null {
  const timed = posts.filter((p) => p.publish_at && !Number.isNaN(Date.parse(p.publish_at)));
  // Same time: keep a fixed order by id, so the arrows never skip or loop.
  timed.sort((a, b) => Date.parse(a.publish_at!) - Date.parse(b.publish_at!) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const index = timed.findIndex((p) => p.id === id);
  if (index < 0) return null;
  return { index, total: timed.length, prev: timed[index - 1] ?? null, next: timed[index + 1] ?? null };
}

/** True when the arrow keys belong to what has focus (typing, picking), so they shouldn't switch posts. */
export function keepsArrows(el: EventTarget | null): boolean {
  if (!el || typeof (el as Element).closest !== "function") return false;
  const e = el as HTMLElement;
  if (e.isContentEditable) return true;
  const tag = e.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = ((e as HTMLInputElement).type || "text").toLowerCase();
    return !["button", "checkbox", "radio", "submit", "reset", "file", "image", "color"].includes(type);
  }
  return !!e.closest('[role="slider"],[role="listbox"],[role="menu"],[role="radiogroup"],[role="tablist"],[role="textbox"]');
}
