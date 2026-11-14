-- Two-factor sign-in with authenticator apps. Supabase Auth keeps the apps (auth.mfa_factors) and the session's level
-- (aal1, aal2); this adds what it doesn't have:
-- 1. A workspace rule: owners can require 2FA for everyone in it (src/lib/session.ts sends members without it to
--    /mfa/setup).
-- 2. Backup codes: ten per person, only their scrypt hashes (src/lib/mfaRules.ts), each used once. Using one removes
--    the lost authenticator, so the person sets 2FA up again (src/lib/mfa.ts).
-- Server-only (service role): RLS on, no policies, no grants to anon or authenticated.

-- 1. The rule.
alter table public.workspaces add column if not exists require_mfa boolean not null default false;

-- 2. Backup codes. `used_by` is the try that used a code, so the same try repeated after a lost reply still finds it
-- as its own instead of "already used".
create table if not exists public.mfa_backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  code_hash text not null check (char_length(code_hash) between 20 and 128),
  used_at timestamptz,
  used_by uuid,
  created_at timestamptz not null default now(),
  unique (user_id, code_hash)
);
alter table public.mfa_backup_codes enable row level security;
revoke all on public.mfa_backup_codes from anon, authenticated;
grant select, insert, update, delete on public.mfa_backup_codes to service_role;

-- A new set replaces the old one in one step, so a failure never leaves half of each.
create or replace function public.replace_backup_codes(p_user uuid, p_hashes text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(array_length(p_hashes, 1), 0) not between 1 and 20 then
    raise exception 'between 1 and 20 backup codes';
  end if;
  delete from public.mfa_backup_codes where user_id = p_user;
  insert into public.mfa_backup_codes (user_id, code_hash) select p_user, h from unnest(p_hashes) as h;
end $$;
revoke all on function public.replace_backup_codes(uuid, text[]) from public, anon, authenticated;
grant execute on function public.replace_backup_codes(uuid, text[]) to service_role;

-- Uses a code once: true when this try (`p_attempt`) holds it. The update locks the row, so two tries at once can't
-- both use it: the second sees used_at set and gets false.
create or replace function public.use_backup_code(p_user uuid, p_hash text, p_attempt uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.mfa_backup_codes set used_at = now(), used_by = p_attempt
  where user_id = p_user and code_hash = p_hash and used_at is null;
  get diagnostics n = row_count;
  if n > 0 then
    return true;
  end if;
  return exists (select 1 from public.mfa_backup_codes where user_id = p_user and code_hash = p_hash and used_by = p_attempt);
end $$;
revoke all on function public.use_backup_code(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.use_backup_code(uuid, text, uuid) to service_role;

-- Gives a code back when the step after using it (removing the lost authenticator) failed, so the person can try
-- again with the same code.
create or replace function public.release_backup_code(p_user uuid, p_attempt uuid) returns void
language sql security definer set search_path = public as $$
  update public.mfa_backup_codes set used_at = null, used_by = null where user_id = p_user and used_by = p_attempt;
$$;
revoke all on function public.release_backup_code(uuid, uuid) from public, anon, authenticated;
grant execute on function public.release_backup_code(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
