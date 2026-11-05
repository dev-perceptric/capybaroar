-- Channel groups: a saved, named set of channels ("All socials", "Client A, everything") to post to in one click.
-- A group belongs to one brand, like a post, so picking it never mixes brands. Channels removed later are skipped
-- when the group is used. Needs 006 (brands).

create table if not exists public.channel_groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  brand_id uuid references public.brands on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  channel_ids uuid[] not null check (cardinality(channel_ids) between 1 and 60),
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists channel_groups_ws on public.channel_groups (workspace_id, created_at);

alter table public.channel_groups enable row level security;
drop policy if exists read_channel_groups on public.channel_groups;
create policy read_channel_groups on public.channel_groups for select to authenticated using (public.is_member(workspace_id));
