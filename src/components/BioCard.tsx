import type { BioView } from "@/lib/bio";

// The link-in-bio page itself: one column on a phone, the same on a wide screen. Drawn by the public page (/b/<slug>)
// and by the editor's preview from the same props, so the preview is the page.

export function BioCard({ view, frame = false }: { view: BioView; frame?: boolean }) {
  return (
    <div data-theme={view.theme} className={`flex justify-center bg-shell text-ink ${frame ? "min-h-full rounded-2xl px-4 py-8" : "min-h-dvh px-4 py-10 sm:py-16"}`}>
      <main className="flex w-full max-w-[480px] flex-col items-center">
        {view.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={view.avatar} alt="" width={88} height={88} className="size-[88px] rounded-full object-cover shadow-chip" />
        ) : null}
        {view.title ? <h1 className="mt-4 text-center text-[20px] leading-tight font-semibold tracking-[-0.02em] text-balance">{view.title}</h1> : null}
        {view.bio ? <p className="mt-2 max-w-[380px] text-center text-[14px] leading-relaxed whitespace-pre-line text-muted">{view.bio}</p> : null}
        {view.links.length ? (
          <nav aria-label="Links" className="mt-7 flex w-full flex-col gap-2.5">
            {view.links.map((l, i) => (
              <a
                key={`${i}:${l.href}`}
                href={l.href}
                rel="noopener"
                className="flex min-h-12 w-full items-center justify-center rounded-md bg-panel px-4 py-3 text-center text-[14px] font-medium text-ink shadow-outline transition-[background-color,transform] duration-[var(--duration-fast)] hover:bg-canvas active:scale-[0.98]"
              >
                {l.label}
              </a>
            ))}
          </nav>
        ) : null}
        {view.posts.length ? (
          <section aria-label="Latest posts" className="mt-9 w-full">
            <p className="label-mono mb-2 text-center">Latest posts</p>
            <div className="grid grid-cols-2 gap-2.5">
              {view.posts.map((p, i) => (
                <a key={`${i}:${p.url}`} href={p.url} rel="noopener" className="group flex aspect-square flex-col overflow-hidden rounded-lg border border-frame bg-panel transition-colors hover:bg-canvas">
                  {p.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumb} alt={p.text.slice(0, 120)} loading="lazy" decoding="async" className="size-full object-cover" />
                  ) : (
                    <span className="line-clamp-6 p-3 text-[13px] leading-snug text-ink">{p.text}</span>
                  )}
                </a>
              ))}
            </div>
          </section>
        ) : null}
        <p className="mt-10 text-[11px] text-faint">Capybaroar</p>
      </main>
    </div>
  );
}
