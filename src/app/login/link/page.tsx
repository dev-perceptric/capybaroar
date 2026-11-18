import { AuthForm } from "@/components/AuthForm";
import { signinOptions } from "@/lib/signinOptions";

// "Email me a sign-in link": a link and a code in one email, for people who have an account (src/lib/emailLink.ts).
export default async function LinkPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const [q, o] = await Promise.all([searchParams, signinOptions()]);
  return <AuthForm mode="link" google={o.google} siteKey={o.siteKey} next={q.next?.startsWith("/") && !q.next.startsWith("//") ? q.next : undefined} email={q.email} />;
}
