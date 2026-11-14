-- Audit events without a workspace (failed sign-ins for unknown emails) are kept the full 365 days too. Before, the
-- guard let them be deleted at any time; now only age, or the cascade from deleting their workspace, removes an event.
create or replace function public.audit_events_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'audit events can''t be changed';
  end if;
  if old.created_at < now() - interval '365 days'
     or (old.workspace_id is not null and not exists (select 1 from public.workspaces w where w.id = old.workspace_id)) then
    return old;
  end if;
  raise exception 'audit events are kept for 365 days';
end $$;
