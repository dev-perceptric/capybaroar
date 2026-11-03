#!/bin/sh
# Proves the newest backup can be read: downloads it from the private "backups" bucket and lists what is in it with
# pg_restore --list. Nothing is restored anywhere. Runs in postgres:17-alpine with SUPABASE_URL and
# SUPABASE_SERVICE_KEY. Set KEEP_FILE=/path to keep the download (for a real restore, see ops/README.md).
set -eu

: "${SUPABASE_URL:?SUPABASE_URL is not set}"
: "${SUPABASE_SERVICE_KEY:?SUPABASE_SERVICE_KEY is not set}"
API="${SUPABASE_URL%/}/storage/v1"
BUCKET=backups

need() { command -v "$1" >/dev/null 2>&1; }
if ! need curl || ! need jq; then apk add --no-cache curl jq >/dev/null; fi
auth() { printf 'Authorization: Bearer %s' "$SUPABASE_SERVICE_KEY"; }
key() { printf 'apikey: %s' "$SUPABASE_SERVICE_KEY"; }

LIST="$(curl -fsS -X POST "${API}/object/list/${BUCKET}" -H "$(auth)" -H "$(key)" -H "Content-Type: application/json" \
  -d '{"prefix":"db","limit":1000,"offset":0,"sortBy":{"column":"name","order":"asc"}}')"
NEWEST="$(echo "$LIST" | jq -r '[.[] | .name | select(startswith("capybaroar-"))] | sort | last // empty')"
if [ -z "$NEWEST" ]; then
  echo "restore-check: no backups found"
  exit 1
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
FILE="${KEEP_FILE:-${WORK}/${NEWEST}}"
curl -fsS "${API}/object/authenticated/${BUCKET}/db/${NEWEST}" -H "$(auth)" -H "$(key)" -o "$FILE"

pg_restore --list "$FILE" > "${WORK}/list.txt"
TABLES="$(grep -cE '^[0-9]+; [0-9]+ [0-9]+ TABLE public ' "${WORK}/list.txt" || true)"
DATA="$(grep -cE '^[0-9]+; [0-9]+ [0-9]+ TABLE DATA public ' "${WORK}/list.txt" || true)"
echo "restore-check: ${NEWEST}, $(wc -c < "$FILE" | tr -d ' ') bytes, ${TABLES} tables, ${DATA} with data"
[ "$TABLES" -gt 0 ] || { echo "restore-check: no tables in the backup"; exit 1; }
echo "restore-check: ok"
