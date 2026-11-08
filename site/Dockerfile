FROM nginx:1.27-alpine
# nginx fills ${CAPY_*} in the template at start. These defaults are for Fly; the VPS compose file sets its own.
ENV CAPY_RESOLVER="[fdaa::3] valid=10s ipv6=on" \
    CAPY_APP="http://capybaroar-web.internal:3000" \
    CAPY_CLIENT_IP="\$http_fly_client_ip"
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY public /usr/share/nginx/html
