-- Storage checks the type and size of every file itself, so a browser can't put anything else in a bucket, whatever
-- the app was told. Safe to run again.
-- media: what people upload (JPG, PNG, GIF, WebP, MP4, MOV, PDF) and the audio Capy makes (MP3, WAV, Ogg), up to
-- 250 MB a file (PDFs are kept to 100 MB by the app).
-- backups: ops/backup.sh uploads pg_dump's custom format as application/octet-stream; gzip and plain SQL dumps are
-- allowed too, up to 2 GB a file.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'allowed_mime_types') then
    update storage.buckets
      set allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'application/pdf', 'audio/mpeg', 'audio/wav', 'audio/ogg'],
          file_size_limit = 250 * 1024 * 1024
      where id = 'media';
    update storage.buckets
      set allowed_mime_types = array['application/octet-stream', 'application/gzip', 'application/sql'],
          file_size_limit = 2::bigint * 1024 * 1024 * 1024
      where id = 'backups';
  end if;
end $$;
