"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "./Overlay";
import { Badge, Button, Checkbox } from "./ui";
import { Loader } from "./Loader";
import { NetworkLogo } from "./NetworkLogo";
import { ExternalLink } from "./Icons";
import type { NetworkId } from "@/lib/networks";
import type { ChannelResult, PlanItem } from "@/lib/unpublisher";
import { deleteEverywhere, deletePlan, remove } from "@/app/(app)/calendar/actions";

/** Delete a post that went out: on the channels picked (Delete everywhere), or only its record here. */
export function DeletePost({ postId, onClose, onDone }: { postId: string; onClose: () => void; onDone: () => void }) {
  const [items, setItems] = useState<PlanItem[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Map<string, ChannelResult> | null>(null);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();

  useEffect(() => {
    let live = true;
    deletePlan(postId).then(
      (r) => {
        if (!live) return;
        if (r.error) setError(r.error);
        setItems(r.items ?? []);
        setPicked(new Set((r.items ?? []).filter((i) => !i.deleted && !i.reason).map((i) => i.channelId)));
      },
      () => live && (setError("Couldn't load this post"), setItems([])),
    );
    return () => {
      live = false;
    };
  }, [postId]);

  const everywhere = () =>
    start(async () => {
      setError("");
      const r = await deleteEverywhere(postId, [...picked]);
      if (r.error) return setError(r.error);
      setResults(new Map((r.results ?? []).map((x) => [x.channelId, x])));
      setPicked(new Set());
    });
  const recordOnly = () =>
    start(async () => {
      setError("");
      const r = await remove(postId);
      if (r.error) setError(r.error);
      else onDone();
    });
  // Once something was deleted, closing refreshes the calendar.
  const close = results ? onDone : onClose;

  return (
    <Modal
      title="Delete post"
      onClose={close}
      footer={
        <>
          {error ? (
            <span role="alert" className="mr-auto min-w-0 truncate self-center text-[12px] text-danger">
              {error}
            </span>
          ) : null}
          <Button variant="ghost" disabled={busy || !items} onClick={recordOnly}>
            Remove from Capybaroar only
          </Button>
          {results ? (
            <Button onClick={onDone}>Done</Button>
          ) : (
            <Button variant="destroy" disabled={busy || !picked.size} onClick={everywhere}>
              {busy ? <Loader /> : null}
              Delete everywhere
            </Button>
          )}
        </>
      }
    >
      {!items ? (
        <div className="flex justify-center py-6">
          <Loader />
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-lg bg-paper px-1 shadow-track">
          {items.map((i) => {
            const r = results?.get(i.channelId);
            const can = !i.deleted && !i.reason && !results;
            const manual = r ? r.result === "manual" : i.manual;
            const gone = r ? r.result === "deleted" : i.deleted;
            const why = r?.result === "manual" ? r.error : r ? null : i.reason;
            return (
              <li key={i.channelId} className="flex min-h-11 items-start gap-2.5 px-2 py-2.5">
                <span className="mt-0.5 flex size-4 shrink-0 items-center">
                  {can ? (
                    <Checkbox
                      label={i.channelName}
                      checked={picked.has(i.channelId)}
                      disabled={busy}
                      onChange={(on) =>
                        setPicked((p) => {
                          const n = new Set(p);
                          if (on) n.add(i.channelId);
                          else n.delete(i.channelId);
                          return n;
                        })
                      }
                    />
                  ) : null}
                </span>
                <span className="mt-0.5 shrink-0">
                  <NetworkLogo id={i.network as NetworkId} size={16} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[13px] font-medium">{i.channelName}</span>
                  {why ? <span className="text-[12px] text-muted">{why}</span> : null}
                  {r?.result === "failed" && r.error ? <span className="text-[12px] text-danger">{r.error}</span> : null}
                  {r?.note ? <span className="text-[12px] text-warning">{r.note}</span> : null}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {manual && i.url ? (
                    <a href={i.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-ink underline underline-offset-2">
                      Open <ExternalLink size={12} />
                    </a>
                  ) : null}
                  {gone ? <Badge tone="green">Deleted</Badge> : r?.result === "failed" ? <Badge tone="red">Failed</Badge> : manual ? <Badge>Delete in the app</Badge> : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
