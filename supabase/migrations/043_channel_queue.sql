-- Each channel can have its own queue times and a name of the team's choosing.
-- queue: [{day, time}] like workspaces.queue, or null to use the workspace's queue.
-- nickname: shown instead of the network's name; reconnecting updates name and keeps nickname.

alter table public.channels add column if not exists queue jsonb;
alter table public.channels add column if not exists nickname text;
alter table public.channels drop constraint if exists channels_nickname_check;
alter table public.channels add constraint channels_nickname_check check (nickname is null or char_length(nickname) between 1 and 80);
