import { readTipsToken } from "@/lib/nurture";
import { appUrl } from "@/lib/channels";
import { adminClient } from "@/lib/supabase/server";

// The "Turn them off" link in getting-started emails (src/lib/nurture.ts). Opening it shows one button, so a link
// checker never turns them off. Mail apps POST here directly from the List-Unsubscribe header (RFC 8058).

const page = (title: string, body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{margin:0;font:14px/1.5 Inter,system-ui,sans-serif;color:#0a0a0a;background:#f5f5f5;display:grid;place-items:center;min-height:100vh}main{background:#fff;border-radius:16px;box-shadow:0 0 0 1px #e6e6e6,0 24px 48px -24px rgba(0,0,0,.18);padding:32px;max-width:360px;text-align:center}h1{font-size:16px;font-weight:600;margin:0 0 8px}p{margin:0 0 16px;color:#525252}button{font:inherit;font-weight:600;background:#333;color:#fff;border:0;border-radius:999px;padding:10px 20px;cursor:pointer}a{color:#525252}</style></head>
<body><main>${body}</main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );

const settings = () => `${appUrl()}/settings?tab=account`;

export async function GET(request: Request) {
  const who = readTipsToken(new URL(request.url).searchParams.get("t") ?? "");
  if (!who) return page("Link not valid", `<h1>This link isn't valid</h1><p>You can turn these emails off in <a href="${settings()}">Settings</a>.</p>`, 400);
  return page("Turn off tips", `<h1>Turn off getting-started tips?</h1><p>Your other emails stay on.</p><form method="post"><button type="submit">Turn them off</button></form>`);
}

export async function POST(request: Request) {
  const who = readTipsToken(new URL(request.url).searchParams.get("t") ?? "");
  if (!who) return Response.json({ error: "This link isn't valid." }, { status: 400 });
  const db = adminClient();
  for (let attempt = 0; ; attempt++) {
    const { error } = await db.from("members").update({ tips: false }).eq("workspace_id", who.workspaceId).eq("user_id", who.userId);
    if (!error) break;
    if (attempt >= 2) return page("Something went wrong", `<h1>That didn't save</h1><p>Try again in a moment, or use <a href="${settings()}">Settings</a>.</p>`, 500);
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  return page("Tips off", `<h1>Tips are off</h1><p>You won't get getting-started emails again. Your other emails stay on.</p>`);
}
