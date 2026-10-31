"use client";

import { useMemo, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Modal } from "./Overlay";
import { Avatar, Button, Field, Segmented, TextArea, inputClass } from "./ui";
import { NetworkLogo } from "./NetworkLogo";
import { NETWORKS, networkOf, type NetworkId } from "@/lib/networks";

const pad = (n: number) => String(n).padStart(2, "0");
const localValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Write a post once, pick where it goes and when. */
export function Composer({ at, onClose }: { at?: Date; onClose: () => void }) {
  const [picked, setPicked] = useState<NetworkId[]>([]);
  const [text, setText] = useState("");
  const [when, setWhen] = useState(() => localValue(at ?? nextHour()));
  const [view, setView] = useState<NetworkId | "">("");
  const shown = view && picked.includes(view) ? view : picked[0];

  const over = useMemo(() => picked.filter((id) => text.length > networkOf(id).limit), [picked, text]);
  const needsMedia = picked.filter((id) => networkOf(id).needsMedia);

  const toggle = (id: NetworkId) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Modal
      title="New post"
      wide
      onClose={onClose}
      footer={
        <div className="flex w-full flex-wrap items-center gap-2">
          <input type="datetime-local" aria-label="Publish time" value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass.replace("w-full", "w-[220px]")} />
          <span className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Save draft
          </Button>
          <Button disabled={!picked.length || !text.trim() || over.length > 0}>Schedule</Button>
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Field label="Channels">
            <div className="flex flex-wrap gap-1.5">
              {NETWORKS.map((n) => {
                const on = picked.includes(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    aria-pressed={on}
                    title={n.name}
                    onClick={() => toggle(n.id)}
                    className={`flex size-9 items-center justify-center border transition-colors ${on ? "border-frame bg-yolk" : "border-line hover:border-frame"}`}
                  >
                    <NetworkLogo id={n.id} size={18} />
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Text">
            <TextArea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="What do you want to share?" />
          </Field>
          {picked.length ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] tabular-nums">
              {picked.map((id) => {
                const n = networkOf(id);
                return (
                  <span key={id} className={`inline-flex items-center gap-1.5 ${text.length > n.limit ? "text-danger" : "text-muted"}`}>
                    <NetworkLogo id={id} size={12} />
                    {text.length} / {n.limit}
                  </span>
                );
              })}
            </div>
          ) : null}
          <button type="button" className="flex h-20 items-center justify-center gap-2 border border-dashed border-line-strong text-[13px] text-muted transition-colors hover:border-frame hover:text-ink">
            <ImagePlus size={16} />
            Add media
          </button>
          {needsMedia.length ? <p className="text-[12px] text-warning">{needsMedia.map((id) => networkOf(id).name).join(", ")} {needsMedia.length > 1 ? "need" : "needs"} a picture or video.</p> : null}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <p className="label-mono">
            <span className="bracket">Preview</span>
          </p>
          {shown ? (
            <>
              {picked.length > 1 ? <Segmented value={shown} onChange={(v) => setView(v)} options={picked.map((id) => ({ value: id, label: "", icon: <NetworkLogo id={id} size={14} /> }))} /> : null}
              <div className="border border-frame bg-panel p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Avatar label="Vincent" size={28} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold">Vincent</p>
                    <p className="flex items-center gap-1 text-[11px] text-faint">
                      <NetworkLogo id={shown} size={10} /> {networkOf(shown).name}
                    </p>
                  </div>
                </div>
                <p className="text-[13px] break-words whitespace-pre-wrap">{text || <span className="text-faint">Your post shows here.</span>}</p>
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center border border-dashed border-line text-[12px] text-faint">Pick a channel</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function nextHour() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}
