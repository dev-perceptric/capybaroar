import "server-only";
import { hostname } from "node:os";
import { adminClient } from "./supabase/server";
import { limitsOf, monthStart } from "./billing";
import { linkToMedia } from "./api/upload";
import { ApiError } from "./api/input";
import { checkLimits, falCall, fileName, type GenKind, type GenRequest, type GenUse } from "./genRules";
import { BadFile, advance, runGenerations as run, type FalApi, type FalAnswer, type GenRow, type GenStore } from "./generator";

// AI pictures and videos through fal.ai's queue (fal.ai/docs/documentation/model-apis/inference/queue). A request is
// saved, sent to fal, and then looked at every few seconds by the runner's own loop until its file is in the library.
// The rules are in generator.ts and genRules.ts.

const WORKER = `${hostname()}:${process.pid}`;
const FAL_QUEUE = "https://queue.fal.run";

export const aiReady = () => !!process.env.FAL_KEY;

export type GenStatus = "queued" | "running" | "done" | "failed";
export type Generation = { id: string; kind: GenKind; model: string; prompt: string; status: GenStatus; error: string | null; media_id: string | null; created_at: string };

const COLUMNS = "id, kind, model, prompt, status, error, media_id, created_at";

// fal

async function falFetch(url: string, init: { method: string; body?: unknown }, timeoutMs: number): Promise<FalAnswer> {
  const res = await fetch(url, {
    method: init.method,
    headers: { authorization: `Key ${process.env.FAL_KEY}`, ...(init.body === undefined ? {} : { "content-type": "application/json" }) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { detail: text.slice(0, 300) };
  }
  return { status: res.status, body };
}

// Only fal's own addresses get the key.
const falUrl = (u: string) => {
  const url = new URL(u);
  if (url.protocol !== "https:" || url.hostname !== "queue.fal.run") throw new Error("fal sent an unexpected address");
  return url.toString();
};

export const falApi: FalApi = {
  submit: (endpoint, input) => falFetch(`${FAL_QUEUE}/${endpoint}`, { method: "POST", body: input }, 30000),
  get: (url) => falFetch(falUrl(url), { method: "GET" }, 30000),
  async cancel(url) {
    await falFetch(falUrl(url), { method: "PUT" }, 15000);
  },
};

// The store

type Db = {
  id: string;
  workspace_id: string;
  created_by: string | null;
  kind: GenKind;
  prompt: string;
  endpoint: string;
  input: Record<string, unknown>;
  request_id: string | null;
  status_url: string | null;
  response_url: string | null;
  tries: number;
  created_at: string;
};

const toRow = (r: Db): GenRow => ({
  id: r.id,
  workspaceId: r.workspace_id,
  userId: r.created_by,
  kind: r.kind,
  prompt: r.prompt,
  endpoint: r.endpoint,
  input: r.input,
  requestId: r.request_id,
  statusUrl: r.status_url,
  responseUrl: r.response_url,
  tries: r.tries,
  createdAt: new Date(r.created_at).getTime(),
});

const iso = (ms: number) => new Date(ms).toISOString();

async function update(id: string, fields: Record<string, unknown>) {
  const { error } = await adminClient().from("generations").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
}

export const genStore: GenStore = {
  async claim(worker, n) {
    const { data, error } = await adminClient().rpc("claim_generations", { worker, n });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Db[]).map(toRow);
  },
  submitted: (id, r, checkAfter) => update(id, { request_id: r.requestId, status_url: r.statusUrl, response_url: r.responseUrl, status: "running", tries: 0, check_after: iso(checkAfter), locked_at: null, locked_by: null }),
  later: (id, checkAfter, tries) => update(id, { check_after: iso(checkAfter), tries, locked_at: null, locked_by: null }),
  async done(id, mediaId) {
    await update(id, { status: "done", media_id: mediaId, error: null, finished_at: iso(Date.now()), locked_at: null, locked_by: null });
    // A draft the agent saved while this was being made gets its file now. The request is already done, so a
    // hiccup here is logged and never makes it run again.
    await attach(id).catch((e) => console.error("attach generation:", e instanceof Error ? e.message : e));
  },
  failed: (id, error) => update(id, { status: "failed", error: error.slice(0, 500), finished_at: iso(Date.now()), locked_at: null, locked_by: null }),
  async saveFile(row, url) {
    try {
      return await linkToMedia(row.workspaceId, row.userId, new URL(url), {
        alt: null,
        place: (mime) => {
          const name = fileName(row.prompt, mime);
          return { path: `ai-${row.id}-${name}`, name };
        },
      });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 413 || /isn't a JPG/.test(e.message))) throw new BadFile(e.message);
      throw e;
    }
  },
};

/** Adds a finished request's file to the draft it belongs to (attach_generation in 022). Safe to repeat. */
async function attach(id: string) {
  for (let i = 0; ; i++) {
    const { error } = await adminClient().rpc("attach_generation", { g: id });
    if (!error) return;
    if (i >= 2) throw new Error(error.message);
    await new Promise((r) => setTimeout(r, 500 * 3 ** i));
  }
}

/** Ties requests to a draft: each file is added to it when it's done, and at once for those already done. */
export async function attachToPost(workspaceId: string, ids: string[], postId: string) {
  if (!ids.length) return;
  const { error } = await adminClient().from("generations").update({ post_id: postId }).eq("workspace_id", workspaceId).in("id", ids);
  if (error) throw new Error(error.message);
  for (const id of ids) await attach(id);
}

/** Waits up to `ms` for a request to finish (pictures take seconds), looking every 2 seconds. */
export async function waitForGeneration(workspaceId: string, id: string, ms: number): Promise<Generation> {
  const until = Date.now() + ms;
  for (;;) {
    const g = await getGeneration(workspaceId, id);
    if (g.status === "done" || g.status === "failed" || Date.now() + 2000 > until) return g;
    await new Promise((r) => setTimeout(r, 2000));
  }
}

/** The runner's loop: every few seconds, one step for each request that's due. */
export const runGenerations = () => run(genStore, falApi, WORKER);

// Starting one

async function usageOf(workspaceId: string): Promise<GenUse> {
  const { data, error } = await adminClient().from("generations").select("kind, seconds, status").eq("workspace_id", workspaceId).neq("status", "failed").gte("created_at", monthStart().toISOString());
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  return {
    images: rows.filter((r) => r.kind === "image").length,
    videoSeconds: rows.filter((r) => r.kind === "video").reduce((s, r) => s + Number(r.seconds ?? 0), 0),
    open: rows.filter((r) => r.status === "queued" || r.status === "running").length,
  };
}

/** Checks the request and the plan, saves it and sends it to fal. Returns the request; its file comes later. */
export async function startGeneration(workspaceId: string, userId: string, r: GenRequest): Promise<Generation> {
  if (!aiReady()) throw new ApiError(503, "unavailable", "AI media isn't set up on this server");
  checkLimits(r, await usageOf(workspaceId), await limitsOf(workspaceId));
  const db = adminClient();
  let imageUrl: string | null = null;
  if (r.sourceMediaId) {
    const { data: m } = await db.from("media").select("path, mime").eq("id", r.sourceMediaId).eq("workspace_id", workspaceId).maybeSingle();
    if (!m) throw new ApiError(400, "invalid_request", "That picture isn't in this workspace's media library");
    if (!/^image\/(jpeg|png|webp)$/.test(m.mime as string)) throw new ApiError(400, "invalid_request", "A video starts from a JPG, PNG or WebP picture");
    // fal fetches it when the request starts, which can wait in fal's queue: the link lasts 6 hours.
    const { data: s, error: e } = await db.storage.from("media").createSignedUrl(m.path as string, 6 * 3600);
    if (e || !s) throw new ApiError(503, "unavailable", "Couldn't link the picture. Try again in a moment.");
    imageUrl = s.signedUrl;
  }
  const call = falCall(r, imageUrl);
  // Saved locked, so the loop leaves it alone while it's sent here; a crash here lets the loop send it later.
  const { data, error } = await db
    .from("generations")
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      kind: r.kind,
      model: r.model,
      prompt: r.prompt,
      aspect: r.aspect,
      seconds: r.kind === "video" ? r.seconds : null,
      source_media_id: r.sourceMediaId,
      endpoint: call.endpoint,
      input: call.input,
      locked_at: new Date().toISOString(),
      locked_by: `start:${WORKER}`,
    })
    .select("*")
    .single();
  if (error || !data) throw new ApiError(503, "unavailable", "Couldn't save the request. Try again in a moment.");
  await advance(genStore, falApi, toRow(data as Db));
  return getGeneration(workspaceId, data.id as string);
}

export async function getGeneration(workspaceId: string, id: string): Promise<Generation> {
  const { data, error } = await adminClient().from("generations").select(COLUMNS).eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (error) throw new ApiError(503, "unavailable", "Couldn't read the request just now. Try again in a moment.");
  if (!data) throw new ApiError(404, "not_found", "Generation not found");
  return data as Generation;
}

/** Where these requests are, for the app to show progress. */
export async function generationsOf(workspaceId: string, ids: string[]): Promise<Generation[]> {
  if (!ids.length) return [];
  const { data, error } = await adminClient().from("generations").select(COLUMNS).eq("workspace_id", workspaceId).in("id", ids.slice(0, 50));
  if (error) throw new Error(error.message);
  return (data ?? []) as Generation[];
}
