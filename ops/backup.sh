#!/usr/bin/env bash
# Nightly backup of Capybaroar's self-hosted Supabase on the VPS. Runs on the host from cron (ops/README.md).
#
# 1. pg_dumpall of the whole cluster (every schema: public, auth, storage metadata, roles and grants), taken inside
#    the Supabase Postgres container, gzip-compressed and encrypted on the fly to an age public key. Plain SQL never
#    touches the disk, and the server holds no key that can decrypt a backup.
# 2. The Supabase .env and compose files (JWT secret, keys, passwords) and any EXTRA_FILES (the app's env with
#    TOKEN_KEY), in one encrypted tarball. Without them a restored database can't be used.
# 3. Row counts of the main tables, in a plain manifest next to the dump, so a test restore can be compared.
# 4. Uploads to off-server storage with rclone: db/daily/ (newest 30 kept) and, the first run of each month,
#    db/monthly/ (newest 12 kept).
# 5. Syncs the Storage media directory to media/current; files deleted or replaced on the server move to
#    media/deleted/<date>/ and are kept 30 days.
# 6. Calls PING_URL (a heartbeat monitor) only when everything above worked.
#
# Settings come from the environment, or from BACKUP_ENV (default /etc/capybaroar/backup.env, chmod 600):
#   RCLONE_REMOTE   required. The rclone remote and bucket, e.g. b2:capybaroar-backups
#   AGE_RECIPIENTS  age public keys (age1...), space separated. Or AGE_RECIPIENTS_FILE, or GPG_RECIPIENT for gpg.
#   DB_CONTAINER    the Supabase Postgres container (sb-capybaroar-db-1)
#   PG_USER         a superuser in that container (supabase_admin); its password is the container's POSTGRES_PASSWORD
#   SUPABASE_DIR    the Supabase compose folder (/docker/sb-capybaroar)
#   MEDIA_DIR       the Storage files volume (/docker/sb-capybaroar/volumes/storage); "" to skip media
#   MEDIA_REMOTE    where media goes ($RCLONE_REMOTE/media); point it at an rclone crypt remote to encrypt media too
#   EXTRA_FILES     more files for the config tarball, space separated (the app's .env)
#   KEEP_DAILY (30), KEEP_MONTHLY (12), KEEP_DELETED_DAYS (30), WORK_DIR (/var/tmp), PING_URL
set -euo pipefail
umask 077

BACKUP_ENV="${BACKUP_ENV:-/etc/capybaroar/backup.env}"
# shellcheck disable=SC1090
if [ -r "$BACKUP_ENV" ]; then set -a; . "$BACKUP_ENV"; set +a; fi

: "${RCLONE_REMOTE:?RCLONE_REMOTE is not set (e.g. b2:capybaroar-backups)}"
DB_CONTAINER="${DB_CONTAINER:-sb-capybaroar-db-1}"
PG_USER="${PG_USER:-supabase_admin}"
SUPABASE_DIR="${SUPABASE_DIR:-/docker/sb-capybaroar}"
MEDIA_DIR="${MEDIA_DIR-${SUPABASE_DIR}/volumes/storage}"
MEDIA_REMOTE="${MEDIA_REMOTE:-${RCLONE_REMOTE%/}/media}"
KEEP_DAILY="${KEEP_DAILY:-30}"
KEEP_MONTHLY="${KEEP_MONTHLY:-12}"
KEEP_DELETED_DAYS="${KEEP_DELETED_DAYS:-30}"
WORK_DIR="${WORK_DIR:-/var/tmp}"
REMOTE="${RCLONE_REMOTE%/}"

log() { echo "$(date -u +%FT%TZ) backup: $*"; }
die() { log "FAILED: $*"; exit 1; }
for c in docker rclone gzip sha256sum flock; do command -v "$c" >/dev/null || die "$c is not installed"; done

# One run at a time.
exec 9>"${WORK_DIR}/capybaroar-backup.lock"
flock -n 9 || die "another backup is still running"

# Encrypt to public keys only.
if [ -n "${AGE_RECIPIENTS:-}" ] || [ -n "${AGE_RECIPIENTS_FILE:-}" ]; then
  command -v age >/dev/null || die "age is not installed"
  ENC_ARGS=()
  for r in ${AGE_RECIPIENTS:-}; do ENC_ARGS+=(-r "$r"); done
  [ -n "${AGE_RECIPIENTS_FILE:-}" ] && ENC_ARGS+=(-R "$AGE_RECIPIENTS_FILE")
  encrypt() { age "${ENC_ARGS[@]}"; }
  EXT=age
elif [ -n "${GPG_RECIPIENT:-}" ]; then
  command -v gpg >/dev/null || die "gpg is not installed"
  encrypt() { gpg --batch --yes --trust-model always --encrypt --recipient "$GPG_RECIPIENT"; }
  EXT=gpg
else
  die "set AGE_RECIPIENTS (or AGE_RECIPIENTS_FILE, or GPG_RECIPIENT): backups are never stored unencrypted"
fi

docker inspect -f '{{.State.Running}}' "$DB_CONTAINER" 2>/dev/null | grep -qx true || die "container $DB_CONTAINER is not running"

STAMP="$(date -u +%Y-%m-%dT%H%MZ)"
DAY="${STAMP:0:10}"
MONTH="${STAMP:0:7}"
NAME="capybaroar-${STAMP}"
WORK="$(mktemp -d "${WORK_DIR}/capybaroar-backup.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

# psql/pg_dumpall inside the container, as PG_USER with the container's own POSTGRES_PASSWORD (never on a command line).
in_db() { docker exec -i "$DB_CONTAINER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" exec "$@"' sh "$@"; }

log "dumping the cluster from $DB_CONTAINER"
DUMP="${WORK}/${NAME}.sql.gz.${EXT}"
# A copy of the stream goes through a pipe to `tail`, to check pg_dumpall's closing line.
mkfifo "${WORK}/tailpipe"
tail -c 512 < "${WORK}/tailpipe" > "${WORK}/tail" &
TAIL_PID=$!
in_db pg_dumpall -h 127.0.0.1 -U "$PG_USER" --quote-all-identifiers \
  | tee "${WORK}/tailpipe" \
  | gzip -6 | encrypt > "$DUMP" || die "pg_dumpall, gzip or encryption failed"
wait "$TAIL_PID"
grep -q "PostgreSQL database cluster dump complete" "${WORK}/tail" || die "the dump did not finish"
SIZE="$(stat -c %s "$DUMP")"
[ "$SIZE" -gt 1024 ] || die "the dump is only ${SIZE} bytes"

log "counting rows for the manifest"
MANIFEST="${WORK}/${NAME}.manifest.txt"
{
  echo "backup ${NAME}"
  echo "container ${DB_CONTAINER} image $(docker inspect -f '{{.Config.Image}}' "$DB_CONTAINER")"
  echo "server_version $(in_db psql -h 127.0.0.1 -U "$PG_USER" -d postgres -Atc 'show server_version')"
  echo "dump_bytes ${SIZE}"
  echo "dump_sha256 $(sha256sum "$DUMP" | cut -d' ' -f1)"
  in_db psql -h 127.0.0.1 -U "$PG_USER" -d postgres -At -F ' ' -c "
    select 'rows ' || n.nspname || '.' || c.relname, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r', 'p') and n.nspname in ('public', 'auth', 'storage')
    order by 1"
} > "$MANIFEST"
grep -q '^rows auth.users ' "$MANIFEST" || die "auth.users is missing from the database"

CONFIG=""
FILES=()
for f in "${SUPABASE_DIR}/.env" "${SUPABASE_DIR}"/docker-compose*.yml ${EXTRA_FILES:-}; do [ -f "$f" ] && FILES+=("$f"); done
if [ "${#FILES[@]}" -gt 0 ]; then
  CONFIG="${WORK}/${NAME}.config.tar.gz.${EXT}"
  tar -czf - --absolute-names "${FILES[@]}" | encrypt > "$CONFIG" || die "config tarball failed"
  log "config: ${FILES[*]}"
fi

up() { rclone copyto --retries 5 --low-level-retries 10 "$1" "$2"; }
log "uploading ${NAME} (${SIZE} bytes) to ${REMOTE}/db/daily/"
up "$DUMP" "${REMOTE}/db/daily/${NAME}.sql.gz.${EXT}"
up "$MANIFEST" "${REMOTE}/db/daily/${NAME}.manifest.txt"
[ -n "$CONFIG" ] && up "$CONFIG" "${REMOTE}/db/daily/${NAME}.config.tar.gz.${EXT}"

# The remote must hold exactly what was made.
GOT="$(rclone size --json "${REMOTE}/db/daily/${NAME}.sql.gz.${EXT}" | grep -oE '"bytes": *[0-9]+' | grep -oE '[0-9]+$')" || true
[ "$GOT" = "$SIZE" ] || die "uploaded size ${GOT:-none} is not ${SIZE}"

# The first backup of each month is also kept as that month's.
if ! rclone lsf "${REMOTE}/db/monthly/" 2>/dev/null | grep -q "^capybaroar-${MONTH}"; then
  log "keeping it as the backup for ${MONTH}"
  up "$DUMP" "${REMOTE}/db/monthly/${NAME}.sql.gz.${EXT}"
  up "$MANIFEST" "${REMOTE}/db/monthly/${NAME}.manifest.txt"
  [ -n "$CONFIG" ] && up "$CONFIG" "${REMOTE}/db/monthly/${NAME}.config.tar.gz.${EXT}"
fi

# Keep the newest N backups by name (names sort by time); the one just made is always the newest.
prune() {
  local dir="$1" keep="$2" old
  old="$(rclone lsf --files-only "${REMOTE}/${dir}/" | grep -oE '^capybaroar-[0-9T:-]+Z' | sort -u | head -n "-${keep}")" || true
  for b in $old; do
    log "deleting ${dir}/${b}"
    rclone delete --include "${b}.*" "${REMOTE}/${dir}/"
  done
}
prune db/daily "$KEEP_DAILY"
prune db/monthly "$KEEP_MONTHLY"

if [ -n "$MEDIA_DIR" ]; then
  [ -d "$MEDIA_DIR" ] || die "MEDIA_DIR $MEDIA_DIR is not a folder"
  log "syncing media from ${MEDIA_DIR}"
  rclone sync "$MEDIA_DIR" "${MEDIA_REMOTE%/}/current" --backup-dir "${MEDIA_REMOTE%/}/deleted/${DAY}" \
    --fast-list --retries 5 --low-level-retries 10 --stats-one-line --stats 0 || die "media sync failed"
  for d in $(rclone lsf --dirs-only "${MEDIA_REMOTE%/}/deleted/" 2>/dev/null | tr -d /); do
    if [[ "$d" < "$(date -u -d "-${KEEP_DELETED_DAYS} days" +%Y-%m-%d)" ]]; then
      log "deleting media/deleted/${d}"
      rclone delete "${MEDIA_REMOTE%/}/deleted/${d}"
    fi
  done
fi

if [ -n "${PING_URL:-}" ]; then curl -fsS -m 10 --retry 3 "$PING_URL" >/dev/null || log "ping failed"; fi
log "done: ${NAME}, ${SIZE} bytes"
