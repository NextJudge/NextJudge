#!/usr/bin/env bash
set -euo pipefail

# Deploy or tear down a per-PR backend stack on the Coolify VPS over SSH.
# Coolify compose *services* do not support PR previews via the deploy API — this script
# runs an isolated docker compose project with Traefik routing to {PR}-api.preview.nextjudge.net.
#
# Usage:
#   coolify-preview-backend-ssh.sh deploy
#   coolify-preview-backend-ssh.sh cleanup
#
# Required env:
#   COOLIFY_SSH_HOST          SSH alias or user@host (e.g. nextjudge)
#   PR_NUMBER
#
# Deploy reads preview-scoped env from Coolify when set:
#   COOLIFY_API_URL, COOLIFY_API_TOKEN, COOLIFY_BACKEND_SERVICE_UUID
#
# Optional deploy env:
#   PREVIEW_BACKEND_ENV_FILE  path to .env on the runner (skips API fetch)
#   NEXTJUDGE_CORE_IMAGE_TAG  default latest
#   NEXTJUDGE_JUDGE_IMAGE_TAG default latest

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

require_env COOLIFY_SSH_HOST
require_env PR_NUMBER

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/compose/docker-compose.coolify.yml"
PROJECT_NAME="nextjudge-pr-${PR_NUMBER}"
REMOTE_DIR="nextjudge-previews/pr-${PR_NUMBER}"
PREVIEW_HOST="${PR_NUMBER}-api.preview.nextjudge.net"

fetch_preview_env_from_api() {
  if [[ -z "${COOLIFY_API_URL:-}" || -z "${COOLIFY_API_TOKEN:-}" || -z "${COOLIFY_BACKEND_SERVICE_UUID:-}" ]]; then
    return 1
  fi

  local tmp
  tmp="$(mktemp)"
  curl -fsS \
    "${COOLIFY_API_URL}/services/${COOLIFY_BACKEND_SERVICE_UUID}/envs" \
    -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    -H "Accept: application/json" \
    | jq -r '.[] | select(.is_preview == true) | "\(.key)=\(.value)"' >"$tmp"

  if [[ ! -s "$tmp" ]]; then
    rm -f "$tmp"
    return 1
  fi

  PREVIEW_BACKEND_ENV_FILE="$tmp"
  PREVIEW_BACKEND_ENV_TEMP=1
  return 0
}

write_traefik_override() {
  local path="$1"
  cat >"$path" <<YAML
services:
  nextjudge-data-layer:
    networks:
      - internal
      - coolify
    labels:
      traefik.enable: "true"
      traefik.http.middlewares.gzip.compress: "true"
      traefik.http.middlewares.redirect-to-https.redirectscheme.scheme: https
      traefik.http.routers.http-${PR_NUMBER}-api.entryPoints: http
      traefik.http.routers.http-${PR_NUMBER}-api.middlewares: redirect-to-https
      traefik.http.routers.http-${PR_NUMBER}-api.rule: Host(\`${PREVIEW_HOST}\`)
      traefik.http.routers.https-${PR_NUMBER}-api.entryPoints: https
      traefik.http.routers.https-${PR_NUMBER}-api.middlewares: gzip
      traefik.http.routers.https-${PR_NUMBER}-api.rule: Host(\`${PREVIEW_HOST}\`)
      traefik.http.routers.https-${PR_NUMBER}-api.tls: "true"
      traefik.http.routers.https-${PR_NUMBER}-api.tls.certresolver: letsencrypt
      coolify.managed: "true"
      coolify.type: service
      coolify.pullRequestId: "${PR_NUMBER}"

networks:
  coolify:
    external: true
YAML
}

deploy_preview_backend() {
  PREVIEW_BACKEND_ENV_TEMP=0
  if [[ -z "${PREVIEW_BACKEND_ENV_FILE:-}" ]]; then
    fetch_preview_env_from_api || true
  fi

  if [[ -z "${PREVIEW_BACKEND_ENV_FILE:-}" || ! -f "${PREVIEW_BACKEND_ENV_FILE}" ]]; then
    echo "No preview backend env. Configure Coolify preview env vars on the backend service." >&2
    exit 1
  fi

  local override_local env_local
  override_local="$(mktemp)"
  env_local="$(mktemp)"
  write_traefik_override "$override_local"
  cp "$PREVIEW_BACKEND_ENV_FILE" "$env_local"

  if [[ "${PREVIEW_BACKEND_ENV_TEMP:-0}" == "1" ]]; then
    rm -f "$PREVIEW_BACKEND_ENV_FILE"
  fi

  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$COOLIFY_SSH_HOST" "mkdir -p ${REMOTE_DIR}"

  scp -o BatchMode=yes -o StrictHostKeyChecking=yes \
    "$COMPOSE_FILE" \
    "$env_local" \
    "$override_local" \
    "${COOLIFY_SSH_HOST}:${REMOTE_DIR}/"

  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$COOLIFY_SSH_HOST" \
    "mv ${REMOTE_DIR}/$(basename "$env_local") ${REMOTE_DIR}/.env && mv ${REMOTE_DIR}/$(basename "$override_local") ${REMOTE_DIR}/traefik.override.yml"

  rm -f "$override_local" "$env_local"

  local core_tag="${NEXTJUDGE_CORE_IMAGE_TAG:-latest}"
  local judge_tag="${NEXTJUDGE_JUDGE_IMAGE_TAG:-latest}"

  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$COOLIFY_SSH_HOST" bash -s -- \
    "$PROJECT_NAME" "$PR_NUMBER" "$core_tag" "$judge_tag" <<'REMOTE'
set -euo pipefail
project="$1"
pr="$2"
core_tag="$3"
judge_tag="$4"
dir="$HOME/nextjudge-previews/pr-${pr}"
cd "$dir"

export NEXTJUDGE_CORE_IMAGE_TAG="$core_tag"
export NEXTJUDGE_JUDGE_IMAGE_TAG="$judge_tag"
set -a
source .env
set +a

docker compose \
  --project-name "$project" \
  -f docker-compose.coolify.yml \
  -f traefik.override.yml \
  pull

docker compose \
  --project-name "$project" \
  -f docker-compose.coolify.yml \
  -f traefik.override.yml \
  up -d --remove-orphans

echo "Preview backend stack ${project} started."
REMOTE

  echo "Deployed preview backend for PR #${PR_NUMBER} at https://${PREVIEW_HOST}" >&2
}

cleanup_preview_backend() {
  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$COOLIFY_SSH_HOST" bash -s -- \
    "$PROJECT_NAME" "$PR_NUMBER" <<'REMOTE'
set -euo pipefail
project="$1"
pr="$2"
dir="$HOME/nextjudge-previews/pr-${pr}"

if [[ -d "$dir" ]]; then
  cd "$dir"
  if [[ -f traefik.override.yml ]]; then
    docker compose --project-name "$project" -f docker-compose.coolify.yml -f traefik.override.yml down -v --remove-orphans
  else
    docker compose --project-name "$project" -f docker-compose.coolify.yml down -v --remove-orphans
  fi
  rm -rf "$dir"
fi

mapfile -t containers < <(docker ps -aq --filter "label=com.docker.compose.project=${project}" 2>/dev/null || true)
if ((${#containers[@]} > 0)); then
  docker rm -f "${containers[@]}"
fi

echo "Cleaned up preview backend for PR #${pr}."
REMOTE
}

main() {
  local action="${1:?usage: coolify-preview-backend-ssh.sh deploy|cleanup}"
  case "$action" in
    deploy) deploy_preview_backend ;;
    cleanup) cleanup_preview_backend ;;
    *)
      echo "unknown action: ${action}" >&2
      exit 1
      ;;
  esac
}

main "$@"
