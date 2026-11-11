import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getCtx } from "@/lib/session";
import { appUrl } from "@/lib/channels";
import { backTo, cleanAuthorize, mcpUrlOf } from "@/lib/oauth/rules";
import { connectableWorkspaces, getClient } from "@/lib/oauth/store";
import { decide } from "./actions";

export const dynamic = "force-dynamic";

const FIELDS = ["client_id", "redirect_uri", "response_type", "code_challenge", "code_challenge_method", "state", "resource"] as const;

// The OAuth sign-in page: an app (Claude, an MCP client) asks to use Capybaroar, and the person picks the workspace
// it may act in. Signed-out visitors are sent to /login and come back here (src/proxy.ts).
export default async function Authorize({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const client = await getClient(q.client_id ?? "");
  const c = cleanAuthorize(q, client?.redirectUris ?? null, mcpUrlOf(appUrl()));
  if (!c.ok) {
    if (c.redirect) redirect(backTo(q.redirect_uri!, { error: c.error, error_description: c.description, state: q.state ?? "" }));
    return (
      <Shell>
        <h1 className="mt-6 text-[20px] font-medium tracking-[-0.02em]">Can&rsquo;t connect this app</h1>
        <p className="mt-2 text-[13px] text-muted">{c.description}</p>
      </Shell>
    );
  }
  const ctx = await getCtx();
  const workspaces = await connectableWorkspaces(ctx.userId);
  const host = new URL(c.ask.redirectUri).host;
  const picked = workspaces.find((w) => w.id === ctx.workspaceId)?.id ?? workspaces[0]?.id;
  return (
    <Shell>
      <h1 className="mt-6 text-center text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-balance">
        {client!.name} wants to use Capybaroar
      </h1>
      <p className="mt-2 text-center text-[13px] text-muted">
        Signed in as {ctx.email}. It will send you back to {host}.
      </p>
      <form action={decide} className="mt-6 flex flex-col gap-4">
        {FIELDS.map((k) => (q[k] ? <input key={k} type="hidden" name={k} value={q[k]} /> : null))}
        {workspaces.length ? (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-[12.5px] font-medium text-body">Workspace</legend>
            {workspaces.map((w) => (
              <label key={w.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] shadow-rest has-checked:bg-signal-soft has-checked:shadow-picked">
                <input type="radio" name="workspace" value={w.id} defaultChecked={w.id === picked} className="accent-brand" />
                {w.name}
              </label>
            ))}
          </fieldset>
        ) : (
          <p className="text-[13px] text-danger">You need to be a member of a workspace (not a client) to connect apps.</p>
        )}
        <div className="rounded-lg bg-paper px-3.5 py-3 text-[12.5px] text-body">
          It can see your channels, posts, media and results, and create, change, schedule and delete posts in this workspace, with your role and brands. You can remove it any time in Settings, API and MCP.
        </div>
        <div className="flex gap-2">
          <button type="submit" name="decision" value="cancel" className="h-9 flex-1 rounded-full bg-panel text-[13px] font-medium shadow-pill">
            Cancel
          </button>
          <button type="submit" name="decision" value="allow" disabled={!workspaces.length} className="h-9 flex-1 rounded-full bg-brand text-[13px] font-medium text-white shadow-primary disabled:opacity-50">
            Allow
          </button>
        </div>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-shell px-4 py-10">
      <div className="w-full max-w-[420px] rounded-2xl bg-panel p-7 shadow-hover">
        <div className="flex justify-center">
          <Logo className="h-9 w-auto" />
        </div>
        {children}
      </div>
    </div>
  );
}
