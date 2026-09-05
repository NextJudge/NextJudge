#!/usr/bin/env bash
set -euo pipefail

# Bootstrap isolated preview credentials once. Never update the production service:
# Coolify service env endpoints match keys without respecting preview scope.
# Existing credentials must be rotated deliberately, together with persisted DB roles.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
if [[ -f "${REPO_ROOT}/coolify.env" ]]; then
  source "${REPO_ROOT}/coolify.env"
fi
export COOLIFY_API_URL="${COOLIFY_API_URL:-https://dev.nextjudge.net/api/v1}"
export COOLIFY_WEB_APP_UUID="${COOLIFY_WEB_APP_UUID:-tockgoco044848g4g4s44ckc}"
: "${COOLIFY_API_TOKEN:?COOLIFY_API_TOKEN is required}"
export COOLIFY_API_TOKEN
repo="NextJudge/NextJudge"
existing="$(gh secret list --repo "$repo" --json name --jq '.[].name')"
if printf '%s\n' "$existing" | grep -qx PREVIEW_BACKEND_ENV; then
  echo 'PREVIEW_BACKEND_ENV already exists; refusing to replace persisted preview credentials.' >&2
  exit 1
fi

upsert_web() {
  COOLIFY_RESOURCE_TYPE=application COOLIFY_APP_UUID="$COOLIFY_WEB_APP_UUID" \
    IS_PREVIEW=true KEY="$1" VALUE="$2" bash "${SCRIPT_DIR}/coolify-upsert-env.sh"
}

web_envs="$(curl -fsS "${COOLIFY_API_URL}/applications/${COOLIFY_WEB_APP_UUID}/envs" \
  -H "Authorization: Bearer ${COOLIFY_API_TOKEN}")"
preview_bridge="$(printf '%s' "$web_envs" | jq -r '[.[] | select(.key == "WEB_BRIDGE_SECRET" and .is_preview == true) | .value][0] // empty')"
production_bridge="$(printf '%s' "$web_envs" | jq -r '[.[] | select(.key == "WEB_BRIDGE_SECRET" and .is_preview != true) | .value][0] // empty')"
if [[ -z "$preview_bridge" || "$preview_bridge" == "$production_bridge" ]]; then
  preview_bridge="$(openssl rand -hex 32)"
fi

config="$(mktemp)"
trap 'rm -f "$config"' EXIT
{
  for key in DB_PASSWORD JWT_SIGNING_SECRET JUDGE_PASSWORD RABBITMQ_PASSWORD; do
    printf '%s=%s\n' "$key" "$(openssl rand -hex 32)"
  done
  printf 'RABBITMQ_USER=nextjudge_preview\nWEB_BRIDGE_SECRET=%s\n' "$preview_bridge"
  printf '%s\n' 'BASIC_REGISTRATION_ENABLED=true' 'PASSWORD_RESET_DEBUG=true' \
    'ALLOW_INSECURE_PASSWORD_RESET=false' 'CORS_ALLOW_PREVIEW=true' \
    'CORS_ORIGIN=https://nextjudge.net' 'TRUSTED_PROXY=true' \
    'AUTH_RATE_LIMIT_PER_MIN=60' 'AUTH_RATE_LIMIT_BURST=20' \
    'ADMIN_EMAILS=Alice.Smith0@example.com'
} > "$config"
bash "${SCRIPT_DIR}/validate-preview-backend-env.sh" < "$config"
upsert_web WEB_BRIDGE_SECRET "$preview_bridge"
upsert_web BASIC_REGISTRATION_ENABLED true
upsert_web AUTH_REDIRECT_PROXY_URL https://nextjudge.net/api/auth
upsert_web AUTH_TRUST_HOST true
gh secret set PREVIEW_BACKEND_ENV --repo "$repo" < "$config"
echo 'Provisioned isolated backend credentials in GitHub and synchronized the preview web bridge.'
