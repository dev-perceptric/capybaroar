-- Capy: AI audio joins pictures and videos, and plans count AI credits (1 credit = 1 cent of fal cost) instead of
-- pictures and seconds. Each request keeps what it costs and why Capy picked its model. Audio files can't go on a
-- post on their own, so a finished audio file is never added to a draft. Needs 021; repeats 022's column so it
-- runs whether or not 022 ran.

alter table public.generations add column if not exists post_id uuid references public.posts on delete set null;
create index if not exists generations_post on public.generations (post_id) where post_id is not null;

alter table public.generations drop constraint if exists generations_kind_check;
alter table public.generations add constraint generations_kind_check check (kind in ('image', 'video', 'audio'));
alter table public.generations drop constraint if exists generations_prompt_check;
alter table public.generations add constraint generations_prompt_check check (char_length(prompt) between 1 and 5000);
alter table public.generations add column if not exists credits int not null default 0;
alter table public.generations add column if not exists reason text;

create or replace function public.attach_generation(g uuid) returns void
language sql security definer set search_path = public as $$
  update public.posts p
  set media_ids = array_append(p.media_ids, gen.media_id), updated_at = now()
  from public.generations gen
  where gen.id = g and gen.post_id = p.id and gen.workspace_id = p.workspace_id
    and gen.status = 'done' and gen.media_id is not null and gen.kind <> 'audio'
    and not (gen.media_id = any (p.media_ids))
    and p.status in ('draft', 'review')
$$;
revoke all on function public.attach_generation(uuid) from public, anon, authenticated;
grant execute on function public.attach_generation(uuid) to service_role;
