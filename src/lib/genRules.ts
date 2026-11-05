// AI pictures, videos and audio made through fal.ai (one key, many models). People pick what to make (CapyImage,
// CapyVideo, CapyAudio) and Capy picks the model from what they asked for (capyPick), or they pick one themselves.
// Pure: the models, the input each one takes, how Capy picks, what each costs us (cents) and costs people (credits,
// MARKUP times the cost, creditRules.ts), how to read fal's answers and the limits. No fetch and no Supabase, so tests
// run it as it is.
// Inputs follow each model's schema on fal (fal.ai/models/<endpoint>/api); prices are from the same pages and fal's
// pricing API, 2026-11-05.

import { MAX_ACTION } from "./creditRules";

export type GenKind = "image" | "video" | "audio";
export const KINDS: GenKind[] = ["image", "video", "audio"];
export const CAPY: Record<GenKind, { name: string; line: string }> = {
  image: { name: "CapyImage", line: "Pictures and edits" },
  video: { name: "CapyVideo", line: "Short videos with sound" },
  audio: { name: "CapyAudio", line: "Voiceovers, music and sound effects" },
};
export type Aspect = "1:1" | "9:16" | "16:9";
export const ASPECTS: Aspect[] = ["1:1", "9:16", "16:9"];
export const SECONDS = [5, 10] as const;
export type Seconds = (typeof SECONDS)[number];
export const MAX_PROMPT = 2000;
/** Voiceover scripts can be longer than a description. */
export const MAX_SCRIPT = 5000;

type Built = { endpoint: string; input: Record<string, unknown> };
type Ask = { prompt: string; aspect: Aspect; seconds: Seconds; imageUrl: string | null };
type Cost = { prompt: string; seconds: Seconds };

export type GenModel = {
  id: string;
  kind: GenKind;
  name: string;
  /** "needs": only with a start picture (edits); "takes": with or without one; absent: never. */
  picture?: "needs" | "takes";
  build: (a: Ask) => Built;
  /** What it costs us, in cents (fal's price). */
  cost: (c: Cost) => number;
  /** What it costs people, in credits: at least MARKUP times the cost (tests/credits.test.ts checks every model). */
  credits: (c: Cost) => number;
};

const SIZE: Record<Aspect, string> = { "1:1": "square_hd", "9:16": "portrait_16_9", "16:9": "landscape_16_9" };
const veoLength = (s: Seconds) => (s === 5 ? 6 : 8);
/** MiniMax Music sings words written after "Lyrics:"; the part before is the style. */
export const splitLyrics = (prompt: string) => {
  const i = prompt.search(/lyrics\s*:/i);
  return i < 0 ? null : { style: prompt.slice(0, i).trim(), lyrics: prompt.slice(i).replace(/^lyrics\s*:/i, "").trim() };
};

/** The first model of each kind is its fallback. */
export const MODELS: GenModel[] = [
  // Pictures
  { id: "flux-2-pro", kind: "image", name: "FLUX.2 Pro", cost: () => 3, credits: () => 8, // $0.03 per megapixel
    build: (a) => ({ endpoint: "fal-ai/flux-2-pro", input: { prompt: a.prompt, image_size: SIZE[a.aspect], output_format: "jpeg", enable_safety_checker: true } }) },
  { id: "ideogram-v3", kind: "image", name: "Ideogram V3", cost: () => 3, credits: () => 8, // $0.03 with TURBO
    build: (a) => ({ endpoint: "fal-ai/ideogram/v3", input: { prompt: a.prompt, image_size: SIZE[a.aspect], rendering_speed: "TURBO", num_images: 1 } }) },
  { id: "nano-banana-2", kind: "image", name: "Nano Banana 2", cost: () => 8, credits: () => 20, // $0.08 at 1K
    build: (a) => ({ endpoint: "fal-ai/nano-banana-2", input: { prompt: a.prompt, aspect_ratio: a.aspect, resolution: "1K", num_images: 1, output_format: "jpeg" } }) },
  { id: "nano-banana-pro", kind: "image", name: "Nano Banana Pro", cost: () => 15, credits: () => 40, // $0.15 at 1K
    build: (a) => ({ endpoint: "fal-ai/nano-banana-pro", input: { prompt: a.prompt, aspect_ratio: a.aspect, resolution: "1K", num_images: 1, output_format: "jpeg" } }) },
  { id: "nano-banana-2-edit", kind: "image", name: "Nano Banana 2 Edit", picture: "needs", cost: () => 8, credits: () => 20, // $0.08 at 1K
    build: (a) => ({ endpoint: "fal-ai/nano-banana-2/edit", input: { prompt: a.prompt, image_urls: [a.imageUrl], aspect_ratio: a.aspect, resolution: "1K", num_images: 1, output_format: "jpeg" } }) },
  // Videos
  { id: "kling-3-pro", kind: "video", name: "Kling 3 Pro", picture: "takes", cost: (c) => 16.8 * c.seconds, credits: (c) => 42 * c.seconds, // $0.168 a second with sound
    build: (a) =>
      a.imageUrl
        ? { endpoint: "fal-ai/kling-video/v3/pro/image-to-video", input: { prompt: a.prompt, start_image_url: a.imageUrl, duration: String(a.seconds), generate_audio: true } }
        : { endpoint: "fal-ai/kling-video/v3/pro/text-to-video", input: { prompt: a.prompt, aspect_ratio: a.aspect, duration: String(a.seconds), generate_audio: true } } },
  { id: "seedance-2-fast", kind: "video", name: "Seedance 2.0 Fast", picture: "takes", cost: (c) => ((1280 * 720 * c.seconds * 24) / 1024) * 0.00112, credits: (c) => 61 * c.seconds, // $0.0112 per 1,000 tokens at 720p
    build: (a) =>
      a.imageUrl
        ? { endpoint: "bytedance/seedance-2.0/fast/image-to-video", input: { prompt: a.prompt, image_url: a.imageUrl, duration: String(a.seconds), resolution: "720p", generate_audio: true } }
        : { endpoint: "bytedance/seedance-2.0/fast/text-to-video", input: { prompt: a.prompt, aspect_ratio: a.aspect, duration: String(a.seconds), resolution: "720p", generate_audio: true } } },
  { id: "veo-3.1", kind: "video", name: "Veo 3.1", picture: "takes", cost: (c) => 40 * veoLength(c.seconds), credits: (c) => 100 * veoLength(c.seconds), // $0.40 a second with sound; 6 or 8 seconds
    build: (a) =>
      a.imageUrl
        ? { endpoint: "fal-ai/veo3.1/image-to-video", input: { prompt: a.prompt, image_url: a.imageUrl, duration: `${veoLength(a.seconds)}s`, resolution: "720p", generate_audio: true } }
        : { endpoint: "fal-ai/veo3.1", input: { prompt: a.prompt, aspect_ratio: a.aspect === "9:16" ? "9:16" : "16:9", duration: `${veoLength(a.seconds)}s`, resolution: "720p", generate_audio: true } } },
  // Audio
  { id: "elevenlabs-turbo", kind: "audio", name: "ElevenLabs Turbo v2.5", cost: (c) => (c.prompt.length / 1000) * 5, credits: (c) => Math.max(2, Math.ceil((c.prompt.length * 13) / 1000)), // $0.05 per 1,000 characters
    build: (a) => ({ endpoint: "fal-ai/elevenlabs/tts/turbo-v2.5", input: { text: a.prompt } }) },
  { id: "elevenlabs-v3", kind: "audio", name: "ElevenLabs v3", cost: (c) => (c.prompt.length / 1000) * 10, credits: (c) => Math.max(2, Math.ceil((c.prompt.length * 25) / 1000)), // $0.10 per 1,000 characters
    build: (a) => ({ endpoint: "fal-ai/elevenlabs/tts/eleven-v3", input: { text: a.prompt } }) },
  { id: "lyria-2", kind: "audio", name: "Lyria 2", cost: () => 10, credits: () => 25, // $0.10 per 30 seconds
    build: (a) => ({ endpoint: "fal-ai/lyria2", input: { prompt: a.prompt } }) },
  { id: "stable-audio-2.5", kind: "audio", name: "Stable Audio 2.5", cost: () => 20, credits: () => 50, // $0.20 an audio
    build: (a) => ({ endpoint: "fal-ai/stable-audio-25/text-to-audio", input: { prompt: a.prompt, seconds_total: 30 } }) },
  { id: "minimax-music-v2", kind: "audio", name: "MiniMax Music v2", cost: () => 3, credits: () => 8, // $0.03 a song
    build: (a) => {
      const parts = splitLyrics(a.prompt);
      if (!parts || parts.style.length < 10 || parts.lyrics.length < 10) throw new Error('For a song, describe the style, then write the words after "Lyrics:" (10 characters or more each)');
      return { endpoint: "fal-ai/minimax-music/v2", input: { prompt: parts.style.slice(0, 2000), lyrics_prompt: parts.lyrics.slice(0, 3000) } };
    } },
  { id: "elevenlabs-sfx", kind: "audio", name: "ElevenLabs Sound Effects", cost: (c) => 0.2 * c.seconds, credits: (c) => Math.max(1, Math.ceil(c.seconds / 2)), // $0.002 a second
    build: (a) => ({ endpoint: "fal-ai/elevenlabs/sound-effects/v2", input: { text: a.prompt, duration_seconds: a.seconds } }) },
];

export const modelOf = (id: string) => MODELS.find((m) => m.id === id) ?? null;
export const defaultModel = (kind: GenKind) => MODELS.find((m) => m.kind === kind)!;
export const modelsFor = (kind: GenKind) => MODELS.filter((m) => m.kind === kind);
const model = (id: string) => modelOf(id)!;

// How Capy picks: the first rule that matches wins.
const has = (p: string, words: string[]) => words.some((w) => new RegExp(`\\b${w}\\b`, "i").test(p));

export type CapyRule = { kind: GenKind; when: string; test: (prompt: string, picture: boolean) => boolean; model: string; why: string };

export const RULES: CapyRule[] = [
  { kind: "image", when: "A picture is added", test: (_, pic) => pic, model: "nano-banana-2-edit", why: "you added a picture, so Capy edits it" },
  { kind: "image", when: "Words to print (quotes, headline, sign, logo)", test: (p) => /["\u201c\u201d]/.test(p) || has(p, ["headline", "sign", "signs", "logo", "text", "poster", "caption", "words", "says", "flyer", "banner"]), model: "ideogram-v3", why: "it has words to print, and Ideogram spells them right" },
  { kind: "image", when: "Premium, hero, 4K, detailed", test: (p) => has(p, ["premium", "hero", "4k", "detailed", "magazine", "cover", "luxury"]), model: "nano-banana-pro", why: "you asked for top quality" },
  { kind: "image", when: "Anything else", test: () => true, model: "flux-2-pro", why: "it's fast and sharp for everyday posts" },
  { kind: "video", when: "Someone talks (says, speaks, talking)", test: (p) => has(p, ["say", "says", "said", "speak", "speaks", "talk", "talks", "talking", "dialogue", "interview", "voice"]), model: "seedance-2-fast", why: "people talk in it, and Seedance matches lips to speech" },
  { kind: "video", when: "Ad, cinematic, premium", test: (p) => has(p, ["ad", "commercial", "cinematic", "premium", "trailer", "film"]), model: "veo-3.1", why: "you asked for a cinematic look" },
  { kind: "video", when: "Anything else, with or without a picture", test: () => true, model: "kling-3-pro", why: "it has good motion with sound at a fair price" },
  { kind: "audio", when: 'A song with words ("Lyrics:")', test: (p) => !!splitLyrics(p), model: "minimax-music-v2", why: "you wrote lyrics, so Capy makes a song" },
  { kind: "audio", when: "Music, beat, jingle", test: (p) => has(p, ["music", "song", "beat", "beats", "jingle", "track", "tune", "soundtrack", "instrumental"]), model: "lyria-2", why: "you asked for music" },
  { kind: "audio", when: "Sound effect, whoosh, sfx", test: (p) => has(p, ["sound effect", "sfx", "whoosh", "swoosh", "ding", "click", "effect", "effects"]), model: "elevenlabs-sfx", why: "you asked for a sound effect" },
  { kind: "audio", when: "Anything else (a voiceover of your words)", test: () => true, model: "elevenlabs-turbo", why: "it reads your words in a natural voice" },
];

/** The model Capy picks for this request, and why. */
export function capyPick(kind: GenKind, prompt: string, picture: boolean): { model: GenModel; why: string; rule: number } {
  const rules = RULES.filter((r) => r.kind === kind);
  const i = rules.findIndex((r) => r.test(prompt, picture));
  return { model: model(rules[i].model), why: rules[i].why, rule: i };
}

/** A checked request. sourceMediaId: a library picture to edit (pictures) or to start from (videos). */
export type GenRequest = { kind: GenKind; model: string; prompt: string; aspect: Aspect; seconds: Seconds; sourceMediaId: string | null; credits: number; why: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Checks what people or the API send, and lets Capy pick the model unless one is named. Throws a message they can act on. */
export function genRequest(body: unknown): GenRequest {
  const b = (typeof body === "object" && body !== null && !Array.isArray(body) ? body : {}) as Record<string, unknown>;
  const kind = b.kind;
  if (kind !== "image" && kind !== "video" && kind !== "audio") throw new Error('kind must be "image", "video" or "audio"');
  const prompt = typeof b.prompt === "string" ? b.prompt.trim() : "";
  if (!prompt) throw new Error(kind === "audio" ? "Write the words or describe the sound" : "Describe what to make");
  const max = kind === "audio" ? MAX_SCRIPT : MAX_PROMPT;
  if (prompt.length > max) throw new Error(`Keep it under ${max.toLocaleString("en-US")} characters`);
  const source = b.source_media_id ?? b.sourceMediaId ?? null;
  if (source != null && source !== "" && (typeof source !== "string" || !UUID.test(source))) throw new Error("source_media_id must be a picture's id from list_media");
  if (kind === "audio" && source) throw new Error("source_media_id is for pictures and videos");
  const picture = !!source;
  const aspect = b.aspect == null || b.aspect === "" ? "1:1" : b.aspect;
  if (!ASPECTS.includes(aspect as Aspect)) throw new Error(`aspect must be one of ${ASPECTS.join(", ")}`);
  const seconds = b.seconds == null || b.seconds === "" ? 5 : Number(b.seconds);
  if (kind !== "image" && !SECONDS.includes(seconds as Seconds)) throw new Error(`seconds must be ${SECONDS.join(" or ")}`);
  const named = b.model == null || b.model === "" || b.model === "auto" ? null : b.model;
  let chosen: GenModel;
  let why: string;
  if (named) {
    const m = typeof named === "string" ? modelOf(named) : null;
    if (!m || m.kind !== kind) throw new Error(`model must be one of ${modelsFor(kind).map((x) => x.id).join(", ")}, or left out for Capy to pick`);
    if (m.picture === "needs" && !picture) throw new Error(`${m.name} edits a picture: send source_media_id`);
    if (!m.picture && picture) throw new Error(`${m.name} doesn't take a picture`);
    chosen = m;
    why = "it was picked";
  } else ({ model: chosen, why } = capyPick(kind, prompt, picture));
  const secs = (kind === "image" ? 5 : seconds) as Seconds;
  return { kind, model: chosen.id, prompt, aspect: aspect as Aspect, seconds: secs, sourceMediaId: (source as string | null) || null, credits: chosen.credits({ prompt, seconds: secs }), why };
}

/** The fal endpoint and its input for a request. imageUrl: a link fal can fetch for the picture. */
export function falCall(r: GenRequest, imageUrl: string | null): Built {
  const m = modelOf(r.model);
  if (!m) throw new Error(`Unknown model ${r.model}`);
  return m.build({ prompt: r.prompt, aspect: r.aspect, seconds: r.seconds, imageUrl: m.picture ? imageUrl : null });
}

// fal's answers

/** A hiccup worth trying again: timeouts, busy, rate limits and server errors. */
export const transient = (status: number) => status === 0 || status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;

/** The message in a fal error body, short enough for one line. */
export function falError(status: number, body: unknown): string {
  const b = body as { detail?: unknown; error?: unknown; message?: unknown } | null;
  let m: unknown = b?.detail ?? b?.error ?? b?.message;
  if (Array.isArray(m)) m = m.map((x) => (typeof x === "object" && x && "msg" in x ? (x as { msg: unknown }).msg : x)).join("; ");
  if (typeof m === "object" && m && "message" in m) m = (m as { message: unknown }).message;
  const text = typeof m === "string" && m.trim() ? m.trim() : `fal answered ${status}`;
  return text.slice(0, 300);
}

/** What a status check means: wait and look again, fetch the result, or stop with this error. */
export type Step = { kind: "wait" } | { kind: "fetch" } | { kind: "fail"; error: string };

export function statusStep(httpStatus: number, body: unknown): Step {
  if (transient(httpStatus)) return { kind: "wait" };
  if (httpStatus === 404) return { kind: "fail", error: "fal lost this request. Try again." };
  if (httpStatus < 200 || httpStatus >= 300) return { kind: "fail", error: falError(httpStatus, body) };
  const b = (body ?? {}) as { status?: unknown; error?: unknown };
  if (b.status === "COMPLETED") return b.error ? { kind: "fail", error: falError(httpStatus, b) } : { kind: "fetch" };
  if (b.status === "IN_QUEUE" || b.status === "IN_PROGRESS") return { kind: "wait" };
  return { kind: "wait" };
}

/** The file in a finished result: images[0] for pictures, video for videos, audio for audio. */
export function resultFile(kind: GenKind, body: unknown): { url: string; mime: string | null } {
  type F = { url?: unknown; content_type?: unknown };
  const b = (body ?? {}) as { images?: F[]; image?: F; video?: F; audio?: F; audio_file?: F };
  const f = kind === "image" ? (b.images?.[0] ?? b.image) : kind === "video" ? b.video : (b.audio ?? b.audio_file);
  if (!f || typeof f.url !== "string" || !/^https:\/\//.test(f.url)) throw new Error(kind === "image" ? "fal sent no picture" : kind === "video" ? "fal sent no video" : "fal sent no audio");
  return { url: f.url, mime: typeof f.content_type === "string" ? f.content_type : null };
}

// Timing

/** A request still running after this long is cancelled and fails. */
export const GIVE_UP_MS = 30 * 60000;
/** A request fal finished keeps trying to save its file until this long after it started. */
export const FINISH_MS = 60 * 60000;
/** A lock older than this is a crashed worker's. */
export const LOCK_MS = 5 * 60000;

/** When to look again: every 4 seconds for the first 2 minutes, then every 15. */
export const nextLook = (startedAt: number, now: number) => now + (now - startedAt < 120000 ? 4000 : 15000);

/** A failed submit or save tries again with growing waits: 5s, 15s, 45s, then every 2 minutes. */
export const retryWait = (tries: number) => [5000, 15000, 45000][tries - 1] ?? 120000;

// Plan limits

/** At most this many being made at once per workspace. */
export const AT_ONCE = 4;
export type GenUse = { open: number };

/** Throws when this request would cost more than one action may, or too many are being made at once. Credits are
 *  checked by the ledger when the request holds them (credits.ts). */
export function checkLimits(r: Pick<GenRequest, "credits">, use: GenUse) {
  if (r.credits > MAX_ACTION) throw new Error(`This would cost ${r.credits} credits. One file can cost up to ${MAX_ACTION}.`);
  if (use.open >= AT_ONCE) throw new Error(`${AT_ONCE} are being made already. Wait for one to finish.`);
}

/** The library name of a made file: the first words of its description. */
export function fileName(prompt: string, mime: string) {
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime === "audio/mpeg" ? "mp3" : mime === "audio/wav" ? "wav" : mime === "audio/ogg" ? "ogg" : mime.startsWith("video/") ? "mp4" : "jpg";
  const words = prompt.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter(Boolean).slice(0, 6).join("-");
  return `${(words || "ai").slice(0, 60)}.${ext}`;
}
