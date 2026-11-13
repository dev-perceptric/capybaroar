import { AuthForm } from "@/components/AuthForm";
import { userClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Signed out: ask for the email a reset link goes to. Signed in (the reset link signs in through /auth/callback):
// set the new password.
export default async function ResetPage() {
  const { data } = await (await userClient()).auth.getUser();
  return <AuthForm mode={data.user ? "reset" : "forgot"} />;
}
