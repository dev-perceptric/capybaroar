"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Check, Copy, Crop, History, ImagePlus, Layers, Monitor, MoreHorizontal, Plus, Scissors, Smartphone, Sparkles, Trash2, Upload, X } from "lucide-react";
import { Badge, Button, Chip, Field, IconButton, Input, Segmented, TextArea, bareArea, boxClass, inputLook } from "./ui";
import { MultiSelect, Select } from "./Select";
import { Loader } from "./Loader";
import { ChannelFace, NetworkLogo } from "./NetworkLogo";
import { askConfirm, askText, tell } from "./Dialogs";
import { Desktop, Phone } from "./Previews";
import { DeletePost } from "./DeletePost";
import { PublishedView } from "./PublishedView";
import { Thumb } from "./MediaThumb";
import { TextTools, mod, toggleStyle, type FormatKind } from "./TextTools";
import { creditGate } from "./creditGate";
import { THREAD_MAX, networkOf, takesThread, type NetworkField, type ThreadPart } from "@/lib/networks";
import { threadOf } from "@/lib/thread";
import { toUploadable } from "@/lib/imageConvert";
import { avoidedIn, type BrandKit } from "@/lib/brandKit";
import type { Channel } from "@/lib/channels";
import type { CreatorInfo } from "@/lib/providers/tiktok";
import type { Comment, PostRow } from "@/lib/posts";
import type { Access } from "./CalendarView";
import { aiFormat, approve, channelGroups, composerData, duplicate, loadComments, loadMedia, newCampaign, reject, remove, removeChannelGroup, save, saveAlt, saveChannelGroup } from "@/app/(app)/calendar/actions";
import type { Campaign } from "@/lib/campaignRules";
import { groupChannels, isGroup, selectAll, type ChannelGroup } from "@/lib/groupRules";
import { Floating } from "./Floating";
import { fmtDateTime } from "@/lib/format";
import { endUpload, startUpload } from "@/app/(app)/media/actions";
import { EvergreenButton } from "./Evergreen";
import { GenerateForm, PendingTile, useGenerations } from "./Generate";
import { dialogIn, fadeIn } from "@/lib/motion";

// Crop and trim load when first used.
const MediaEdit = dynamic(() => import("./MediaEdit").then((m) => m.MediaEdit), { ssr: false });

type Media = { id: string; name: string; mime: string; thumb: string | null; alt: string | null };
type Target = { text: string | null; settings: Record<string, string> };
type Uploading = { key: string; name: string; error?: string };

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,application/pdf";
// What the file picker offers: the above, plus photos that become JPEG before they upload.
const PICK = `${ACCEPT},image/heic,image/heif,image/avif,.heic,.heif,.avif`;
const isPdf = (m: { mime: string }) => m.mime === "application/pdf";
const NEW_CAMPAIGN = "__new";
const pad = (n: number) => String(n).padStart(2, "0");
const localValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const nextHour = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
};
const initialSettings = (c: Channel) => Object.fromEntries((networkOf(c.network).fields ?? []).filter((f) => f.initial).map((f) => [f.key, f.initial!]));
const count = (s: string) => [...s].length;
type Snapshot = { text: string; targets: Record<string, Target>; mediaIds: string[]; when: string; thread?: ThreadPart[]; campaignId?: string | null };
const noSub = () => () => {};
const readLocal = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const opened = new Map<string, string | null>();
const openedWith = (key: string) => {
  if (!opened.has(key)) opened.set(key, readLocal(key));
  return opened.get(key)!;
};
const writeLocal = (key: string, v: string | null) => {
  try {
    if (v == null) localStorage.removeItem(key);
    else localStorage.setItem(key, v);
  } catch {
    /* private window: no autosave */
  }
};
/** The next time this weekday and hour comes around (browser time, which matches the workspace for most people). */
const nextAt = (day: number, hour: number) => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(hour);
  let add = (day - d.getDay() + 7) % 7;
  if (add === 0 && d.getTime() <= Date.now()) add = 7;
  d.setDate(d.getDate() + add);
  return d;
};

/** Write a post once, change it per channel, see it on a phone and a desktop, pick when it goes out. Full screen. */
export function Composer({ channels, at, post, preset, access = { write: true, approve: false }, onClose, onSaved }: { channels: Channel[]; at?: Date; post?: PostRow; preset?: string; access?: Access; onClose: () => void; onSaved: () => void }) {
  const locked = !access.write || (post ? !["draft", "review", "scheduled", "failed"].includes(post.status) : false);
  const inReview = post?.status === "review";
  // A post that went out is deleted on its networks (or only here) from its own dialog.
  const wentOut = !!post && ["published", "partial", "deleted"].includes(post.status);
  const [deleting, setDeleting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  useEffect(() => {
    if (post) loadComments(post.id).then(setComments, () => setComments([]));
  }, [post]);
  const [targets, setTargets] = useState<Record<string, Target>>(() => {
    if (post) return Object.fromEntries(post.post_targets.map((t) => [t.channel_id, { text: t.text, settings: t.settings ?? {} }]));
    const c = channels.find((x) => x.id === preset) ?? (channels.length === 1 ? channels[0] : undefined);
    return c ? { [c.id]: { text: null, settings: initialSettings(c) } } : {};
  });
  const [text, setText] = useState(post?.text ?? "");
  const [mediaIds, setMediaIds] = useState<string[]>(post?.media_ids ?? []);
  const [thread, setThread] = useState<ThreadPart[]>(() => threadOf(post?.thread));
  const [campaignId, setCampaignId] = useState<string | null>(post?.campaign_id ?? null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [when, setWhen] = useState(() => localValue(post?.publish_at ? new Date(post.publish_at) : (at ?? nextHour())));
  const [tab, setTab] = useState<string>("all");
  const [view, setView] = useState<string>("");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [library, setLibrary] = useState<Media[] | null>(null);
  const [picking, setPicking] = useState<"media" | "generate" | { cover: string } | null>(null);
  const [ai, setAi] = useState(false);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const sharedArea = useRef<HTMLTextAreaElement>(null);
  const chanArea = useRef<HTMLTextAreaElement>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  // Autosave on this device: every change is kept, and offered back the next time this post opens.
  const draftKey = `capybaroar:compose:${post?.id ?? "new"}`;
  const snap: Snapshot = { text, targets, mediaIds, when, thread, campaignId };
  const snapJson = JSON.stringify(snap);
  const [first] = useState(snapJson);
  const dirty = snapJson !== first;
  // Read once when the composer opens, so the bar never shows the autosave of what is being typed now.
  const stored = useSyncExternalStore(noSub, () => openedWith(draftKey), () => null);
  useEffect(() => () => void opened.delete(draftKey), [draftKey]);
  const [restoreSeen, setRestoreSeen] = useState(false);
  const restorable = !restoreSeen && !locked && stored && (() => {
    try {
      const v = JSON.parse(stored) as Snapshot & { savedAt: number };
      const { savedAt, ...rest } = v;
      return JSON.stringify(rest) !== first ? { ...v, savedAt } : null;
    } catch {
      return null;
    }
  })();
  useEffect(() => {
    if (!dirty || locked) return;
    const t = setTimeout(() => writeLocal(draftKey, JSON.stringify({ ...JSON.parse(snapJson), savedAt: Date.now() })), 400);
    return () => clearTimeout(t);
  }, [snapJson, dirty, draftKey, locked]);
  const restore = () => {
    if (!restorable) return;
    setText(restorable.text);
    setTargets(restorable.targets);
    setMediaIds(restorable.mediaIds);
    setThread(restorable.thread ?? []);
    if (restorable.campaignId !== undefined) setCampaignId(restorable.campaignId);
    setWhen(restorable.when);
    setRestoreSeen(true);
  };
  const discardLocal = () => {
    writeLocal(draftKey, null);
    setRestoreSeen(true);
  };
  const requestClose = async () => {
    if (dirty && !locked && !(await askConfirm("Close without saving?", { body: "Your changes stay on this device. Open this post again to get them back.", ok: "Close" }))) return;
    onClose();
  };

  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  useLayoutEffect(() => {
    void fadeIn(shell.current);
    void dialogIn(card.current);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const [best, setBest] = useState<{ day: number; hour: number }[]>([]);
  const [popular, setPopular] = useState<Record<string, { day: number; hour: number }[]>>({});
  const [kits, setKits] = useState<Record<string, BrandKit>>({});
  useEffect(() => {
    composerData().then(
      (d) => {
        setBest(d.best ?? []);
        setPopular(d.popular ?? {});
        setKits(d.kits ?? {});
        setLibrary((d.media ?? []) as Media[]);
        setCampaigns(d.campaigns ?? []);
        setAi(!!d.ai);
      },
      () => {
        setBest([]);
        setLibrary([]);
      },
    );
  }, []);

  const picked = channels.filter((c) => targets[c.id]);
  const active = picked.find((c) => c.id === tab) ?? null;
  // TikTok: what the account may post right now (who can watch, comments, Duet, Stitch), loaded from TikTok.
  const [tiktokInfo, setTiktokInfo] = useState<Record<string, CreatorInfo | { error: string }>>({});
  const tiktokAsked = useRef(new Set<string>());
  useEffect(() => {
    if (active?.network !== "tiktok" || tiktokAsked.current.has(active.id)) return;
    const id = active.id;
    tiktokAsked.current.add(id);
    fetch(`/api/tiktok/creator?channel=${encodeURIComponent(id)}`)
      .then(async (r) => ((await r.json()) as CreatorInfo | { error: string }))
      .catch(() => ({ error: "Couldn't reach TikTok" }))
      .then((info) => {
        setTiktokInfo((m) => ({ ...m, [id]: info }));
        // A choice TikTok no longer allows for this account is cleared, so the person picks again.
        if ("privacy" in info)
          setTargets((t) => (t[id]?.settings.privacy && !info.privacy.includes(t[id].settings.privacy) ? { ...t, [id]: { ...t[id], settings: { ...t[id].settings, privacy: "" } } } : t));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.network]);
  const fieldsFor = (c: Channel): NetworkField[] => {
    const fs = networkOf(c.network).fields ?? [];
    const info = c.network === "tiktok" ? tiktokInfo[c.id] : undefined;
    if (!info || "error" in info) return fs;
    return fs.map((f) => {
      if (f.key === "privacy") return { ...f, options: (f.options ?? []).filter((o) => info.privacy.includes(o.value)) };
      const off = (f.key === "comments" && info.commentOff) || (f.key === "duet" && info.duetOff) || (f.key === "stitch" && info.stitchOff);
      return off ? { ...f, label: `${f.label} (off in TikTok)`, options: (f.options ?? []).filter((o) => o.value === "off") } : f;
    });
  };
  const shown = picked.find((c) => c.id === view) ?? active ?? picked[0] ?? null;
  const files = mediaIds.map((id) => (library ?? []).find((m) => m.id === id)).filter((m): m is Media => Boolean(m));
  const textOf = (c: Channel) => targets[c.id]?.text ?? text;
  // Channels that post the thread's later parts; the rest post the first only.
  const threaded = picked.filter((c) => takesThread(c.network));
  const threadLimit = threaded.length ? Math.min(...threaded.map((c) => networkOf(c.network).limit)) : null;
  // The brand kit's words to avoid, anywhere in the post: the text each channel gets and the thread.
  const kit = picked[0]?.brand_id ? kits[picked[0].brand_id] : undefined;
  const avoided = kit?.avoid.length ? avoidedIn([text, ...picked.map((c) => targets[c.id]?.text ?? ""), ...thread.map((p) => p.text)].join("\n"), kit.avoid) : [];
  const threadPreview = (c: Channel) =>
    takesThread(c.network) ? thread.map((p) => ({ text: p.text, media: p.mediaIds.map((id) => (library ?? []).find((m) => m.id === id)).filter((m): m is Media => Boolean(m)) })) : [];
  const problems = useMemo(
    () =>
      picked.flatMap((c) => {
        const n = networkOf(c.network);
        const out: string[] = [];
        if (count(textOf(c)) > n.limit) out.push(`${c.name}: over ${n.limit.toLocaleString("en-US")} characters`);
        for (const f of n.fields ?? []) if (f.required && !targets[c.id]?.settings[f.key]?.trim()) out.push(`${c.name}: ${f.label} is required`);
        if (n.thread) thread.forEach((p, i) => count(p.text) > n.limit && out.push(`${c.name}: post ${i + 2} is over ${n.limit.toLocaleString("en-US")} characters`));
        return out;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [picked, targets, text, thread],
  );

  // Select all and saved channel groups (groupRules.ts).
  const [groups, setGroups] = useState<ChannelGroup[]>([]);
  const [groupMenu, setGroupMenu] = useState(false);
  const groupMenuBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    channelGroups().then(setGroups, () => setGroups([]));
  }, []);
  const pickedIds = channels.filter((c) => targets[c.id]).map((c) => c.id);
  const setPicked = (ids: string[]) =>
    setTargets((t) => Object.fromEntries(ids.flatMap((id) => {
      const c = channels.find((x) => x.id === id);
      return c ? [[id, t[id] ?? { text: null, settings: initialSettings(c) }]] : [];
    })));
  const everyone = selectAll(channels, pickedIds);
  const allOn = !!everyone && everyone.length > 0 && everyone.every((id) => targets[id]) && pickedIds.length === everyone.length;
  const saveGroup = async () => {
    const name = await askText("Name this group", { placeholder: "All socials", ok: "Save" });
    if (!name?.trim()) return;
    const r = await saveChannelGroup(name, pickedIds);
    if (r.error || !r.group) return setError(r.error ?? "Couldn't save the group");
    setGroups((g) => [...g, r.group!]);
  };
  const deleteGroup = async (g: ChannelGroup) => {
    setGroupMenu(false);
    if (!(await askConfirm(`Delete the group "${g.name}"?`, { ok: "Delete", danger: true, body: "The channels stay connected." }))) return;
    const r = await removeChannelGroup(g.id);
    if (r.error) return setError(r.error);
    setGroups((all) => all.filter((x) => x.id !== g.id));
  };
  const usable = groups.filter((g) => groupChannels(g, channels).length > 0);

  const patch = (id: string, p: Partial<Target>) => setTargets((t) => ({ ...t, [id]: { ...t[id], ...p } }));
  const setSetting = (id: string, key: string, value: string) => setTargets((t) => ({ ...t, [id]: { ...t[id], settings: { ...t[id].settings, [key]: value } } }));

  // AI pictures and videos: attached when their file is in the library.
  const gens = useGenerations(async (mediaId, kind) => {
    setLibrary((await loadMedia()) as Media[]);
    // Audio waits in the library: it can't go on a post on its own.
    if (kind !== "audio") setMediaIds((ids) => (ids.includes(mediaId) ? ids : [...ids, mediaId]));
  });

  /** Upload straight to storage with a one-time link, then attach. Several files upload one after another. */
  const upload = async (list: FileList | File[], replace?: string, attach?: (id: string) => void) => {
    const converted = await Promise.all(Array.from(list).map((f) => toUploadable(f).catch(() => f)));
    const all = converted.filter((f) => ACCEPT.split(",").includes(f.type));
    if (!all.length) {
      setError("Use JPG, PNG, GIF, WebP, MP4, MOV or PDF");
      return;
    }
    setError("");
    // Storage's client loads with the first upload, while its one-time link is made.
    const storage = import("@/lib/supabase/browser");
    for (const f of all) {
      const key = `${f.name}-${f.size}-${f.lastModified}`;
      setUploading((u) => [...u, { key, name: f.name }]);
      const info = { name: f.name, type: f.type, size: f.size };
      const fail = (msg: string) => setUploading((u) => u.map((x) => (x.key === key ? { ...x, error: msg } : x)));
      const s = await startUpload(info);
      if (s.error || !s.path || !s.token) {
        fail(s.error ?? "Couldn't start the upload");
        continue;
      }
      const sb = (await storage).browserClient();
      const { error: e } = await sb.storage.from("media").uploadToSignedUrl(s.path, s.token, f, { contentType: f.type });
      if (e) {
        fail(e.message);
        continue;
      }
      const done = await endUpload({ ...info, path: s.path });
      if (done.error || !done.id) {
        fail(done.error ?? "Upload didn't finish");
        continue;
      }
      const fresh = (await loadMedia()) as Media[];
      setLibrary(fresh);
      if (attach) attach(done.id);
      else setMediaIds((ids) => (replace && ids.includes(replace) ? ids.map((x) => (x === replace ? done.id! : x)) : [...ids, done.id!]));
      setUploading((u) => u.filter((x) => x.key !== key));
    }
  };

  const submit = (mode: "draft" | "schedule" | "now" | "queue") =>
    start(async () => {
      setError("");
      const r = await save({
        id: post?.id,
        text,
        mediaIds,
        thread,
        campaignId,
        targets: picked.map((c) => ({ channelId: c.id, text: targets[c.id].text, settings: targets[c.id].settings })),
        publishAt: when ? new Date(when).toISOString() : null,
        mode,
      });
      if (r.error) setError(r.error);
      else {
        writeLocal(draftKey, null);
        if (mode !== "draft" && picked.some((c) => c.network === "tiktok"))
          await tell("TikTok can take a few minutes", "After your video posts, TikTok may take a few minutes to process it before it shows on your profile.");
        onSaved();
      }
    });
  // AI formats the picked channels take, made from the post's text (aiFormat).
  const formats: FormatKind[] = [
    ...(threaded.length ? (["thread"] as const) : []),
    ...(picked.some((c) => c.network === "x") ? (["poll"] as const) : []),
    ...(picked.some((c) => c.network === "linkedin" || c.network === "linkedin-page") ? (["carousel"] as const) : []),
    ...(picked.some((c) => c.network === "tiktok") ? (["slideshow"] as const) : []),
  ];
  const [making, setMaking] = useState(false);
  const makeFormat = async (kind: FormatKind) => {
    const source = (active ? textOf(active) : text).trim();
    if (!source) return setError("Write what it's about first");
    if (kind === "thread" && thread.length && !(await askConfirm("Replace the thread?", { ok: "Replace" }))) return;
    if ((kind === "carousel" || kind === "slideshow") && mediaIds.length && !(await askConfirm("Replace the files on this post?", { ok: "Replace" }))) return;
    setError("");
    setMaking(true);
    const network = kind === "thread" ? (threaded[0]?.network ?? null) : null;
    const r = await aiFormat(kind, source, network, picked[0]?.brand_id ?? null);
    setMaking(false);
    if (r.error && (await creditGate(r.error))) return;
    if (r.error) return setError(r.error);
    if (r.thread) {
      setText(r.thread[0]);
      setThread(r.thread.slice(1).map((t) => ({ text: t, mediaIds: [] })));
    } else if (r.poll) {
      const xs = picked.filter((c) => c.network === "x");
      setTargets((t) => ({ ...t, ...Object.fromEntries(xs.map((c) => [c.id, { text: r.poll!.question, settings: { ...t[c.id].settings, poll: r.poll!.options.join("\n") } }])) }));
    } else if (r.mediaIds) {
      setLibrary((await loadMedia()) as Media[]);
      setMediaIds(r.mediaIds);
    }
  };
  const pickCampaign = async (v: string) => {
    if (v !== NEW_CAMPAIGN) return setCampaignId(v || null);
    const name = await askText("New campaign", { placeholder: "Spring launch", ok: "Create" });
    if (!name?.trim()) return;
    const r = await newCampaign(name);
    if (r.error || !r.campaign) return setError(r.error ?? "Couldn't make the campaign");
    setCampaigns((all) => [...all, r.campaign!]);
    setCampaignId(r.campaign.id);
  };
  const del = async () => {
    if (!post || !(await askConfirm("Delete this post?", { ok: "Delete", danger: true }))) return;
    start(async () => {
      const r = await remove(post.id);
      if (r.error) setError(r.error);
      else onSaved();
    });
  };
  const decide = async (ok: boolean) => {
    if (!post) return;
    const comment = ok ? "" : await askText("Reject this post", { placeholder: "What should change?", ok: "Reject" });
    if (comment === null) return;
    start(async () => {
      const r = ok ? await approve(post.id) : await reject(post.id, comment);
      if (r.error) setError(r.error);
      else {
        writeLocal(draftKey, null);
        onSaved();
      }
    });
  };
  const dup = () =>
    post &&
    start(async () => {
      const r = await duplicate(post.id);
      if (r.error) setError(r.error);
      else onSaved();
    });
  const editAlt = async (m: Media) => {
    const v = await askText("Alt text", { initial: m.alt ?? "", placeholder: "Describe the picture for people who can't see it" });
    if (v == null) return;
    const r = await saveAlt(m.id, v);
    if (r.error) setError(r.error);
    else setLibrary((lib) => (lib ?? []).map((x) => (x.id === m.id ? { ...x, alt: v.trim() || null } : x)));
  };
  const ready = picked.length > 0 && (text.trim() || mediaIds.length || picked.some((c) => targets[c.id].text?.trim())) && !problems.length && !uploading.some((u) => !u.error) && !gens.busy;
  useEffect(() => {
    keys.current = (e: KeyboardEvent) => {
      if (document.querySelector("[data-dialog-open]")) return;
      const cmd = e.metaKey || e.ctrlKey;
      const box = e.target instanceof HTMLTextAreaElement && (e.target === sharedArea.current || e.target === chanArea.current) ? e.target : null;
      if (e.key === "Escape") {
        if (e.defaultPrevented || aiOpen || editing || deleting || document.querySelector('[role="menu"],[role="listbox"]')) return;
        e.preventDefault();
        void requestClose();
      } else if (cmd && e.key === "Enter" && !locked) {
        e.preventDefault();
        if (ready && !busy) submit(e.shiftKey ? "now" : "schedule");
      } else if (cmd && e.key.toLowerCase() === "s" && !locked) {
        e.preventDefault();
        if (!busy) submit("draft");
      } else if (cmd && box && !locked && (e.key.toLowerCase() === "b" || e.key.toLowerCase() === "i")) {
        e.preventDefault();
        toggleStyle(box, e.key.toLowerCase() === "b" ? "bold" : "italic");
      } else if (cmd && e.key.toLowerCase() === "j" && !locked) {
        e.preventDefault();
        (active ? chanArea : sharedArea).current?.focus();
        setAiOpen(!aiOpen);
      }
    };
  });

  return (
    <div ref={shell} className="fixed inset-0 z-[80] flex bg-scrim md:p-4" role="dialog" aria-modal="true" aria-label={post ? "Edit post" : "New post"}>
      <div
        ref={card}
        className="relative flex min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-panel shadow-modal"
        onDragOver={(e) => {
          if (locked || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={(e) => {
          if (locked || !e.dataTransfer.files.length) return;
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files);
        }}
      >
        <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-2 pr-3 pl-5">
          <h2 className="text-[16px] font-semibold tracking-[-0.02em]">{post ? (locked ? "Post" : "Edit post") : "New post"}</h2>
          {inReview ? <Badge tone="violet">In review</Badge> : null}
          {locked && error ? <span className="min-w-0 truncate text-[12px] text-danger">{error}</span> : null}
          {wentOut && post ? (
            <Badge tone={post.status === "published" ? "green" : post.status === "partial" ? "amber" : "gray"}>{post.status === "published" ? "Published" : post.status === "partial" ? "Partly published" : "Deleted"}</Badge>
          ) : picked.length ? (
            <span className="flex items-center gap-1 text-[12px] text-muted">
              to {picked.length} channel{picked.length === 1 ? "" : "s"}
            </span>
          ) : null}
          <span className="flex-1" />
          {inReview && access.approve ? (
            <>
              <Button variant="ghost" disabled={busy} onClick={() => decide(false)}>
                Reject
              </Button>
              <Button variant={locked ? "primary" : "ghost"} disabled={busy} onClick={() => decide(true)}>
                {busy && locked ? <Loader /> : null}
                Approve
              </Button>
            </>
          ) : null}
          {post && access.write ? (
            <>
              {post.status === "published" || post.status === "partial" ? <EvergreenButton postId={post.id} /> : null}
              <IconButton label={post.status === "published" || post.status === "partial" ? "Post again" : "Duplicate"} onClick={dup} disabled={busy}>
                <Copy size={16} />
              </IconButton>
              {!locked || wentOut ? (
                <IconButton label="Delete" onClick={wentOut ? () => setDeleting(true) : del} disabled={busy}>
                  <Trash2 size={16} />
                </IconButton>
              ) : null}
            </>
          ) : null}
          <IconButton label="Close (Esc)" onClick={requestClose}>
            <X size={18} />
          </IconButton>
        </header>

        {restorable ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-signal-pale px-5 py-2 text-[13px]">
            <History size={14} />
            <span>Unsaved changes from {new Date(restorable.savedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            <span className="flex-1" />
            <Button variant="ghost" size="sm" onClick={discardLocal}>
              Discard
            </Button>
            <Button size="sm" onClick={restore}>
              Restore
            </Button>
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(440px,560px)]">
          {/* Editor */}
          <div className="min-h-0 overflow-y-auto">
            {wentOut && post ? (
              <div className="mx-auto w-full max-w-[720px] px-5 py-5">
                <PublishedView post={post} channels={channels} media={library ?? []} comments={comments} />
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 px-5 py-5">
                <Field
                  label="Channels"
                  aside={
                    !locked && channels.length > 1 ? (
                      <Button variant="plain" size="sm" className="-mr-1.5" disabled={!everyone} title={everyone ? undefined : "Pick a channel first to choose its brand"} onClick={() => setPicked(allOn ? [] : (everyone ?? []))}>
                        {allOn ? "Clear" : "Select all"}
                      </Button>
                    ) : null
                  }
                >
                  {channels.length ? (
                    <MultiSelect<string>
                      ariaLabel="Channels"
                      noun={["channel", "channels"]}
                      placeholder="Pick channels"
                      disabled={locked}
                      allowAll={false}
                      values={pickedIds}
                      onChange={setPicked}
                      canPick={(id) => {
                        const brand = picked[0]?.brand_id;
                        const c = channels.find((x) => x.id === id);
                        return picked.length && c && c.brand_id !== brand ? "Another brand's channel" : null;
                      }}
                      options={channels.map((c) => ({ value: c.id, label: c.name, icon: <ChannelFace channel={c} size={22} badge={10} />, hint: c.status === "reconnect" ? "Reconnect" : networkOf(c.network).name }))}
                    />
                  ) : (
                    <Link href="/channels" className="inline-flex h-9 w-fit items-center rounded-full border border-dashed border-line-strong px-4 text-[13px] text-muted transition-colors hover:border-ink/40 hover:text-ink">
                      Connect a channel
                    </Link>
                  )}
                </Field>
                {!locked && (usable.length || pickedIds.length > 1) ? (
                  <div className="-mt-2 flex flex-wrap items-center gap-1.5">
                    {usable.length ? (
                      <Select<string>
                        size="sm"
                        lead="Group"
                        ariaLabel="Channel group"
                        className="w-56 max-w-full"
                        value={usable.find((g) => isGroup(g, pickedIds, channels))?.id ?? ""}
                        onChange={(id) => {
                          const g = usable.find((x) => x.id === id);
                          if (g) setPicked(groupChannels(g, channels));
                        }}
                        placeholder="Pick a group"
                        options={usable.map((g) => ({ value: g.id, label: g.name, hint: String(groupChannels(g, channels).length) }))}
                      />
                    ) : null}
                    {pickedIds.length > 1 && !usable.some((g) => isGroup(g, pickedIds, channels)) ? (
                      <Chip size="sm" dashed onClick={saveGroup}>
                        <Plus size={12} />
                        Save as group
                      </Chip>
                    ) : null}
                    {usable.length ? (
                      <>
                        <button ref={groupMenuBtn} type="button" aria-label="Manage groups" title="Manage groups" aria-expanded={groupMenu} onClick={() => setGroupMenu(!groupMenu)} className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-hover hover:text-ink">
                          <MoreHorizontal size={14} />
                        </button>
                        {groupMenu ? (
                          <Floating anchor={groupMenuBtn} placement="bottom-start" onClose={() => setGroupMenu(false)} role="menu" className="min-w-56 rounded-lg bg-panel p-1.5 text-[13px] shadow-menu">
                            <p className="px-2.5 pt-1 pb-1.5 text-[11.5px] font-medium text-faint">Groups</p>
                            {usable.map((g) => (
                              <button key={g.id} type="button" role="menuitem" onClick={() => deleteGroup(g)} className="flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left hover:bg-hover">
                                <Layers size={13} className="text-muted" />
                                <span className="min-w-0 flex-1 truncate">{g.name}</span>
                                <Trash2 size={13} className="text-danger" />
                              </button>
                            ))}
                          </Floating>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ) : null}

                {picked.length ? (
                  <div className="border-t border-line pt-4">
                    <Select<string>
                      size="sm"
                      lead="Text for"
                      ariaLabel="Text for"
                      className="w-full max-w-80"
                      value={active?.id ?? "all"}
                      onChange={(id) => {
                        setTab(id);
                        if (id !== "all") setView(id);
                      }}
                      options={[
                        { value: "all", label: "All channels", icon: <Layers size={14} /> },
                        ...picked.map((c) => ({ value: c.id, label: c.name, icon: <NetworkLogo id={c.network} size={14} />, hint: targets[c.id].text != null ? "Own text" : undefined })),
                      ]}
                    />
                  </div>
                ) : null}

                {active ? (
                  <>
                    <Field
                      label={`Text for ${active.name}`}
                      aside={
                        targets[active.id].text != null && !locked ? (
                          <Button variant="plain" size="sm" className="-my-1" onClick={() => patch(active.id, { text: null })}>
                            Use shared text
                          </Button>
                        ) : null
                      }
                    >
                      <div className={boxClass}>
                        {!locked ? <TextTools area={chanArea} network={active.network} brandId={active.brand_id} formats={formats} onFormat={makeFormat} onError={setError} aiOpen={aiOpen} setAiOpen={setAiOpen} /> : null}
                        <textarea ref={chanArea} rows={11} aria-label={`Text for ${active.name}`} value={textOf(active)} readOnly={locked} onChange={(e) => patch(active.id, { text: e.target.value })} className={`${bareArea} resize-y text-[14px] leading-relaxed`} />
                      </div>
                    </Field>
                    <Counter c={active} text={textOf(active)} />
                  </>
                ) : (
                  <>
                    <Field label="Text">
                      <div className={boxClass}>
                      {!locked ? <TextTools area={sharedArea} network={picked.length === 1 ? picked[0].network : null} brandId={picked[0]?.brand_id ?? null} formats={formats} onFormat={makeFormat} onError={setError} aiOpen={aiOpen} setAiOpen={setAiOpen} /> : null}
                      <textarea
                        ref={sharedArea}
                        aria-label="Text"
                        rows={12}
                        value={text}
                        readOnly={locked}
                        onChange={(e) => setText(e.target.value)}
                        onPaste={(e) => {
                          if (!locked && e.clipboardData.files.length) {
                            e.preventDefault();
                            void upload(e.clipboardData.files);
                          }
                        }}
                        placeholder="What do you want to share?"
                        className={`${bareArea} resize-y text-[14px] leading-relaxed`}
                      />
                      </div>
                    </Field>
                    {picked.length ? (
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {/* One counter per network: the longest text among its channels, so over-limit still shows. */}
                        {[...new Set(picked.map((c) => c.network))].map((net) => {
                          const longest = picked.filter((c) => c.network === net).reduce((a, b) => (count(textOf(b)) > count(textOf(a)) ? b : a));
                          return <Counter key={net} c={longest} text={textOf(longest)} />;
                        })}
                      </div>
                    ) : null}
                  </>
                )}

                {/* Media */}
                <div className="flex flex-col gap-2">
                  <p className="text-[12.5px] font-medium text-body">Media</p>
                  <div className="flex flex-wrap gap-2">
                    {files.map((m, i) => (
                      <div
                        key={m.id}
                        draggable={!locked && files.length > 1}
                        onDragStart={(e) => {
                          setDragId(m.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/x-capybaroar-media", m.id);
                        }}
                        onDragEnd={() => setDragId(null)}
                        onDragOver={(e) => {
                          if (!dragId || dragId === m.id) return;
                          e.preventDefault();
                          e.stopPropagation();
                          setMediaIds((ids) => {
                            const from = ids.indexOf(dragId);
                            const to = ids.indexOf(m.id);
                            if (from < 0 || to < 0 || from === to) return ids;
                            const next = [...ids];
                            next.splice(from, 1);
                            next.splice(to, 0, dragId);
                            return next;
                          });
                        }}
                        onDrop={(e) => {
                          if (dragId) {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragId(null);
                          }
                        }}
                        className={`group/thumb relative ${files.length > 1 && !locked ? "cursor-grab active:cursor-grabbing" : ""} ${dragId === m.id ? "opacity-40" : ""}`}
                      >
                        <Thumb m={m} />
                        {files.length > 1 ? <span className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-panel text-[10px] font-semibold tabular-nums shadow-chip">{i + 1}</span> : null}
                        {!locked ? (
                          <>
                            <span className="absolute top-1.5 right-1.5 hidden gap-1 group-focus-within/thumb:flex group-hover/thumb:flex">
                              {!isPdf(m) ? (
                                <button type="button" title={m.mime.startsWith("video/") ? "Trim" : "Crop"} aria-label={m.mime.startsWith("video/") ? "Trim" : "Crop"} onClick={() => setEditing(m)} className="flex size-6 items-center justify-center rounded-full bg-panel shadow-chip transition-shadow hover:shadow-pill">
                                  {m.mime.startsWith("video/") ? <Scissors size={13} /> : <Crop size={13} />}
                                </button>
                              ) : null}
                              <button type="button" title="Remove" aria-label="Remove" onClick={() => setMediaIds((ids) => ids.filter((x) => x !== m.id))} className="flex size-6 items-center justify-center rounded-full bg-panel shadow-chip transition-shadow hover:shadow-pill">
                                <X size={13} />
                              </button>
                            </span>
                            {!m.mime.startsWith("video/") && !isPdf(m) ? (
                              <button type="button" onClick={() => editAlt(m)} className={`absolute inset-x-1.5 bottom-1.5 h-5 rounded-full bg-panel px-1.5 text-[10px] font-medium shadow-chip ${m.alt ? "text-muted" : ""}`}>
                                {m.alt ? "Alt text" : "Add alt"}
                              </button>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    ))}
                    {uploading.map((u) => (
                      <div key={u.key} className={`flex size-28 flex-col items-center justify-center gap-2 rounded-lg p-2 text-center text-[11px] ${u.error ? "bg-danger-soft text-danger" : "border border-dashed border-line-strong text-muted"}`}>
                        {u.error ? (
                          <>
                            <span className="line-clamp-3">{u.error}</span>
                            <Button variant="plain" size="sm" onClick={() => setUploading((all) => all.filter((x) => x.key !== u.key))}>
                              Dismiss
                            </Button>
                          </>
                        ) : (
                          <>
                            <Loader />
                            <span className="line-clamp-2 break-all">{u.name}</span>
                          </>
                        )}
                      </div>
                    ))}
                    {gens.pending.map((g) => (
                      <PendingTile key={g.id} p={g} onDismiss={() => gens.dismiss(g.id)} />
                    ))}
                    {!locked ? (
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="flex size-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong text-[12px] text-muted transition-colors hover:border-ink/40 hover:text-ink"
                      >
                        <Upload size={18} />
                        Upload
                      </button>
                    ) : null}
                    {!locked ? (
                      <button
                        type="button"
                        onClick={() => setPicking(picking === "media" ? null : "media")}
                        aria-pressed={picking === "media"}
                        className={`flex size-28 flex-col items-center justify-center gap-1.5 rounded-lg text-[12px] transition-colors ${picking === "media" ? "bg-signal-soft text-ink shadow-picked" : "border border-dashed border-line-strong text-muted hover:border-ink/40 hover:text-ink"}`}
                      >
                        <ImagePlus size={18} />
                        From library
                      </button>
                    ) : null}
                    {!locked && ai ? (
                      <button
                        type="button"
                        onClick={() => setPicking(picking === "generate" ? null : "generate")}
                        aria-pressed={picking === "generate"}
                        className={`flex size-28 flex-col items-center justify-center gap-1.5 rounded-lg text-[12px] transition-colors ${picking === "generate" ? "bg-signal-soft text-ink shadow-picked" : "border border-dashed border-line-strong text-muted hover:border-ink/40 hover:text-ink"}`}
                      >
                        <Sparkles size={18} />
                        Generate
                      </button>
                    ) : null}
                  </div>
                  <input ref={fileInput} type="file" multiple accept={PICK} className="hidden" onChange={(e) => e.target.files && void upload(e.target.files).then(() => (e.target.value = ""))} />
                  {picking === "generate" ? (
                    <div className="rounded-lg bg-paper p-3 shadow-track">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[13px] font-medium">Generate</span>
                        <Button variant="plain" size="sm" className="-mr-1.5" onClick={() => setPicking(null)}>
                          Done
                        </Button>
                      </div>
                      <GenerateForm pictures={[...files, ...(library ?? []).filter((m) => !mediaIds.includes(m.id))]} onStarted={gens.add} />
                    </div>
                  ) : picking ? (
                    <div className="rounded-lg bg-paper p-3 shadow-track">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[13px] font-medium">{picking === "media" ? "Your library" : "Pick a cover picture"}</span>
                        <Button variant="plain" size="sm" className="-mr-1.5" onClick={() => setPicking(null)}>
                          Done
                        </Button>
                      </div>
                      {library === null ? (
                        <Loader />
                      ) : library.length ? (
                        <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
                          {library
                            .filter((m) => !m.mime.startsWith("audio/") && (picking === "media" || !m.mime.startsWith("video/")))
                            .map((m) => {
                              const on = picking === "media" ? mediaIds.includes(m.id) : targets[picking.cover]?.settings.cover === m.id;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    if (picking === "media") setMediaIds((ids) => (ids.includes(m.id) ? ids.filter((x) => x !== m.id) : [...ids, m.id]));
                                    else {
                                      setSetting(picking.cover, "cover", m.id);
                                      setPicking(null);
                                    }
                                  }}
                                  className="relative"
                                >
                                  <Thumb m={m} small />
                                  {on ? (
                                    <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-signal text-on-signal">
                                      <Check size={12} />
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-[12px] text-muted">No files yet. Drop some here.</p>
                      )}
                    </div>
                  ) : null}
                </div>

                {threadLimit !== null || thread.length ? (
                  <ThreadEditor
                    parts={thread}
                    onChange={setThread}
                    limit={threadLimit}
                    library={library}
                    locked={locked}
                    onUpload={(list, i) => void upload(list, undefined, (id) => setThread((t) => t.map((p, j) => (j === i ? { ...p, mediaIds: [...p.mediaIds, id] } : p))))}
                  />
                ) : null}

                {active?.network === "tiktok" ? <TikTokCreator info={tiktokInfo[active.id]} /> : null}

                {active
                  ? fieldsFor(active)
                      .filter((f) => !f.when || targets[active.id].settings[f.when.key] === f.when.value)
                      .map((f) => (
                        <SettingField
                          key={f.key}
                          f={f}
                          value={targets[active.id].settings[f.key] ?? ""}
                          locked={locked}
                          onChange={(v) => setSetting(active.id, f.key, v)}
                          cover={(library ?? []).find((m) => m.id === targets[active.id].settings[f.key]) ?? null}
                          onPickCover={() => setPicking({ cover: active.id })}
                        />
                      ))
                  : null}

                {active?.network === "tiktok" ? <TikTokConsent brand={targets[active.id].settings.brand ?? "off"} /> : null}

                {comments.length ? (
                  <div className="flex flex-col gap-2 border-t border-line pt-4">
                    <p className="text-[12.5px] font-medium text-body">Approval</p>
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
                  </div>
                ) : null}

                {post?.post_targets.some((t) => t.error || t.url || t.note) ? (
                  <div className="flex flex-col gap-1.5 border-t border-line pt-4">
                    {post.post_targets.map((t) => {
                      const c = channels.find((x) => x.id === t.channel_id);
                      return (
                        <p key={t.id} className="flex flex-wrap items-center gap-2 text-[12px]">
                          {c ? <NetworkLogo id={c.network} size={12} /> : null}
                          <span className="font-medium">{c?.name ?? "Removed channel"}</span>
                          {t.url && !t.deleted_at ? (
                            <a href={t.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                              Open post
                            </a>
                          ) : null}
                          {t.deleted_at ? <Badge>Deleted</Badge> : null}
                          {t.error ? <span className="text-danger">{t.error}</span> : null}
                          {t.note ? <span className="text-warning">{t.note}</span> : null}
                        </p>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Preview */}
          <aside className="hidden min-h-0 flex-col border-l border-line bg-paper lg:flex">
            <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-line bg-panel px-4 py-2.5">
              {picked.length ? (
                <Select<string>
                  size="sm"
                  lead="Preview"
                  ariaLabel="Preview"
                  className="min-w-0 max-w-64 flex-1"
                  value={shown?.id ?? ""}
                  onChange={setView}
                  options={picked.map((c) => ({ value: c.id, label: c.name, icon: <ChannelFace channel={c} size={16} badge={9} /> }))}
                />
              ) : (
                <span className="flex-1" />
              )}
              <Segmented
                label="Preview on"
                size="sm"
                value={device}
                onChange={(v) => setDevice(v as "mobile" | "desktop")}
                options={[
                  { value: "mobile", label: "Phone", icon: <Smartphone size={14} /> },
                  { value: "desktop", label: "Desktop", icon: <Monitor size={14} /> },
                ]}
              />
            </div>
            <FitBox width={device === "mobile" ? 340 : 560}>
              {shown ? (
                device === "mobile" ? (
                  <Phone channel={shown} text={textOf(shown)} media={files} settings={targets[shown.id]?.settings ?? {}} thread={threadPreview(shown)} />
                ) : (
                  <Desktop channel={shown} text={textOf(shown)} media={files} settings={targets[shown.id]?.settings ?? {}} thread={threadPreview(shown)} />
                )
              ) : (
                <div className="text-[13px] text-faint">Pick a channel to see the preview</div>
              )}
            </FitBox>
          </aside>
        </div>

        {!locked ? (
          <footer className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-line bg-paper px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <input type="datetime-local" aria-label="Publish time" value={when} onChange={(e) => setWhen(e.target.value)} className={`${inputLook} w-[210px] max-w-full`} />
              {(best.length ? best : shown ? (popular[shown.network] ?? []) : []).map((b) => {
                const at = nextAt(b.day, b.hour);
                return (
                  <Chip key={`${b.day}${b.hour}`} size="sm" title={best.length ? "One of your best times" : `Popular on ${networkOf(shown!.network).name}`} on={when === localValue(at)} onClick={() => setWhen(localValue(at))}>
                    {at.toLocaleDateString("en-US", { weekday: "short" })} {at.toLocaleTimeString("en-US", { hour: "numeric" })}
                  </Chip>
                );
              })}
            </div>
            <Select<string>
              size="sm"
              lead="Campaign"
              ariaLabel="Campaign"
              value={campaignId ?? ""}
              onChange={(v) => void pickCampaign(v)}
              options={[
                { value: "", label: "None" },
                ...campaigns.map((c) => ({ value: c.id, label: c.name, dot: `var(--color-tone-${c.tone})` })),
                { value: NEW_CAMPAIGN, label: "New campaign" },
              ]}
            />
            <span role={error ? "alert" : undefined} className="min-w-0 flex-1 truncate text-[12px]">
              {making ? <Loader /> : error ? <span className="text-danger">{error}</span> : problems.length ? <span className="text-warning">{problems[0]}</span> : avoided.length ? <span className="text-warning">Words to avoid: {avoided.join(", ")}</span> : null}
            </span>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" disabled={busy} onClick={() => submit("draft")} title={`${mod()}S`}>
                Save draft
              </Button>
              <Button variant="ghost" disabled={busy || !ready} onClick={() => submit("queue")}>
                Add to queue
              </Button>
              <Button variant="ghost" disabled={busy || !ready} onClick={() => submit("now")} title={`${mod()}Shift+Enter`}>
                Post now
              </Button>
              <Button disabled={busy || !ready} onClick={() => submit("schedule")} title={`${mod()}Enter`}>
                {busy ? <Loader /> : null}
                Schedule
              </Button>
            </div>
          </footer>
        ) : null}

        {deleting && post ? <DeletePost postId={post.id} onClose={() => setDeleting(false)} onDone={onSaved} /> : null}

        {editing ? (
          <MediaEdit
            m={editing}
            onClose={() => setEditing(null)}
            onCropped={(f) => upload([f], editing.id)}
            onTrimmed={async (id) => {
              setLibrary((await loadMedia()) as Media[]);
              setMediaIds((ids) => ids.map((x) => (x === editing.id ? id : x)));
            }}
          />
        ) : null}

        {dragging ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-signal-strong bg-signal-pale/90">
            <span className="flex items-center gap-2 rounded-full bg-panel px-5 py-3 text-[14px] font-semibold shadow-menu">
              <Upload size={18} /> Drop pictures or videos to add them
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Counter({ c, text }: { c: Channel; text: string }) {
  const n = networkOf(c.network);
  const len = count(text);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] tabular-nums ${len > n.limit ? "text-danger" : "text-muted"}`}>
      <NetworkLogo id={c.network} size={12} />
      {len} / {n.limit}
    </span>
  );
}

function SettingField({ f, value, locked, onChange, cover, onPickCover }: { f: NetworkField; value: string; locked: boolean; onChange: (v: string) => void; cover: Media | null; onPickCover: () => void }) {
  const label = f.required ? `${f.label} *` : f.label;
  if (f.kind === "select")
    return (
      <Field label={label}>
        <Select value={value} onChange={onChange} disabled={locked} placeholder="Choose" options={f.options ?? []} />
      </Field>
    );
  if (f.kind === "textarea")
    return (
      <Field label={label}>
        <TextArea rows={2} value={value} readOnly={locked} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
      </Field>
    );
  if (f.kind === "cover")
    return (
      <Field label={label}>
        <div className="flex items-center gap-2">
          {cover ? <Thumb m={cover} small /> : null}
          {!locked ? (
            <>
              <Button variant="ghost" onClick={onPickCover}>
                {cover ? "Change" : "Pick a picture"}
              </Button>
              {cover ? (
                <Button variant="plain" onClick={() => onChange("")}>
                  Remove
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </Field>
    );
  return (
    <Field label={label}>
      <Input value={value} readOnly={locked} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

/** A thread's posts after the first: each with its own text and files, added one by one. */
function ThreadEditor({ parts, onChange, limit, library, locked, onUpload }: { parts: ThreadPart[]; onChange: (p: ThreadPart[]) => void; limit: number | null; library: Media[] | null; locked: boolean; onUpload: (files: FileList, index: number) => void }) {
  const [picking, setPicking] = useState<number | null>(null);
  const upInput = useRef<HTMLInputElement>(null);
  const upFor = useRef(0);
  const set = (i: number, p: Partial<ThreadPart>) => onChange(parts.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const toggleFile = (i: number, id: string) => set(i, { mediaIds: parts[i].mediaIds.includes(id) ? parts[i].mediaIds.filter((x) => x !== id) : [...parts[i].mediaIds, id] });
  const tile = "flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-strong text-[11px] text-muted transition-colors hover:border-ink/40 hover:text-ink";
  return (
    <div className="flex flex-col gap-2">
      {parts.length ? <p className="text-[12.5px] font-medium text-body">Thread</p> : null}
      {parts.map((p, i) => {
        const files = p.mediaIds.map((id) => (library ?? []).find((m) => m.id === id)).filter((m): m is Media => Boolean(m));
        const len = count(p.text);
        return (
          <div key={i} className="flex flex-col gap-1.5">
            <div className={boxClass}>
              <div className="flex items-center justify-between gap-2 px-3 pt-2">
                <span className="text-[12px] text-muted tabular-nums">{i + 2}</span>
                {!locked ? (
                  <IconButton label="Remove from thread" onClick={() => onChange(parts.filter((_, j) => j !== i))}>
                    <Trash2 size={14} />
                  </IconButton>
                ) : null}
              </div>
              <textarea aria-label={`Post ${i + 2}`} rows={4} value={p.text} readOnly={locked} onChange={(e) => set(i, { text: e.target.value })} className={`${bareArea} resize-y text-[14px] leading-relaxed`} />
              {files.length || !locked ? (
                <div className="flex flex-wrap gap-2 px-3 pb-3">
                  {files.map((m) => (
                    <div key={m.id} className="group/thumb relative">
                      <Thumb m={m} small />
                      {!locked ? (
                        <button type="button" title="Remove" aria-label="Remove" onClick={() => toggleFile(i, m.id)} className="absolute top-1.5 right-1.5 hidden size-6 items-center justify-center rounded-full bg-panel shadow-chip group-focus-within/thumb:flex group-hover/thumb:flex">
                          <X size={13} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {!locked ? (
                    <>
                      <button
                        type="button"
                        className={tile}
                        onClick={() => {
                          upFor.current = i;
                          upInput.current?.click();
                        }}
                      >
                        <Upload size={16} />
                        Upload
                      </button>
                      <button type="button" aria-pressed={picking === i} onClick={() => setPicking(picking === i ? null : i)} className={picking === i ? "flex size-20 flex-col items-center justify-center gap-1 rounded-lg bg-signal-soft text-[11px] text-ink shadow-picked" : tile}>
                        <ImagePlus size={16} />
                        Library
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
            {limit !== null ? <span className={`text-[12px] tabular-nums ${len > limit ? "text-danger" : "text-muted"}`}>{len} / {limit}</span> : null}
            {picking === i ? (
              <div className="rounded-lg bg-paper p-3 shadow-track">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-medium">Your library</span>
                  <Button variant="plain" size="sm" className="-mr-1.5" onClick={() => setPicking(null)}>
                    Done
                  </Button>
                </div>
                {library === null ? (
                  <Loader />
                ) : (
                  <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
                    {library
                      .filter((m) => !m.mime.startsWith("audio/"))
                      .map((m) => (
                        <button key={m.id} type="button" onClick={() => toggleFile(i, m.id)} className="relative">
                          <Thumb m={m} small />
                          {p.mediaIds.includes(m.id) ? (
                            <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-signal text-on-signal">
                              <Check size={12} />
                            </span>
                          ) : null}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
      {!locked && limit !== null && parts.length < THREAD_MAX ? (
        <div>
          <Button variant="ghost" size="sm" onClick={() => onChange([...parts, { text: "", mediaIds: [] }])}>
            <Plus size={14} />
            Add to thread
          </Button>
        </div>
      ) : null}
      <input ref={upInput} type="file" multiple accept={PICK} className="hidden" onChange={(e) => e.target.files && (onUpload(e.target.files, upFor.current), (e.target.value = ""))} />
    </div>
  );
}

/** Shrinks the preview to fit its panel, so the whole phone or window shows without scrolling. */
function FitBox({ width, children }: { width: number; children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      const pad = 32;
      const w = i.scrollWidth;
      const h = i.scrollHeight;
      if (!w || !h) return;
      setScale(Math.min(1, (o.clientWidth - pad) / w, (o.clientHeight - pad) / h));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    fit();
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={outer} className="relative min-h-0 flex-1 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div ref={inner} className="shrink-0" style={{ width, transform: `scale(${scale})`, transformOrigin: "center" }}>
          {children}
        </div>
      </div>
    </div>
  );
}


/** What TikTok requires next to the Post button: the label promotional posts get and the policies the person agrees to. */
function TikTokConsent({ brand }: { brand: string }) {
  const link = (href: string, label: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">
      {label}
    </a>
  );
  return (
    <div className="flex flex-col gap-1 text-[12px] text-muted">
      {brand === "own" ? <p>Your video will be labeled “Promotional content”.</p> : null}
      {brand === "branded" ? <p>Your video will be labeled “Paid partnership”.</p> : null}
      <p>
        By posting, you agree to TikTok’s {link("https://www.tiktok.com/legal/page/global/music-usage-confirmation/en", "Music Usage Confirmation")}
        {brand === "branded" ? <> and {link("https://www.tiktok.com/legal/page/global/bc-policy/en", "Branded Content Policy")}</> : null}.
      </p>
    </div>
  );
}


/** The TikTok account the post goes to, as TikTok names it, shown above its settings. */
function TikTokCreator({ info }: { info: CreatorInfo | { error: string } | undefined }) {
  if (!info)
    return (
      <div className="flex items-center gap-2 text-[12.5px] text-muted">
        <Loader /> TikTok account
      </div>
    );
  if ("error" in info) return <p className="text-[12.5px] text-danger">{info.error}</p>;
  return (
    <div className="flex items-center gap-2.5">
      {info.avatar ? <img src={info.avatar} alt="" width={28} height={28} className="size-7 rounded-full object-cover" /> : null}
      <p className="text-[12.5px] text-muted">
        Posting as <span className="font-medium text-ink">{info.nickname}</span>
      </p>
    </div>
  );
}
