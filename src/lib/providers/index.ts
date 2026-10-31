import type { NetworkId } from "../networks";
import { bluesky } from "./bluesky";
import { linkedin, linkedinPage } from "./linkedin";
import { facebook, instagram, threads } from "./meta";
import { tiktok } from "./tiktok";
import type { Provider } from "./types";

export const PROVIDERS: Partial<Record<NetworkId, Provider>> = {
  linkedin,
  "linkedin-page": linkedinPage,
  facebook,
  instagram,
  threads,
  tiktok,
  bluesky,
};

export const providerOf = (n: string) => PROVIDERS[n as NetworkId] ?? null;
