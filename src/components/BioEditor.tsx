"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button, CopyButton, Field, IconButton, Input, Segmented, Switch, TextArea } from "./ui";
import { Modal } from "./Overlay";
import { Select } from "./Select";
import { ToolIntro } from "./ToolIntro";
import { Loader } from "./Loader";
import { askConfirm } from "./Dialogs";
import { BioCard } from "./BioCard";
import type { BioPage, BioTheme } from "@/lib/bio";
import { removeBio, saveBio } from "@/app/(app)/channels/bio/actions";

type Image = { id: string; name: string; thumb: string | null };
type Post = { text: string; url: string; thumb: string | null };
type Link = { label: string; url: string; code?: string };

export function BioEditor({ brand, brands, page, clicks, base, suggested, images, posts }: { brand: { id: string; name: string }; brands: { id: string; name: string }[]; page: BioPage | null; clicks: Record<string, number>; base: string; suggested: string; images: Image[]; posts: Post[] }) {
  const router = useRouter();
  const [started, setStarted] = useState(!!page);
  const [slug, setSlug] = useState(page?.slug ?? suggested);
  const [title, setTitle] = useState(page?.title ?? brand.name);
  const [bio, setBio] = useState(page?.bio ?? "");
  const [avatar, setAvatar] = useState<string | null>(page?.avatar_media_id ?? null);
  const [links, setLinks] = useState<Link[]>(page?.links ?? [{ label: "", url: "" }]);
  const [showPosts, setShowPosts] = useState(page?.show_posts ?? false);
  const [theme, setTheme] = useState<BioTheme>(page?.theme ?? "light");
  const [picking, setPicking] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();

  const brandPicker = brands.length > 1 ? (
    <div className="mb-5 w-56">
      <Select ariaLabel="Brand" value={brand.id} onChange={(v) => router.push(`/channels/bio?brand=${v}`)} options={brands.map((b) => ({ value: b.id, label: b.name }))} />
    </div>
  ) : null;

  if (!started)
    return (
      <div className="mx-auto w-full max-w-[1080px]">
        {brandPicker}
        <ToolIntro drawing="lists" title="Make a link-in-bio page" lead="One page for the link in your profiles, with every click counted." action={<Button onClick={() => setStarted(true)}>Start</Button>} />
      </div>
    );

  const set = (i: number, p: Partial<Link>) => setLinks((all) => all.map((l, j) => (j === i ? { ...l, ...p, ...(p.url != null && p.url !== l.url ? { code: undefined } : {}) } : l)));
  const moveLink = (i: number, d: -1 | 1) =>
    setLinks((all) => {
      const next = [...all];
      const j = i + d;
      if (j < 0 || j >= next.length) return all;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const save = () =>
    start(async () => {
      setMsg("");
      const r = await saveBio(brand.id, { slug, title, bio, avatarMediaId: avatar, links: links.map(({ label, url }) => ({ label, url })), showPosts, theme });
      setMsg(r.error ?? "Saved");
      if (!r.error) router.refresh();
    });
  const del = async () => {
    if (!(await askConfirm("Delete this page?", { body: "Its address stops working.", ok: "Delete", danger: true }))) return;
    start(async () => {
      const r = await removeBio(brand.id);
      if (r.error) setMsg(r.error);
      else router.refresh();
    });
  };
  const thumb = images.find((m) => m.id === avatar)?.thumb ?? null;
  const live = page ? `${base}${page.slug}` : null;

  return (
    <div className="mx-auto grid w-full max-w-[1080px] gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex min-w-0 flex-col gap-4">
        {brandPicker}
        {live ? (
          <div className="flex h-10 items-center gap-1 rounded-md bg-canvas pr-1 pl-3 shadow-outline">
            <span className="min-w-0 flex-1 truncate text-[13px]">{live}</span>
            <CopyButton text={live} label="Copy link" />
            <a href={live} target="_blank" rel="noopener" aria-label="Open" title="Open" className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-ink">
              <ExternalLink size={16} />
            </a>
          </div>
        ) : null}
        <Field label="Address">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[13px] text-muted">{base.replace(/^https?:\/\//, "")}</span>
            <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} maxLength={40} />
          </div>
        </Field>
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Bio" aside={<span className="text-[11px] text-faint tabular-nums">{bio.length}/300</span>}>
          <TextArea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />
        </Field>
        <Field label="Picture">
          <div className="flex items-center gap-2">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="size-10 rounded-full object-cover" />
            ) : null}
            <Button variant="ghost" onClick={() => setPicking(true)}>
              <ImagePlus size={14} /> {avatar ? "Change" : "Choose"}
            </Button>
            {avatar ? (
              <IconButton label="Remove picture" onClick={() => setAvatar(null)}>
                <X size={16} />
              </IconButton>
            ) : null}
          </div>
        </Field>
        <Field label="Links">
          <div className="flex flex-col gap-2">
            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Input aria-label="Label" placeholder="Label" value={l.label} onChange={(e) => set(i, { label: e.target.value })} className="!w-40 shrink-0" maxLength={60} />
                <Input aria-label="URL" placeholder="https://" value={l.url} onChange={(e) => set(i, { url: e.target.value })} inputMode="url" />
                {l.code && clicks[l.code] != null ? <span className="w-14 shrink-0 text-right text-[11px] text-faint tabular-nums" title="Clicks">{clicks[l.code].toLocaleString("en-US")}</span> : null}
                <IconButton label="Move up" onClick={() => moveLink(i, -1)} disabled={i === 0}>
                  <ArrowUp size={16} />
                </IconButton>
                <IconButton label="Move down" onClick={() => moveLink(i, 1)} disabled={i === links.length - 1}>
                  <ArrowDown size={16} />
                </IconButton>
                <IconButton label="Remove link" onClick={() => setLinks((all) => all.filter((_, j) => j !== i))}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            ))}
            <div>
              <Button variant="ghost" onClick={() => setLinks((all) => [...all, { label: "", url: "" }])} disabled={links.length >= 20}>
                <Plus size={14} /> Add link
              </Button>
            </div>
          </div>
        </Field>
        <Field label="Latest posts" row>
          <Switch on={showPosts} label="Latest posts" onChange={setShowPosts} />
        </Field>
        <Field label="Theme" row>
          <Segmented<BioTheme>
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </Field>
        <div className="flex items-center gap-3 border-t border-line pt-4">
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader /> : null}
            Save
          </Button>
          {msg ? <span className={`text-[12px] ${msg === "Saved" ? "text-success" : "text-danger"}`}>{msg}</span> : null}
          <span className="flex-1" />
          {page ? (
            <IconButton label="Delete page" onClick={del} disabled={busy}>
              <Trash2 size={16} />
            </IconButton>
          ) : null}
        </div>
      </div>
      <div className="lg:sticky lg:top-0 lg:self-start">
        <p className="label-mono mb-2">Preview</p>
        <div className="pointer-events-none mx-auto h-[640px] w-full max-w-[400px] overflow-hidden rounded-2xl border border-frame" aria-hidden>
          <div className="h-full overflow-y-auto">
            <BioCard
              frame
              view={{
                title,
                bio,
                avatar: thumb,
                links: links.filter((l) => l.label.trim()).map((l) => ({ label: l.label, href: "#" })),
                posts: showPosts ? posts : [],
                theme,
              }}
            />
          </div>
        </div>
      </div>
      {picking ? (
        <Modal title="Choose a picture" onClose={() => setPicking(false)} wide>
          {images.length ? (
            <div className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {images.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setAvatar(m.id);
                    setPicking(false);
                  }}
                  className={`aspect-square overflow-hidden rounded-md border ${m.id === avatar ? "border-transparent shadow-focus" : "border-frame hover:opacity-90"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.thumb ?? ""} alt={m.name} loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted">Upload a picture in Media first</p>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
