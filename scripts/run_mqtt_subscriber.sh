#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

printf 'Building MQTT subscriber...\n' >&2
go build -o bin/mqtt-subscriber ./cmd/mqtt-subscriber

# Help should work without requesting credentials or contacting the broker.
for arg in "$@"; do
  case "$arg" in
    -h|-help|--help) exec ./bin/mqtt-subscriber "$@" ;;
  esac
done

export MQTT_BROKER_URL="${MQTT_BROKER_URL:-tcp://15.207.187.242:1883}"
export MQTT_TOPIC="${MQTT_TOPIC:-INSTRUTEL/MBIOT_ETH/09001/EMS}"
export MQTT_USERNAME="${MQTT_USERNAME:-test}"

if [[ -z "${MQTT_PASSWORD:-}" ]]; then
  if [[ ! -t 0 ]]; then
    printf 'Set MQTT_PASSWORD or run in an interactive terminal to enter it.\n' >&2
    exit 1
  fi
  IFS= read -r -s -p 'MQTT password: ' MQTT_PASSWORD
  printf '\n' >&2
  if [[ -z "$MQTT_PASSWORD" ]]; then
    printf 'MQTT password cannot be empty.\n' >&2
    exit 1
  fi
fi
export MQTT_PASSWORD

printf 'Listening for MQTT events; press Ctrl+C to stop.\n' >&2
if command -v jq >/dev/null 2>&1; then
  ./bin/mqtt-subscriber -duration 1h -max-messages 0 "$@" |
    jq --unbuffered '{
      received_at, topic, qos, retained, duplicate,
      payload: (if has("payload_text") then
        (.payload_text | . as $text | try fromjson catch $text)
      else
        {payload_base64}
      end)
    }'
else
  exec ./bin/mqtt-subscriber -duration 1h -max-messages 0 "$@"
fi
