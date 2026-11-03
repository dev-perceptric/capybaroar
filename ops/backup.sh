#!/bin/sh
# Daily database backup for Capybaroar. Runs in a postgres:17-alpine container (see ops/README.md).
# Needs PW (the database password), SUPABASE_URL and SUPABASE_SERVICE_KEY. Optional: KEEP_DAYS (14), PING_URL (an
# uptime monitor's heartbeat address, called only after a good backup), DB_URL (to point it somewhere else).
# 1. pg_dump of the public schema (tables, data, functions, policies, grants), custom format, compressed.
# 2. Checks the file reads back (pg_restore --list) before it is kept.
# 3. Uploads it to the private Storage bucket "backups" as db/capybaroar-YYYY-MM-DDTHHMMZ.dump.
# 4. Deletes backups older than KEEP_DAYS, never the newest one.
# 5. Counts the files in the "media" bucket. Media itself is not copied (too big for a daily dump).
set -eu

: "${PW:?PW is not set}"
: "${SUPABASE_URL:?SUPABASE_URL is not set}"
: "${SUPABASE_SERVICE_KEY:?SUPABASE_SERVICE_KEY is not set}"
KEEP_DAYS="${KEEP_DAYS:-14}"
DB_URL="${DB_URL:-postgresql://postgres:${PW}@db.txaqthvlpjzzyyrszbdd.supabase.co:5432/postgres?sslmode=require}"
API="${SUPABASE_URL%/}/storage/v1"
BUCKET=backups

need() { command -v "$1" >/dev/null 2>&1; }
if ! need curl || ! need jq; then apk add --no-cache curl jq >/dev/null; fi

log() { echo "backup: $*"; }
auth() { printf 'Authorization: Bearer %s' "$SUPABASE_SERVICE_KEY"; }
key() { printf 'apikey: %s' "$SUPABASE_SERVICE_KEY"; }

STAMP="$(date -u +%Y-%m-%dT%H%MZ)"
NAME="db/capybaroar-${STAMP}.dump"
WORK="$(mktemp -d)"
FILE="${WORK}/capybaroar.dump"
trap 'rm -rf "$WORK"' EXIT

log "dumping public schema"
pg_dump --dbname="$DB_URL" --schema=public --format=custom --compress=9 --file="$FILE"

ENTRIES="$(pg_restore --list "$FILE" | grep -c '^[0-9]' || true)"
TABLES="$(pg_restore --list "$FILE" | grep -cE '^[0-9]+; [0-9]+ [0-9]+ TABLE public ' || true)"
SIZE="$(wc -c < "$FILE" | tr -d ' ')"
if [ "$TABLES" -lt 1 ]; then
  log "the dump has no tables; not uploading it"
  exit 1
fi
log "dump ok: ${SIZE} bytes, ${TABLES} tables, ${ENTRIES} entries"

log "uploading ${BUCKET}/${NAME}"
curl -fsS -X POST "${API}/object/${BUCKET}/${NAME}" \
  -H "$(auth)" -H "$(key)" -H "Content-Type: application/octet-stream" -H "x-upsert: false" \
  -T "$FILE" >/dev/null

# Every backup, oldest first.
LIST="$(curl -fsS -X POST "${API}/object/list/${BUCKET}" -H "$(auth)" -H "$(key)" -H "Content-Type: application/json" \
  -d '{"prefix":"db","limit":1000,"offset":0,"sortBy":{"column":"name","order":"asc"}}')"
echo "$LIST" | jq -e --arg n "${NAME#db/}" 'map(.name) | index($n) != null' >/dev/null || { log "upload not found in the bucket"; exit 1; }

CUTOFF="$(date -u -d "@$(( $(date -u +%s) - KEEP_DAYS * 86400 ))" +%Y-%m-%d)"
OLD="$(echo "$LIST" | jq -c --arg cut "$CUTOFF" --arg keep "${NAME#db/}" \
  '[.[] | .name | select(startswith("capybaroar-") and .[11:21] < $cut and . != $keep) | "db/" + .]')"
if [ "$OLD" != "[]" ]; then
  log "deleting backups from before ${CUTOFF}: ${OLD}"
  curl -fsS -X DELETE "${API}/object/${BUCKET}" -H "$(auth)" -H "$(key)" -H "Content-Type: application/json" \
    -d "{\"prefixes\":${OLD}}" >/dev/null
fi

MEDIA="$(psql "$DB_URL" -Atc "select count(*) || ' files, ' || pg_size_pretty(coalesce(sum((metadata->>'size')::bigint), 0)) from storage.objects where bucket_id = 'media'" 2>/dev/null || echo "unknown")"
log "media bucket: ${MEDIA} (not copied)"

if [ -n "${PING_URL:-}" ]; then curl -fsS -m 10 "$PING_URL" >/dev/null || log "ping failed"; fi
log "done: ${NAME}"
