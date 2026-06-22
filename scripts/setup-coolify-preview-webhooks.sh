#!/usr/bin/env bash
set -euo pipefail

# Sync the GitHub manual webhook secret to Coolify web/docs preview apps.
#
# Required env:
#   COOLIFY_API_URL
#   COOLIFY_API_TOKEN
#   COOLIFY_GITHUB_WEBHOOK_SECRET
#   COOLIFY_WEB_APP_UUID
#   COOLIFY_DOCS_APP_UUID

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

require_env COOLIFY_API_URL
require_env COOLIFY_API_TOKEN
require_env COOLIFY_GITHUB_WEBHOOK_SECRET
require_env COOLIFY_WEB_APP_UUID
require_env COOLIFY_DOCS_APP_UUID

sync_secret() {
  local uuid="$1"
  curl -fsS -X PATCH \
    "${COOLIFY_API_URL}/applications/${uuid}" \
    -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "{\"manual_webhook_secret_github\": \"${COOLIFY_GITHUB_WEBHOOK_SECRET}\"}" \
    >/dev/null
  echo "Updated manual_webhook_secret_github for ${uuid}"
}

sync_secret "$COOLIFY_WEB_APP_UUID"
sync_secret "$COOLIFY_DOCS_APP_UUID"
