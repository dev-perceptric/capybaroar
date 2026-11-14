import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { me, verifiedFactors } from "@/lib/mfa";
import { mfaNext } from "@/lib/mfaRules";
import { safeNext } from "@/proxy";

export const dynamic = "force-dynamic";

// The code after a password or Google, for people with an authenticator app (getCtx sends aal1 sessions here). Reached
// with a session at any level; never getCtx, which would send it back here.
export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = mfaNext((await searchParams).next, safeNext);
  const m = await me();
  if (!m) redirect("/login");
  if (m.aal === "aal2" || !(await verifiedFactors(m.userId)).length) redirect(next);
  return <AuthForm mode="mfa" next={next} />;
}
