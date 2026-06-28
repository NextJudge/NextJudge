#!/usr/bin/env bash
set -euo pipefail

# Upsert a preview-scoped environment variable via Coolify API.
#
# Required env:
#   COOLIFY_API_URL
#   COOLIFY_API_TOKEN
#   COOLIFY_APP_UUID
#   KEY
#   VALUE
#
# Optional env:
#   COOLIFY_RESOURCE_TYPE   application (default) or service

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

require_env COOLIFY_API_URL
require_env COOLIFY_API_TOKEN
require_env COOLIFY_APP_UUID
require_env KEY
require_env VALUE

COOLIFY_RESOURCE_TYPE="${COOLIFY_RESOURCE_TYPE:-application}"
if [[ "$COOLIFY_RESOURCE_TYPE" != "application" && "$COOLIFY_RESOURCE_TYPE" != "service" ]]; then
  echo "COOLIFY_RESOURCE_TYPE must be application or service, got: ${COOLIFY_RESOURCE_TYPE}" >&2
  exit 1
fi

resource_path="${COOLIFY_RESOURCE_TYPE}s"

payload="$(jq -nc \
  --arg key "$KEY" \
  --arg value "$VALUE" \
  '{ key: $key, value: $value, is_preview: true, is_literal: true }')"

response="$(
  curl -sS -w "\n%{http_code}" -X PATCH \
    "${COOLIFY_API_URL}/${resource_path}/${COOLIFY_APP_UUID}/envs" \
    -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$payload"
)"
http_code="${response##*$'\n'}"
body="${response%$'\n'*}"

if [[ "$http_code" =~ ^20 ]]; then
  echo "Set preview env ${KEY} on ${COOLIFY_RESOURCE_TYPE} ${COOLIFY_APP_UUID}." >&2
  exit 0
fi

if [[ "$http_code" == "404" ]]; then
  create_response="$(
    curl -sS -w "\n%{http_code}" -X POST \
      "${COOLIFY_API_URL}/${resource_path}/${COOLIFY_APP_UUID}/envs" \
      -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d "$payload"
  )"
  create_code="${create_response##*$'\n'}"
  create_body="${create_response%$'\n'*}"
  if [[ "$create_code" =~ ^20 ]]; then
    echo "Created preview env ${KEY} on ${COOLIFY_RESOURCE_TYPE} ${COOLIFY_APP_UUID}." >&2
    exit 0
  fi
  echo "Failed to create preview env ${KEY} (${create_code}): ${create_body}" >&2
  exit 1
fi

echo "Failed to set preview env ${KEY} (${http_code}): ${body}" >&2
exit 1
