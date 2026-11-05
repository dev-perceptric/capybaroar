"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, LayoutTemplate, Link2, Sparkles, Trash2 } from "lucide-react";
import { Badge, Button, CardHead, CopyButton, ErrorNote, Field, IconLink, Input, Panel, Segmented, Switch, TabNav, TextArea, Page as UiPage } from "./ui";
import { Modal } from "./Overlay";
import { Select } from "./Select";
import { ToolIntro } from "./ToolIntro";
import { Loader } from "./Loader";
import { askConfirm } from "./Dialogs";
import { BioCard } from "./BioCard";
import { BioBlocks, Picture, type EditorPost, type Img } from "./BioBlocks";
import { BioStats } from "./BioStats";
import { BuildForm, DraftBar, TemplateGallery, previewResolver } from "./BioTemplates";
import { BIO_FONTS, BIO_THEMES, type BioTheme } from "@/lib/bioThemes";
import { buildView, draftOf, placeholderProblem, slugProblem, videoSource, type Appearance, type BioDraft, type BioPage, type Block, type SocialItem } from "@/lib/bioBlocks";
import { applyTemplate, type BioTemplate } from "@/lib/bioTemplates";
import type { BuildInput } from "@/lib/bioAi";
import { buildBio, checkSlug, createBio, removeBio, saveBio } from "@/app/(app)/bio/actions";

export type BioTab = "blocks" | "appearance" | "analytics" | "settings";
const TABS: { value: BioTab; label: string }[] = [
  { value: "blocks", label: "Blocks" },
  { value: "appearance", label: "Appearance" },
  { value: "analytics", label: "Analytics" },
  { value: "settings", label: "Settings" },
];

/** A server action's answer, or its error when the call itself failed (offline, a new deploy). */
async function ask<T extends { error?: string }>(run: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await run();
  } catch {
    return { error: "Couldn't reach Capybaroar. Check your connection and try again." };
  }
}

/** What the preview can draw while a block is still being filled in. */
const drawable = (b: Block) => {
  switch (b.type) {
    case "link":
    case "email":
      return !!b.label.trim();
    case "header":
    case "text":
      return !!b.text.trim();
    case "social":
      return b.items.some((i) => i.url.trim());
    case "video":
      return !!videoSource(b.url);
    case "posts":
      return true;
  }
};

export function BioEditor({
  brand,
  brands,
  page,
  base,
  images,
  posts,
  social,
  badgeOff,
  agent,
  canUpgrade,
  tab: firstTab,
}: {
  brand: { id: string; name: string };
  brands: { id: string; name: string }[];
  page: BioPage | null;
  base: string;
  images: Img[];
  posts: EditorPost[];
  social: SocialItem[];
  badgeOff: boolean;
  /** The plan includes the agent (Build with AI); `canUpgrade`: this person can change the plan. */
  agent: boolean;
  canUpgrade: boolean;
  tab: BioTab;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<BioPage | null>(page);
  const [draft, setDraft] = useState<BioDraft | null>(page ? draftOf(page) : null);
  const [tab, setTabState] = useState<BioTab>(firstTab);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const [picking, setPicking] = useState<{ title: string; onPick: (id: string) => void } | null>(null);
  const [gallery, setGallery] = useState(false);
  const [building, setBuilding] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  // The page as it was before Claude's draft, while the draft waits to be kept or discarded.
  const [aiBefore, setAiBefore] = useState<BioDraft | null>(null);

  const dirty = !!saved && !!draft && JSON.stringify(draft) !== JSON.stringify(draftOf(saved));

  const setTab = (t: BioTab) => {
    setTabState(t);
    const u = new URL(window.location.href);
    u.searchParams.set("tab", t);
    window.history.replaceState(null, "", u);
  };
  const thumbOf = (id: string | null | undefined) => (id ? (images.find((m) => m.id === id)?.thumb ?? null) : null);

  const view = useMemo(() => {
    if (!draft) return null;
    return buildView(
      { title: draft.title.trim(), bio: draft.bio.trim(), avatar: thumbOf(draft.avatarMediaId), appearance: draft.appearance, badge: badgeOff ? draft.badge : true, blocks: draft.blocks.filter(drawable) },
      new Date(),
      previewResolver(posts, thumbOf),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, posts, images, badgeOff]);

  const brandPicker =
    brands.length > 1 ? (
      <Select size="sm" lead="Brand" ariaLabel="Brand" className="w-56 max-w-full" value={brand.id} onChange={(v) => router.push(`/bio?brand=${v}`)} options={brands.map((b) => ({ value: b.id, label: b.name }))} />
    ) : null;

  /** The brand's page, made now when there isn't one yet. */
  const ensurePage = async (): Promise<{ page?: BioPage; error?: string }> => {
    if (saved) return { page: saved };
    const r = await ask(() => createBio(brand.id));
    if (r.error || !("page" in r) || !r.page) return { error: r.error ?? "Couldn't make the page" };
    setSaved(r.page);
    return { page: r.page };
  };
  const pickTemplate = async (t: BioTemplate) => {
    if (draft?.blocks.length && !(await askConfirm("Use this template?", { body: "It replaces the page's blocks and look.", ok: "Use template" }))) return;
    setGallery(false);
    start(async () => {
      setError("");
      const r = await ensurePage();
      if (!r.page) return setError(r.error ?? "Couldn't make the page");
      const { blocks, appearance } = applyTemplate(t, social);
      setDraft({ ...(draft ?? draftOf(r.page)), blocks, appearance });
      setError("");
      setAiBefore(null);
      setTab("blocks");
    });
  };
  const build = (input: BuildInput) => {
    setAiError("");
    setAiBusy(true);
    void (async () => {
      const made = await ensurePage();
      const r = made.page ? await ask(() => buildBio(brand.id, input)) : { error: made.error ?? "Couldn't make the page" };
      setAiBusy(false);
      if (!made.page || r.error || !("draft" in r) || !r.draft) {
        if (made.page && !draft) setDraft(draftOf(made.page));
        return setAiError(r.error ?? "Couldn't build the page");
      }
      const d = r.draft;
      const before = draft ?? draftOf(made.page);
      // Building again over a draft keeps the page from before the first one to go back to.
      setAiBefore((b) => b ?? before);
      setDraft({ ...before, title: d.title, bio: d.bio, appearance: d.appearance, blocks: d.blocks });
      setError("");
      setBuilding(false);
      setTab("blocks");
    })();
  };
  const tools = (
    <>
      <Button variant="ghost" onClick={() => setGallery(true)} disabled={busy || aiBusy}>
        <LayoutTemplate /> Templates
      </Button>
      <Button variant="ghost" onClick={() => setBuilding(true)} disabled={busy || aiBusy}>
        <Sparkles /> Build with AI
      </Button>
    </>
  );
  const overlays = (
    <>
      {gallery ? <TemplateGallery title={draft?.title.trim() || brand.name} bio={draft?.bio.trim() ?? ""} avatar={thumbOf(draft?.avatarMediaId)} social={social} posts={posts} onPick={(t) => void pickTemplate(t)} onClose={() => setGallery(false)} /> : null}
      {building ? <BuildForm agent={agent} canUpgrade={canUpgrade} busy={aiBusy} error={aiError} onBuild={build} onClose={() => (aiBusy ? undefined : setBuilding(false))} /> : null}
    </>
  );

  if (!saved || !draft || !view) {
    const create = () =>
      start(async () => {
        setError("");
        const r = await ask(() => createBio(brand.id));
        if (r.error || !("page" in r) || !r.page) return setError(r.error ?? "Couldn't make the page");
        setSaved(r.page);
        setDraft(draftOf(r.page));
        setTab("blocks");
      });
    return (
      <Page actions={brandPicker}>
        <ErrorNote message={error} className="mx-auto max-w-md" />
        <ToolIntro
          drawing="lists"
          title={"Link in bio\none page for every profile"}
          lead="Links, posts and videos on one page at your own address, with every visit and click counted."
          action={
            <>
              <Button onClick={create} disabled={busy || aiBusy}>
                {busy ? <Loader /> : null}
                Create page
              </Button>
              {tools}
            </>
          }
        />
        {overlays}
      </Page>
    );
  }

  const patch = (p: Partial<BioDraft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const setBlocks = (fn: (b: Block[]) => Block[]) => setDraft((d) => (d ? { ...d, blocks: fn(d.blocks) } : d));
  const pick = (title: string, onPick: (id: string) => void) => setPicking({ title, onPick });
  const live = `${base}${saved.slug}`;

  const save = () => {
    const waiting = placeholderProblem(draft.blocks);
    if (waiting) return setError(waiting);
    const sent = draft;
    start(async () => {
      setError("");
      const r = await ask(() => saveBio(brand.id, sent));
      if (r.error || !("page" in r) || !r.page) return setError(r.error ?? "Couldn't save");
      const page = r.page;
      setSaved(page);
      // Changes made while saving stay; otherwise take the saved page (links get https://, codes are set).
      setDraft((cur) => (JSON.stringify(cur) === JSON.stringify(sent) ? draftOf(page) : cur));
    });
  };
  const del = async () => {
    if (!(await askConfirm("Delete this page?", { body: "Its address stops working.", ok: "Delete", danger: true }))) return;
    start(async () => {
      const r = await ask(() => removeBio(brand.id));
      if (r.error) return setError(r.error);
      setSaved(null);
      setDraft(null);
    });
  };

  return (
    <Page
      tabs={<TabNav label="Link in bio" value={tab} tabs={TABS} onChange={setTab} />}
      actions={
        <>
          {brandPicker}
          <IconLink href={live} label="Open page">
            <ExternalLink />
          </IconLink>
          <Button onClick={save} disabled={!dirty || busy || !!aiBefore}>
            {busy ? <Loader /> : null}
            Save
          </Button>
        </>
      }
    >
      {tab === "analytics" ? (
        <BioStats brandId={brand.id} />
      ) : (
        <div className="mx-auto grid w-full max-w-[1120px] gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-4">
            <ErrorNote message={error} />
            {aiBefore ? (
              <DraftBar
                onKeep={() => setAiBefore(null)}
                onDiscard={() => {
                  setError("");
                  setDraft(aiBefore);
                  setAiBefore(null);
                }}
              />
            ) : null}
            {tab === "blocks" ? (
              <BioBlocks blocks={draft.blocks} setBlocks={setBlocks} images={images} posts={posts} social={social} pick={pick} tools={tools} />
            ) : tab === "appearance" ? (
              <AppearanceTab draft={draft} patch={patch} images={images} pick={pick} />
            ) : (
              <SettingsTab brandId={brand.id} draft={draft} saved={saved} patch={patch} base={base} images={images} pick={pick} badgeOff={badgeOff} onDelete={del} busy={busy} />
            )}
          </div>
          <section aria-label="Preview" className="lg:sticky lg:top-0 lg:self-start">
            <div className="mx-auto h-[680px] max-h-[calc(100dvh-140px)] min-h-[520px] w-full max-w-[360px] overflow-y-auto rounded-2xl shadow-hover">
              <div inert className="min-h-full">
                <BioCard view={view} frame />
              </div>
            </div>
          </section>
        </div>
      )}
      {picking ? (
        <Modal title={picking.title} onClose={() => setPicking(null)} wide>
          {images.length ? (
            <div className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto p-0.5 sm:grid-cols-4">
              {images.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    picking.onPick(m.id);
                    setPicking(null);
                  }}
                  className="aspect-square overflow-hidden rounded-md shadow-chip transition-shadow hover:shadow-pill"
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
      {overlays}
    </Page>
  );
}

/** The section's page frame: the title, the tabs once there's a page, and the actions. */
function Page({ tabs, actions, children }: { tabs?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <UiPage icon={<Link2 />} title="Link in bio" tabs={tabs} actions={actions}>
      {children}
    </UiPage>
  );
}

function AppearanceTab({ draft, patch, images, pick }: { draft: BioDraft; patch: (p: Partial<BioDraft>) => void; images: Img[]; pick: (title: string, onPick: (id: string) => void) => void }) {
  const a = draft.appearance;
  const look = (p: Partial<Appearance>) => patch({ appearance: { ...a, ...p } });
  return (
    <>
      <Panel>
        <CardHead label="Profile" />
        <div className="flex flex-col gap-4 p-4">
          <Field label="Picture">
            <Picture id={draft.avatarMediaId} images={images} title="Choose a picture" pick={pick} onChange={(avatarMediaId) => patch({ avatarMediaId })} />
          </Field>
          <Field label="Title">
            <Input aria-label="Title" value={draft.title} maxLength={80} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
          <Field label="Bio" aside={<span className="text-[11px] text-faint tabular-nums">{draft.bio.length}/300</span>}>
            <TextArea aria-label="Bio" rows={3} value={draft.bio} maxLength={300} onChange={(e) => patch({ bio: e.target.value })} />
          </Field>
        </div>
      </Panel>
      <Panel>
        <CardHead label="Theme" />
        <div className="flex flex-col gap-3 p-4">
          {[
            { label: "Calm", list: BIO_THEMES.filter((t) => !t.bold) },
            { label: "Bold", list: BIO_THEMES.filter((t) => t.bold) },
          ].map((g) => (
            <div key={g.label} className="flex flex-col gap-2">
              <p className="label-mono">{g.label}</p>
              <div role="radiogroup" aria-label={`${g.label} themes`} className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-6">
                {g.list.map((t) => (
                  <ThemeSwatch key={t.id} t={t} on={a.theme === t.id} onPick={() => look({ theme: t.id })} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <CardHead label="Font" />
        <div role="radiogroup" aria-label="Font" className="grid grid-cols-3 gap-2.5 p-4 sm:grid-cols-6">
          {BIO_FONTS.map((f) => {
            const on = a.font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => look({ font: f.id })}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 pt-2.5 pb-2 transition-[background-color,box-shadow] duration-[var(--duration-fast)] ${on ? "bg-signal-soft shadow-picked" : "bg-panel shadow-chip hover:shadow-pill"}`}
              >
                <span className="text-[24px] leading-none font-semibold text-ink" style={{ fontFamily: f.family }}>
                  Aa
                </span>
                <span className="text-[11.5px] font-medium text-muted">{f.name}</span>
              </button>
            );
          })}
        </div>
      </Panel>
      <Panel>
        <CardHead label="Buttons" />
        <div className="flex flex-col gap-3 p-4">
          <Field label="Shape" row>
            <Segmented
              label="Shape"
              size="sm"
              value={a.shape}
              onChange={(shape) => look({ shape })}
              options={[
                { value: "pill", label: "Pill" },
                { value: "rounded", label: "Rounded" },
                { value: "square", label: "Square" },
              ]}
            />
          </Field>
          <Field label="Fill" row>
            <Segmented
              label="Fill"
              size="sm"
              value={a.fill}
              onChange={(fill) => look({ fill })}
              options={[
                { value: "solid", label: "Solid" },
                { value: "outline", label: "Outline" },
                { value: "hard", label: "Pop" },
                { value: "glass", label: "Glass" },
              ]}
            />
          </Field>
          <Field label="Text size" row>
            <Segmented
              label="Text size"
              size="sm"
              value={a.size}
              onChange={(size) => look({ size })}
              options={[
                { value: "normal", label: "Normal" },
                { value: "large", label: "Large" },
              ]}
            />
          </Field>
        </div>
      </Panel>
    </>
  );
}

function SettingsTab({
  brandId,
  draft,
  saved,
  patch,
  base,
  images,
  pick,
  badgeOff,
  onDelete,
  busy,
}: {
  brandId: string;
  draft: BioDraft;
  saved: BioPage;
  patch: (p: Partial<BioDraft>) => void;
  base: string;
  images: Img[];
  pick: (title: string, onPick: (id: string) => void) => void;
  badgeOff: boolean;
  onDelete: () => void;
  busy: boolean;
}) {
  const slug = draft.slug;
  const local = slug === saved.slug ? null : slugProblem(slug, saved.slug);
  const [checked, setChecked] = useState<{ slug: string; problem: string | null } | null>(null);
  // A new address is checked with the server a moment after typing stops.
  useEffect(() => {
    if (slug === saved.slug || local) return;
    let live = true;
    const t = setTimeout(() => {
      void ask(() => checkSlug(brandId, slug)).then((r) => live && setChecked({ slug, problem: r.error ?? ("problem" in r ? (r.problem ?? null) : null) }));
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [brandId, slug, saved.slug, local]);
  const status = slug === saved.slug ? null : local ? { ok: false, text: local } : checked?.slug === slug ? (checked.problem ? { ok: false, text: checked.problem } : { ok: true, text: "Available" }) : null;
  const live = `${base}${saved.slug}`;

  return (
    <>
      <Panel>
        <CardHead label="Address">
          <CopyButton text={live} label="Copy link" />
          <IconLink href={live} label="Open page">
            <ExternalLink />
          </IconLink>
        </CardHead>
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[13px] text-muted">{base.replace(/^https?:\/\//, "")}</span>
            <Input value={slug} onChange={(e) => patch({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} maxLength={40} aria-label="Address" aria-invalid={status ? !status.ok : undefined} />
          </div>
          {status ? (
            <p role="status" className={`text-[12px] ${status.ok ? "text-success" : "text-danger"}`}>
              {status.text}
            </p>
          ) : null}
        </div>
      </Panel>
      <Panel>
        <CardHead label="QR code" />
        <QrCode url={live} name={saved.slug} />
      </Panel>
      <Panel>
        <CardHead label="Search and sharing" />
        <div className="flex flex-col gap-4 p-4">
          <Field label="Title" aside={<span className="text-[11px] text-faint tabular-nums">{draft.seoTitle.length}/70</span>}>
            <Input aria-label="Search title" value={draft.seoTitle} placeholder={draft.title} maxLength={70} onChange={(e) => patch({ seoTitle: e.target.value })} />
          </Field>
          <Field label="Description" aside={<span className="text-[11px] text-faint tabular-nums">{draft.seoDescription.length}/200</span>}>
            <TextArea aria-label="Search description" rows={2} value={draft.seoDescription} placeholder={draft.bio} maxLength={200} onChange={(e) => patch({ seoDescription: e.target.value })} />
          </Field>
          <Field label="Picture">
            <Picture id={draft.shareMediaId} images={images} title="Choose a picture" pick={pick} onChange={(shareMediaId) => patch({ shareMediaId })} />
          </Field>
        </div>
      </Panel>
      <Panel>
        <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
          <span className="min-w-0 flex-1 text-[13px] font-medium">Made with Capybaroar</span>
          {badgeOff ? null : <Badge tone="yellow">Pro</Badge>}
          <Switch on={badgeOff ? draft.badge : true} disabled={!badgeOff} label="Made with Capybaroar" onChange={(badge) => patch({ badge })} />
        </div>
      </Panel>
      <div>
        <Button variant="danger" size="sm" onClick={onDelete} disabled={busy}>
          <Trash2 /> Delete page
        </Button>
      </div>
    </>
  );
}

/** The page's address as a QR code, to download as PNG or SVG. Made in the browser. */
function QrCode({ url, name }: { url: string; name: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let live = true;
    void import("qrcode")
      .then((q) => q.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" }))
      .then((s) => live && setSvg(s))
      .catch(() => live && setSvg(""));
    return () => {
      live = false;
    };
  }, [url]);
  const save = (href: string, file: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = file;
    a.click();
  };
  const png = async () => save(await (await import("qrcode")).toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: "M" }), `${name}-qr.png`);
  const vector = () => {
    const href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    save(href, `${name}-qr.svg`);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };
  return (
    <div className="flex flex-wrap items-center gap-4 p-4">
      <div className="flex size-36 items-center justify-center rounded-md bg-panel p-2 shadow-track">
        {svg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} alt={`QR code for ${url}`} className="size-full" />
        ) : (
          <Loader />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => void png()} disabled={!svg}>
          <Download /> PNG
        </Button>
        <Button variant="ghost" size="sm" onClick={vector} disabled={!svg}>
          <Download /> SVG
        </Button>
      </div>
    </div>
  );
}

/** A theme as a small picture: its background (gradients and patterns too) with a title bar and two buttons. */
function ThemeSwatch({ t, on, onPick }: { t: BioTheme; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onPick}
      className={`flex flex-col gap-1.5 rounded-lg p-1.5 text-left transition-[background-color,box-shadow] duration-[var(--duration-fast)] ${on ? "bg-signal-soft shadow-picked" : "bg-panel shadow-chip hover:shadow-pill"}`}
    >
      {/* The theme's own colors, from its preset. */}
      <span className="flex h-16 flex-col items-center justify-center gap-1.5 rounded-md px-2.5" style={{ background: t.bg }}>
        <span className="h-1.5 w-8 rounded-full" style={{ background: t.ink }} />
        <span className="flex h-3.5 w-full items-center justify-center rounded-full" style={{ background: t.surface, boxShadow: t.shadow }}>
          <span className="h-1 w-6 rounded-full" style={{ background: t.btnInk, opacity: 0.5 }} />
        </span>
        <span className="flex h-3.5 w-full items-center justify-center rounded-full" style={{ background: t.surface, boxShadow: t.shadow }}>
          <span className="h-1 w-6 rounded-full" style={{ background: t.btnInk, opacity: 0.5 }} />
        </span>
      </span>
      <span className="px-0.5 text-[12px] font-medium">{t.name}</span>
    </button>
  );
}
