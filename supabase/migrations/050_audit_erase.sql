-- Deleting an account (Settings → Your account, deleteAccount in src/lib/workspaceDelete.ts) failed for anyone who
-- had done something in a workspace: audit_events.actor_id is "on delete set null", and the guard turned that update
-- down ("audit events can't be changed"). The guard now lets exactly that one change through, clearing the person's
-- id when their account is deleted, and still refuses every other change. Safe to run twice.

create or replace function public.audit_events_guard() returns trigger
language plpgsql as $fn$
begin
  if tg_op = 'UPDATE' then
    if old.actor_id is not null and new.actor_id is null and (to_jsonb(new) - 'actor_id') = (to_jsonb(old) - 'actor_id') then
      return new;
    end if;
    raise exception 'audit events can''t be changed';
  end if;
  if old.created_at < now() - interval '365 days'
     or (old.workspace_id is not null and not exists (select 1 from public.workspaces w where w.id = old.workspace_id)) then
    return old;
  end if;
  raise exception 'audit events are kept for 365 days';
end $fn$;
