import { siBluesky, siDiscord, siFacebook, siInstagram, siMastodon, siPinterest, siReddit, siTelegram, siThreads, siTiktok, siX, siYoutube } from "simple-icons";
import { networkOf, type NetworkId } from "@/lib/networks";

type Icon = { path: string; hex: string };

const ICONS: Partial<Record<NetworkId, Icon>> = {
  facebook: siFacebook,
  instagram: siInstagram,
  threads: siThreads,
  tiktok: siTiktok,
  youtube: siYoutube,
  x: siX,
  pinterest: siPinterest,
  reddit: siReddit,
  bluesky: siBluesky,
  mastodon: siMastodon,
  telegram: siTelegram,
  discord: siDiscord,
};

/** A network's logo in its own color, with its name as the label. */
export function NetworkLogo({ id, size = 16 }: { id: NetworkId; size?: number }) {
  const name = networkOf(id).name;
  if (id === "linkedin" || id === "linkedin-page") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={name} className="shrink-0">
        <rect width="24" height="24" fill="#0A66C2" />
        <rect x="4.5" y="9.5" width="3.2" height="10" fill="#fff" />
        <rect x="4.5" y="4.5" width="3.2" height="3.2" fill="#fff" />
        <path d="M10.5 9.5h3v1.4c.5-.9 1.6-1.6 3.1-1.6 2.6 0 3.4 1.6 3.4 4.2v6h-3.2v-5.3c0-1.3-.3-2.2-1.5-2.2s-1.7.9-1.7 2.2v5.3h-3.1z" fill="#fff" />
        {id === "linkedin-page" ? <rect x="15" y="15" width="9" height="9" fill="#0A0A0A" stroke="#fff" strokeWidth="1.5" /> : null}
      </svg>
    );
  }
  const icon = ICONS[id]!;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={name} className="shrink-0">
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  );
}
