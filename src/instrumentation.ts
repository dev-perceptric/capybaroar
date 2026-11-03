import type { Instrumentation } from "next";

// Start the publisher inside the Node server (not in the edge runtime, and not when its keys are missing).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.RUN_JOBS === "0" || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.TOKEN_KEY) return;
  const { startRunner } = await import("./lib/runner");
  startRunner();
}

// Server errors go to app_errors (deduplicated, tokens scrubbed), and ALERT_EMAIL hears once an hour per error.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const { trackError } = await import("./lib/opsdb");
  await trackError(err, `${request.method} ${context.routePath || request.path}`);
};
