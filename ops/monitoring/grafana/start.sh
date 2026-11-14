#!/bin/sh
# Starts Grafana with the alert thresholds filled in. Grafana leaves ${...} in alert rule queries as written, so this
# copies the provisioning files to /tmp, puts each ALERT_* number from .env (defaults in docker-compose.yml) into
# alerting/rules.yml, and starts Grafana's own /run.sh on the copy.
set -eu

src=/etc/grafana/provisioning
out=/tmp/provisioning
rm -rf "$out"
cp -R "$src" "$out"

for name in ALERT_ERRORS_10M ALERT_FAILED_SIGNINS_10M ALERT_SSH_FAILED_10M ALERT_HTTP_5XX_10M ALERT_APP_STARTS_15M; do
	value=$(printenv "$name" || true)
	case "$value" in
	'' | *[!0-9]*)
		echo "start.sh: $name must be a whole number (it is '$value')" >&2
		exit 1
		;;
	esac
	sed -i "s/\${$name}/$value/g" "$out/alerting/rules.yml"
done

if grep -q '\${ALERT_[A-Z0-9_]*}' "$out/alerting/rules.yml"; then
	echo "start.sh: rules.yml uses a threshold this script doesn't know:" >&2
	grep -o '\${ALERT_[A-Z0-9_]*}' "$out/alerting/rules.yml" | sort -u >&2
	exit 1
fi

export GF_PATHS_PROVISIONING="$out"
exec /run.sh "$@"
