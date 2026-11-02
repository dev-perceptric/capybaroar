import Link from "next/link";
import { userClient } from "@/lib/supabase/server";
import { inviteByToken } from "@/lib/team";
import { InviteCard } from "@/components/InviteCard";

const ROLE = { owner: "an owner", admin: "an admin", editor: "an editor", client: "a client" } as const;
const link = "inline-flex h-8 items-center justify-center border px-3.5 text-[12px] font-medium";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invite, { data }] = await Promise.all([inviteByToken(token), (await userClient()).auth.getClaims()]);
  const email = (data?.claims?.email as string | undefined) ?? null;
  const next = encodeURIComponent(`/invite/${token}`);
  if (!invite || invite.state !== "open")
    return (
      <InviteCard title={!invite ? "This invite was withdrawn" : invite.state === "expired" ? "This invite has expired" : "This invite was already used"} line={invite?.state === "expired" ? "Ask for a new one." : undefined}>
        <Link href="/calendar" className={`${link} border-frame hover:bg-hover`}>
          Open Capybaroar
        </Link>
      </InviteCard>
    );
  const title = `Join ${invite.workspaceName}`;
  const line = `${invite.inviter ? `${invite.inviter} invited you` : "You're invited"} as ${ROLE[invite.role]}.`;
  if (!email)
    return (
      <InviteCard title={title} line={line}>
        <Link href={`/signup?next=${next}&email=${encodeURIComponent(invite.email)}`} className={`${link} border-frame bg-yolk text-on-yolk hover:bg-yolk-hover`}>
          Create an account
        </Link>
        <Link href={`/login?next=${next}&email=${encodeURIComponent(invite.email)}`} className={`${link} border-frame hover:bg-hover`}>
          Sign in
        </Link>
      </InviteCard>
    );
  return <InviteCard title={title} line={line} token={token} mismatch={email.toLowerCase() !== invite.email.toLowerCase() ? { invited: invite.email, signedIn: email } : undefined} />;
}
