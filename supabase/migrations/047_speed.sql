-- Speed. popularTimes (src/lib/analytics.ts) reads the newest published targets across every workspace for the
-- Composer's popular hours; the existing post_targets_published index starts with workspace_id, so it scanned.
create index if not exists post_targets_published_recent on public.post_targets (published_at desc) where status = 'published';
