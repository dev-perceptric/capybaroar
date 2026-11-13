"use client";

import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { Badge, Button, Field, IconLink, Input, TextArea, bareArea, boxClass, type Tone } from "./ui";
import { Select } from "./Select";
import { Loader } from "./Loader";
import { ChannelFace } from "./NetworkLogo";
import { fmtDateTime, fmtNum } from "@/lib/format";
import { networkOf } from "@/lib/networks";
import type { Channel } from "@/lib/channels";
import type { Comment, PostRow, TargetResult, TargetRow } from "@/lib/posts";
import type { EditResult } from "@/lib/editor";
import { editLive } from "@/app/(app)/calendar/actions";

type Metrics = NonNullable<TargetResult["metrics"]>;
type Draft = { text: string | null; settings: Record<string, string> };

// Only a target that differs from "went out fine" gets a tag; the header already says Published.
const STATE: Partial<Record<TargetRow["status"], { label: string; tone: Tone }>> = {
  failed: { label: "Failed", tone: "red" },
  pending: { label: "Waiting", tone: "gray" },
  publishing: { label: "Publishing", tone: "sky" },
};

/** Whether this channel's post can be changed on its network now. */
export const editableTarget = (t: TargetRow, c: Channel | undefined) => !!c && t.status === "published" && !t.deleted_at && !!networkOf(c.network).edit;

/** The numbers a network gave. Before the first check, the usual three show as dashes. */
function statsOf(m: Metrics | null): { label: string; value: number | null }[] {
  if (!m) return ["Views", "Likes", "Comments"].map((label) => ({ label, value: null }));
  const seen = m.views != null ? { label: "Views", value: m.views } : m.reach != null ? { label: "Reach", value: m.reach } : { label: "Impressions", value: m.impressions };
  return [seen, { label: "Likes", value: m.likes }, { label: "Comments", value: m.comments }, { label: "Shares", value: m.shares }, { label: "Saves", value: m.saves }, { label: "Clicks", value: m.clicks }].filter((s) => s.value != null);
}

/**
 * A post that went out: each channel's numbers and link. The post itself shows in the preview. With `editing`, the
 * channels whose network allows it get their text and allowed settings to change; typing updates the preview.
 */
export function PublishedView({
  post,
  channels,
  comments,
  results,
  editing,
  drafts,
  onDraft,
  onCancel,
  onDone,
}: {
  post: PostRow;
  channels: Channel[];
  comments: Comment[];
  results: TargetResult[] | null;
  editing: boolean;
  drafts: Record<string, Draft>;
  onDraft: (channelId: string, d: Partial<Draft>) => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const chan = (t: TargetRow) => channels.find((c) => c.id === t.channel_id);
  const editable = post.post_targets.filter((t) => editableTarget(t, chan(t)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, start] = useTransition();

  const save = () =>
    start(async () => {
      setError("");
      setErrors({});
      const r = await editLive(
        post.id,
        editable.map((t) => ({ channelId: t.channel_id, text: drafts[t.channel_id]?.text ?? post.text, settings: drafts[t.channel_id]?.settings ?? {} })),
      );
      if (r.error) return setError(r.error);
      const failed = (r.results ?? []).filter((x: EditResult) => x.result === "failed");
      if (failed.length) return setErrors(Object.fromEntries(failed.map((x) => [x.channelId, x.error ?? "Couldn't save"])));
      onDone();
    });

  if (editing)
    return (
      <div className="flex flex-col gap-6">
        {editable.map((t) => {
          const c = chan(t)!;
          const n = networkOf(c.network);
          const d = drafts[t.channel_id] ?? { text: t.text, settings: t.settings ?? {} };
          const fields = (n.fields ?? []).filter((f) => n.edit!.settings.includes(f.key));
          const text = d.text ?? post.text;
          return (
            <section key={t.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ChannelFace channel={c} size={24} badge={11} />
                <span className="text-[13px] font-medium">{c.name}</span>
              </div>
              {fields.map((f) => (
                <Field key={f.key} label={f.required ? `${f.label} *` : f.label}>
                  {f.kind === "select" ? (
                    <Select value={d.settings[f.key] ?? ""} onChange={(v) => onDraft(t.channel_id, { settings: { ...d.settings, [f.key]: v } })} placeholder="Choose" options={f.options ?? []} />
                  ) : f.kind === "textarea" ? (
                    <TextArea rows={2} value={d.settings[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => onDraft(t.channel_id, { settings: { ...d.settings, [f.key]: e.target.value } })} />
                  ) : (
                    <Input value={d.settings[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => onDraft(t.channel_id, { settings: { ...d.settings, [f.key]: e.target.value } })} />
                  )}
                </Field>
              ))}
              {n.edit!.text ? (
                <Field label="Text">
                  <div className={boxClass}>
                    <textarea rows={8} aria-label={`Text for ${c.name}`} value={text} onChange={(e) => onDraft(t.channel_id, { text: e.target.value })} className={`${bareArea} resize-y text-[14px] leading-relaxed`} />
                  </div>
                  <span className={`text-[12px] tabular-nums ${[...text].length > n.limit ? "text-danger" : "text-muted"}`}>
                    {[...text].length} / {n.limit}
                  </span>
                </Field>
              ) : null}
              {errors[t.channel_id] ? <p className="text-[12.5px] text-danger">{errors[t.channel_id]}</p> : null}
            </section>
          );
        })}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
          {error ? <span className="mr-auto text-[12px] text-danger">{error}</span> : null}
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={save}>
            {busy ? <Loader /> : null}
            Save changes
          </Button>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {post.post_targets.map((t) => (
          <ChannelResult key={t.id} t={t} channel={chan(t) ?? null} result={results?.find((r) => r.targetId === t.id) ?? null} loading={!results} />
        ))}
      </div>

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
