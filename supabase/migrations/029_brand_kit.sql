-- Brand kit: how a brand writes. A short description of its voice, words its posts never use, and hashtags its
-- posts always carry. Every AI that writes for the brand reads it (rewrites, the agent, Inbox replies, AI formats),
-- and the composer flags words to avoid before saving.
alter table public.brands add column if not exists voice text not null default '' check (char_length(voice) <= 1500);
alter table public.brands add column if not exists avoid text[] not null default '{}';
alter table public.brands add column if not exists hashtags text[] not null default '{}';
