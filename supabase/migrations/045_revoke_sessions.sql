-- "This wasn't me" in the new-device email (src/app/secure): signs one person out on every device by ending all their
-- sign-in sessions, so no refresh token works again. Access tokens already handed out stop at their expiry (an hour at
-- most). Server-only: the service role runs it, never anon or authenticated. Safe to run twice.

create or replace function public.revoke_user_sessions(p_user uuid) returns int
language plpgsql security definer set search_path = public, auth as $$
declare
  n int;
begin
  delete from auth.refresh_tokens where user_id = p_user::text;
  delete from auth.sessions where user_id = p_user;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;

notify pgrst, 'reload schema';
