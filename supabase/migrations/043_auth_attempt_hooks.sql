-- Lockouts inside Supabase Auth itself: 5 wrong passwords, or 5 wrong two-factor codes, lock that one account for 15
-- minutes. The app's own limits (032, src/lib/limits.ts) only count tries that come through the app; these hooks also
-- count tries sent straight to Supabase Auth with the public key, which skip the app.
-- During a lockout even the right password or code is refused, so a guesser can't learn it from the answer.
-- Server-only: RLS on, no policies, no grants to anon or authenticated. Only Supabase Auth runs the functions.
--
-- Turn them on after this runs: Supabase, Authentication, Hooks, add "Password verification attempt" and "MFA
-- verification attempt", type Postgres, schema public, functions hook_password_verification_attempt and
-- hook_mfa_verification_attempt.

create table if not exists public.auth_failures (
  user_id uuid not null,
  kind text not null check (kind in ('password', 'mfa')),
  at timestamptz not null default now()
);
create index if not exists auth_failures_user on public.auth_failures (user_id, kind, at desc);
alter table public.auth_failures enable row level security;
revoke all on public.auth_failures from anon, authenticated;

-- The decision for one try. A right answer clears that account's failures; a wrong one adds one. Rows older than a day
-- go as new ones come in.
create or replace function public.auth_attempt_decision(p_user uuid, p_kind text, p_valid boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  wrong int;
begin
  select count(*) into wrong from public.auth_failures
  where user_id = p_user and kind = p_kind and at > now() - interval '15 minutes';
  if wrong >= 5 then
    return jsonb_build_object(
      'decision', 'reject',
      'message', case when p_kind = 'mfa' then 'Too many wrong codes. Try again in 15 minutes.' else 'Too many wrong tries. Try again in 15 minutes, or reset your password.' end,
      'should_logout_user', false
    );
  end if;
  if p_valid then
    delete from public.auth_failures where user_id = p_user and kind = p_kind;
  else
    insert into public.auth_failures (user_id, kind) values (p_user, p_kind);
    delete from public.auth_failures where at < now() - interval '1 day';
  end if;
  return jsonb_build_object('decision', 'continue');
end $$;

create or replace function public.hook_password_verification_attempt(event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  return public.auth_attempt_decision((event ->> 'user_id')::uuid, 'password', coalesce((event ->> 'valid')::boolean, false));
end $$;

create or replace function public.hook_mfa_verification_attempt(event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  return public.auth_attempt_decision((event ->> 'user_id')::uuid, 'mfa', coalesce((event ->> 'valid')::boolean, false));
end $$;

revoke all on function public.auth_attempt_decision(uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.hook_password_verification_attempt(jsonb) from public, anon, authenticated;
revoke all on function public.hook_mfa_verification_attempt(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.auth_attempt_decision(uuid, text, boolean) to supabase_auth_admin;
grant execute on function public.hook_password_verification_attempt(jsonb) to supabase_auth_admin;
grant execute on function public.hook_mfa_verification_attempt(jsonb) to supabase_auth_admin;
grant select, insert, delete on public.auth_failures to supabase_auth_admin;
