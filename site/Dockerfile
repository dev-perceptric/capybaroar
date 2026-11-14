# nginx:1.27-alpine, pinned by digest (the multi-arch index on Docker Hub, 2026-11-13).
FROM nginx:1.29-alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de
# nginx fills ${CAPY_*} in the template at start; the VPS compose file sets the resolver and the app's address.
# The visitor's IP is X-Real-IP, which Caddy sets from the connection after dropping what the visitor sent
# (ops/vps/Caddyfile.example). nginx passes X-Real-IP on to the app unchanged, and the app reads only that.
ENV CAPY_RESOLVER="[fdaa::3] valid=10s ipv6=on" \
    CAPY_APP="http://capybaroar-web.internal:3000" \
    CAPY_CLIENT_IP="\$http_x_real_ip"
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY public /usr/share/nginx/html
