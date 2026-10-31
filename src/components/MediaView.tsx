"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { Button, IconButton } from "./ui";
import { ToolIntro } from "./ToolIntro";
import { Loader } from "./Loader";
import { askConfirm } from "./Dialogs";
import { endUpload, removeMedia, startUpload } from "@/app/(app)/media/actions";
import { browserClient } from "@/lib/supabase/browser";

type File = { id: string; name: string; mime: string; size: number; thumb: string | null };

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;

export function MediaView({ files }: { files: File[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  const pick = () => input.current?.click();
  const send = (list: FileList | null) => {
    if (!list?.length) return;
    start(async () => {
      setError("");
      const sb = browserClient();
      for (const f of Array.from(list)) {
        const info = { name: f.name, type: f.type, size: f.size };
        const s = await startUpload(info);
        if (s.error || !s.path || !s.token) {
          setError(`${f.name}: ${s.error}`);
          break;
        }
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
    if (!(await askConfirm(`Delete ${f.name}?`, { ok: "Delete", danger: true }))) return;
    start(async () => {
      await removeMedia(f.id);
      router.refresh();
    });
  };
  const button = (
    <Button onClick={pick} disabled={busy}>
      {busy ? <Loader /> : <Upload size={14} />}
      Upload
    </Button>
  );
  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => (e.preventDefault(), send(e.dataTransfer.files))}>
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime" className="hidden" onChange={(e) => send(e.target.files)} />
      {error ? <p className="mb-4 border border-danger bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p> : null}
      {files.length ? (
        <>
          <div className="mb-4 flex justify-end">{button}</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {files.map((f) => (
              <figure key={f.id} className="group border border-frame">
                <div className="relative aspect-square bg-pressed">
                  {f.mime.startsWith("video/") ? (
                    <video src={f.thumb ?? undefined} className="size-full object-cover" muted controls />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.thumb ?? ""} alt={f.name} className="size-full object-cover" />
                  )}
                  <span className="absolute top-1 right-1 hidden bg-panel group-hover:block">
                    <IconButton label="Delete" onClick={() => del(f)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </span>
                </div>
                <figcaption className="flex items-center gap-2 border-t border-line px-2 py-1.5 text-[12px]">
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="text-faint tabular-nums">{mb(f.size)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      ) : (
        <ToolIntro drawing="files" title="Add your first file" lead="Pictures and videos you upload here are ready for any post." action={button} />
      )}
    </div>
  );
}
