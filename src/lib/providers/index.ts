import type { NetworkId } from "../networks";
import { bluesky } from "./bluesky";
import { discord } from "./discord";
import { gbp } from "./gbp";
import { linkedin, linkedinPage } from "./linkedin";
import { mastodon } from "./mastodon";
import { facebook, instagram, threads } from "./meta";
import { pinterest } from "./pinterest";
import { reddit } from "./reddit";
import { telegram } from "./telegram";
import { tiktok } from "./tiktok";
import { x } from "./x";
import { youtube } from "./youtube";
import type { Provider } from "./types";

export const PROVIDERS: Record<NetworkId, Provider> = {
  linkedin,
  "linkedin-page": linkedinPage,
  facebook,
  instagram,
  threads,
  tiktok,
  youtube,
  x,
  pinterest,
  reddit,
  bluesky,
  mastodon,
  telegram,
  discord,
  gbp,
};

export const providerOf = (n: string): Provider | null => PROVIDERS[n as NetworkId] ?? null;

/** Ready to connect: its keys are set (sign-in) or it needs none (form). */
export const isReady = (p: Provider) => (p.oauth ? p.oauth.configured() : p.form ? p.form.configured() : false);
