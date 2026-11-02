-- Speed: indexes for queries that ran without one. Each names the query it serves.
-- Plain (not concurrent) because migrations run in a transaction; every table here is small enough that the brief
-- write lock is fine.

-- Media library and the composer's picker: newest 200 files of a workspace (listMedia).
create index if not exists media_ws_created on public.media (workspace_id, created_at desc);

-- Saving, moving or deleting a post cancels its pending publish jobs by payload->>'postId' (cancelPostJobs).
-- Without this every save scans all pending jobs.
create index if not exists jobs_pending_post on public.jobs ((payload ->> 'postId')) where done_at is null and kind = 'publish';

-- Analytics followers chart: a workspace's daily counts from a date (analytics).
create index if not exists metrics_ws_day on public.metrics (workspace_id, day);

-- Hourly upkeep: which channels already have today's count (the primary key starts with channel_id).
create index if not exists metrics_day on public.metrics (day);

-- Agents page: a person's latest chats in a workspace.
create index if not exists agent_chats_user on public.agent_chats (user_id, workspace_id, created_at desc);

-- A chat's messages in order (agents page and every agent turn).
create index if not exists agent_messages_chat on public.agent_messages (chat_id, id);
