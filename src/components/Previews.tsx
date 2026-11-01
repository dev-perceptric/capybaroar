"use client";

// Realistic previews of a post on each network, on a phone or in a desktop browser. These copy each network's
// own look on purpose (rounded corners, their icons and spacing), so they sit inside a device frame and nowhere else.
import { Bookmark, ChevronDown, Globe, Heart, MessageCircle, MoreHorizontal, Music2, Play, Repeat2, Send, Share, ThumbsUp } from "lucide-react";
import { Avatar } from "./ui";
import { NetworkLogo } from "./NetworkLogo";
import { networkOf } from "@/lib/networks";
import type { Channel } from "@/lib/channels";

export type PreviewMedia = { id: string; mime: string; thumb: string | null; alt: string | null };
export type PreviewProps = { channel: Channel; text: string; media: PreviewMedia[]; settings: Record<string, string> };

const handle = (c: Channel) => c.username || c.name.toLowerCase().replace(/[^a-z0-9_.]+/g, "");
const isVideo = (m: PreviewMedia) => m.mime.startsWith("video/");

function Face({ c, size = 36 }: { c: Channel; size?: number }) {
  return c.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.avatar} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span className="shrink-0 overflow-hidden rounded-full">
      <Avatar label={c.name} size={size} />
    </span>
  );
}

function Visual({ m, className = "" }: { m: PreviewMedia; className?: string }) {
  return isVideo(m) ? (
    <div className={`relative bg-black ${className}`}>
      <video src={m.thumb ?? undefined} className="size-full object-cover" muted playsInline preload="metadata" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-black/50 text-white">
          <Play size={22} fill="currentColor" />
        </span>
      </span>
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={m.thumb ?? ""} alt={m.alt ?? ""} className={`bg-neutral-100 object-cover ${className}`} />
  );
}

function Grid({ media, rounded = "" }: { media: PreviewMedia[]; rounded?: string }) {
  if (!media.length) return null;
  if (media.length === 1) return <Visual m={media[0]} className={`aspect-[4/5] max-h-[520px] w-full ${rounded}`} />;
  return (
    <div className={`grid grid-cols-2 gap-0.5 overflow-hidden ${rounded}`}>
      {media.slice(0, 4).map((m, i) => (
        <div key={m.id} className="relative">
          <Visual m={m} className="aspect-square w-full" />
          {i === 3 && media.length > 4 ? <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[20px] font-semibold text-white">+{media.length - 4}</span> : null}
        </div>
      ))}
    </div>
  );
}

function Clamp({ text, lines, more = "more", className = "" }: { text: string; lines: number; more?: string; className?: string }) {
  const long = text.split("\n").length > lines || text.length > lines * 60;
  return (
    <p className={`break-words whitespace-pre-wrap ${className}`}>
      <span className={long ? `line-clamp-${lines}` : ""} style={long ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}>
        {text || <span className="opacity-40">Your text shows here</span>}
      </span>
      {long ? <span className="opacity-60">… {more}</span> : null}
    </p>
  );
}

/* ---------- Networks ---------- */

function Instagram({ channel: c, text, media, settings }: PreviewProps) {
  const fmt = settings.format || "post";
  if (fmt === "story" || fmt === "reel")
    return (
      <div className="relative h-full min-h-[560px] w-full overflow-hidden bg-black text-white">
        {media[0] ? <Visual m={media[0]} className="absolute inset-0 size-full" /> : <div className="absolute inset-0 bg-neutral-800" />}
        {fmt === "story" ? (
          <div className="absolute inset-x-2 top-2 flex flex-col gap-2">
            <div className="h-0.5 rounded bg-white/40">
              <div className="h-full w-1/3 rounded bg-white" />
            </div>
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <Face c={c} size={30} /> {handle(c)} <span className="font-normal opacity-70">1m</span>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
              <Heart size={26} />
              <MessageCircle size={26} />
              <Send size={24} />
              <MoreHorizontal size={22} />
            </div>
            <div className="absolute inset-x-3 bottom-5 flex flex-col gap-2 pr-12">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <Face c={c} size={28} /> {handle(c)} <span className="rounded-md border border-white/70 px-2 py-0.5 text-[11px]">Follow</span>
              </div>
              <Clamp text={text} lines={2} className="text-[13px]" />
              <span className="flex items-center gap-1.5 text-[12px] opacity-90">
                <Music2 size={12} /> {handle(c)} · Original audio
              </span>
            </div>
          </>
        )}
      </div>
    );
  return (
    <div className="bg-white text-[14px] text-black">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span className="rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]">
          <span className="block rounded-full bg-white p-[1.5px]">
            <Face c={c} size={30} />
          </span>
        </span>
        <span className="flex-1 text-[13px] font-semibold">{handle(c)}</span>
        <MoreHorizontal size={18} />
      </div>
      {media.length ? (
        <div className="relative">
          <Visual m={media[0]} className="aspect-[4/5] w-full" />
          {media.length > 1 ? <span className="absolute top-3 right-3 rounded-full bg-black/70 px-2 py-0.5 text-[11px] text-white">1/{media.length}</span> : null}
        </div>
      ) : (
        <div className="flex aspect-[4/5] w-full items-center justify-center bg-neutral-100 text-[12px] text-neutral-400">Instagram needs a picture or video</div>
      )}
      <div className="flex items-center gap-4 px-3 pt-3 pb-1">
        <Heart size={24} />
        <MessageCircle size={24} />
        <Send size={22} />
        <span className="flex-1" />
        {media.length > 1 ? (
          <span className="absolute left-1/2 flex -translate-x-1/2 gap-1">
            {media.slice(0, 5).map((m, i) => (
              <span key={m.id} className={`size-1.5 rounded-full ${i ? "bg-neutral-300" : "bg-[#0095f6]"}`} />
            ))}
          </span>
        ) : null}
        <Bookmark size={24} />
      </div>
      <div className="px-3 pb-3 text-[13px]">
        <p className="font-semibold">Be the first to like this</p>
        <Clamp text={text ? `${handle(c)} ${text}` : ""} lines={2} className="mt-0.5" />
        {settings.first_comment ? <p className="mt-1 text-neutral-500">View 1 comment</p> : null}
        <p className="mt-1 text-[11px] text-neutral-400 uppercase">Just now</p>
      </div>
    </div>
  );
}

function Facebook({ channel: c, text, media, settings }: PreviewProps) {
  if (settings.format === "reel") return <TikTokLike c={c} text={text} media={media} label="Facebook" />;
  return (
    <div className="bg-white text-[15px] text-[#050505]">
      <div className="flex items-center gap-2.5 px-4 pt-3">
        <Face c={c} size={40} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-semibold">{c.name}</p>
          <p className="flex items-center gap-1 text-[13px] text-[#65676b]">
            Just now · <Globe size={12} />
          </p>
        </div>
        <MoreHorizontal size={20} className="text-[#65676b]" />
      </div>
      <Clamp text={text} lines={5} more="See more" className="px-4 py-3" />
      <Grid media={media} />
      <div className="mx-4 flex justify-around border-t border-[#ced0d4] py-1.5 text-[14px] font-semibold text-[#65676b]">
        <span className="flex items-center gap-2 py-1">
          <ThumbsUp size={18} /> Like
        </span>
        <span className="flex items-center gap-2 py-1">
          <MessageCircle size={18} /> Comment
        </span>
        <span className="flex items-center gap-2 py-1">
          <Share size={18} /> Share
        </span>
      </div>
    </div>
  );
}

function LinkedIn({ channel: c, text, media }: PreviewProps) {
  return (
    <div className="bg-white text-[14px] text-black/90">
      <div className="flex gap-2 px-4 pt-3">
        <Face c={c} size={48} />
        <div className="min-w-0 flex-1 leading-snug">
          <p className="truncate font-semibold">{c.name}</p>
          <p className="truncate text-[12px] text-black/60">{c.network === "linkedin-page" ? "Company" : "Founder"}</p>
          <p className="flex items-center gap-1 text-[12px] text-black/60">
            Now · <Globe size={11} />
          </p>
        </div>
        <MoreHorizontal size={20} className="text-black/60" />
      </div>
      <Clamp text={text} lines={3} more="see more" className="px-4 py-2" />
      <Grid media={media} />
      <div className="flex items-center gap-1 px-4 py-2 text-[12px] text-black/60">
        <span className="flex size-4 items-center justify-center rounded-full bg-[#378fe9] text-white">
          <ThumbsUp size={9} fill="currentColor" />
        </span>
        Be the first to react
      </div>
      <div className="mx-4 flex justify-between border-t border-black/10 py-1 text-[13px] font-semibold text-black/60">
        {[
          [ThumbsUp, "Like"],
          [MessageCircle, "Comment"],
          [Repeat2, "Repost"],
          [Send, "Send"],
        ].map(([I, l]) => {
          const Icon = I as typeof ThumbsUp;
          return (
            <span key={l as string} className="flex items-center gap-1.5 px-2 py-2.5">
              <Icon size={17} /> {l as string}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function XPost({ channel: c, text, media }: PreviewProps) {
  return (
    <div className="flex gap-3 bg-white px-4 py-3 text-[15px] text-[#0f1419]">
      <Face c={c} size={40} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate">
          <span className="font-bold">{c.name}</span> <span className="text-[#536471]">@{handle(c)} · 1m</span>
        </p>
        <Clamp text={text} lines={12} className="mt-0.5 leading-snug" />
        {media.length ? <div className="mt-3 overflow-hidden rounded-2xl border border-[#cfd9de]">{<Grid media={media} />}</div> : null}
        <div className="mt-3 flex justify-between pr-6 text-[13px] text-[#536471]">
          <MessageCircle size={18} />
          <Repeat2 size={18} />
          <Heart size={18} />
          <span className="flex items-center gap-1">
            <BarIcon /> 0
          </span>
          <Bookmark size={18} />
        </div>
      </div>
    </div>
  );
}

const BarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 20V10M12 20V4M18 20v-7" />
  </svg>
);

function Threads({ channel: c, text, media }: PreviewProps) {
  return (
    <div className="flex gap-3 bg-white px-4 py-3 text-[15px] text-black">
      <Face c={c} size={36} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5">
          <span className="font-semibold">{handle(c)}</span> <span className="text-neutral-400">1m</span>
          <span className="flex-1" />
          <MoreHorizontal size={18} className="text-neutral-500" />
        </p>
        <Clamp text={text} lines={10} className="mt-0.5 leading-snug" />
        {media.length ? (
          <div className="mt-2 flex gap-2 overflow-hidden">
            {media.slice(0, 3).map((m) => (
              <Visual key={m.id} m={m} className={`rounded-xl ${media.length === 1 ? "aspect-[4/5] w-full" : "aspect-[3/4] w-1/2 shrink-0"}`} />
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex gap-5 text-neutral-700">
          <Heart size={19} />
          <MessageCircle size={19} />
          <Repeat2 size={19} />
          <Send size={18} />
        </div>
      </div>
    </div>
  );
}

function TikTokLike({ c, text, media, label }: { c: Channel; text: string; media: PreviewMedia[]; label: string }) {
  return (
    <div className="relative h-full min-h-[560px] w-full overflow-hidden bg-black text-white">
      {media[0] ? <Visual m={media[0]} className="absolute inset-0 size-full" /> : <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-[12px] text-white/50">{label} needs a video</div>}
      <div className="absolute top-3 inset-x-0 flex justify-center gap-4 text-[15px] font-semibold">
        <span className="opacity-60">Following</span>
        <span className="border-b-2 border-white pb-1">For You</span>
      </div>
      <div className="absolute right-2.5 bottom-20 flex flex-col items-center gap-4 text-[11px]">
        <span className="relative">
          <Face c={c} size={44} />
          <span className="absolute -bottom-2 left-1/2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full bg-[#fe2c55] text-[14px] leading-none">+</span>
        </span>
        <span className="mt-2 flex flex-col items-center gap-1">
          <Heart size={30} fill="currentColor" />0
        </span>
        <span className="flex flex-col items-center gap-1">
          <MessageCircle size={28} fill="currentColor" />0
        </span>
        <span className="flex flex-col items-center gap-1">
          <Bookmark size={28} fill="currentColor" />0
        </span>
        <span className="flex flex-col items-center gap-1">
          <Share size={26} />
          Share
        </span>
      </div>
      <div className="absolute inset-x-3 bottom-4 pr-16">
        <p className="text-[15px] font-semibold">@{handle(c)}</p>
        <Clamp text={text} lines={2} className="mt-1 text-[14px]" />
        <p className="mt-2 flex items-center gap-1.5 text-[13px]">
          <Music2 size={13} /> original sound - {handle(c)}
        </p>
      </div>
    </div>
  );
}

function YouTube({ channel: c, text, media, settings }: PreviewProps) {
  return (
    <div className="bg-white text-[#0f0f0f]">
      {media[0] ? (
        <div className="relative">
          <Visual m={media[0]} className="aspect-video w-full" />
          <span className="absolute right-2 bottom-2 rounded bg-black/80 px-1 text-[12px] font-medium text-white">0:30</span>
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-neutral-100 text-[12px] text-neutral-400">YouTube needs a video</div>
      )}
      <div className="flex gap-3 px-3 py-3">
        <Face c={c} size={36} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[15px] leading-snug font-semibold">{settings.title || <span className="opacity-40">Video title</span>}</p>
          <p className="mt-0.5 text-[12px] text-[#606060]">
            {c.name} · 0 views · Just now {settings.privacy && settings.privacy !== "public" ? `· ${settings.privacy}` : ""}
          </p>
          {text ? <Clamp text={text} lines={2} className="mt-1.5 text-[13px] text-[#606060]" /> : null}
        </div>
        <MoreHorizontal size={18} />
      </div>
    </div>
  );
}

function Generic({ channel: c, text, media }: PreviewProps) {
  return (
    <div className="flex gap-3 bg-white px-4 py-3 text-[15px] text-black">
      <Face c={c} size={40} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate">
          <span className="font-semibold">{c.name}</span>
          {c.username ? <span className="text-neutral-500">@{c.username}</span> : null}
          <span className="text-neutral-400">· now</span>
        </p>
        <Clamp text={text} lines={10} className="mt-0.5 leading-snug" />
        {media.length ? <div className="mt-2 overflow-hidden rounded-xl">{<Grid media={media} />}</div> : null}
        <div className="mt-3 flex gap-6 text-neutral-500">
          <MessageCircle size={18} />
          <Repeat2 size={18} />
          <Heart size={18} />
        </div>
      </div>
    </div>
  );
}

/** Full-screen, video-first formats fill the phone; feeds sit in a feed. */
const fullBleed = (p: PreviewProps) =>
  p.channel.network === "tiktok" || (p.channel.network === "instagram" && ["reel", "story"].includes(p.settings.format)) || (p.channel.network === "facebook" && p.settings.format === "reel");

export function NetworkPost(p: PreviewProps) {
  switch (p.channel.network) {
    case "instagram":
      return <Instagram {...p} />;
    case "facebook":
      return <Facebook {...p} />;
    case "linkedin":
    case "linkedin-page":
      return <LinkedIn {...p} />;
    case "x":
      return <XPost {...p} />;
    case "threads":
      return <Threads {...p} />;
    case "tiktok":
      return <TikTokLike c={p.channel} text={p.text} media={p.media} label="TikTok" />;
    case "youtube":
      return <YouTube {...p} />;
    default:
      return <Generic {...p} />;
  }
}

/* ---------- Devices ---------- */

const STATUS_ICONS = (
  <span className="flex items-center gap-1">
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
      <rect x="0" y="7" width="3" height="4" rx="1" />
      <rect x="4.5" y="5" width="3" height="6" rx="1" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
      <rect x="13.5" y="0" width="3" height="11" rx="1" />
    </svg>
    <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
      <path d="M7.5 2.2c2.1 0 4 .8 5.5 2.1l1.1-1.1A9.4 9.4 0 0 0 7.5.6 9.4 9.4 0 0 0 .9 3.2L2 4.3a7.9 7.9 0 0 1 5.5-2.1Zm0 3.1c1.2 0 2.3.4 3.2 1.2l1.1-1.1a6.3 6.3 0 0 0-8.6 0l1.1 1.1c.9-.8 2-1.2 3.2-1.2Zm0 3.1c-.4 0-.8.2-1.1.4l1.1 1.2 1.1-1.2c-.3-.2-.7-.4-1.1-.4Z" />
    </svg>
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
      <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" opacity=".4" />
      <rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor" />
      <path d="M23 4v4c.8-.3 1.3-1.1 1.3-2S23.8 4.3 23 4Z" fill="currentColor" opacity=".4" />
    </svg>
  </span>
);

function AppBar({ network }: { network: Channel["network"] }) {
  return (
    <div className="flex h-11 items-center justify-between border-b border-black/5 bg-white px-4 text-black">
      <span className="flex items-center gap-2 text-[16px] font-semibold">
        <NetworkLogo id={network} size={20} />
        {networkOf(network).name}
      </span>
      <span className="flex items-center gap-4">
        <Heart size={20} />
        <Send size={19} />
      </span>
    </div>
  );
}

/** An iPhone: rounded body, side buttons, Dynamic Island, status bar and home indicator. */
export function Phone(p: PreviewProps) {
  const bleed = fullBleed(p);
  return (
    <div className="relative mx-auto w-[320px]">
      <span className="absolute top-[108px] -left-[3px] h-8 w-[3px] rounded-l bg-neutral-700" />
      <span className="absolute top-[160px] -left-[3px] h-14 w-[3px] rounded-l bg-neutral-700" />
      <span className="absolute top-[224px] -left-[3px] h-14 w-[3px] rounded-l bg-neutral-700" />
      <span className="absolute top-[180px] -right-[3px] h-20 w-[3px] rounded-r bg-neutral-700" />
      <div className="rounded-[54px] bg-neutral-900 p-[11px] ring-1 ring-neutral-600">
        <div className={`relative h-[660px] overflow-hidden rounded-[44px] ${bleed ? "bg-black text-white" : "bg-white text-black"}`}>
          <div className={`absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-between px-7 pt-1 text-[15px] font-semibold ${bleed ? "text-white" : "text-black"}`}>
            <span className="tabular-nums">9:41</span>
            {STATUS_ICONS}
          </div>
          <div className="absolute top-[11px] left-1/2 z-30 h-[32px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
          <div className={`absolute inset-0 overflow-y-auto ${bleed ? "" : "pt-12"}`}>
            {bleed ? (
              <NetworkPost {...p} />
            ) : (
              <>
                <AppBar network={p.channel.network} />
                <NetworkPost {...p} />
                <div className="h-2 bg-neutral-100" />
                <div className="space-y-3 p-4 opacity-40">
                  <div className="h-3 w-2/3 rounded bg-neutral-200" />
                  <div className="h-3 w-1/2 rounded bg-neutral-200" />
                  <div className="h-40 rounded bg-neutral-100" />
                </div>
              </>
            )}
          </div>
          <div className={`absolute bottom-2 left-1/2 z-30 h-[5px] w-[120px] -translate-x-1/2 rounded-full ${bleed ? "bg-white" : "bg-black"}`} />
        </div>
      </div>
    </div>
  );
}

const DOMAINS: Partial<Record<Channel["network"], string>> = {
  instagram: "instagram.com",
  facebook: "facebook.com",
  linkedin: "linkedin.com/feed",
  "linkedin-page": "linkedin.com/feed",
  x: "x.com/home",
  threads: "threads.com",
  tiktok: "tiktok.com/foryou",
  youtube: "youtube.com",
  pinterest: "pinterest.com",
  reddit: "reddit.com",
  bluesky: "bsky.app",
  mastodon: "mastodon.social",
  telegram: "web.telegram.org",
  discord: "discord.com/channels",
  gbp: "google.com/maps",
};

/** A desktop browser window with the network's feed column. */
export function Desktop(p: PreviewProps) {
  const bleed = fullBleed(p);
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-300 bg-white">
      <div className="flex h-10 items-center gap-3 border-b border-neutral-200 bg-neutral-100 px-3">
        <span className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </span>
        <span className="flex h-6 flex-1 items-center gap-1.5 rounded-md bg-white px-2 text-[11px] text-neutral-500">
          <NetworkLogo id={p.channel.network} size={11} />
          {DOMAINS[p.channel.network] ?? "example.com"}
        </span>
        <ChevronDown size={14} className="text-neutral-400" />
      </div>
      <div className="flex justify-center bg-[#f3f2ef] px-6 py-6">
        <div className={`w-full overflow-hidden rounded-lg border border-neutral-200 bg-white ${bleed ? "max-w-[340px]" : "max-w-[520px]"}`}>
          <NetworkPost {...p} />
        </div>
      </div>
    </div>
  );
}
