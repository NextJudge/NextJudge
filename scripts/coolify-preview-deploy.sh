#!/usr/bin/env bash
set -euo pipefail

# Deploy (or bootstrap + deploy) a Coolify preview for a pull request.
#
# Required env:
#   COOLIFY_API_URL          e.g. https://dev.example.com/api/v1
#   COOLIFY_API_TOKEN
#   COOLIFY_APP_UUID
#   COOLIFY_GITHUB_WEBHOOK_SECRET
#   PR_NUMBER
#   PR_HEAD_SHA
#   PR_HEAD_REF
#   PR_HTML_URL
#   REPO_FULL_NAME           e.g. NextJudge/NextJudge
#
# Optional env:
#   COOLIFY_WEBHOOK_BASE_URL defaults to COOLIFY_API_URL without /api/v1
#   PR_TITLE                 defaults to "Preview deployment"
#   PR_AUTHOR_ASSOCIATION    defaults to MEMBER
#   PR_BASE_REF              defaults to main
#   FORCE_DEPLOY             defaults to true

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
require_env PR_NUMBER

if [[ "${COOLIFY_RESOURCE_TYPE:-application}" != "service" ]]; then
  require_env COOLIFY_GITHUB_WEBHOOK_SECRET
  require_env PR_HEAD_SHA
  require_env PR_HEAD_REF
  require_env PR_HTML_URL
  require_env REPO_FULL_NAME
fi

COOLIFY_WEBHOOK_BASE_URL="${COOLIFY_WEBHOOK_BASE_URL:-${COOLIFY_API_URL%/api/v1}}"
PR_TITLE="${PR_TITLE:-Preview deployment}"
PR_AUTHOR_ASSOCIATION="${PR_AUTHOR_ASSOCIATION:-MEMBER}"
PR_BASE_REF="${PR_BASE_REF:-main}"
FORCE_DEPLOY="${FORCE_DEPLOY:-true}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

set_preview_image_tags() {
  local resource_type="${COOLIFY_RESOURCE_TYPE:-application}"
  if [[ -n "${NEXTJUDGE_CORE_IMAGE_TAG:-}" ]]; then
    KEY=NEXTJUDGE_CORE_IMAGE_TAG VALUE="${NEXTJUDGE_CORE_IMAGE_TAG}" \
      COOLIFY_APP_UUID="${COOLIFY_APP_UUID}" \
      COOLIFY_RESOURCE_TYPE="${resource_type}" \
      "${SCRIPT_DIR}/coolify-set-preview-env.sh"
  fi
  if [[ -n "${NEXTJUDGE_JUDGE_IMAGE_TAG:-}" ]]; then
    KEY=NEXTJUDGE_JUDGE_IMAGE_TAG VALUE="${NEXTJUDGE_JUDGE_IMAGE_TAG}" \
      COOLIFY_APP_UUID="${COOLIFY_APP_UUID}" \
      COOLIFY_RESOURCE_TYPE="${resource_type}" \
      "${SCRIPT_DIR}/coolify-set-preview-env.sh"
  fi
}

deploy_preview_backend_ssh() {
  require_env COOLIFY_SSH_HOST
  export COOLIFY_BACKEND_SERVICE_UUID="${COOLIFY_APP_UUID}"
  "${SCRIPT_DIR}/coolify-preview-backend-ssh.sh" deploy
}

deploy_preview() {
  local response
  response="$(
    curl -fsS -X GET \
      "${COOLIFY_API_URL}/deploy?uuid=${COOLIFY_APP_UUID}&pr=${PR_NUMBER}&force=${FORCE_DEPLOY}" \
      -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
      -H "Accept: application/json"
  )"
  echo "$response"

  local deployment_uuid message
  deployment_uuid="$(echo "$response" | jq -r --arg uuid "$COOLIFY_APP_UUID" '
    .deployments[]? | select(.resource_uuid == $uuid) | .deployment_uuid // empty
  ')"
  message="$(echo "$response" | jq -r --arg uuid "$COOLIFY_APP_UUID" '
    .deployments[]? | select(.resource_uuid == $uuid) | .message // empty
  ')"

  if [[ -n "$deployment_uuid" ]]; then
    echo "Queued preview deployment ${deployment_uuid} for app ${COOLIFY_APP_UUID} (PR #${PR_NUMBER})." >&2
    return 0
  fi

  if [[ "$message" == *"not found for this resource"* ]]; then
    return 2
  fi

  echo "Coolify preview deploy failed for app ${COOLIFY_APP_UUID}: ${message:-unknown error}" >&2
  echo "$response" >&2
  return 1
}

bootstrap_preview() {
  local payload signature delivery webhook_url response
  payload="$(
    jq -nc \
      --arg action "synchronize" \
      --argjson number "$PR_NUMBER" \
      --arg after "$PR_HEAD_SHA" \
      --arg full_name "$REPO_FULL_NAME" \
      --arg html_url "$PR_HTML_URL" \
      --arg title "$PR_TITLE" \
      --arg head_ref "$PR_HEAD_REF" \
      --arg head_sha "$PR_HEAD_SHA" \
      --arg base_ref "$PR_BASE_REF" \
      --arg author_association "$PR_AUTHOR_ASSOCIATION" \
      '{
        action: $action,
        number: $number,
        before: ("0" * 40),
        after: $after,
        repository: { full_name: $full_name },
        pull_request: {
          html_url: $html_url,
          title: $title,
          head: { ref: $head_ref, sha: $head_sha },
          base: { ref: $base_ref },
          author_association: $author_association
        }
      }'
  )"

  signature="$(printf '%s' "$payload" | openssl dgst -sha256 -hmac "$COOLIFY_GITHUB_WEBHOOK_SECRET" | awk '{print $2}')"
  delivery="nextjudge-ci-${PR_NUMBER}-$(date +%s)-${RANDOM}"
  webhook_url="${COOLIFY_WEBHOOK_BASE_URL}/webhooks/source/github/events/manual"

  echo "Bootstrapping Coolify preview record for PR #${PR_NUMBER} via manual GitHub webhook..." >&2
  response="$(
    curl -fsS -X POST "$webhook_url" \
      -H "Content-Type: application/json" \
      -H "X-GitHub-Event: pull_request" \
      -H "X-GitHub-Delivery: ${delivery}" \
      -H "X-Hub-Signature-256: sha256=${signature}" \
      -d "$payload"
  )"
  echo "$response" >&2

  if echo "$response" | jq -e '.[]? | select(.message == "Preview deployments disabled.")' >/dev/null; then
    echo "Enable Preview Deployments for app ${COOLIFY_APP_UUID} in Coolify (Application -> Advanced)." >&2
    exit 1
  fi

  if echo "$response" | jq -e '.[]? | select(.message == "Invalid signature.")' >/dev/null; then
    echo "COOLIFY_GITHUB_WEBHOOK_SECRET does not match manual_webhook_secret_github on at least one matching Coolify app." >&2
    exit 1
  fi

  echo "Preview bootstrap webhook accepted." >&2
}

set_preview_image_tags

if [[ "${COOLIFY_RESOURCE_TYPE:-application}" == "service" ]]; then
  deploy_preview_backend_ssh
  exit 0
fi

if deploy_preview; then
  exit 0
else
  status=$?
  if [[ "$status" -ne 2 ]]; then
    exit "$status"
  fi
fi

bootstrap_preview
sleep 5
set_preview_image_tags
deploy_preview