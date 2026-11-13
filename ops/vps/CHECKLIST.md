# VPS hardening checklist

Paste each block into the server's terminal as root, in order. Steps 1 and 9 only look. Keep a second SSH session open
until step 8 is done, so a firewall mistake can't lock you out.

1. See what listens now. Anything on `0.0.0.0`, `*` or `[::]` other than SSH, 80 and 443 is open to the internet,
   whatever ufw says (Docker publishes ports past it).

   ```sh
   ss -tlnpu
   docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
   ```

2. Check Docker Compose is 2.24.4 or newer (the override uses `!override`) and the service names match the override.

   ```sh
   docker compose version
   cd /docker/sb-capybaroar && docker compose config --services
   ```

3. Put the override in place (from your computer, in the repo):

   ```sh
   scp ops/vps/docker-compose.override.yml root@45.90.109.7:/docker/sb-capybaroar/
   ```

   Then on the server, check the published ports and apply:

   ```sh
   cd /docker/sb-capybaroar
   docker compose config | grep -E 'host_ip|published'
   docker compose up -d
   docker ps --format 'table {{.Names}}\t{{.Ports}}'
   ```

   Every port should now show `127.0.0.1:`. If the app container already uses host port 3000, change the studio line
   in the override (for example to `127.0.0.1:3010:3000`).

4. Sign-ups confirm their email, passwords at least 8 characters. Supabase's `SMTP_*` settings in `.env` must be
   filled in, or new people can't confirm.

   ```sh
   cd /docker/sb-capybaroar
   grep -E '^(ENABLE_EMAIL_AUTOCONFIRM|SMTP_HOST|SMTP_ADMIN_EMAIL)=' .env
   sed -i 's/^ENABLE_EMAIL_AUTOCONFIRM=.*/ENABLE_EMAIL_AUTOCONFIRM=false/' .env
   docker compose up -d auth
   docker compose exec auth env | grep -E 'GOTRUE_(MAILER_AUTOCONFIRM|PASSWORD_MIN_LENGTH)'
   ```

   Expect `GOTRUE_MAILER_AUTOCONFIRM=false` and `GOTRUE_PASSWORD_MIN_LENGTH=8`.

5. Caddy. Copy `ops/vps/Caddyfile.example` up, merge it into `/etc/caddy/Caddyfile`, and give Caddy the addresses
   (your own IP for Studio; where the app and homepage containers listen):

   ```sh
   scp ops/vps/Caddyfile.example root@45.90.109.7:/etc/caddy/Caddyfile.capybaroar   # from your computer
   ```

   ```sh
   mkdir -p /etc/systemd/system/caddy.service.d
   cat > /etc/systemd/system/caddy.service.d/capybaroar.conf <<'EOF'
   [Service]
   Environment=CAPY_ADMIN_IPS=203.0.113.7/32
   Environment=SUPABASE_KONG=127.0.0.1:8000
   Environment=CAPY_WEB=127.0.0.1:3001
   Environment=CAPY_SITE=127.0.0.1:8081
   EOF
   systemctl daemon-reload
   set -a; . <(sed -n 's/^Environment=//p' /etc/systemd/system/caddy.service.d/capybaroar.conf); set +a
   caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && systemctl restart caddy
   ```

6. The homepage container must pass the visitor's IP on from Caddy, not Fly's header. Find where it is set and make
   it `$http_x_real_ip` (or remove the line: the image's default is now `$http_x_real_ip`):

   ```sh
   grep -rn 'CAPY_CLIENT_IP\|fly_client_ip' /docker /opt /root 2>/dev/null | grep -v node_modules
   ```

7. ufw. Check the SSH port first and allow that one.

   ```sh
   ss -tlnp | grep sshd
   ufw default deny incoming
   ufw default allow outgoing
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 443/udp
   ufw enable
   ufw status verbose
   ```

8. DOCKER-USER: containers answer the internet only on 80 and 443, even if a port is published by mistake later.
   The rules live in ufw's `after.rules`, so they come back after a reboot or `ufw reload`.

   ```sh
   EXT=$(ip route show default | awk '{print $5; exit}'); echo "outside interface: $EXT"
   cp /etc/ufw/after.rules /etc/ufw/after.rules.bak
   cat >> /etc/ufw/after.rules <<EOF

   # capybaroar: from outside, containers are reachable on 80 and 443 only
   *filter
   :DOCKER-USER - [0:0]
   -A DOCKER-USER -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN
   -A DOCKER-USER ! -i $EXT -j RETURN
   -A DOCKER-USER -p tcp -m conntrack --ctorigdstport 80 --ctdir ORIGINAL -j RETURN
   -A DOCKER-USER -p tcp -m conntrack --ctorigdstport 443 --ctdir ORIGINAL -j RETURN
   -A DOCKER-USER -p udp -m conntrack --ctorigdstport 443 --ctdir ORIGINAL -j RETURN
   -A DOCKER-USER -j DROP
   COMMIT
   EOF
   ufw reload
   iptables -S DOCKER-USER
   ```

9. Check from outside (on your computer, not the server):

   ```sh
   nmap -Pn -p 22,80,443,3000,4000,5432,6543,8000,8080,8443 45.90.109.7     # only 22, 80, 443 open
   curl -s -o /dev/null -w '%{http_code}\n' https://db.capybaroar.com/          # 404 (Studio hidden)
   curl -s -o /dev/null -w '%{http_code}\n' https://db.capybaroar.com/pg/tables # 404
   curl -s -o /dev/null -w '%{http_code}\n' https://db.capybaroar.com/auth/v1/health -H "apikey: $ANON_KEY"  # 200
   curl -sI https://app.capybaroar.com/api/health | grep -iE '^(server|via|x-powered-by|strict-transport|x-content-type)'
   curl -s https://db.capybaroar.com/auth/v1/signup -H "apikey: $ANON_KEY" -H 'content-type: application/json' \
     -d '{"email":"check@example.com","password":"1234567"}'                    # refused: password too short
   ```

   The header check should show `strict-transport-security` and `x-content-type-options`, and no `server`, `via` or
   `x-powered-by`. Studio from your own address: https://db.capybaroar.com/ (or `ssh -L 3000:127.0.0.1:3000
   root@45.90.109.7` and http://localhost:3000).

10. Backups: follow "Install on the VPS" in `ops/README.md`, then run one test restore.
