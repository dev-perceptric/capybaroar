import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { OpenWorkspace, TwoFactor } from "@/components/TwoFactor";
import { signOut } from "@/app/login/actions";
import { backupLeft, me, requiringWorkspaces, verifiedFactors } from "@/lib/mfa";
import { mfaNext } from "@/lib/mfaRules";
import { WORKSPACE_COOKIE } from "@/lib/session";
import { adminClient } from "@/lib/supabase/server";
import { safeNext } from "@/proxy";

export const dynamic = "force-dynamic";

// Setting up two-factor sign-in before a workspace that requires it (getCtx sends members here), and after a backup
// code removed a lost app. Reached with a session at any level; never getCtx, which would send it back here.
export default async function MfaSetupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = mfaNext((await searchParams).next, safeNext);
  const m = await me();
  if (!m) redirect("/login");
  const [factors, req, { data: rows }] = await Promise.all([
    verifiedFactors(m.userId),
    requiringWorkspaces(m.userId),
    adminClient().from("members").select("workspace_id, workspaces(name)").eq("user_id", m.userId).order("created_at"),
  ]);
  // An app on file but only a password so far: the code first.
  if (factors.length && m.aal !== "aal2") redirect(`/mfa${next === "/calendar" ? "" : `?next=${encodeURIComponent(next)}`}`);
  const all = ((rows ?? []) as unknown as { workspace_id: string; workspaces: { name: string } }[]).map((r) => ({ id: r.workspace_id, name: r.workspaces.name }));
  const want = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  const current = all.find((w) => w.id === want) ?? all[0];
  const required = req.some((w) => w.id === current?.id);
  const others = all.filter((w) => w.id !== current?.id && !req.some((r) => r.id === w.id));
  const on = factors.length > 0;
  const initial = { on, left: on ? await backupLeft(m.userId) : 0, required: req.map((w) => w.name) };
  return (
    <div className="flex min-h-dvh items-center justify-center bg-shell px-4 py-10">
      <div className="flex w-full max-w-[520px] flex-col gap-4">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-9 w-auto" />
          <h1 className="mt-6 text-[22px] leading-[1.15] font-medium tracking-[-0.025em] text-balance">
            {required && current ? `${current.name} requires two-factor sign-in.` : "Two-factor sign-in."} <span className="text-faint">Use an authenticator app.</span>
          </h1>
        </div>
        <TwoFactor initial={initial} next={next} />
        {required && !on ? <OpenWorkspace workspaces={others} /> : null}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[12px] text-muted">
          {on || !required ? (
            <Link href={next} className="font-medium text-ink underline underline-offset-2">
              {on ? "Continue" : "Not now"}
            </Link>
          ) : null}
          <form action={signOut}>
            <button type="submit" className="font-medium text-ink underline underline-offset-2">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
