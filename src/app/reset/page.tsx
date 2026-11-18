import { AuthForm } from "@/components/AuthForm";
import { userClient } from "@/lib/supabase/server";
import { signinOptions } from "@/lib/signinOptions";
import { linkNotice } from "@/lib/emailLink";

export const dynamic = "force-dynamic";

// Signed out: ask for the email a reset link goes to. Signed in (the reset link signs in through /auth/callback):
// set the new password. ?link= is set by /auth/callback for a reset link that couldn't sign in here.
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ leaked?: string; link?: string }> }) {
  const [{ data }, o, q] = await Promise.all([(async () => (await userClient()).auth.getUser())(), signinOptions(), searchParams]);
  // Sent here after signing in with a password found in data leaks (signIn in src/app/login/actions.ts).
  const leaked = data.user && q.leaked === "1";
  const link = data.user ? undefined : linkNotice(q.link, true);
  return <AuthForm mode={data.user ? "reset" : "forgot"} notice={leaked ? "Your password showed up in a data leak. Choose a new one to keep your account safe." : link} siteKey={o.siteKey} />;
}
