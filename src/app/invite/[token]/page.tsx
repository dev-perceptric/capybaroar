import { userClient } from "@/lib/supabase/server";
import { inviteByToken } from "@/lib/team";
import { InviteCard } from "@/components/InviteCard";
import { LinkButton } from "@/components/ui";

const ROLE = { owner: "an owner", admin: "an admin", editor: "an editor", client: "a client" } as const;

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invite, { data }] = await Promise.all([inviteByToken(token), (await userClient()).auth.getClaims()]);
  const email = (data?.claims?.email as string | undefined) ?? null;
  const next = encodeURIComponent(`/invite/${token}`);
  if (!invite || invite.state !== "open")
    return (
      <InviteCard title={!invite ? "This invite was withdrawn" : invite.state === "expired" ? "This invite has expired" : "This invite was already used"} line={invite?.state === "expired" ? "Ask for a new one." : undefined}>
        <LinkButton href="/calendar" variant="ghost">
          Open Capybaroar
        </LinkButton>
      </InviteCard>
    );
  const title = `Join ${invite.workspaceName}`;
  const line = `${invite.inviter ? `${invite.inviter} invited you` : "You're invited"} as ${ROLE[invite.role]}.`;
  if (!email)
    return (
      <InviteCard title={title} line={line}>
        <LinkButton href={`/signup?next=${next}&email=${encodeURIComponent(invite.email)}`}>Create an account</LinkButton>
        <LinkButton href={`/login?next=${next}&email=${encodeURIComponent(invite.email)}`} variant="ghost">
          Sign in
        </LinkButton>
      </InviteCard>
    );
  return <InviteCard title={title} line={line} token={token} mismatch={email.toLowerCase() !== invite.email.toLowerCase() ? { invited: invite.email, signedIn: email } : undefined} />;
}
