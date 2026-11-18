import { AuthForm } from "@/components/AuthForm";
import { linkNotice } from "@/lib/emailLink";
import { signinOptions } from "@/lib/signinOptions";

// ?link= is set by /auth/callback for an email link that couldn't sign in here (opened in another browser, expired).
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string; link?: string }> }) {
  const [q, o] = await Promise.all([searchParams, signinOptions()]);
  return <AuthForm mode="login" google={o.google} siteKey={o.siteKey} next={q.next?.startsWith("/") && !q.next.startsWith("//") ? q.next : undefined} email={q.email} notice={linkNotice(q.link)} />;
}
