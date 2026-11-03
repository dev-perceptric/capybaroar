-- Delete everywhere: a published post can be deleted on its networks. Each channel's row keeps status 'published',
-- its link and its results, and gets deleted_at, so Analytics keeps the numbers and marks the post deleted. Once every
-- channel it went out on is deleted, the post is 'deleted': kept for history, left off the calendar.
alter table public.post_targets add column if not exists deleted_at timestamptz;

alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check check (status in ('draft', 'review', 'scheduled', 'publishing', 'published', 'partial', 'failed', 'deleted'));
