// AI pictures and videos made through fal.ai (one key, many models). Pure: the models we offer, the input each one
// takes, how to read fal's answers, and the plan limits. No fetch and no Supabase, so tests run it as it is.
// Inputs follow each model's schema on fal (fal.ai/models/<endpoint>/api). Prices from the same pages, 2026-11-05.

export type GenKind = "image" | "video";
export type Aspect = "1:1" | "9:16" | "16:9";
export const ASPECTS: Aspect[] = ["1:1", "9:16", "16:9"];
export const SECONDS = [5, 10] as const;
export type Seconds = (typeof SECONDS)[number];
export const MAX_PROMPT = 2000;

type Built = { endpoint: string; input: Record<string, unknown> };
type Ask = { prompt: string; aspect: Aspect; seconds: Seconds; imageUrl: string | null };

export type GenModel = { id: string; kind: GenKind; name: string; build: (a: Ask) => Built };

const FLUX_SIZE: Record<Aspect, string> = { "1:1": "square_hd", "9:16": "portrait_16_9", "16:9": "landscape_16_9" };

/** The first model of each kind is the default. */
export const MODELS: GenModel[] = [
  {
    // $0.03 for the first megapixel (check fal.ai/models/fal-ai/flux-2-pro)
    id: "flux-2-pro",
    kind: "image",
    name: "FLUX.2 Pro",
    build: (a) => ({ endpoint: "fal-ai/flux-2-pro", input: { prompt: a.prompt, image_size: FLUX_SIZE[a.aspect], output_format: "jpeg", enable_safety_checker: true } }),
  },
  {
    // $0.08 an image at 1K (check fal.ai/models/fal-ai/nano-banana-2)
    id: "nano-banana-2",
    kind: "image",
    name: "Nano Banana 2",
    build: (a) => ({ endpoint: "fal-ai/nano-banana-2", input: { prompt: a.prompt, aspect_ratio: a.aspect, resolution: "1K", num_images: 1, output_format: "jpeg" } }),
  },
  {
    // $0.168 a second with sound (check fal.ai/models/fal-ai/kling-video/v3/pro/text-to-video)
    id: "kling-3-pro",
    kind: "video",
    name: "Kling 3 Pro",
    build: (a) =>
      a.imageUrl
        ? { endpoint: "fal-ai/kling-video/v3/pro/image-to-video", input: { prompt: a.prompt, start_image_url: a.imageUrl, duration: String(a.seconds), generate_audio: true } }
        : { endpoint: "fal-ai/kling-video/v3/pro/text-to-video", input: { prompt: a.prompt, aspect_ratio: a.aspect, duration: String(a.seconds), generate_audio: true } },
  },
  {
    // $0.2419 a second at 720p (check fal.ai/models/bytedance/seedance-2.0/fast/text-to-video)
    id: "seedance-2-fast",
    kind: "video",
    name: "Seedance 2.0 Fast",
    build: (a) =>
      a.imageUrl
        ? { endpoint: "bytedance/seedance-2.0/fast/image-to-video", input: { prompt: a.prompt, image_url: a.imageUrl, duration: String(a.seconds), resolution: "720p", generate_audio: true } }
        : { endpoint: "bytedance/seedance-2.0/fast/text-to-video", input: { prompt: a.prompt, aspect_ratio: a.aspect, duration: String(a.seconds), resolution: "720p", generate_audio: true } },
  },
];

export const modelOf = (id: string) => MODELS.find((m) => m.id === id) ?? null;
export const defaultModel = (kind: GenKind) => MODELS.find((m) => m.kind === kind)!;
export const modelsFor = (kind: GenKind) => MODELS.filter((m) => m.kind === kind);

/** A checked request. sourceMediaId: a picture from the library a video starts from. */
export type GenRequest = { kind: GenKind; model: string; prompt: string; aspect: Aspect; seconds: Seconds; sourceMediaId: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Checks what people or the API send. Throws a message they can act on. */
export function genRequest(body: unknown): GenRequest {
  const b = (typeof body === "object" && body !== null && !Array.isArray(body) ? body : {}) as Record<string, unknown>;
  const kind = b.kind;
  if (kind !== "image" && kind !== "video") throw new Error('kind must be "image" or "video"');
  const prompt = typeof b.prompt === "string" ? b.prompt.trim() : "";
  if (!prompt) throw new Error("Describe what to make");
  if (prompt.length > MAX_PROMPT) throw new Error(`Keep the description under ${MAX_PROMPT.toLocaleString("en-US")} characters`);
  const modelId = b.model == null || b.model === "" ? defaultModel(kind).id : b.model;
  const model = typeof modelId === "string" ? modelOf(modelId) : null;
  if (!model || model.kind !== kind) throw new Error(`model must be one of ${modelsFor(kind).map((m) => m.id).join(", ")}`);
  const aspect = b.aspect == null || b.aspect === "" ? "1:1" : b.aspect;
  if (!ASPECTS.includes(aspect as Aspect)) throw new Error(`aspect must be one of ${ASPECTS.join(", ")}`);
  const seconds = b.seconds == null || b.seconds === "" ? 5 : Number(b.seconds);
  if (kind === "video" && !SECONDS.includes(seconds as Seconds)) throw new Error(`seconds must be ${SECONDS.join(" or ")}`);
  const source = b.source_media_id ?? b.sourceMediaId ?? null;
  if (source != null && source !== "" && (typeof source !== "string" || !UUID.test(source))) throw new Error("source_media_id must be a picture's id from list_media");
  if (kind === "image" && source) throw new Error("source_media_id is for videos");
  return { kind, model: model.id, prompt, aspect: aspect as Aspect, seconds: (kind === "video" ? seconds : 5) as Seconds, sourceMediaId: (source as string | null) || null };
}

/** The fal endpoint and its input for a request. imageUrl: a link fal can fetch for the start picture. */
export function falCall(r: GenRequest, imageUrl: string | null): Built {
  const m = modelOf(r.model);
  if (!m) throw new Error(`Unknown model ${r.model}`);
  return m.build({ prompt: r.prompt, aspect: r.aspect, seconds: r.seconds, imageUrl: r.kind === "video" ? imageUrl : null });
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

/** The file in a finished result: images[0] for pictures, video for videos. */
export function resultFile(kind: GenKind, body: unknown): { url: string; mime: string | null } {
  const b = (body ?? {}) as { images?: { url?: unknown; content_type?: unknown }[]; image?: { url?: unknown; content_type?: unknown }; video?: { url?: unknown; content_type?: unknown } };
  const f = kind === "image" ? (b.images?.[0] ?? b.image) : b.video;
  if (!f || typeof f.url !== "string" || !/^https:\/\//.test(f.url)) throw new Error(kind === "image" ? "fal sent no picture" : "fal sent no video");
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

export type GenUse = { images: number; videoSeconds: number; open: number };
export type GenLimits = { aiImages: number; aiVideoSeconds: number };

/** Throws when this request would pass the plan's monthly limit or the number being made at once. */
export function checkLimits(r: Pick<GenRequest, "kind" | "seconds">, use: GenUse, limits: GenLimits) {
  if (r.kind === "image") {
    if (limits.aiImages <= 0) throw new Error("Your plan doesn't include AI pictures. Upgrade to make them.");
    if (use.images >= limits.aiImages) throw new Error(`Your plan makes ${limits.aiImages} AI pictures a month. They start again on the 1st.`);
  } else {
    if (limits.aiVideoSeconds <= 0) throw new Error("Your plan doesn't include AI videos. Upgrade to make them.");
    const left = Math.max(0, limits.aiVideoSeconds - use.videoSeconds);
    if (r.seconds > left) throw new Error(left ? `${left} seconds of AI video are left this month` : `Your plan makes ${limits.aiVideoSeconds} seconds of AI video a month. They start again on the 1st.`);
  }
  if (use.open >= AT_ONCE) throw new Error(`${AT_ONCE} are being made already. Wait for one to finish.`);
}

/** The library name of a made file: the first words of its description. */
export function fileName(prompt: string, mime: string) {
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime.startsWith("video/") ? "mp4" : "jpg";
  const words = prompt.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter(Boolean).slice(0, 6).join("-");
  return `${(words || "ai").slice(0, 60)}.${ext}`;
}
