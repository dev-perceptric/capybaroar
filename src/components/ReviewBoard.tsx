"use client";

import { useState, useTransition } from "react";
import { Badge, Button, Empty } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { Logo } from "./Logo";
import { NetworkLogo } from "./NetworkLogo";
import { askText } from "./Dialogs";
import { Phone, type PreviewMedia } from "./Previews";
import type { Channel } from "@/lib/channels";
import { decide } from "@/app/review/actions";

export type ReviewPost = { id: string; when: string | null; media: PreviewMedia[]; targets: { channel: Channel; text: string; settings: Record<string, string> }[] };

/** A brand's posts waiting for approval, as they will look, with Approve and Reject. Opened from a review link. */
export function ReviewBoard({ token, brand, posts }: { token: string; brand: string; posts: ReviewPost[] }) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-10 flex min-h-[52px] items-center gap-2.5 border-b border-line bg-panel px-4 py-2">
        <Logo variant="icon" small className="size-6" />
        <h1 className="min-w-0 flex-1 truncate text-[15px] font-medium tracking-[-0.01em]">
          {brand} <span className="text-faint tabular-nums">{posts.length ? `${posts.length} to review` : ""}</span>
        </h1>
      </header>
      <main className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 md:py-8">
        {posts.length ? posts.map((p) => <ReviewItem key={p.id} token={token} post={p} />) : <Empty title="Nothing to review" drawing="search" />}
      </main>
    </div>
  );
}

function ReviewItem({ token, post }: { token: string; post: ReviewPost }) {
  const [view, setView] = useState(post.targets[0]?.channel.id ?? "");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const t = post.targets.find((x) => x.channel.id === view) ?? post.targets[0];
  const run = async (ok: boolean) => {
    const comment = ok ? "" : await askText("Reject this post", { placeholder: "What should change?", ok: "Reject" });
    if (comment === null) return;
    start(async () => {
      const r = await decide(token, post.id, ok, comment);
      if (r.error) setError(r.error);
    });
  };
  return (
    <section className="grid overflow-hidden rounded-lg bg-panel shadow-card md:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="violet">In review</Badge>
          {post.when ? <span className="text-[13px] font-medium">{post.when}</span> : null}
        </div>
        <p className="text-[13px] leading-relaxed whitespace-pre-line">{t?.text}</p>
        <span className="flex-1" />
        {error ? (
          <p role="alert" className="text-[12px] text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => run(false)}>
            Reject
          </Button>
          <Button disabled={busy} onClick={() => run(true)}>
            {busy ? <Loader /> : null}
            Approve
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 border-t border-line bg-paper p-4 md:border-t-0 md:border-l">
        {post.targets.length > 1 ? (
          <Select<string>
            size="sm"
            lead="Preview"
            ariaLabel="Preview"
            className="max-w-full"
            value={view}
            onChange={setView}
            options={post.targets.map((x) => ({ value: x.channel.id, label: x.channel.name, icon: <NetworkLogo id={x.channel.network} size={14} /> }))}
          />
        ) : null}
        {t ? <Phone channel={t.channel} text={t.text} media={post.media} settings={t.settings} /> : null}
      </div>
    </section>
  );
}
