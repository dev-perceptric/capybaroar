"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Image as ImageIcon, Sparkles, Trash2, Upload } from "lucide-react";
import { Button, Chip, ErrorNote, IconButton, Input, Page } from "./ui";
import { ToolIntro } from "./ToolIntro";
import { Loader } from "./Loader";
import { askConfirm } from "./Dialogs";
import { Modal } from "./Overlay";
import { GenerateForm, PendingTile, useGenerations } from "./Generate";
import { endUpload, mediaUsage, removeMedia, startUpload } from "@/app/(app)/media/actions";
import { toUploadable } from "@/lib/imageConvert";

type File = { id: string; name: string; mime: string; size: number; thumb: string | null };

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;

export function MediaView({ files, ai = false }: { files: File[]; ai?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  const [making, setMaking] = useState(false);
  const gens = useGenerations(() => router.refresh());
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | "image" | "video" | "pdf">("all");
  const kindOf = (m: string) => (m === "application/pdf" ? "pdf" : m.startsWith("video/") ? "video" : m.startsWith("image/") ? "image" : "other");
  const visible = files.filter((f) => (kind === "all" || kindOf(f.mime) === kind) && (!q.trim() || f.name.toLowerCase().includes(q.trim().toLowerCase())));
  const pick = () => input.current?.click();
  const send = (list: FileList | null) => {
    if (!list?.length) return;
    start(async () => {
      setError("");
      // Storage's client loads with the first upload, while its one-time link is made.
      const storage = import("@/lib/supabase/browser");
      for (const raw of Array.from(list)) {
        let f: globalThis.File;
        try {
          f = await toUploadable(raw);
        } catch (e) {
          setError(e instanceof Error ? e.message : `Couldn't read ${raw.name}`);
          break;
        }
        const info = { name: f.name, type: f.type, size: f.size };
        const s = await startUpload(info);
        if (s.error || !s.path || !s.token) {
          setError(`${f.name}: ${s.error}`);
          break;
        }
        const sb = (await storage).browserClient();
        const { error } = await sb.storage.from("media").uploadToSignedUrl(s.path, s.token, f, { contentType: f.type });
        if (error) {
          setError(`${f.name}: ${error.message}`);
          break;
        }
        const e = await endUpload({ ...info, path: s.path });
        if (e.error) {
          setError(`${f.name}: ${e.error}`);
          break;
        }
      }
      router.refresh();
    });
  };
  const del = async (f: File) => {
    const used = await mediaUsage(f.id).catch(() => 0);
    const body = used ? `It's in ${used} post${used === 1 ? "" : "s"} still to go out. They'll go out without it.` : undefined;
    if (!(await askConfirm(`Delete ${f.name}?`, { ok: "Delete", danger: true, body }))) return;
    start(async () => {
      await removeMedia(f.id);
      router.refresh();
    });
  };
  const button = (
    <>
      {ai ? (
        <Button variant="ghost" onClick={() => setMaking(true)}>
          <Sparkles />
          Generate
        </Button>
      ) : null}
      <Button onClick={pick} disabled={busy}>
        {busy ? <Loader /> : <Upload />}
        Upload
      </Button>
    </>
  );
  const shown = files.length || gens.pending.length;
  return (
    <Page icon={<ImageIcon />} title="Media" count={files.length || undefined} actions={shown ? <div className="flex flex-wrap items-center gap-2">{button}</div> : undefined}>
      <div className="min-h-full" onDragOver={(e) => e.preventDefault()} onDrop={(e) => (e.preventDefault(), send(e.dataTransfer.files))}>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,application/pdf,image/heic,image/heif,image/avif,.heic,.heif,.avif" className="hidden" onChange={(e) => send(e.target.files)} />
        <ErrorNote message={error} className="mb-4" />
        {files.length > 8 ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Input aria-label="Search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="w-56 max-w-full" />
            {(["all", "image", "video", "pdf"] as const).map((k) => (
              <Chip key={k} size="sm" on={kind === k} onClick={() => setKind(k)}>
                {k === "all" ? "All" : k === "image" ? "Pictures" : k === "video" ? "Videos" : "PDFs"}
              </Chip>
            ))}
          </div>
        ) : null}
        {shown ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {gens.pending.map((g) => (
              <PendingTile key={g.id} p={g} onDismiss={() => gens.dismiss(g.id)} className="aspect-square" />
            ))}
            {visible.map((f) => (
              <figure key={f.id} className="group overflow-hidden rounded-lg bg-panel shadow-card transition-shadow duration-[var(--duration-fast)] hover:shadow-hover">
                <div className="relative aspect-square bg-paper">
                  {f.mime === "application/pdf" ? (
                    <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center">
                      <FileText size={28} className="text-muted" />
                      <span className="text-[12px] text-body">PDF</span>
                    </div>
                  ) : f.mime.startsWith("audio/") ? (
                    <div className="flex size-full items-center justify-center p-3">
                      <audio src={f.thumb ?? undefined} controls preload="metadata" className="w-full" />
                    </div>
                  ) : f.mime.startsWith("video/") ? (
                    <video src={f.thumb ?? undefined} className="size-full object-cover" muted controls preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.thumb ?? ""} alt={f.name} loading="lazy" decoding="async" className="size-full object-cover" />
                  )}
                  <span className="absolute top-2 right-2 hidden group-focus-within:block group-hover:block">
                    <IconButton label="Delete" variant="ghost" align="end" onClick={() => del(f)}>
                      <Trash2 />
                    </IconButton>
                  </span>
                </div>
                <figcaption className="flex items-center gap-2 border-t border-line px-3 py-2 text-[12px]">
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="text-faint tabular-nums">{mb(f.size)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <ToolIntro drawing="files" title="Add your first file" lead={ai ? "Pictures and videos you upload, and files Capy makes, are ready for any post." : "Pictures and videos you upload here are ready for any post."} action={button} />
        )}
        {making ? (
          <Modal title="Generate" onClose={() => setMaking(false)} wide>
            <GenerateForm
              primary
              pictures={files}
              onStarted={(p) => {
                gens.add(p);
                setMaking(false);
              }}
            />
          </Modal>
        ) : null}
      </div>
    </Page>
  );
}
