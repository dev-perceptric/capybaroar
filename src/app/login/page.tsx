import { AuthForm } from "@/components/AuthForm";
import { signinOptions } from "@/lib/signinOptions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const [q, o] = await Promise.all([searchParams, signinOptions()]);
  return <AuthForm mode="login" google={o.google} siteKey={o.siteKey} next={q.next?.startsWith("/") && !q.next.startsWith("//") ? q.next : undefined} email={q.email} />;
}
