#!/usr/bin/env bash
set -euo pipefail

# Upsert an environment variable via Coolify API (production or preview scope).
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
#   IS_PREVIEW              true or false (default false)

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
IS_PREVIEW="${IS_PREVIEW:-false}"

if [[ "$COOLIFY_RESOURCE_TYPE" != "application" && "$COOLIFY_RESOURCE_TYPE" != "service" ]]; then
  echo "COOLIFY_RESOURCE_TYPE must be application or service" >&2
  exit 1
fi

resource_path="${COOLIFY_RESOURCE_TYPE}s"
preview_flag="false"
if [[ "$IS_PREVIEW" == "true" ]]; then
  preview_flag="true"
fi

payload="$(jq -nc \
  --arg key "$KEY" \
  --arg value "$VALUE" \
  --argjson is_preview "$preview_flag" \
  '{ key: $key, value: $value, is_preview: $is_preview, is_literal: true }')"

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
  echo "Set ${KEY} on ${COOLIFY_RESOURCE_TYPE} ${COOLIFY_APP_UUID} (preview=${preview_flag})." >&2
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
    echo "Created ${KEY} on ${COOLIFY_RESOURCE_TYPE} ${COOLIFY_APP_UUID} (preview=${preview_flag})." >&2
    exit 0
  fi
  echo "Failed to create ${KEY} (${create_code}): ${create_body}" >&2
  exit 1
fi

echo "Failed to set ${KEY} (${http_code}): ${body}" >&2
exit 1
