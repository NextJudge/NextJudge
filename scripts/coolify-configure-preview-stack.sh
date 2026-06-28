#!/usr/bin/env bash
set -euo pipefail

# One-shot Coolify + preview env configuration for NextJudge production and previews.
# Requires: coolify.env with COOLIFY_API_TOKEN, ssh nextjudge access for verification.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -f "${REPO_ROOT}/coolify.env" ]]; then
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/coolify.env"
fi

export COOLIFY_API_URL="${COOLIFY_API_URL:-https://dev.nextjudge.net/api/v1}"
export COOLIFY_WEB_APP_UUID="${COOLIFY_WEB_APP_UUID:-tockgoco044848g4g4s44ckc}"
export COOLIFY_DOCS_APP_UUID="${COOLIFY_DOCS_APP_UUID:-ukcg0oc8k0o40cgkg88wcw44}"
export COOLIFY_BACKEND_SERVICE_UUID="${COOLIFY_BACKEND_SERVICE_UUID:-sooskw8c44g848ss804okos8}"
export COOLIFY_SSH_HOST="${COOLIFY_SSH_HOST:-nextjudge}"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing ${name}" >&2
    exit 1
  fi
}

require_env COOLIFY_API_TOKEN

upsert() {
  local resource_type="$1"
  local uuid="$2"
  local is_preview="$3"
  local key="$4"
  local value="$5"
  COOLIFY_RESOURCE_TYPE="$resource_type" \
    COOLIFY_APP_UUID="$uuid" \
    IS_PREVIEW="$is_preview" \
    KEY="$key" \
    VALUE="$value" \
    "${SCRIPT_DIR}/coolify-upsert-env.sh"
}

rand_secret() {
  openssl rand -base64 48 | tr -d '/+=' | head -c 48
}

echo "=== Production web: OAuth redirect proxy ==="
upsert application "$COOLIFY_WEB_APP_UUID" false AUTH_REDIRECT_PROXY_URL "https://nextjudge.net/api/auth"
upsert application "$COOLIFY_WEB_APP_UUID" false AUTH_TRUST_HOST "true"

echo "=== Preview web: OAuth redirect proxy ==="
upsert application "$COOLIFY_WEB_APP_UUID" true AUTH_REDIRECT_PROXY_URL "https://nextjudge.net/api/auth"
upsert application "$COOLIFY_WEB_APP_UUID" true AUTH_TRUST_HOST "true"

preview_bridge="$(
  curl -fsS "${COOLIFY_API_URL}/applications/${COOLIFY_WEB_APP_UUID}/envs" \
    -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    | jq -r '.[] | select(.key == "WEB_BRIDGE_SECRET" and .is_preview == true) | .value' | head -1
)"

if [[ -z "$preview_bridge" ]]; then
  preview_bridge="$(rand_secret)"
  upsert application "$COOLIFY_WEB_APP_UUID" true WEB_BRIDGE_SECRET "$preview_bridge"
fi

echo "=== Preview backend service env ==="
upsert service "$COOLIFY_BACKEND_SERVICE_UUID" true WEB_BRIDGE_SECRET "$preview_bridge"
upsert service "$COOLIFY_BACKEND_SERVICE_UUID" true SEED_DATA "true"
upsert service "$COOLIFY_BACKEND_SERVICE_UUID" true PASSWORD_RESET_DEBUG "true"
upsert service "$COOLIFY_BACKEND_SERVICE_UUID" true ALLOW_INSECURE_PASSWORD_RESET "false"
upsert service "$COOLIFY_BACKEND_SERVICE_UUID" true ADMIN_EMAILS "Alice.Smith0@example.com"
upsert service "$COOLIFY_BACKEND_SERVICE_UUID" true AUTH_RATE_LIMIT_PER_MIN "60"
upsert service "$COOLIFY_BACKEND_SERVICE_UUID" true AUTH_RATE_LIMIT_BURST "20"
upsert service "$COOLIFY_BACKEND_SERVICE_UUID" true CORS_ALLOW_PREVIEW "true"
upsert service "$COOLIFY_BACKEND_SERVICE_UUID" true TRUSTED_PROXY "true"
upsert service "$COOLIFY_BACKEND_SERVICE_UUID" true CORS_ORIGIN "https://nextjudge.net"

for key in DB_PASSWORD JWT_SIGNING_SECRET JUDGE_PASSWORD RABBITMQ_USER RABBITMQ_PASSWORD; do
  existing="$(
    curl -fsS "${COOLIFY_API_URL}/services/${COOLIFY_BACKEND_SERVICE_UUID}/envs" \
      -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
      | jq -r --arg k "$key" '.[] | select(.key == $k and .is_preview == true) | .value' | head -1
  )"
  if [[ -z "$existing" ]]; then
    upsert service "$COOLIFY_BACKEND_SERVICE_UUID" true "$key" "$(rand_secret)"
  else
    echo "Preview ${key} already set on backend service." >&2
  fi
done

echo "=== Sync GitHub webhook secrets (web + docs) ==="
webhook_secret="$(
  curl -fsS "${COOLIFY_API_URL}/applications/${COOLIFY_WEB_APP_UUID}" \
    -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    | jq -r '.manual_webhook_secret_github // empty'
)"
if [[ -n "$webhook_secret" ]]; then
  export COOLIFY_GITHUB_WEBHOOK_SECRET="$webhook_secret"
  "${SCRIPT_DIR}/setup-coolify-preview-webhooks.sh"
fi

echo "=== Redeploy production web ==="
curl -fsS -X GET \
  "${COOLIFY_API_URL}/deploy?uuid=${COOLIFY_WEB_APP_UUID}&force=false" \
  -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
  -H "Accept: application/json" | jq -r '.deployments[]? | .message // .'

echo "Done. Verify GitHub OAuth app Ov23livh7IuZKmQG4F07 callback: https://nextjudge.net/api/auth/callback/github"
