# Central logs and alerts

Status: Draft for review | Version: 0.1 | Owner: [Security lead name] | Last reviewed: 2026-11-14 | Review: every 12 months, and when a log source or alert is added

The app VPS (45.90.109.7) sends its logs to a small second server, the compliance server, which also runs Probo.
There, Grafana Loki keeps them 365 days and Grafana shows them and sends alert emails. A copy off the app VPS means a
broken or broken-into VPS can't erase its own history: the VPS can add log lines, and it has no way to read, change or
delete them.

| Where | What runs | Files |
|---|---|---|
| Compliance server | Loki (one process, logs on its own disk), Grafana, Caddy in front | this folder |
| App VPS | Grafana Alloy (reads and ships the logs), a read-only Docker API proxy for it | `ops/vps/alloy/`, `ops/vps/CHECKLIST.md` step 12 |
| App | One JSON line per security event, error and runner start, plus a beat line every 5 minutes | `src/lib/logLines.ts` |

Versions (pinned with their digests in the compose files): Loki 3.7.10, Grafana 13.3.1, Caddy 2.11.9, Alloy 1.22.0,
docker-socket-proxy 0.5.0.

## What is shipped

| Source | Labels | Notes |
|---|---|---|
| App containers | `role="app"`, `container`, `stream` | Everything the app prints. Its JSON lines also get `type`: `audit`, `error`, `start` or `beat`. |
| Homepage (nginx) | `role="site"` | Access and error lines. |
| Supabase auth (GoTrue), kong, storage, db | `role="supabase"`, `service` | Other Supabase containers (Studio, analytics, vector and the rest) stay on the VPS. |
| Caddy access log | `role="caddy"`, `job="caddy"` | One JSON line per request (`ops/vps/Caddyfile.example`, "Access log"). |
| sshd and sudo | `role="system"`, `job="system"`, `unit`, `ident` | From the systemd journal. |

Every line also has `host` (from `LOG_HOST`, default `app-vps`).

The app's lines look like this. They carry no email, name, IP, message or event details. The full audit event stays
in the `audit_events` table and the full error in `app_errors`.

```json
{"type":"audit","action":"member.role_changed","workspace":"3f2b8c1e-...","actor_kind":"user","role":"admin","at":"2026-11-14T21:03:04.000Z"}
{"type":"error","where":"GET /api/v1/posts","fp":"9c1d...","at":"2026-11-14T21:03:05.000Z"}
{"type":"start","at":"2026-11-14T21:00:00.000Z"}
```

`role` appears only on `member.role_changed`, and only when it is one of owner, admin, editor or client. `fp` is the
error's fingerprint, the same one `app_errors` uses. `tests/logLines.test.ts` checks the format.

## What is taken out

In three places, so a secret has to slip past all of them to reach Loki:

1. **The app.** Audit lines hold only the fields above. Error lines hold the route's path with its query string
   removed, then `scrub()` from `src/lib/ops.ts`, and emails replaced with `[email]`.
2. **Caddy.** Its access log drops the query string and every request and response header (cookies, Authorization,
   `apikey`, Referer) before it writes the line.
3. **Alloy, on every line before it leaves the VPS** (`ops/vps/alloy/config.alloy`, `loki.process "scrub"`):
   Authorization and Proxy-Authorization values, Bearer and Basic credentials, Cookie and Set-Cookie values,
   secret query parameters and `key=value` pairs (`apikey`, `access_token`, `refresh_token`, `token`, `code`, `secret`,
   `password`, `signature` and more), the same names as JSON fields, JWTs, Stripe, GitHub, Slack, AWS and Supabase
   key shapes, and passwords in `postgres://` URLs. Each is replaced with `[redacted]`, `[jwt]` or `[key]`.

Kept on purpose: visitors' IP addresses in Caddy and sshd lines, for security alerts and investigations. Supabase's
auth logs may hold user ids and emails. Both are personal data kept 365 days for security. Read a day of
`{role="supabase", service="auth"}` after setup, and add a pattern to `loki.process "scrub"` for anything that
shouldn't be there.

## Alerts

Grafana checks each rule every minute and emails `ALERT_EMAIL` (`grafana/provisioning/alerting/`). An alert that keeps
firing emails again every 4 hours, and once more when it clears. Thresholds are set in `.env`; the defaults are in
`docker-compose.yml`.

| Alert | Fires when | Threshold (default) |
|---|---|---|
| App error spike | app error lines in 10 minutes are over the threshold | `ALERT_ERRORS_10M` (20) |
| Failed sign-in spike | `auth.sign_in_failed` events in 10 minutes, all workspaces together | `ALERT_FAILED_SIGNINS_10M` (30) |
| Workspace or account deletion | any `workspace.deletion_requested` or `account.deleted` | any |
| SSH sign-in as root | sshd accepts a root sign-in | any |
| Many failed SSH sign-ins | failed SSH sign-ins in 10 minutes | `ALERT_SSH_FAILED_10M` (60) |
| Caddy 5xx spike | 5xx answers from Caddy in 10 minutes | `ALERT_HTTP_5XX_10M` (25) |
| App restarting repeatedly | app runner starts in 15 minutes | `ALERT_APP_STARTS_15M` (3) |
| No logs from the app | no line at all from the app for 15 minutes (it writes a beat every 5) | 15 minutes |

A rule whose query fails (Loki down) emails as an error too.

Logged with no alert: a role changed to owner or admin, a new API key (`api_key.created`) and a connected app
(`app.connected`). The dashboard lists them in "Sensitive changes", and the ones outside working hours in "Sensitive
changes outside working hours (UTC)". Set the hours with the two boxes at the top of the dashboard (default 8 to 18
UTC).

The **Capybaroar** dashboard (`grafana/dashboards/capybaroar.json`) has a panel for each alert, errors by place, audit
events by action, deletions, SSH sign-ins that worked, sudo, Caddy 5xx by host, app starts, log lines by source and
the app's stderr.

The two "No logs" and "restarting" alerts need the runner on (the default). With `RUN_JOBS=0` on every app container,
there are no start or beat lines: turn those two rules off in Grafana.

## Set up the compliance server

Do this once, before step 12 of `ops/vps/CHECKLIST.md`.

1. **Get the server.** A Hostinger KVM 2 (see costs below) with Ubuntu 24.04, in a different data center from the app
   VPS (Phoenix), so one outage can't take both. Then harden it like the app VPS: `ops/vps/CHECKLIST.md` steps 7
   (ufw: 22, 80, 443), 8 (DOCKER-USER) and 11 (SSH keys only, no root).

2. **DNS.** Add an A record for `logs.capybaroar.com` pointing at the new server's IP (and an AAAA record if it has
   IPv6). Caddy gets the certificate on its own when it starts.

3. **Docker, with log rotation.** On the server, as root:

   ```sh
   curl -fsSL https://get.docker.com | sh
   cat > /etc/docker/daemon.json <<'EOF'
   {
     "log-driver": "json-file",
     "log-opts": { "max-size": "20m", "max-file": "5" }
   }
   EOF
   systemctl restart docker
   docker compose version          # 2.24 or newer
   ```

4. **Copy this folder up and make the push password.** From your computer, in the repo:

   ```sh
   scp -r ops/monitoring deploy@<compliance server>:/tmp/capy-monitoring
   ssh deploy@<compliance server> 'sudo mv /tmp/capy-monitoring /opt/capy-monitoring' 
   ```

   Then on the server:

   ```sh
   cd /opt/capy-monitoring
   openssl rand -base64 32          # the push password: save it in your password manager
   docker run --rm -it caddy:2.11.9-alpine caddy hash-password    # paste the password twice; it prints a hash
   echo 'capy-vps <the hash>' > caddy/loki-push.users             # single quotes: the hash has $ signs in it
   chmod 600 caddy/loki-push.users
   ```

5. **Settings.** Fill in `.env` (every line is explained in `.env.example`):

   ```sh
   cp .env.example .env
   chmod 600 .env
   nano .env
   ```

   `GRAFANA_ALLOW_IPS` is your own address. With no fixed address, keep `127.0.0.1/32` and use the SSH tunnel below.

6. **Start it.**

   ```sh
   docker compose up -d
   docker compose ps                                   # loki, grafana and caddy all "Up"
   docker compose logs grafana | grep -iE 'start.sh|provision'
   ```

   `start.sh:` lines mean a threshold in `.env` is wrong (each must be a whole number). Fix it and run
   `docker compose up -d` again.

7. **Check from outside** (your computer):

   ```sh
   curl -s -o /dev/null -w '%{http_code}\n' -X POST https://logs.capybaroar.com/loki/api/v1/push  # 404 (not the app VPS)
   curl -s -o /dev/null -w '%{http_code}\n' 'https://logs.capybaroar.com/loki/api/v1/labels'     # 404
   nmap -Pn -p 22,80,443,3100,3300,9095 <compliance server>                                       # only 22, 80, 443 open
   ```

   And from the app VPS: the same push `curl` gives `401` (it asks for the password).

8. **Open Grafana** and sign in as `GRAFANA_ADMIN_USER`:
   - from an address in `GRAFANA_ALLOW_IPS`: https://logs.capybaroar.com
   - from anywhere: `ssh -L 3300:127.0.0.1:3300 deploy@<compliance server>`, then http://localhost:3300

   Grafana locks a user out for a while after 5 wrong passwords in a row.

9. **Test the email.** Grafana, Alerting, Contact points, Operations email, Test. Check it arrives.

Then do step 12 of `ops/vps/CHECKLIST.md` on the app VPS.

## Day to day

- **Change a threshold:** edit `.env`, then `docker compose up -d grafana`.
- **Change a rule or the dashboard:** edit the files here, copy them up, `docker compose restart grafana`. Changes
  made in Grafana's screens to these provisioned rules and the dashboard are refused or lost on restart.
- **Find something:** Grafana, Explore, Loki. For example `{role="app", type="audit"} | json | action="member.removed"`
  or `{role="supabase", service="auth"} |= "error"`.
- **Disk:** `docker system df -v | grep loki-data` shows how much the logs take.
- **Updates:** check the release notes, change the tag and the digest in `docker-compose.yml`, then
  `docker compose pull && docker compose up -d`. To get a digest: `docker pull grafana/loki:<new tag>` and
  `docker inspect --format '{{index .RepoDigests 0}}' grafana/loki:<new tag>`.

## Gaps

| Gap | Fix | Owner |
|---|---|---|
| The logs live on one disk with no copy. Losing the compliance server loses the log history. | Turn on Hostinger's VPS backups for this server (check what the plan includes), or copy the `loki-data` volume to the B2 bucket nightly with rclone | Operations |
| Grafana's own sign-in has no second step (2FA). | Keep Grafana behind `GRAFANA_ALLOW_IPS` or the SSH tunnel, with a long password from the password manager | Security lead |
| Thresholds are first guesses. | After two weeks, read the dashboard and set each `ALERT_*` just above a normal busy day | Operations |
| Supabase's log formats aren't checked for personal data or secrets yet. | Read a day of each Supabase service in Explore after setup and add scrub patterns where needed | Operations |

## What it costs

Everything here is open source with no license fee (Loki, Grafana, Alloy, Caddy). No Claude tokens are used. Alert
emails go through the SMTP account the app already uses. The one new bill is the compliance server, which Probo shares.

Log volume, an estimate: about 3,000 requests per team a day through Caddy (about 350 bytes a line after the filter),
half of them also logged by Kong, plus Supabase's own lines and SSH noise from bots. That is about 2 MB a team a day
before compression. Loki stores roughly a fifth of that, and deletes each day after 365 days, so storage grows for a
year and then stays level.

| | Beta (50 teams) | Growth (500 teams) |
|---|---|---|
| Lines received a day | about 100 MB | about 1 GB |
| Stored after 365 days (then level) | about 7 GB | about 65 GB |
| Sent from the app VPS (compressed) | about 3 GB a month, inside both plans' bandwidth | about 30 GB a month, inside both plans' bandwidth |
| Server | Hostinger KVM 2 (2 vCPU, 8 GB, 100 GB disk) | Hostinger KVM 4 (4 vCPU, 16 GB, 200 GB disk), for the disk |
| Server price | $8.79 a month on a 24-month term, then $14.99 | $12.99 a month on a 24-month term, then $28.99 |
| Alloy on the app VPS | $0 (about 150 MB of memory, check) | $0 (check) |
| Alert emails | $0 (existing SMTP account, check) | $0 (check) |
| Claude tokens | $0 | $0 |
| **Monthly total** | **$8.79, then $14.99** | **$12.99, then $28.99** |

Server prices and specs are from hostinger.com/vps-hosting (read 2026-11-14); the lower price is the 24-month term
paid up front, and the plan renews at the higher one. The log volume and storage are estimates: check them after the
first week with the "Log lines by source" panel and the disk command above, and move to KVM 4 when the disk passes 70%.
If the Probo kit already counts this server, logging adds $0 on top of it.
