import { AuthForm } from "@/components/AuthForm";
import { userClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Signed out: ask for the email a reset link goes to. Signed in (the reset link signs in through /auth/callback):
// set the new password.
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ leaked?: string }> }) {
  const { data } = await (await userClient()).auth.getUser();
  // Sent here after signing in with a password found in data leaks (signIn in src/app/login/actions.ts).
  const leaked = data.user && (await searchParams).leaked === "1";
  return <AuthForm mode={data.user ? "reset" : "forgot"} notice={leaked ? "Your password showed up in a data leak. Choose a new one to keep your account safe." : undefined} />;
}
