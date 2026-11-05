-- The agent can save a draft before its AI picture or video is done: the request keeps the post it belongs to, and
-- the finished file is added to that post. Adding is safe to run any number of times (the file is added once), and
-- only drafts and posts in review take it, so nothing already sent changes. Needs 021.

alter table public.generations add column if not exists post_id uuid references public.posts on delete set null;
create index if not exists generations_post on public.generations (post_id) where post_id is not null;

create or replace function public.attach_generation(g uuid) returns void
language sql security definer set search_path = public as $$
  update public.posts p
  set media_ids = array_append(p.media_ids, gen.media_id), updated_at = now()
  from public.generations gen
  where gen.id = g and gen.post_id = p.id and gen.workspace_id = p.workspace_id
    and gen.status = 'done' and gen.media_id is not null
    and not (gen.media_id = any (p.media_ids))
    and p.status in ('draft', 'review')
$$;
revoke all on function public.attach_generation(uuid) from public, anon, authenticated;
grant execute on function public.attach_generation(uuid) to service_role;
