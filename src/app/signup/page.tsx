import { AuthForm } from "@/components/AuthForm";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const q = await searchParams;
  return <AuthForm mode="signup" next={q.next?.startsWith("/") && !q.next.startsWith("//") ? q.next : undefined} email={q.email} />;
}
