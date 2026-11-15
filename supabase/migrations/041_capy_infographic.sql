-- CapyInfographic: a brand's look, read from its website (website, style), and infographics as a kind of AI file.
-- Claude designs an infographic as HTML and our server renders it; the request uses the same generations table,
-- credits and attach-to-post as the other Capy files. Needs 021, 023 and 029.

alter table public.brands add column if not exists website text check (website is null or char_length(website) <= 300);
-- Colors, fonts, corner size, logo (a data URL) and a line on the look; checked by cleanStyle in src/lib/capy/styleRules.ts.
alter table public.brands add column if not exists style jsonb check (style is null or pg_column_size(style) <= 700000);
alter table public.brands add column if not exists style_read_at timestamptz;

alter table public.generations drop constraint if exists generations_kind_check;
alter table public.generations add constraint generations_kind_check check (kind in ('image', 'video', 'audio', 'infographic'));
