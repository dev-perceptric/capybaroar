// The rules for making AI files, kept free of Supabase and fetch so tests run them against a fake fal and an
// in-memory store (tests/generate.test.ts).
// - A request is claimed under a lock; a crashed worker's lock expires after LOCK_MS (claim_generations in SQL).
// - Once fal accepts a request its id is saved (tried a few times), and a request with a saved id is never sent again:
//   from then on we only look at its status. If the id can't be saved, the request is cancelled at fal before it's
//   sent again, so a hiccup never pays for the same file twice.
// - Hiccups (timeouts, busy, 429, 5xx, a failed save) try again with growing waits. A refusal from fal (a bad prompt,
//   a blocked picture) fails at once with fal's own message. A request still waiting after GIVE_UP_MS is cancelled
//   and fails; one fal finished is still saved until FINISH_MS.
// - The file is saved at a fixed place per request, so saving it twice finds the first copy (one library file).
// - Every claimed row ends its turn with exactly one of: submitted, later, done, failed.
import { FINISH_MS, GIVE_UP_MS, falError, nextLook, resultFile, retryWait, statusStep, transient, type GenKind } from "./genRules";

export type GenRow = {
  id: string;
  workspaceId: string;
  userId: string | null;
  kind: GenKind;
  prompt: string;
  endpoint: string;
  input: Record<string, unknown>;
  requestId: string | null;
  statusUrl: string | null;
  responseUrl: string | null;
  tries: number;
  createdAt: number;
};

export type FalAnswer = { status: number; body: unknown };

export interface FalApi {
  submit(endpoint: string, input: Record<string, unknown>): Promise<FalAnswer>;
  get(url: string): Promise<FalAnswer>;
  cancel(url: string): Promise<void>;
}

/** A save that can't work however often it's tried (the file isn't a picture or video we post). */
export class BadFile extends Error {}

export interface GenStore {
  claim(worker: string, n: number): Promise<GenRow[]>;
  /** fal took it: keep its id and links, look again at checkAfter. */
  submitted(id: string, r: { requestId: string; statusUrl: string; responseUrl: string }, checkAfter: number): Promise<void>;
  /** Look again at checkAfter. tries counts failed submits and saves in a row. */
  later(id: string, checkAfter: number, tries: number): Promise<void>;
  /** Saves the file to the library at this request's fixed place and returns its media id. */
  saveFile(row: GenRow, url: string, mime: string | null): Promise<string>;
  done(id: string, mediaId: string): Promise<void>;
  failed(id: string, error: string): Promise<void>;
}

// Saving fal's request id is tried again a few times before giving up on this turn.
let saveRetryMs = [500, 1000, 2000];
export const setSaveRetryMs = (ms: number[]) => void (saveRetryMs = ms);

async function keep(fn: () => Promise<void>) {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= saveRetryMs.length) throw e;
      await new Promise((r) => setTimeout(r, saveRetryMs[i]));
    }
  }
}

/** Network failures read as status 0 (a hiccup). */
async function call(fn: () => Promise<FalAnswer>): Promise<FalAnswer> {
  try {
    return await fn();
  } catch (e) {
    return { status: 0, body: { detail: e instanceof Error ? e.message : String(e) } };
  }
}

const cancelUrl = (row: GenRow) => (row.responseUrl ? `${row.responseUrl}/cancel` : null);

/** One step for one request. Always ends with exactly one store call that lets go of the lock. */
export async function advance(store: GenStore, fal: FalApi, row: GenRow, now = Date.now()): Promise<"submitted" | "later" | "done" | "failed"> {
  // Past GIVE_UP_MS a request still waiting stops; a finished one still gets saved, up to FINISH_MS.
  const late = now - row.createdAt > GIVE_UP_MS;
  const giveUp = async () => {
    const c = cancelUrl(row);
    if (c) await fal.cancel(c).catch(() => undefined);
    await store.failed(row.id, "This took longer than 30 minutes. Try again.");
    return "failed" as const;
  };
  const retry = async () => {
    if (now - row.createdAt > FINISH_MS) return giveUp();
    await store.later(row.id, now + retryWait(row.tries + 1), row.tries + 1);
    return "later" as const;
  };
  try {
    if (!row.requestId) {
      if (late) return await giveUp();
      const r = await call(() => fal.submit(row.endpoint, row.input));
      const b = (r.body ?? {}) as { request_id?: unknown; status_url?: unknown; response_url?: unknown };
      if (r.status >= 200 && r.status < 300 && typeof b.request_id === "string" && typeof b.status_url === "string" && typeof b.response_url === "string") {
        try {
          await keep(() => store.submitted(row.id, { requestId: b.request_id as string, statusUrl: b.status_url as string, responseUrl: b.response_url as string }, nextLook(row.createdAt, now)));
        } catch {
          // fal took it but its id couldn't be saved: cancel it there, so sending it again later doesn't pay twice.
          await fal.cancel(`${b.response_url}/cancel`).catch(() => undefined);
          return "later";
        }
        return "submitted";
      }
      if (transient(r.status) || (r.status >= 200 && r.status < 300)) return await retry();
      await store.failed(row.id, falError(r.status, r.body));
      return "failed";
    }
    const s = await call(() => fal.get(row.statusUrl!));
    const step = statusStep(s.status, s.body);
    if (step.kind === "wait") {
      if (late) return await giveUp();
      await store.later(row.id, nextLook(row.createdAt, now), row.tries);
      return "later";
    }
    if (step.kind === "fail") {
      await store.failed(row.id, step.error);
      return "failed";
    }
    const res = await call(() => fal.get(row.responseUrl!));
    if (res.status < 200 || res.status >= 300) {
      if (transient(res.status)) return await retry();
      await store.failed(row.id, falError(res.status, res.body));
      return "failed";
    }
    let file: { url: string; mime: string | null };
    try {
      file = resultFile(row.kind, res.body);
    } catch (e) {
      await store.failed(row.id, e instanceof Error ? e.message : String(e));
      return "failed";
    }
    let mediaId: string;
    try {
      mediaId = await store.saveFile(row, file.url, file.mime);
    } catch (e) {
      if (e instanceof BadFile) {
        await store.failed(row.id, e.message);
        return "failed";
      }
      return await retry();
    }
    await keep(() => store.done(row.id, mediaId));
    return "done";
  } catch {
    // The store itself had a hiccup: the lock runs out and the next round takes it again.
    return "later";
  }
}

/** Claims due requests and moves each one step, side by side. Returns how many it claimed. */
export async function runGenerations(store: GenStore, fal: FalApi, worker: string, n = 8, now = () => Date.now()) {
  const rows = await store.claim(worker, n);
  await Promise.all(rows.map((r) => advance(store, fal, r, now())));
  return rows.length;
}
