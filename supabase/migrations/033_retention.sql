-- Retention (src/lib/retention.ts, src/lib/prune.ts): the hourly upkeep deletes unfinished sign-ins after 1 hour,
-- closed Inbox items after 180 days, agent chats 365 days after their last message and finished jobs after 30 days.
-- And workspace deletion (src/lib/workspaceDelete.ts): a workspace being deleted is marked until its job finishes.

alter table public.workspaces add column if not exists deleting_at timestamptz;
create index if not exists workspaces_deleting on public.workspaces (deleting_at) where deleting_at is not null;

-- The upkeep's deletes find old rows by date.
create index if not exists oauth_states_age on public.oauth_states (created_at);
create index if not exists inbox_items_done_age on public.inbox_items (created_at) where status = 'done';
create index if not exists jobs_done_age on public.jobs (done_at) where done_at is not null;
create index if not exists agent_chats_age on public.agent_chats (created_at);
create index if not exists agent_messages_age on public.agent_messages (chat_id, created_at);
-- Finding a workspace's waiting deletion job.
create index if not exists jobs_workspace_delete on public.jobs ((payload ->> 'workspaceId')) where kind = 'workspace_delete' and done_at is null;

-- A chat's last activity is its newest message, or when it was made if it has none. Its messages go with it.
create or replace function public.prune_agent_chats(before timestamptz) returns int
language sql security definer set search_path = public as $$
  with gone as (
    delete from public.agent_chats c
    where c.created_at < before
      and not exists (select 1 from public.agent_messages m where m.chat_id = c.id and m.created_at >= before)
    returning 1
  )
  select count(*)::int from gone
$$;
revoke all on function public.prune_agent_chats(timestamptz) from public, anon, authenticated;
grant execute on function public.prune_agent_chats(timestamptz) to service_role;
