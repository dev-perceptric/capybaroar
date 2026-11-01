-- Composer tools: saved snippets (hashtag sets, signatures) and short links with click counts.
create table if not exists public.snippets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index if not exists snippets_ws on public.snippets (workspace_id, created_at desc);
alter table public.snippets enable row level security;
create policy read_snippets on public.snippets for select to authenticated using (public.is_member(workspace_id));
grant select on public.snippets to authenticated;
grant all on public.snippets to service_role;

create table if not exists public.links (
  code text primary key check (code ~ '^[A-Za-z0-9]{6,12}$'),
  workspace_id uuid not null references public.workspaces on delete cascade,
  url text not null check (url ~ '^https?://' and char_length(url) <= 2000),
  clicks int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists links_ws on public.links (workspace_id, url);
alter table public.links enable row level security;
create policy read_links on public.links for select to authenticated using (public.is_member(workspace_id));
grant select on public.links to authenticated;
grant all on public.links to service_role;

create or replace function public.link_click(p_code text) returns text
language sql security definer set search_path = public as $$
  update public.links set clicks = clicks + 1 where code = p_code returning url;
$$;
revoke all on function public.link_click(text) from public, anon, authenticated;
grant execute on function public.link_click(text) to service_role;
