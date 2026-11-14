# Ops

Running Capybaroar in production on the VPS (45.90.109.7): the app and homepage containers pulled from the images CI
builds (`.github/workflows/build-images.yml`), the self-hosted Supabase in `/docker/sb-capybaroar`, and Caddy in
front. Server hardening is in `ops/vps/CHECKLIST.md`.

## More than one app container

The publisher runs inside every app container (`src/instrumentation.ts` starts `src/lib/runner.ts`). Running two is
safe:

- Publish, stats and Inbox jobs are claimed with `for update skip locked`. A job a container is still working on
  keeps its lock (`keep_locks`, every minute), so a long video upload is never taken over by the other one after the
  10-minute crash timeout. A container that dies stops refreshing, and its jobs are taken over 10 minutes later.
- The 10-minute Inbox queue and the hourly upkeep (token refresh, follower counts, error cleanup) run on whichever
  container takes that period's turn first (`take_turn` in `supabase/migrations/012_ops.sql`).
- Failure and reconnect emails are sent once (the `alerts` table); error emails once an hour per error.

`tests/ops.test.ts` races two and three runners against an in-memory database to prove this.

## Health

`GET /api/health` (also `HEAD`) runs one query with a 2-second timeout that reads this container's runner beat, and
answers `200 {"ok":true,"db":"ok","runner":"ok",...}`, or `503` when the database doesn't answer or the runner hasn't
beaten for 3 minutes. Use it as the container's healthcheck and point an outside monitor (UptimeRobot, Better Stack)
at `https://app.capybaroar.com/api/health` every 1 to 5 minutes.

## Errors

Server errors go to `app_errors`, one row per fingerprint with a count, first and last seen, the route and a trimmed
stack, with tokens and keys scrubbed. With `SMTP_HOST` and `ALERT_EMAIL` in the app's environment, each error emails
at most once an hour. Read them in Studio (`ssh -L 3000:127.0.0.1:3000 root@45.90.109.7`, then
http://localhost:3000, SQL editor):

```sql
select last_seen, count, route, message from app_errors order by last_seen desc limit 50;
```

## Encryption keys

Channel tokens, link tokens and webhook secrets are sealed with AES-256-GCM (`src/lib/sealing.ts`). Values carry the
id of their key (`v2.<kid>....`); the original `v1....` values still open with `TOKEN_KEY`.

- `TOKEN_KEY`: the original key, kid `v1`. Keep it set while any v1 value or `v2.v1` value exists (the health check
  and the runner also look for it).
- `TOKEN_KEYS="k2026a:<base64>,..."`: more keys, 32 random bytes each (`openssl rand -base64 32`).
- `TOKEN_KEY_CURRENT=k2026a`: the key new values are sealed with (default `v1`).
- `BIO_SALT`: its own random value for link-in-bio visitor hashes (`openssl rand -base64 32`). Without it the hash
  falls back to `TOKEN_KEY`, so set it before you ever retire that key.

Rotating: add the new key to `TOKEN_KEYS` on every app container and restart; set `TOKEN_KEY_CURRENT` to it and
restart; run `npx tsx scripts/rotate-token-key.mjs` (dry run, counts values per key), then with `--apply`, then once
more to see nothing left; only then remove the old key. Back up first (below), since a value sealed only with a
removed key can't be opened again.

## Backups

`ops/backup.sh` runs on the VPS from cron every night:

1. `pg_dumpall` of the whole cluster inside the Supabase Postgres container (`DB_CONTAINER`, default
   `sb-capybaroar-db-1`): every schema, so `public`, `auth` (sign-ins) and `storage` (file metadata), plus roles and
   grants. It is gzipped and encrypted to an age public key as it streams, so plain SQL never lands on disk and the
   server can't decrypt any backup.
2. The Supabase `.env` and compose files (JWT secret, keys, passwords) and `EXTRA_FILES` (the app's env file, with
   `TOKEN_KEY`) in one encrypted tarball. A restored database is no use without them.
3. A plain manifest with the dump's size, checksum, the Postgres image, and the row count of every table in `public`,
   `auth` and `storage`.
4. rclone uploads them to `db/daily/` (newest 30 kept) and, on the first run of each month, `db/monthly/` (newest 12).
5. `rclone sync` of the Storage files volume (`MEDIA_DIR`) to `media/current/`. Files deleted or replaced on the
   server move to `media/deleted/<date>/` and stay 30 days.
6. `PING_URL` is called only when all of that worked: point a heartbeat monitor (Healthchecks.io, Better Stack) at it
   so a missed night alerts you.

### Storage (once)

Backblaze B2, or any S3 store with object lock:

1. Create a private bucket `capybaroar-backups` with **Object Lock on** (only possible when creating it) and a default
   retention of 30 days. Add a lifecycle rule "Keep only the last version" (hidden versions are removed 1 day after
   their lock ends). With the lock, nothing on the server can destroy a backup younger than 30 days, even with the key.
2. Create an application key for that bucket only, with `listBuckets, listFiles, readFiles, writeFiles` and **without**
   `deleteFiles`: the script's deletes only hide files.

### Install on the VPS (once)

```sh
apt-get install -y age rclone                      # rclone 1.60 or newer
age-keygen -o capybaroar-backup.key                # ON YOUR COMPUTER, not the server. Keep this file in your password
                                                   # manager and one offline copy; it is the only way to read backups.
                                                   # It prints the public key (age1...).
rclone config                                      # ON THE SERVER: new remote "b2", type b2, the key from step 2
mkdir -p /etc/capybaroar /opt/capybaroar
install -m 700 ops/backup.sh ops/restore.sh ops/restore-test-cron.sh /opt/capybaroar/   # copied up with scp
cat > /etc/capybaroar/backup.env <<'EOF'
RCLONE_REMOTE=b2:capybaroar-backups
AGE_RECIPIENTS=age1...your-public-key...
DB_CONTAINER=sb-capybaroar-db-1
SUPABASE_DIR=/docker/sb-capybaroar
MEDIA_DIR=/docker/sb-capybaroar/volumes/storage
EXTRA_FILES=/path/to/the/app/.env
PING_URL=https://hc-ping.com/your-check-id
EOF
chmod 600 /etc/capybaroar/backup.env
echo '17 3 * * * root /opt/capybaroar/backup.sh >> /var/log/capybaroar-backup.log 2>&1' > /etc/cron.d/capybaroar-backup
/opt/capybaroar/backup.sh                           # run it once now and read the log
```

`PG_USER` (default `supabase_admin`, the cluster's superuser) signs in with the container's own `POSTGRES_PASSWORD`,
so the backup env holds no database password. To encrypt media at rest too, make an rclone `crypt` remote over
`b2:capybaroar-backups/media` and set `MEDIA_REMOTE` to it.

### Test a restore (monthly, and after any Supabase upgrade)

`ops/restore.sh test` downloads the backup, checks its checksum against the manifest, decrypts it, starts a throwaway
container from the same Supabase Postgres image with no network, loads the dump and compares every table's row count
with the manifest. "Already exists" errors are expected (the image creates Supabase's own roles and schemas first) and
are summed up; the test fails if any `public` table, `auth.users`, `auth.identities`, `storage.objects` or
`storage.buckets` differs.

By hand, on your computer (or the VPS with the key copied in for the test and deleted after), with Docker, rclone set
up for the bucket and the same `backup.env` settings:

```sh
export AGE_IDENTITY=~/capybaroar-backup.key
ops/restore.sh list
ops/restore.sh test latest            # or a name like capybaroar-2026-11-13T0317Z; FROM=monthly for monthly ones
rm -rf ./restore                      # it holds decrypted data and secrets
rclone cat --head 65536 b2:capybaroar-backups/media/current/<path> | file -    # one media file opens
```

#### Every month from cron

`ops/restore-test-cron.sh` runs `ops/restore.sh test latest`, checks the dump's checksum against the manifest again,
reads one random media file back from the bucket, and writes the result to
`/var/lib/capybaroar/restore-tests/restore-test-YYYY-MM-DD.md`: the date, the backup tested, the checksum, the row
counts, how long it took, and pass or fail. It deletes the decrypted files when it ends, whatever the result. It also
fails when the newest daily backup is more than 48 hours old (`MAX_AGE_HOURS`), since that means backups stopped.

- Pass: it calls its own `PING_URL`.
- Fail: it calls `PING_URL/fail` (Healthchecks.io and Better Stack heartbeats read this as a failure; check for other
  monitors), emails `ALERT_EMAIL`, prints a line starting `restore-test: FAILED` and exits 1.

Where it runs. The test needs the age private key, and the backup policy keeps that key off the server. Pick one:

- **A second machine (keeps the policy as written).** Any small Linux box with Docker, age and rclone, a B2 key for the
  bucket with only `listBuckets, listFiles, readFiles`, the same `backup.env` and the age key.
- **The VPS.** The key then lives on the server, so a break-in there could also read the last 30 days of backups and
  the saved secrets. Change rule 3 of the backup policy in the private repo and note the risk before doing this. The
  test also runs a second Postgres next to production for a few minutes: it needs free disk for about twice the
  dump's unpacked size (`MIN_FREE_GB`, default 10) and spare memory.

Install (as root, on the machine that runs it):

```sh
install -m 700 ops/restore.sh ops/restore-test-cron.sh /opt/capybaroar/          # copied up with scp
install -m 400 capybaroar-backup.key /etc/capybaroar/restore-test.key            # copied up for this; see above
cat > /etc/capybaroar/restore-test.env <<'END'
AGE_IDENTITY=/etc/capybaroar/restore-test.key
PING_URL=https://hc-ping.com/a-second-check-id   # its own check, not the backup's: period 1 month, grace 3 days
ALERT_EMAIL=you@example.com
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=alerts@capybaroar.com
SMTP_PASS=the-mailbox-password
END
chmod 600 /etc/capybaroar/restore-test.env
echo '43 5 2 * * root /opt/capybaroar/restore-test-cron.sh >> /var/log/capybaroar-restore-test.log 2>&1' > /etc/cron.d/capybaroar-restore-test
/opt/capybaroar/restore-test-cron.sh                 # run it once now and read the result
```

It runs at 05:43 on the 2nd of each month, well after the 03:17 backup, and waits if a backup on the same machine is
still running. With the output sent to the log file, cron mails nothing: the email, the failed heartbeat and the
`restore-test: FAILED` line in the log are the alarms. Without `SMTP_HOST` it uses a local `sendmail` if there is one.
Run it by hand after any Supabase upgrade too.

File each result in the private compliance repo, then tick "Result read by" in a pull request:

```sh
scp deploy@45.90.109.7:/var/lib/capybaroar/restore-tests/restore-test-2026-12-02.md ../capybaroar-compliance/records/
```

The results folder can be read by the `sudo` group (`RESULTS_GROUP`), so the named user from `ops/vps/CHECKLIST.md`
step 11 can copy it (use `root@` until that step is done). A result holds table names and row counts, with no customer
data.

Cost: one dump download a month (about 0.3 GB at Beta, 3 GB at Growth) is well inside B2's free downloads (3x what is
stored), and a second heartbeat check fits a monitor's free tier (check). On the VPS that is $0 a month at Beta and at
Growth. A second machine adds its own price: [small VPS price, check] a month at both stages.

### Restore for real

Stop writes first: stop the app containers (the publisher runs in them).

- **One table or a few rows back:** `ops/restore.sh fetch <name>`, load it into a throwaway container as in `test`
  (or `CONFIRM=yes ops/restore.sh load <scratch container> <name>`), and copy the rows you need across with
  `pg_dump --data-only --table=...` from the scratch container into production.
- **The whole database (lost or broken):**
  1. `ops/restore.sh config <name>` and put the saved `.env` and compose files back in `/docker/sb-capybaroar` (the
     dump's roles use those passwords and the data needs the same JWT secret).
  2. `cd /docker/sb-capybaroar && docker compose down`, then move the old data aside:
     `mv volumes/db/data volumes/db/data.broken`.
  3. Start only the database so it initializes fresh: `docker compose up -d db`, and wait until
     `docker exec sb-capybaroar-db-1 pg_isready -h 127.0.0.1` says accepting connections.
  4. `CONFIRM=yes ops/restore.sh load sb-capybaroar-db-1 <name>`: it loads the dump and checks the row counts.
  5. `CONFIRM=yes ops/restore.sh media` to bring the Storage files back, if they were lost too.
  6. `docker compose up -d`, start the app containers, check `https://app.capybaroar.com/api/health`.

### What it costs

Backups run on the existing VPS (no new server) and use no AI. The only new bill is B2 storage. Sizes are estimates:
about 1.5 GB of database and 1 GB of media per team, gzip shrinking the dump to about a fifth, 42 copies kept
(30 daily and 12 monthly), and 10% extra for media kept after it is deleted.

| | Beta (50 teams) | Growth (500 teams) |
|---|---|---|
| Database dumps | 0.3 GB x 42 = 13 GB | 3 GB x 42 = 126 GB |
| Media | 55 GB | 550 GB |
| Stored | about 68 GB | about 680 GB |
| B2 storage at $5/TB a month | $0.34 | $3.40 |
| Downloads (monthly test restore, free up to 3x what is stored) | $0 | $0 |
| API calls (listing and uploads; check) | under $0.10 | under $0.10 |
| **Monthly total** | **about $0.40** | **about $3.50** |

$5/TB a month and free downloads up to 3x the stored amount (then $0.01/GB) are from backblaze.com/cloud-storage/pricing
(read 2026-11-13). The first 10 GB being free, the price of API calls and Object Lock having no extra charge are
"check". A heartbeat monitor's free tier covers one daily check (check).
