#!/usr/bin/env bash
set -euo pipefail

# Poll preview URLs until they return HTTP 2xx or timeout.
#
# Required env:
#   PREVIEW_URLS          Space-separated preview URLs
#
# Optional env:
#   PREVIEW_WAIT_TIMEOUT_SEC    Default 600 (10 minutes)
#   PREVIEW_POLL_INTERVAL_SEC   Default 30

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

require_env PREVIEW_URLS

PREVIEW_WAIT_TIMEOUT_SEC="${PREVIEW_WAIT_TIMEOUT_SEC:-600}"
PREVIEW_POLL_INTERVAL_SEC="${PREVIEW_POLL_INTERVAL_SEC:-30}"

wait_for_url() {
  local url="$1"
  local deadline=$((SECONDS + PREVIEW_WAIT_TIMEOUT_SEC))
  local attempt=0
  local http_code

  echo "Waiting for preview URL to respond: ${url}" >&2

  while (( SECONDS < deadline )); do
    attempt=$((attempt + 1))
    http_code="$(
      curl -fsS -o /dev/null -w "%{http_code}" --max-time 20 "$url" 2>/dev/null || true
    )"

    if [[ "$http_code" =~ ^2 ]]; then
      echo "Preview ready (${http_code}) after ${attempt} attempt(s): ${url}" >&2
      return 0
    fi

    echo "Attempt ${attempt}: ${url} returned HTTP ${http_code:-000}; retrying in ${PREVIEW_POLL_INTERVAL_SEC}s..." >&2
    sleep "$PREVIEW_POLL_INTERVAL_SEC"
  done

  echo "Timed out after ${PREVIEW_WAIT_TIMEOUT_SEC}s waiting for ${url} (last HTTP ${http_code:-000})." >&2
  echo "Check the Coolify deployment logs for PR preview build failures." >&2
  return 1
}

for url in $PREVIEW_URLS; do
  wait_for_url "$url"
done

echo "All preview URLs are responding." >&2
