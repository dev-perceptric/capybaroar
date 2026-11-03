# Ops

Running Capybaroar in production: two web machines, the health check, error tracking and database backups.

## Two machines

The publisher runs inside every web machine (`src/instrumentation.ts` starts `src/lib/runner.ts`). Running two is safe:

- Publish, stats and Inbox jobs are claimed with `for update skip locked`. A job a machine is still working on keeps
  its lock (`keep_locks`, every minute), so a long video upload is never taken over by the other machine after the
  10-minute crash timeout. A machine that dies stops refreshing, and its jobs are taken over 10 minutes later.
- The 10-minute Inbox queue and the hourly upkeep (token refresh, follower counts, error cleanup) run on whichever
  machine takes that period's turn first (`take_turn` in `supabase/migrations/012_ops.sql`). A run that is still
  going blocks the next one until it ends, or until its lease runs out if the machine died.
- Failure and reconnect emails are sent once (the `alerts` table); error emails once an hour per error
  (`record_error`).

`tests/ops.test.ts` races two and three runners against an in-memory database to prove this.

```sh
fly scale count 2 --app capybaroar-web --region iad
```

## Health

`GET /api/health` (also `HEAD`) runs one query with a 2-second timeout that reads this machine's runner beat, and
answers `200 {"ok":true,"db":"ok","runner":"ok","lastBeatSecondsAgo":12,"version":"..."}`, or `503` when the
database doesn't answer or the runner hasn't beaten for 3 minutes. Fly's http check uses it (`fly.toml`).

Outside monitor: point UptimeRobot or Better Stack at `https://app.capybaroar.com/api/health`, every 1 to 5 minutes,
alerting on anything but 200 (or on the keyword `"ok":true`). Each request reaches one of the two machines.

## Errors

Server errors (Next's `onRequestError`, plus the runner's loops) go to `app_errors`, one row per fingerprint with a
count, first and last seen, the last route, machine and a trimmed stack. Tokens, keys and passwords are scrubbed
first. With `SMTP_HOST` and `ALERT_EMAIL` set, each error emails at most once an hour. Rows not seen for 30 days are
deleted by upkeep.

```sh
fly secrets set ALERT_EMAIL=ops@example.com --app capybaroar-web   # several: a,b
```

Read them in the Supabase SQL editor:

```sql
select last_seen, count, route, message from app_errors order by last_seen desc limit 50;
```

## Backups

`ops/backup.sh` dumps the `public` schema (tables, data, functions, policies and grants) in pg_dump's custom format,
checks the file reads back, uploads it to the private Storage bucket `backups` as
`db/capybaroar-YYYY-MM-DDTHHMMZ.dump`, and deletes backups older than 14 days (never the newest). It runs in
`postgres:17-alpine` and installs `curl` and `jq` itself.

Not in the dump:

- Media files. The `media` bucket is counted (files and size, printed in the log) but not copied: it is too big for
  a daily dump. Turn on Storage backups in Supabase, or copy the bucket separately, if you need it.
- The `auth` schema (sign-ins). Restoring into the same project keeps them. For a new project, also dump users:
  `pg_dump "$DB_URL" --data-only --table=auth.users --table=auth.identities -Fc -f auth.dump`.

### Schedule it (once)

The bucket comes from migration 012. Then set the secrets on the app that runs the job, staged so its web machines
don't restart, and create the scheduled machine. The machine starts once a day, runs the script and stops.

```sh
APP=capybaroar-site
fly secrets set --stage --app $APP PW='<database password>' \
  SUPABASE_URL=https://txaqthvlpjzzyyrszbdd.supabase.co SUPABASE_SERVICE_KEY='<service role key>'
# optional: PING_URL=<a heartbeat monitor's address>, called only after a good backup

fly machine run postgres:17-alpine sh /ops/backup.sh \
  --app $APP --name db-backup --region iad --schedule daily \
  --vm-size shared-cpu-1x --vm-memory 512 \
  --file-local /ops/backup.sh=ops/backup.sh
```

App secrets reach every machine in an app, so the database password and service key are also visible to
`capybaroar-site`'s own machines. A separate app keeps them apart: `fly apps create capybaroar-ops` and use
`APP=capybaroar-ops`.

Run it now and watch it: `fly machine start <id> --app $APP` and `fly logs --app $APP`.

The direct database host (`db.txaqthvlpjzzyyrszbdd.supabase.co`) is IPv6 only unless the project has the IPv4
add-on; Fly machines have IPv6. Anywhere without IPv6, set `DB_URL` to the session pooler from the Supabase dashboard
(Connect, Session pooler, port 5432).

### Check a backup is readable

```sh
fly machine run postgres:17-alpine sh /ops/restore-check.sh --app $APP --region iad --rm \
  --file-local /ops/restore-check.sh=ops/restore-check.sh
```

It downloads the newest backup, runs `pg_restore --list` and prints its size and table count. Nothing is restored.

### Restore

1. Download the backup to keep (needs pg_restore 17 or newer, or run in `postgres:17-alpine`):
   `SUPABASE_URL=... SUPABASE_SERVICE_KEY=... KEEP_FILE=./restore.dump sh ops/restore-check.sh`
2. Stop the publisher so nothing writes while you restore: `fly scale count 0 --app capybaroar-web`.
3. One table back (keeps everything else):
   `pg_restore --dbname="$DB_URL" --data-only --table=posts --no-owner restore.dump` (empty the table first, or restore
   into a scratch database and copy the rows you need).
4. The whole schema back (replaces every table in `public`):
   `pg_restore --dbname="$DB_URL" --clean --if-exists --no-owner --single-transaction --schema=public restore.dump`
5. Start again: `fly scale count 2 --app capybaroar-web`, then check `/api/health`.

`$DB_URL` is `postgresql://postgres:$PW@db.txaqthvlpjzzyyrszbdd.supabase.co:5432/postgres`.
