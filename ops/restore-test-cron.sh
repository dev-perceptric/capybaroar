#!/usr/bin/env bash
# Monthly restore test, run from cron (ops/README.md, "Test a restore"). It runs `ops/restore.sh test` on a backup,
# checks the dump's checksum against the manifest again on its own, reads one media file, and writes a Markdown result
# (date, backup tested, checksum, row counts, duration, pass or fail) to RESULTS_DIR. Copy that file into the private
# compliance repo as records/restore-test-YYYY-MM-DD.md.
#
# On a pass it calls PING_URL. On a fail it calls PING_URL/fail, emails ALERT_EMAIL, prints a line starting with
# "restore-test: FAILED" and exits 1, so cron mail or the log shipper sees it.
#
# Settings come from the environment, or from RESTORE_TEST_ENV (default /etc/capybaroar/restore-test.env, chmod 600).
# restore.sh itself reads BACKUP_ENV (default /etc/capybaroar/backup.env) for the bucket.
#   AGE_IDENTITY   required. The age private key file that opens the backups.
#   PING_URL       optional. A heartbeat check for this test. Use a different check from backup.sh's PING_URL.
#   ALERT_EMAIL    optional. Who gets the failure email, comma separated.
#   SMTP_HOST, SMTP_PORT (465), SMTP_USER, SMTP_PASS, ALERT_FROM   optional. Mail server for the failure email.
#                  Without SMTP_HOST, a local `sendmail` is used when there is one.
#   RESULTS_DIR    where results go (/var/lib/capybaroar/restore-tests)
#   RESULTS_GROUP  a group that may read the results, so a named sudo user can copy them off (sudo)
#   BACKUP_NAME    the backup to test (latest). FROM=monthly picks from the monthly copies.
#   MAX_AGE_HOURS  "latest" daily backup older than this fails the test, since backups have stopped (48)
#   MEDIA_CHECK    yes (default) reads one random media file from the bucket; no skips it
#   MIN_FREE_GB    free space needed for the download and the scratch database (10)
#   WORK_DIR       where the temporary restore folder goes (/var/tmp). It holds decrypted data and is always deleted.
set -uo pipefail
umask 077

RESTORE_TEST_ENV="${RESTORE_TEST_ENV:-/etc/capybaroar/restore-test.env}"
# shellcheck disable=SC1090
if [ -r "$RESTORE_TEST_ENV" ]; then set -a; . "$RESTORE_TEST_ENV"; set +a; fi

HERE="$(cd "$(dirname "$0")" && pwd)"
RESTORE_SH="${RESTORE_SH:-${HERE}/restore.sh}"
BACKUP_ENV="${BACKUP_ENV:-/etc/capybaroar/backup.env}"
RESULTS_DIR="${RESULTS_DIR:-/var/lib/capybaroar/restore-tests}"
RESULTS_GROUP="${RESULTS_GROUP:-sudo}"
WORK_DIR="${WORK_DIR:-/var/tmp}"
BACKUP_NAME="${BACKUP_NAME:-latest}"
FROM="${FROM:-daily}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-48}"
MEDIA_CHECK="${MEDIA_CHECK:-yes}"
MIN_FREE_GB="${MIN_FREE_GB:-10}"
PING="${PING_URL:-}"
export BACKUP_ENV FROM

log() { echo "$(date -u +%FT%TZ) restore-test: $*"; }

STARTED_AT="$(date -u +%FT%TZ)"
START="$(date +%s)"
mkdir -p "$RESULTS_DIR" && chmod 750 "$RESULTS_DIR"
getent group "$RESULTS_GROUP" >/dev/null 2>&1 && chgrp "$RESULTS_GROUP" "$RESULTS_DIR" 2>/dev/null
RESULT="${RESULTS_DIR}/restore-test-$(date -u +%F).md"
[ -e "$RESULT" ] && RESULT="${RESULTS_DIR}/restore-test-$(date -u +%F-%H%MZ).md"

# The restore folder holds the decrypted dump and the saved secrets: it is always removed.
RESTORE_DIR="$(mktemp -d "${WORK_DIR%/}/capybaroar-restore-test.XXXXXX")" || { echo "restore-test: FAILED: can't make a folder in ${WORK_DIR}" >&2; exit 1; }
export RESTORE_DIR
LOG="${RESTORE_DIR}/restore.log"
: > "$LOG"
trap 'rm -rf "$RESTORE_DIR"' EXIT

# --- Notifying -------------------------------------------------------------------------------------------------

ping_url() { # url
  [ -n "$1" ] || return 0
  curl -fsS -m 10 --retry 3 -o /dev/null "$1" || log "could not reach the heartbeat URL"
}

send_mail() { # subject, body file
  [ -n "${ALERT_EMAIL:-}" ] || return 0
  local subject="$1" body="$2" from="${ALERT_FROM:-${SMTP_USER:-restore-test@$(hostname -f 2>/dev/null || hostname)}}" msg rcpts=() r
  msg="$(mktemp "${RESTORE_DIR}/mail.XXXXXX")"
  {
    printf 'From: %s\r\nTo: %s\r\nSubject: %s\r\nDate: %s\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n' \
      "$from" "$ALERT_EMAIL" "$subject" "$(date -R)"
    sed 's/$/\r/' "$body"
  } > "$msg"
  IFS=',' read -ra rcpts <<< "$ALERT_EMAIL"
  if [ -n "${SMTP_HOST:-}" ]; then
    local port="${SMTP_PORT:-465}" scheme=smtp cfg args=()
    [ "$port" = 465 ] && scheme=smtps
    # The password goes in a config file, never on the command line where `ps` shows it.
    cfg="$(mktemp "${RESTORE_DIR}/curl.XXXXXX")"
    printf 'user = "%s:%s"\n' "$(printf '%s' "${SMTP_USER:-}" | sed 's/[\\"]/\\&/g')" "$(printf '%s' "${SMTP_PASS:-}" | sed 's/[\\"]/\\&/g')" > "$cfg"
    for r in "${rcpts[@]}"; do r="${r// /}"; [ -n "$r" ] && args+=(--mail-rcpt "$r"); done
    curl -sS -m 60 --retry 3 --ssl-reqd --url "${scheme}://${SMTP_HOST}:${port}" -K "$cfg" \
      --mail-from "$from" "${args[@]}" --upload-file "$msg" || log "the failure email could not be sent"
  elif command -v sendmail >/dev/null; then
    sendmail -t < "$msg" || log "the failure email could not be sent"
  else
    log "no way to send email: set SMTP_HOST, or install sendmail"
  fi
}

# --- Checks before starting ------------------------------------------------------------------------------------

PRE_FAIL=""
[ -f "$RESTORE_SH" ] || PRE_FAIL="restore.sh was not found at ${RESTORE_SH}"
[ -z "$PRE_FAIL" ] && { [ -n "${AGE_IDENTITY:-}" ] && [ -r "$AGE_IDENTITY" ] || PRE_FAIL="AGE_IDENTITY is not set or can't be read"; }
export AGE_IDENTITY="${AGE_IDENTITY:-}"
for c in docker rclone age gzip sha256sum curl flock; do
  [ -z "$PRE_FAIL" ] && ! command -v "$c" >/dev/null && PRE_FAIL="$c is not installed"
done
free_gb() { df -Pk "$1" 2>/dev/null | awk 'NR == 2 {print int($4 / 1048576)}'; }
if [ -z "$PRE_FAIL" ]; then
  for d in "$WORK_DIR" "$(docker info -f '{{.DockerRootDir}}' 2>/dev/null || echo /var/lib/docker)"; do
    g="$(free_gb "$d")"
    [ -n "$g" ] && [ "$g" -lt "$MIN_FREE_GB" ] && PRE_FAIL="only ${g} GB free in ${d} (MIN_FREE_GB is ${MIN_FREE_GB})"
  done
fi

# One test at a time, and never while a backup on this machine is still uploading (a half-uploaded backup would be
# picked as "latest"). The backup lock is only waited for, and let go before the test starts.
exec 8>"${WORK_DIR%/}/capybaroar-restore-test.lock"
[ -z "$PRE_FAIL" ] && ! flock -n 8 && PRE_FAIL="another restore test is still running"
if [ -z "$PRE_FAIL" ] && [ -e "${WORK_DIR%/}/capybaroar-backup.lock" ]; then
  exec 9>>"${WORK_DIR%/}/capybaroar-backup.lock"
  flock -w 7200 9 || PRE_FAIL="the nightly backup was still running after 2 hours"
  exec 9>&-
fi

# --- The test --------------------------------------------------------------------------------------------------

RC=1
if [ -z "$PRE_FAIL" ]; then
  log "testing ${BACKUP_NAME} (${FROM}) with ${RESTORE_SH}"
  bash "$RESTORE_SH" test "$BACKUP_NAME" >> "$LOG" 2>&1
  RC=$?
  # The load log can hold DETAIL lines with key values from the data: they stay out of every log and record.
  grep -v 'DETAIL:' "$LOG"
fi
END="$(date +%s)"
SECS=$((END - START))

NAME="$(grep -oE 'downloading capybaroar-[0-9T:-]+Z' "$LOG" | head -n 1 | cut -d' ' -f2)"
MANIFEST="${RESTORE_DIR}/${NAME}.manifest.txt"
REASONS=()
[ -n "$PRE_FAIL" ] && REASONS+=("$PRE_FAIL")
[ -z "$PRE_FAIL" ] && [ "$RC" -ne 0 ] && REASONS+=("restore.sh test exited with ${RC}: $(grep -m 1 'FAILED' "$LOG" | sed 's/^restore: //' || true)")

# The checksum, checked again here from the files restore.sh downloaded.
CHECKSUM="not checked"
if [ -n "$NAME" ] && [ -f "$MANIFEST" ]; then
  ENC="$(ls "${RESTORE_DIR}/${NAME}".sql.gz.* 2>/dev/null | head -n 1)"
  WANT="$(awk '$1 == "dump_sha256" {print $2}' "$MANIFEST")"
  if [ -n "$ENC" ] && [ -n "$WANT" ]; then
    GOT="$(sha256sum "$ENC" | cut -d' ' -f1)"
    if [ "$GOT" = "$WANT" ]; then CHECKSUM="yes (sha256 ${GOT:0:16}...)"; else CHECKSUM="NO: ${GOT:0:16}... is not the manifest's ${WANT:0:16}..."; REASONS+=("the checksum differs from the manifest"); fi
  fi
fi
grep -q "is not the manifest's" "$LOG" && CHECKSUM="NO (restore.sh found a different checksum)"

DUMP_OK="not reached"
grep -q '^restore: ok: ' "$LOG" && DUMP_OK="yes"
grep -qE 'not valid gzip|cut short' "$LOG" && DUMP_OK="NO: $(grep -m 1 -oE 'the (decrypted dump is not valid gzip|dump is cut short)' "$LOG")"

IMAGE="$( [ -f "$MANIFEST" ] && awk '$1 == "container" {print $4}' "$MANIFEST")"
TABLES="-"; ROWS="-"
if [ -f "${RESTORE_DIR}/${NAME}.expected.txt" ]; then
  TABLES="$(wc -l < "${RESTORE_DIR}/${NAME}.expected.txt" | tr -d ' ')"
  ROWS="$(awk '{s += $3} END {print s + 0}' "${RESTORE_DIR}/${NAME}.expected.txt")"
fi
COUNTS="not compared"
grep -q 'row counts match the manifest' "$LOG" && COUNTS="all ${TABLES} tables match"
grep -q 'only Supabase bookkeeping tables differ' "$LOG" && COUNTS="app tables match; only Supabase bookkeeping tables differ (below)"
grep -q 'row counts differ for app tables' "$LOG" && COUNTS="NO: app tables differ (below)"
FAILED_STMTS="$(grep -oE '^restore: [0-9]+ statements failed' "$LOG" | grep -oE '[0-9]+' | head -n 1)"
DIFF=""
[ -s "${RESTORE_DIR}/${NAME}.diff" ] && DIFF="$(grep -E '^[-+]rows ' "${RESTORE_DIR}/${NAME}.diff")"

# A "latest" daily backup that is old means the nightly backup stopped.
AGE="-"
if [ -n "$NAME" ]; then
  s="${NAME#capybaroar-}"
  t="$(date -u -d "${s:0:10} ${s:11:2}:${s:13:2}" +%s 2>/dev/null || true)"
  if [ -n "$t" ]; then
    AGE="$(( (END - t) / 3600 )) hours"
    if [ "$BACKUP_NAME" = latest ] && [ "$FROM" = daily ] && [ $(( (END - t) / 3600 )) -gt "$MAX_AGE_HOURS" ]; then
      REASONS+=("the newest daily backup is ${AGE} old (more than ${MAX_AGE_HOURS})")
    fi
  fi
fi

# One random media file from the bucket, read back without saving it. Its path stays out of the record.
MEDIA="not reached"
[ "$MEDIA_CHECK" = yes ] || MEDIA="skipped (MEDIA_CHECK=no)"
if [ "$MEDIA_CHECK" = yes ] && [ -z "$PRE_FAIL" ]; then
  eval "$(set +u; set -a; [ -r "$BACKUP_ENV" ] && . "$BACKUP_ENV" >/dev/null 2>&1; printf 'B_REMOTE=%q\nB_MEDIA=%q\n' "${RCLONE_REMOTE:-}" "${MEDIA_REMOTE:-}")"
  MREM="${B_MEDIA:-${B_REMOTE%/}/media}"
  if [ -z "$B_REMOTE" ] && [ -z "$B_MEDIA" ]; then
    MEDIA="NO: RCLONE_REMOTE is not set"; REASONS+=("media check: RCLONE_REMOTE is not set")
  else
    f="$(rclone lsf -R --files-only --max-depth 8 "${MREM%/}/current" 2>>"$LOG" | head -n 500 | shuf -n 1)"
    if [ -z "$f" ]; then
      MEDIA="NO: no media files found in ${MREM%/}/current"; REASONS+=("no media files found in the bucket")
    else
      bytes="$(rclone cat --head 65536 "${MREM%/}/current/${f}" 2>>"$LOG" | wc -c | tr -d ' ')"
      kind="$(command -v file >/dev/null && rclone cat --head 65536 "${MREM%/}/current/${f}" 2>/dev/null | file -b - | cut -c1-60)"
      if [ "${bytes:-0}" -gt 0 ]; then MEDIA="yes: one random file read back (${bytes} bytes${kind:+, ${kind}})"; else MEDIA="NO: a media file came back empty"; REASONS+=("a media file came back empty"); fi
    fi
  fi
fi

if [ "${#REASONS[@]}" -eq 0 ]; then RESULT_WORD=PASS; else RESULT_WORD=FAIL; fi

# --- The record ------------------------------------------------------------------------------------------------

{
  echo "# Restore test $(date -u +%F)"
  echo
  echo "Status: Record | Result: ${RESULT_WORD} | Host: $(hostname) | Made by: ops/restore-test-cron.sh"
  echo
  echo "| Item | Result |"
  echo "|---|---|"
  echo "| Started (UTC) | ${STARTED_AT} |"
  echo "| Backup tested | ${NAME:-none} (${FROM}) |"
  echo "| Backup age at test | ${AGE} |"
  echo "| Postgres image | ${IMAGE:--} |"
  echo "| Checksum matches the manifest | ${CHECKSUM} |"
  echo "| Decrypts to a complete dump | ${DUMP_OK} |"
  echo "| Row counts compared | ${COUNTS} (${TABLES} tables, ${ROWS} rows in the manifest) |"
  echo "| Statements that failed during the load | ${FAILED_STMTS:--} (\"already exists\" errors are expected) |"
  echo "| Media file | ${MEDIA} |"
  echo "| Duration | $((SECS / 60)) min $((SECS % 60)) s |"
  echo "| Result | **${RESULT_WORD}** |"
  echo
  if [ "${#REASONS[@]}" -gt 0 ]; then
    echo "## Why it failed"
    echo
    for r in "${REASONS[@]}"; do echo "- ${r}"; done
    echo
  fi
  echo "## Row count differences"
  echo
  if [ -n "$DIFF" ]; then echo '```diff'; echo "$DIFF"; echo '```'; else echo "None."; fi
  echo
  echo "## restore.sh output"
  echo
  echo '```text'
  grep -v 'DETAIL:' "$LOG" | grep -E '^restore: |^ +[0-9]+ .*ERROR' | cut -c1-300 | head -n 80
  echo '```'
  echo
  echo "## Review"
  echo
  echo "- [ ] Result read by: [name], [YYYY-MM-DD]"
  echo "- Fixes made:"
} > "$RESULT"
chmod 640 "$RESULT"
getent group "$RESULTS_GROUP" >/dev/null 2>&1 && chgrp "$RESULTS_GROUP" "$RESULT" 2>/dev/null
log "${RESULT_WORD}: ${NAME:-no backup} in ${SECS} s; result in ${RESULT}"

if [ "$RESULT_WORD" = PASS ]; then
  ping_url "$PING"
  exit 0
fi
ping_url "${PING:+${PING%/}/fail}"
send_mail "Capybaroar restore test FAILED on $(hostname)" "$RESULT"
echo "restore-test: FAILED: ${REASONS[*]}" >&2
exit 1
