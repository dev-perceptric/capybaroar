import { adminClient } from "@/lib/supabase/server";
import { MACHINE, VERSION } from "@/lib/opsdb";
import { healthOf } from "@/lib/ops";

export const dynamic = "force-dynamic";

// Same switch as src/instrumentation.ts: does this server run the publisher?
const runs = () => process.env.RUN_JOBS !== "0" && !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.TOKEN_KEY;

/** For Fly's check and an outside uptime monitor: one small query that also reads this server's runner beat. */
async function check() {
  let db = false;
  let beatAt: Date | null = null;
  try {
    const { data, error } = await adminClient().from("runner_beats").select("beat_at").eq("machine", MACHINE).abortSignal(AbortSignal.timeout(2000)).maybeSingle();
    db = !error;
    beatAt = data?.beat_at ? new Date(data.beat_at as string) : null;
  } catch {
    db = false;
  }
  return healthOf({ db, runs: runs(), beatAt, version: VERSION });
}

export async function GET() {
  const h = await check();
  return Response.json(h.body, { status: h.status, headers: { "Cache-Control": "no-store" } });
}

export async function HEAD() {
  const h = await check();
  return new Response(null, { status: h.status, headers: { "Cache-Control": "no-store" } });
}
