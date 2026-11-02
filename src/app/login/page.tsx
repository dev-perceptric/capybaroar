import { AuthForm } from "@/components/AuthForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const q = await searchParams;
  return <AuthForm mode="login" next={q.next?.startsWith("/") && !q.next.startsWith("//") ? q.next : undefined} email={q.email} />;
}
