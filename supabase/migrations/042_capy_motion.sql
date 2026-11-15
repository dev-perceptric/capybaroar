-- CapyMotion: short animated videos as a kind of AI file. Claude plans the scenes and our server renders them with
-- our own Remotion scene kit; same generations table, credits and attach-to-post as the other Capy files. Needs 041.

alter table public.generations drop constraint if exists generations_kind_check;
alter table public.generations add constraint generations_kind_check check (kind in ('image', 'video', 'audio', 'infographic', 'motion'));
