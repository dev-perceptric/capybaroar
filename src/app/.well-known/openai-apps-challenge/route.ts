export const dynamic = "force-dynamic";

/** OpenAI's domain check for the ChatGPT app: the challenge token from the plugin dashboard, as plain text. */
export function GET() {
  const token = process.env.OPENAI_APPS_CHALLENGE?.trim();
  if (!token) return new Response("Not found", { status: 404 });
  return new Response(token, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
