-- Thumbnails for library tiles. Pictures saved to Media get a small WebP (480px wide at most) in the same bucket, at
-- `<workspace>/thumbs/<file name>.webp` (makeThumb in src/lib/media.ts, paths in src/lib/thumbRules.ts). Tiles show it
-- and fall back to the original while it's null (videos, PDFs, audio, files saved before this). Safe to run twice.
alter table public.media add column if not exists thumb_path text check (thumb_path is null or char_length(thumb_path) <= 400);
