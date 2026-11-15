// The two CapyInfographic models, kept apart from the prompts so the browser can show them without loading those.
// Fast writes with Sonnet, Best with Opus. cents is what one picture costs us in Claude tokens (a design, a render
// check and sometimes one fix); credits are MARKUP times that, rounded up (genRules.ts).
export const INFO_MODELS = {
  "capy-infographic": { name: "CapyInfographic Fast", claude: "claude-sonnet-5-5", cents: 7 }, // Sonnet $3 in, $15 out per million tokens (check)
  "capy-infographic-best": { name: "CapyInfographic Best", claude: "claude-opus-5-5", cents: 12 }, // Opus $5 in, $25 out per million tokens
} as const;
export type InfoModel = keyof typeof INFO_MODELS;
/** CapyMotion: Sonnet plans the scenes, our server renders them with Remotion. cents: Claude plus rendering on our servers. */
export const MOTION_MODEL = { id: "capy-motion", name: "CapyMotion", claude: "claude-sonnet-5-5", cents: 10 } as const; // Sonnet $3 in, $15 out per million tokens (check)
export const isInfoModel = (id: string): id is InfoModel => id in INFO_MODELS;
