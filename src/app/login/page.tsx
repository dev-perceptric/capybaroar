import { Button, Field, Input } from "@/components/ui";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-panel px-4">
      <div className="w-full max-w-[380px] border border-frame bg-panel p-6">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={72} height={72} className="size-18" />
          <p className="mt-2 text-[13px] font-semibold tracking-[0.18em]">CAPYBAROAR</p>
          <h1 className="mt-6 text-[20px] font-semibold tracking-[-0.025em] text-balance">
            Every post, every channel. <span className="text-faint">One calendar.</span>
          </h1>
        </div>
        <form className="mt-6 flex flex-col gap-3">
          <Button type="button" variant="ghost" className="w-full justify-center">
            Continue with Google
          </Button>
          <div className="flex items-center gap-2 text-[11px] text-faint">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <Field label="Email">
            <Input type="email" autoComplete="email" placeholder="you@company.com" />
          </Field>
          <Field label="Password">
            <Input type="password" autoComplete="current-password" />
          </Field>
          <Button type="submit" className="mt-1 w-full justify-center">
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-[12px] text-muted">
          New here? <a href="/signup" className="font-medium text-ink underline underline-offset-2">Create an account</a>
        </p>
      </div>
    </div>
  );
}
