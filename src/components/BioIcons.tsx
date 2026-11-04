import {
  siBluesky,
  siFacebook,
  siGithub,
  siInstagram,
  siMastodon,
  siPinterest,
  siReddit,
  siSnapchat,
  siSpotify,
  siTelegram,
  siThreads,
  siTiktok,
  siTwitch,
  siWhatsapp,
  siX,
  siYoutube,
} from "simple-icons";
import type { SocialId } from "@/lib/bioBlocks";

// Social icons for link-in-bio pages: one color (the page's ink), drawn from each network's own mark.

const LINKEDIN =
  "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z";

const PATHS: Record<SocialId, string> = {
  instagram: siInstagram.path,
  tiktok: siTiktok.path,
  youtube: siYoutube.path,
  x: siX.path,
  facebook: siFacebook.path,
  linkedin: LINKEDIN,
  threads: siThreads.path,
  pinterest: siPinterest.path,
  bluesky: siBluesky.path,
  mastodon: siMastodon.path,
  telegram: siTelegram.path,
  reddit: siReddit.path,
  whatsapp: siWhatsapp.path,
  spotify: siSpotify.path,
  twitch: siTwitch.path,
  snapchat: siSnapchat.path,
  github: siGithub.path,
};

/** A network's mark in the current text color. Decorative: the link around it carries the name. */
export function SocialIcon({ id, size = 20 }: { id: SocialId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0" fill="currentColor">
      <path d={PATHS[id]} />
    </svg>
  );
}
