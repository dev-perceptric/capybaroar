// Start the publisher inside the Node server (not in the edge runtime, and not when its keys are missing).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.RUN_JOBS === "0" || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.TOKEN_KEY) return;
  const { startRunner } = await import("./lib/runner");
  startRunner();
}
