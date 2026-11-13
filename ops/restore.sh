#!/usr/bin/env bash
# Restores a backup made by ops/backup.sh. Run it where the age private key is (your computer, or the VPS with the
# key copied in for the restore and deleted after). Reads the same settings as backup.sh (BACKUP_ENV), plus:
#   AGE_IDENTITY   the age private key file (or GPG for .gpg backups: gpg's own keyring is used)
#   RESTORE_DIR    where downloads and decrypted files go (./restore)
#
#   ops/restore.sh list                      backups on the remote, daily and monthly
#   ops/restore.sh fetch  [NAME|latest]      download, check the checksum against the manifest, decrypt
#   ops/restore.sh config [NAME|latest]      unpack the saved .env and compose files into RESTORE_DIR/config
#   ops/restore.sh test   [NAME|latest]      restore into a throwaway container (no network) from the same
#                                            Postgres image and compare row counts with the manifest
#   ops/restore.sh load CONTAINER [NAME]     restore into CONTAINER, a FRESHLY created Supabase db (see README).
#                                            Needs CONFIRM=yes.
#   ops/restore.sh media [TARGET_DIR]        copy media/current back (to MEDIA_DIR by default). Needs CONFIRM=yes.
#
# NAME is like capybaroar-2026-11-13T0317Z; "latest" (the default) is the newest daily one. Set FROM=monthly to pick
# from the monthly copies.
set -euo pipefail
umask 077

BACKUP_ENV="${BACKUP_ENV:-/etc/capybaroar/backup.env}"
# shellcheck disable=SC1090
if [ -r "$BACKUP_ENV" ]; then set -a; . "$BACKUP_ENV"; set +a; fi
: "${RCLONE_REMOTE:?RCLONE_REMOTE is not set (e.g. b2:capybaroar-backups)}"
REMOTE="${RCLONE_REMOTE%/}"
FROM="${FROM:-daily}"
RESTORE_DIR="${RESTORE_DIR:-./restore}"
PG_USER="${PG_USER:-supabase_admin}"
SUPABASE_DIR="${SUPABASE_DIR:-/docker/sb-capybaroar}"
MEDIA_DIR="${MEDIA_DIR-${SUPABASE_DIR}/volumes/storage}"
MEDIA_REMOTE="${MEDIA_REMOTE:-${REMOTE}/media}"

log() { echo "restore: $*" >&2; }
die() { log "FAILED: $*"; exit 1; }
mkdir -p "$RESTORE_DIR"

pick() {
  local want="${1:-latest}"
  if [ "$want" = latest ]; then
    want="$(rclone lsf --files-only "${REMOTE}/db/${FROM}/" | grep -oE '^capybaroar-[0-9T:-]+Z' | sort -u | tail -n 1)" || true
    [ -n "$want" ] || die "no backups in ${REMOTE}/db/${FROM}/"
  fi
  echo "$want"
}

decrypt() { # in out
  case "$1" in
    *.age) : "${AGE_IDENTITY:?set AGE_IDENTITY to the age private key file}"; age -d -i "$AGE_IDENTITY" -o "$2" "$1" ;;
    *.gpg) gpg --batch --yes -o "$2" -d "$1" ;;
    *) die "unknown file type: $1" ;;
  esac
}

# Downloads NAME and leaves RESTORE_DIR/NAME.sql.gz (decrypted, still gzip) and NAME.manifest.txt. Prints the name.
fetch() {
  local name enc sum want
  name="$(pick "${1:-latest}")"
  log "downloading ${name} from ${REMOTE}/db/${FROM}/"
  rclone copy --retries 5 --include "${name}.*" "${REMOTE}/db/${FROM}/" "$RESTORE_DIR/"
  enc="$(ls "$RESTORE_DIR/${name}".sql.gz.* 2>/dev/null | head -n 1)"
  [ -n "$enc" ] || die "${name} has no dump file"
  want="$(awk '$1 == "dump_sha256" {print $2}' "$RESTORE_DIR/${name}.manifest.txt")"
  sum="$(sha256sum "$enc" | cut -d' ' -f1)"
  [ "$sum" = "$want" ] || die "checksum ${sum} is not the manifest's ${want}"
  decrypt "$enc" "$RESTORE_DIR/${name}.sql.gz"
  gzip -t "$RESTORE_DIR/${name}.sql.gz" || die "the decrypted dump is not valid gzip"
  gunzip -c "$RESTORE_DIR/${name}.sql.gz" | tail -c 512 | grep -q "PostgreSQL database cluster dump complete" || die "the dump is cut short"
  log "ok: $RESTORE_DIR/${name}.sql.gz"
  echo "$name"
}

unpack_config() { # name -> RESTORE_DIR/config
  local enc
  enc="$(ls "$RESTORE_DIR/${1}".config.tar.gz.* 2>/dev/null | head -n 1)"
  [ -n "$enc" ] || { log "no config saved with ${1}"; return 1; }
  decrypt "$enc" "$RESTORE_DIR/${1}.config.tar.gz"
  mkdir -p "$RESTORE_DIR/config"
  tar -xzf "$RESTORE_DIR/${1}.config.tar.gz" -C "$RESTORE_DIR/config"
  log "config unpacked in $RESTORE_DIR/config (contains secrets: delete it when done)"
}

in_c() { local c="$1"; shift; docker exec -i "$c" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" exec "$@"' sh "$@"; }

# Loads NAME's dump into container C with psql. Errors such as "already exists" are expected (the Supabase image
# creates its own roles and schemas first); they are counted and kept in a log.
load_into() { # container name
  local c="$1" name="$2" logf="$RESTORE_DIR/${2}.load.log"
  log "loading ${name} into ${c} (log: ${logf})"
  gunzip -c "$RESTORE_DIR/${name}.sql.gz" \
    | in_c "$c" psql -h 127.0.0.1 -U "$PG_USER" -d postgres -q -v ON_ERROR_STOP=0 > /dev/null 2> "$logf" || true
  log "$(grep -c 'ERROR' "$logf" || true) statements failed; the first ones:"
  grep 'ERROR' "$logf" | sort | uniq -c | sort -rn | head -n 15 >&2 || true
}

COUNTS_SQL="select 'rows ' || n.nspname || '.' || c.relname, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r', 'p') and n.nspname in ('public', 'auth', 'storage') order by 1"

compare() { # container name
  local c="$1" name="$2" bad
  in_c "$c" psql -h 127.0.0.1 -U "$PG_USER" -d postgres -At -F ' ' -c "$COUNTS_SQL" > "$RESTORE_DIR/${name}.restored.txt"
  grep '^rows ' "$RESTORE_DIR/${name}.manifest.txt" > "$RESTORE_DIR/${name}.expected.txt"
  if diff -u "$RESTORE_DIR/${name}.expected.txt" "$RESTORE_DIR/${name}.restored.txt" > "$RESTORE_DIR/${name}.diff"; then
    log "row counts match the manifest for $(wc -l < "$RESTORE_DIR/${name}.expected.txt") tables"
    return 0
  fi
  cat "$RESTORE_DIR/${name}.diff" >&2
  # public.* and auth.users must match; migration bookkeeping tables the image fills itself may differ.
  bad="$(grep -E '^[-+]rows (public\.|auth\.users |auth\.identities |storage\.objects |storage\.buckets )' "$RESTORE_DIR/${name}.diff" || true)"
  [ -z "$bad" ] || die "row counts differ for app tables"
  log "only Supabase bookkeeping tables differ (shown above)"
}

cmd="${1:-}"; shift || true
case "$cmd" in
  list)
    for d in daily monthly; do echo "== ${d}"; rclone lsl "${REMOTE}/db/${d}/" --include '*.sql.gz.*' | sort -k4; done
    ;;
  fetch)
    fetch "${1:-latest}" >/dev/null
    ;;
  config)
    name="$(pick "${1:-latest}")"
    rclone copy --include "${name}.config.*" "${REMOTE}/db/${FROM}/" "$RESTORE_DIR/"
    unpack_config "$name"
    ;;
  test)
    command -v docker >/dev/null || die "docker is needed for a test restore"
    name="$(fetch "${1:-latest}")"
    image="$(awk '$1 == "container" {print $4}' "$RESTORE_DIR/${name}.manifest.txt")"
    [ -n "$image" ] || die "the manifest names no image"
    # The dump sets every role's password to production's, so the scratch server is given the same POSTGRES_PASSWORD
    # (from the saved .env, or RESTORE_PG_PASSWORD) to keep signing in during the load.
    pw="${RESTORE_PG_PASSWORD:-}"
    if [ -z "$pw" ] && unpack_config "$name" 2>/dev/null; then
      envf="$(find "$RESTORE_DIR/config" -path "*${SUPABASE_DIR%/}/.env" | head -n 1)"
      [ -n "$envf" ] && pw="$(grep -m 1 '^POSTGRES_PASSWORD=' "$envf" | cut -d= -f2- | tr -d '"'"'")"
    fi
    [ -n "$pw" ] || die "set RESTORE_PG_PASSWORD (production's POSTGRES_PASSWORD): no saved .env was found"
    c="capybaroar-restore-test-$$"
    trap 'docker rm -f "$c" >/dev/null 2>&1 || true' EXIT
    log "starting ${image} as ${c} (no network)"
    docker run -d --name "$c" --network none -e POSTGRES_PASSWORD="$pw" -e JWT_SECRET="$(head -c 32 /dev/urandom | base64)" \
      -e JWT_EXP=3600 "$image" postgres -c config_file=/etc/postgresql/postgresql.conf >/dev/null
    for _ in $(seq 1 120); do
      docker exec "$c" pg_isready -h 127.0.0.1 -q 2>/dev/null && break
      sleep 2
    done
    docker exec "$c" pg_isready -h 127.0.0.1 -q || die "the scratch database did not start: $(docker logs --tail 20 "$c" 2>&1)"
    sleep 5 # the image restarts Postgres once after its first-run scripts
    docker exec "$c" pg_isready -h 127.0.0.1 -q || sleep 10
    load_into "$c" "$name"
    compare "$c" "$name"
    log "test restore of ${name} passed"
    ;;
  load)
    c="${1:?name the target container}"
    [ "${CONFIRM:-}" = yes ] || die "this writes into ${c}; run again with CONFIRM=yes"
    name="$(fetch "${2:-latest}")"
    load_into "$c" "$name"
    compare "$c" "$name"
    log "restored ${name} into ${c}"
    ;;
  media)
    target="${1:-$MEDIA_DIR}"
    [ -n "$target" ] || die "name a target folder"
    [ "${CONFIRM:-}" = yes ] || die "this copies into ${target}; run again with CONFIRM=yes"
    rclone copy --retries 5 --fast-list -P "${MEDIA_REMOTE%/}/current" "$target"
    log "media copied to ${target}"
    ;;
  *)
    sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
    exit 2
    ;;
esac
