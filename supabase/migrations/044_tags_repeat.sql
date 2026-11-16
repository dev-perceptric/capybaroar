-- Tags: colored labels a post can carry several of (up to 10), for the whole workspace. They color the calendar's
-- cards and filter it. Campaigns stay one per post. Deleting a tag takes it off its posts (delete_tag).
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  tone text not null default 'sky',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists tags_ws_name on public.tags (workspace_id, lower(name));
alter table public.tags enable row level security;
drop policy if exists read_tags on public.tags;
create policy read_tags on public.tags for select to authenticated using (public.is_member(workspace_id));
grant select on public.tags to authenticated;
grant all on public.tags to service_role;

alter table public.posts add column if not exists tag_ids uuid[] not null default '{}';
create index if not exists posts_tags on public.posts using gin (tag_ids);

create or replace function public.delete_tag(ws uuid, tag uuid) returns void
language sql security definer set search_path = public as $$
  update public.posts set tag_ids = array_remove(tag_ids, tag) where workspace_id = ws and tag = any(tag_ids);
  delete from public.tags where id = tag and workspace_id = ws;
$$;
revoke all on function public.delete_tag(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_tag(uuid, uuid) to service_role;

-- Repeat: a post goes out again at the same time every few days, weeks or a month. When it goes out, the next copy
-- is scheduled and takes the repeat over (repeats.ts), so the newest copy always holds it.
alter table public.posts add column if not exists repeat text;
alter table public.posts drop constraint if exists posts_repeat_check;
alter table public.posts add constraint posts_repeat_check check (repeat is null or repeat in ('1d', '2d', '3d', '4d', '5d', '6d', '1w', '2w', '1m'));
