-- Threads: a post's parts after the first, each with its own text and files ([{text, media_ids}]), and for each
-- channel the parts that already went out ([{id, url}], in order). A retry starts after the last saved part, so no
-- part goes out twice. Only networks marked `thread` in networks.ts post the parts.
alter table public.posts add column if not exists thread jsonb not null default '[]';
alter table public.post_targets add column if not exists parts jsonb not null default '[]';
