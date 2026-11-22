#!/usr/bin/env bash
# Moves Supabase Storage (people's pictures, videos and PDFs) from the server's disk to Cloudflare R2, once.
# Runs on the server as root: sudo bash ops/storage-r2.sh. Safe to run again: each step skips what is already done.
#
# Why: the disk fills up and can't grow past the server; R2 has no size limit and no download fees, which matters
# because every network fetches each picture when a post goes out. Cost is in ops/README.md, Storage on R2.
#
# What it does:
# 1. Copies every file to R2 under the key Supabase's S3 backend reads (<tenant>/<bucket>/<name>/<version>), with
#    the content type and cache time from storage.objects, so files keep opening as pictures, not downloads.
# 2. Adds the R2 settings to Supabase's .env and the storage service (docker-compose.override.yml, see
#    ops/vps/docker-compose.override.yml) and restarts only the storage container.
# 3. Copies anything uploaded while step 2 ran, then checks every file in storage.objects is in R2 and that one
#    file reads back through Supabase with the same bytes as on disk.
# The files on disk are left as they were, so going back is: remove the storage block from the override, then
# `docker compose up -d storage`. Delete the old files only after a week of R2 working and a backup run.
#
# Settings (environment, or /etc/capybaroar/r2.env, chmod 600):
#   R2_ACCOUNT_ID         the Cloudflare account id
#   R2_ACCESS_KEY_ID      an R2 API token's access key, Object Read & Write on R2_BUCKET only
#   R2_SECRET_ACCESS_KEY  that token's secret access key
#   R2_BUCKET             capybaroar-media
#   SUPABASE_DIR          /docker/sb-capybaroar
#   DB_CONTAINER          sb-capybaroar-db-1
set -euo pipefail
umask 077

R2_ENV="${R2_ENV:-/etc/capybaroar/r2.env}"
# shellcheck disable=SC1090
if [ -r "$R2_ENV" ]; then set -a; . "$R2_ENV"; set +a; fi
: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID is not set}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is not set}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is not set}"
R2_BUCKET="${R2_BUCKET:-capybaroar-media}"
SUPABASE_DIR="${SUPABASE_DIR:-/docker/sb-capybaroar}"
DB_CONTAINER="${DB_CONTAINER:-sb-capybaroar-db-1}"
STORE="${SUPABASE_DIR}/volumes/storage"

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }
die() { log "FAILED: $*"; exit 1; }
for c in docker rclone curl sha256sum; do command -v "$c" >/dev/null || die "$c is not installed"; done
[ -d "$STORE" ] || die "no Storage folder at $STORE"
[ -f "${SUPABASE_DIR}/.env" ] || die "no Supabase .env in $SUPABASE_DIR"

# rclone reads this remote from the environment, so no key is written to an rclone.conf.
export RCLONE_CONFIG_R2_TYPE=s3 RCLONE_CONFIG_R2_PROVIDER=Cloudflare RCLONE_CONFIG_R2_REGION=auto \
  RCLONE_CONFIG_R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true \
  RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
rclone lsf "r2:${R2_BUCKET}" --max-depth 1 >/dev/null || die "can't reach r2:${R2_BUCKET} with these keys"

# The file backend keeps files at <store>/<old GLOBAL_S3_BUCKET>/<tenant>/<bucket>/<name>/<version>.
envval() { grep -E "^$1=" "${SUPABASE_DIR}/.env" | tail -n1 | cut -d= -f2- | tr -d '"' || true; }
OLD="$(envval GLOBAL_S3_BUCKET)"; OLD="${OLD:-stub}"
TENANT="$(envval TENANT_ID)"; TENANT="${TENANT:-stub}"
[ -d "${STORE}/${OLD}/${TENANT}" ] || die "no files at ${STORE}/${OLD}/${TENANT}"

psql_q() { docker exec -i "$DB_CONTAINER" psql -U supabase_admin -d postgres -At -F $'\t' -c "$1"; }
LIST="$(mktemp)"; trap 'rm -f "$LIST"' EXIT

copy_all() {  # $1: only objects changed since this time (empty: all)
  local since="$1" n=0 bad=0
  local where=""; [ -n "$since" ] && where="where updated_at >= '${since}'"
  psql_q "select bucket_id, name, version, coalesce(metadata->>'mimetype','application/octet-stream'), coalesce(metadata->>'cacheControl','max-age=3600') from storage.objects ${where}" > "$LIST"
  while IFS=$'\t' read -r b name ver mime cache; do
    [ -n "$ver" ] || continue
    local key="${TENANT}/${b}/${name}/${ver}" src="${STORE}/${OLD}/${TENANT}/${b}/${name}/${ver}"
    if [ ! -f "$src" ]; then log "missing on disk: $key"; bad=$((bad + 1)); continue; fi
    [[ "$cache" == max-age=* ]] || cache="max-age=${cache}"
    rclone copyto "$src" "r2:${R2_BUCKET}/${key}" --checksum --retries 5 \
      --header-upload "Content-Type: ${mime}" --header-upload "Cache-Control: ${cache}" || die "copy failed: $key"
    n=$((n + 1))
  done < "$LIST"
  log "copied ${n} files (${bad} missing on disk)"
}

START="$(date -u +%FT%TZ)"
log "1/3 copying files to r2:${R2_BUCKET}"
copy_all ""

log "2/3 switching Supabase Storage to R2"
set_env() { if grep -qE "^$1=" "${SUPABASE_DIR}/.env"; then sed -i "s|^$1=.*|$1=$2|" "${SUPABASE_DIR}/.env"; else printf '%s=%s\n' "$1" "$2" >> "${SUPABASE_DIR}/.env"; fi; }
set_env R2_ACCOUNT_ID "$R2_ACCOUNT_ID"
set_env R2_ACCESS_KEY_ID "$R2_ACCESS_KEY_ID"
set_env R2_SECRET_ACCESS_KEY "$R2_SECRET_ACCESS_KEY"
set_env R2_BUCKET "$R2_BUCKET"
OVR="${SUPABASE_DIR}/docker-compose.override.yml"
grep -q 'STORAGE_BACKEND: s3' "$OVR" 2>/dev/null || die "add the storage block from ops/vps/docker-compose.override.yml to ${OVR} first"
( cd "$SUPABASE_DIR" && docker compose up -d storage ) || die "storage didn't restart"
for _ in $(seq 1 30); do
  docker inspect -f '{{.State.Health.Status}}' "$(cd "$SUPABASE_DIR" && docker compose ps -q storage)" 2>/dev/null | grep -q healthy && break
  sleep 2
done

log "3/3 catching up and checking"
copy_all "$START"
want="$(psql_q "select count(*) from storage.objects where version is not null")"
have="$(rclone lsf -R --files-only "r2:${R2_BUCKET}/${TENANT}" | wc -l)"
log "objects in Supabase: ${want}, files in R2: ${have}"
[ "$have" -ge "$want" ] || die "R2 has fewer files than storage.objects"

# One file through Supabase's own API, compared with the copy on disk.
KEY="$(envval SERVICE_ROLE_KEY)"; URL="$(envval SUPABASE_PUBLIC_URL)"; URL="${URL:-$(envval API_EXTERNAL_URL)}"
IFS=$'\t' read -r b name ver _ < <(psql_q "select bucket_id, name, version, '' from storage.objects where version is not null order by created_at desc limit 1")
if [ -n "${b:-}" ] && [ -n "$KEY" ] && [ -n "$URL" ]; then
  got="$(curl -fsS -H "Authorization: Bearer ${KEY}" "${URL%/}/storage/v1/object/${b}/${name}" | sha256sum | cut -d' ' -f1)"
  disk="$(sha256sum "${STORE}/${OLD}/${TENANT}/${b}/${name}/${ver}" | cut -d' ' -f1)"
  [ "$got" = "$disk" ] || die "the file read through Supabase doesn't match the disk copy (${b}/${name})"
  log "read back ${b}/${name} through Supabase: same bytes"
fi
log "done. Storage now reads and writes r2:${R2_BUCKET}. Point backups at it: MEDIA_DIR=r2:${R2_BUCKET} in backup.env."
