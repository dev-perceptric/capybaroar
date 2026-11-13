"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Badge, LinkButton, type Tone } from "./ui";
import { ChannelFace } from "./NetworkLogo";
import { fmtDateTime, fmtNum } from "@/lib/format";
import { networkOf } from "@/lib/networks";
import { threadOf } from "@/lib/thread";
import type { Channel } from "@/lib/channels";
import type { Comment, PostRow, TargetResult, TargetRow } from "@/lib/posts";
import { loadResults } from "@/app/(app)/calendar/actions";

type Media = { id: string; name: string; mime: string; thumb: string | null };

const STATE: Record<TargetRow["status"], { label: string; tone: Tone }> = {
  published: { label: "Published", tone: "green" },
  failed: { label: "Failed", tone: "red" },
  pending: { label: "Waiting", tone: "gray" },
  publishing: { label: "Publishing", tone: "sky" },
};

/** A post that went out: how it did on each channel, and what was posted. Nothing here is editable. */
export function PublishedView({ post, channels, media, comments }: { post: PostRow; channels: Channel[]; media: Media[]; comments: Comment[] }) {
  const [results, setResults] = useState<TargetResult[] | null>(null);
  useEffect(() => {
    loadResults(post.id).then(setResults, () => setResults([]));
  }, [post.id]);
  const thread = threadOf(post.thread);
  const files = post.media_ids.map((id) => media.find((m) => m.id === id)).filter((m): m is Media => !!m);

  return (
    <div className="flex flex-col gap-4">
      {post.post_targets.map((t) => (
        <ChannelResult key={t.id} t={t} post={post} channel={channels.find((c) => c.id === t.channel_id) ?? null} result={results?.find((r) => r.targetId === t.id) ?? null} loading={!results} />
      ))}

      {thread.length ? (
        <section className="flex flex-col gap-2">
          <p className="label-mono">Thread</p>
          {thread.map((p, i) => (
            <div key={i} className="rounded-lg bg-panel px-4 py-3 shadow-card">
              <p className="text-[12px] text-muted">Post {i + 2}</p>
              <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line wrap-break-word">{p.text}</p>
            </div>
          ))}
        </section>
      ) : null}

      {files.length ? (
        <section className="flex flex-col gap-2">
          <p className="label-mono">Media</p>
          <div className="flex flex-wrap gap-2">
            {files.map((m) => (
              <div key={m.id} title={m.name} className="flex size-24 items-center justify-center overflow-hidden rounded-lg bg-paper shadow-card">
                {m.thumb ? <img src={m.thumb} alt={m.name} className="size-full object-cover" /> : <FileText size={20} className="text-muted" />}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {comments.length ? (
        <section className="flex flex-col gap-2">
          <p className="label-mono">Approval</p>
          {comments.map((c) => (
            <div key={c.id} className="flex flex-col gap-0.5 text-[12px]">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{c.author_name || "Review link"}</span>
                {c.kind === "approved" ? <Badge tone="green">Approved</Badge> : c.kind === "rejected" ? <Badge tone="red">Changes asked</Badge> : null}
                <span className="text-faint">{fmtDateTime(c.created_at)}</span>
              </span>
              {c.body ? <p className="whitespace-pre-line text-ink">{c.body}</p> : null}
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function ChannelResult({ t, post, channel, result, loading }: { t: TargetRow; post: PostRow; channel: Channel | null; result: TargetResult | null; loading: boolean }) {
  const state = t.deleted_at ? { label: "Deleted", tone: "gray" as Tone } : STATE[t.status];
  const net = channel ? networkOf(channel.network) : null;
  const text = t.text ?? post.text;
  const title = (t.settings?.title ?? "").trim();
  const m = result?.metrics ?? null;
  const seen = m ? (m.views ?? m.reach ?? m.impressions) : null;
  const stats = [
    {
      label: m?.views != null ? "Views" : m?.reach != null ? "Reach" : "Impressions",
      value: seen,
    },
    { label: "Likes", value: m?.likes ?? null },
    { label: "Comments", value: m?.comments ?? null },
    { label: "Shares", value: m?.shares ?? null },
  ];
  const at = result?.publishedAt ?? null;

  return (
    <section className="rounded-lg bg-panel shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        {channel ? <ChannelFace channel={channel} size={32} badge={13} /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[14px] font-medium wrap-break-word">{channel?.name ?? "Removed channel"}</span>
          <span className="text-[12px] text-muted">
            {net?.name}
            {at ? `, ${fmtDateTime(at)}` : ""}
          </span>
        </div>
        <Badge tone={state.tone}>{state.label}</Badge>
        {t.url && !t.deleted_at ? (
          <LinkButton href={t.url} external variant="ghost" size="sm">
            <ExternalLink size={14} />
            Open post
          </LinkButton>
        ) : null}
      </div>

      {t.status === "published" ? (
        <div className="grid grid-cols-2 border-b border-line sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 px-4 py-3">
              <span className="text-[12px] text-muted">{s.label}</span>
              <span className="text-[20px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{loading ? "" : s.value != null ? fmtNum(s.value) : "–"}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 px-4 py-3">
        {t.error ? <p className="text-[12.5px] text-danger">{t.error}</p> : null}
        {t.note ? <p className="text-[12.5px] text-warning">{t.note}</p> : null}
        {title ? <p className="text-[15px] font-semibold wrap-break-word">{title}</p> : null}
        {text.trim() ? <p className="text-[14px] leading-relaxed whitespace-pre-line wrap-break-word">{text}</p> : null}
        {t.parts?.some((p) => p.url) ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
            {t.parts.map((p, i) =>
              p.url ? (
                <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  Post {i + 2}
                </a>
              ) : null,
            )}
          </div>
        ) : null}
        {m ? <p className="text-[12px] text-faint">Updated {fmtDateTime(m.fetchedAt)}</p> : null}
      </div>
    </section>
  );
}
