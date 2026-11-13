"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Badge, IconLink, type Tone } from "./ui";
import { ChannelFace } from "./NetworkLogo";
import { Thumb } from "./MediaThumb";
import { fmtDateTime, fmtNum } from "@/lib/format";
import { networkOf } from "@/lib/networks";
import { threadOf } from "@/lib/thread";
import type { Channel } from "@/lib/channels";
import type { Comment, PostRow, TargetResult, TargetRow } from "@/lib/posts";
import { loadResults } from "@/app/(app)/calendar/actions";

type Media = { id: string; name: string; mime: string; thumb: string | null; alt: string | null };
type Metrics = NonNullable<TargetResult["metrics"]>;

// Only a target that differs from "went out fine" gets a tag; the header already says Published.
const STATE: Partial<Record<TargetRow["status"], { label: string; tone: Tone }>> = {
  failed: { label: "Failed", tone: "red" },
  pending: { label: "Waiting", tone: "gray" },
  publishing: { label: "Publishing", tone: "sky" },
};

/** The numbers a network gave. Before the first check, the usual three show as dashes. */
function statsOf(m: Metrics | null): { label: string; value: number | null }[] {
  if (!m) return ["Views", "Likes", "Comments"].map((label) => ({ label, value: null }));
  const seen = m.views != null ? { label: "Views", value: m.views } : m.reach != null ? { label: "Reach", value: m.reach } : { label: "Impressions", value: m.impressions };
  return [seen, { label: "Likes", value: m.likes }, { label: "Comments", value: m.comments }, { label: "Shares", value: m.shares }, { label: "Saves", value: m.saves }, { label: "Clicks", value: m.clicks }].filter((s) => s.value != null);
}

/** A post that went out: each channel's numbers and link, then what was posted. Nothing here is editable. */
export function PublishedView({ post, channels, media, comments }: { post: PostRow; channels: Channel[]; media: Media[]; comments: Comment[] }) {
  const [results, setResults] = useState<TargetResult[] | null>(null);
  useEffect(() => {
    loadResults(post.id).then(setResults, () => setResults([]));
  }, [post.id]);
  const thread = threadOf(post.thread);
  const files = post.media_ids.map((id) => media.find((m) => m.id === id)).filter((m): m is Media => !!m);
  const chan = (t: TargetRow) => channels.find((c) => c.id === t.channel_id) ?? null;
  // Text and title as each channel got them; shown once when every channel got the same.
  const versions = post.post_targets.map((t) => ({ t, title: (t.settings?.title ?? "").trim(), text: (t.text ?? post.text).trim() }));
  const same = versions.every((v) => v.title === versions[0]?.title && v.text === versions[0]?.text);
  const shown = same ? versions.slice(0, 1) : versions;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {post.post_targets.map((t) => (
          <ChannelResult key={t.id} t={t} channel={chan(t)} result={results?.find((r) => r.targetId === t.id) ?? null} loading={!results} />
        ))}
      </div>

      {shown.some((v) => v.title || v.text) ? (
        <section className="flex flex-col gap-4">
          {shown.map(({ t, title, text }) => (
            <div key={t.id} className="flex flex-col gap-1.5">
              <p className="label-mono">{same ? "Text" : `Text for ${chan(t)?.name ?? "removed channel"}`}</p>
              {title ? <p className="text-[15px] font-semibold wrap-break-word">{title}</p> : null}
              {text ? <p className="text-[14px] leading-relaxed whitespace-pre-line wrap-break-word">{text}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      {thread.length ? (
        <section className="flex flex-col gap-3">
          <p className="label-mono">Thread</p>
          {thread.map((p, i) => (
            <div key={i} className="flex flex-col gap-1 border-l-2 border-line pl-3">
              <p className="text-[12px] text-muted">Post {i + 2}</p>
              <p className="text-[14px] leading-relaxed whitespace-pre-line wrap-break-word">{p.text}</p>
            </div>
          ))}
        </section>
      ) : null}

      {files.length ? (
        <section className="flex flex-col gap-2">
          <p className="label-mono">Media</p>
          <div className="flex flex-wrap gap-2">
            {files.map((m) => (
              <Thumb key={m.id} m={m} />
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

function ChannelResult({ t, channel, result, loading }: { t: TargetRow; channel: Channel | null; result: TargetResult | null; loading: boolean }) {
  const state = t.deleted_at ? { label: "Deleted", tone: "gray" as Tone } : STATE[t.status];
  const m = result?.metrics ?? null;
  const stats = statsOf(m);
  const at = result?.publishedAt ?? null;

  return (
    <section className="rounded-lg bg-panel shadow-card">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {channel ? <ChannelFace channel={channel} size={32} badge={13} /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[14px] font-medium wrap-break-word">{channel?.name ?? "Removed channel"}</span>
          <span className="text-[12px] text-muted">{[channel ? networkOf(channel.network).name : null, at ? fmtDateTime(at) : null].filter(Boolean).join(", ")}</span>
        </div>
        {state ? <Badge tone={state.tone}>{state.label}</Badge> : null}
        {t.url && !t.deleted_at ? (
          <IconLink href={t.url} label={`Open on ${channel ? networkOf(channel.network).name : "the network"}`}>
            <ExternalLink />
          </IconLink>
        ) : null}
      </div>

      {t.status === "published" && !t.deleted_at ? (
        <div className="flex flex-wrap border-t border-line" title={m ? `Updated ${fmtDateTime(m.fetchedAt)}` : undefined}>
          {stats.map((s) => (
            <div key={s.label} className="flex min-w-28 flex-1 flex-col gap-1 px-4 py-3">
              <span className="text-[12px] text-muted">{s.label}</span>
              <span className="text-[20px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{loading ? "" : s.value != null ? fmtNum(s.value) : "–"}</span>
            </div>
          ))}
        </div>
      ) : null}

      {t.error || t.note ? (
        <div className="flex flex-col gap-1 border-t border-line px-4 py-3 text-[12.5px]">
          {t.error ? <p className="text-danger">{t.error}</p> : null}
          {t.note ? <p className="text-warning">{t.note}</p> : null}
        </div>
      ) : null}

      {t.parts?.some((p) => p.url) ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-line px-4 py-3 text-[12px]">
          {t.parts.map((p, i) =>
            p.url ? (
              <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                Post {i + 2}
              </a>
            ) : null,
          )}
        </div>
      ) : null}
    </section>
  );
}
