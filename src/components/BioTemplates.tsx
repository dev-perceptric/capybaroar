"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button, Chip, ErrorNote, Field, Input, LinkButton, TextArea } from "./ui";
import { Select } from "./Select";
import { Modal } from "./Overlay";
import { Loader } from "./Loader";
import { BioCard } from "./BioCard";
import type { EditorPost } from "./BioBlocks";
import { buildView, httpUrl, isPlaceholder, youtubeThumb, type BioView, type Resolver, type SocialItem } from "@/lib/bioBlocks";
import { BIO_TEMPLATES, TEMPLATE_GROUPS, applyTemplate, type BioTemplate, type TemplateGroup } from "@/lib/bioTemplates";
import { INCLUDES, type BuildInput, type IncludeId } from "@/lib/bioAi";

// Templates and Build with AI for the link-in-bio editor: the gallery of templates (each drawn by BioCard, small), the
// form that asks Claude for a page, and the bar over a draft Claude made.

/** How the editor's preview turns a draft into addresses: links stay as typed, placeholder videos show no picture. */
export function previewResolver(posts: EditorPost[], thumbOf: (id: string) => string | null, fillPosts = false): Resolver {
  return {
    media: (id) => thumbOf(id),
    link: (url) => httpUrl(url) ?? "#",
    // In the gallery a page with no posts yet shows empty tiles, so the template's grid is still there to see.
    posts: (b) => (posts.length || !fillPosts ? posts.map((p) => ({ href: httpUrl(b.links[p.id]) ?? p.url, thumb: p.thumb, alt: p.text })) : Array.from({ length: b.count }, () => ({ href: "#", thumb: null, alt: "" }))),
    video: (b, src) => (src.kind === "youtube" && !isPlaceholder(b.url) ? youtubeThumb(src.id) : null),
  };
}

/** The page as a small picture: BioCard at half size, not clickable. */
function MiniPage({ view }: { view: BioView }) {
  return (
    <div aria-hidden="true" inert className="relative h-[200px] overflow-hidden rounded-md sm:h-[230px]">
      <div className="absolute top-0 left-0 h-[200%] w-[200%] origin-top-left scale-50">
        <BioCard view={view} frame />
      </div>
    </div>
  );
}

export function TemplateGallery({
  title,
  bio,
  avatar,
  social,
  posts,
  onPick,
  onClose,
}: {
  title: string;
  bio: string;
  avatar: string | null;
  social: SocialItem[];
  posts: EditorPost[];
  onPick: (t: BioTemplate) => void;
  onClose: () => void;
}) {
  const cards = useMemo(() => {
    const now = new Date();
    const r = previewResolver(posts, () => null, true);
    return BIO_TEMPLATES.map((t) => ({ t, view: buildView({ title, bio, avatar, appearance: t.appearance, badge: false, blocks: applyTemplate(t, social, now).blocks }, now, r) }));
  }, [title, bio, avatar, social, posts]);
  const [group, setGroup] = useState<TemplateGroup | "all">("all");
  const shown = group === "all" ? cards : cards.filter((c) => c.t.group === group);
  return (
    <Modal title="Templates" onClose={onClose} wide>
      <div>
        <Select<string>
          size="sm"
          lead="Kind"
          ariaLabel="Kind of page"
          className="w-60 max-w-full"
          value={group}
          onChange={(v) => setGroup(v as TemplateGroup | "all")}
          options={[{ id: "all" as const, name: "All" }, ...TEMPLATE_GROUPS].map((g) => ({ value: g.id, label: g.name, hint: String(g.id === "all" ? cards.length : cards.filter((c) => c.t.group === g.id).length) }))}
        />
      </div>
      <ul className="-m-1 grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3" aria-label="Templates">
        {shown.map(({ t, view }) => (
          <li key={t.id} className="relative flex flex-col rounded-lg bg-panel p-1.5 shadow-chip transition-shadow duration-[var(--duration-fast)] focus-within:shadow-focus hover:shadow-pill">
            <MiniPage view={view} />
            <div className="min-w-0 px-1.5 pt-2 pb-1">
              <button type="button" onClick={() => onPick(t)} className="block max-w-full truncate text-left text-[13px] font-medium outline-none after:absolute after:inset-0 after:rounded-lg after:content-['']">
                {t.name}
              </button>
              <p className="truncate text-[12px] text-muted">{t.line}</p>
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function BuildForm({
  agent,
  canUpgrade,
  busy,
  error,
  onBuild,
  onClose,
}: {
  agent: boolean;
  canUpgrade: boolean;
  busy: boolean;
  error: string;
  onBuild: (input: BuildInput) => void;
  onClose: () => void;
}) {
  const [about, setAbout] = useState("");
  const [website, setWebsite] = useState("");
  const [include, setInclude] = useState<IncludeId[]>([]);
  if (!agent)
    return (
      <Modal title="Build with AI" onClose={onClose} footer={canUpgrade ? <LinkButton href="/settings?tab=billing">Upgrade</LinkButton> : undefined}>
        <p className="text-[13px] text-body">Build with AI comes with Pro and Agency.</p>
      </Modal>
    );
  const ready = !!about.trim() && !busy;
  const submit = () => ready && onBuild({ about: about.trim(), website: website.trim(), include });
  return (
    <Modal
      title="Build with AI"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!ready}>
            {busy ? <Loader /> : <Sparkles />}
            Build
          </Button>
        </>
      }
    >
      <ErrorNote message={error} />
      <Field label="What's this page for?" aside={<span className="text-[11px] text-faint tabular-nums">{about.length}/400</span>}>
        <TextArea aria-label="What's this page for?" autoFocus rows={3} maxLength={400} value={about} onChange={(e) => setAbout(e.target.value)} disabled={busy} />
      </Field>
      <Field label="Website">
        <Input aria-label="Website" inputMode="url" placeholder="example.com" value={website} onChange={(e) => setWebsite(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} disabled={busy} />
      </Field>
      <Field label="Include">
        <div className="flex flex-wrap gap-2">
          {INCLUDES.map((i) => {
            const on = include.includes(i.id);
            return (
              <Chip key={i.id} size="sm" on={on} disabled={busy} onClick={() => setInclude(on ? include.filter((x) => x !== i.id) : [...include, i.id])}>
                {i.label}
              </Chip>
            );
          })}
        </div>
      </Field>
    </Modal>
  );
}

/** The bar over a page Claude drafted: keep it in the editor, or go back to the page as it was. */
export function DraftBar({ onKeep, onDiscard }: { onKeep: () => void; onDiscard: () => void }) {
  return (
    <div role="status" className="flex min-h-14 flex-wrap items-center gap-3 rounded-lg bg-signal-pale px-4 py-2.5 shadow-picked">
      <Sparkles size={16} className="shrink-0 text-ink" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-[13px] font-medium">Draft from AI</span>
      <Button variant="ghost" size="sm" onClick={onDiscard}>
        Discard
      </Button>
      <Button size="sm" onClick={onKeep}>
        Keep
      </Button>
    </div>
  );
}
