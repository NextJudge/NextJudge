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
# Deploy reads PREVIEW_BACKEND_ENV from GitHub Actions, never the production service.
#
# Required deploy env:
#   PREVIEW_BACKEND_ENV_FILE  optional path to .env instead of PREVIEW_BACKEND_ENV
#   NEXTJUDGE_CORE_IMAGE_TAG  immutable ci-{commit} tag
#   NEXTJUDGE_JUDGE_IMAGE_TAG immutable ci-{commit} tag

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
PREVIEW_COMPOSE_FILE="${REPO_ROOT}/compose/docker-compose.preview.yml"
PROJECT_NAME="nextjudge-pr-${PR_NUMBER}"
REMOTE_DIR="nextjudge-previews/pr-${PR_NUMBER}"
PREVIEW_HOST="${PR_NUMBER}-api.preview.nextjudge.net"

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
      traefik.docker.network: coolify
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
  require_env NEXTJUDGE_CORE_IMAGE_TAG
  require_env NEXTJUDGE_JUDGE_IMAGE_TAG

  PREVIEW_BACKEND_ENV_TEMP=0
  if [[ -z "${PREVIEW_BACKEND_ENV_FILE:-}" ]]; then
    require_env PREVIEW_BACKEND_ENV
    PREVIEW_BACKEND_ENV_FILE="$(mktemp)"
    printf '%s\n' "$PREVIEW_BACKEND_ENV" > "$PREVIEW_BACKEND_ENV_FILE"
    PREVIEW_BACKEND_ENV_TEMP=1
  fi

  if [[ -z "${PREVIEW_BACKEND_ENV_FILE:-}" || ! -f "${PREVIEW_BACKEND_ENV_FILE}" ]]; then
    echo "No preview backend env. Configure the PREVIEW_BACKEND_ENV repository secret." >&2
    exit 1
  fi

  local override_local env_local
  override_local="$(mktemp)"
  env_local="$(mktemp)"
  write_traefik_override "$override_local"
  cp "$PREVIEW_BACKEND_ENV_FILE" "$env_local"

  if [[ -n "${DOCKERHUB_NAMESPACE:-}" ]]; then
    if grep -q '^DOCKERHUB_NAMESPACE=' "$env_local"; then
      sed -i.bak "s|^DOCKERHUB_NAMESPACE=.*|DOCKERHUB_NAMESPACE=${DOCKERHUB_NAMESPACE}|" "$env_local"
      rm -f "${env_local}.bak"
    else
      printf '\nDOCKERHUB_NAMESPACE=%s\n' "$DOCKERHUB_NAMESPACE" >> "$env_local"
    fi
  fi

  if [[ "${PREVIEW_BACKEND_ENV_TEMP:-0}" == "1" ]]; then
    rm -f "$PREVIEW_BACKEND_ENV_FILE"
  fi

  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$COOLIFY_SSH_HOST" "mkdir -p ${REMOTE_DIR}"

  scp -o BatchMode=yes -o StrictHostKeyChecking=yes \
    "$COMPOSE_FILE" \
    "$PREVIEW_COMPOSE_FILE" \
    "${SCRIPT_DIR}/validate-preview-backend-env.sh" \
    "$env_local" \
    "$override_local" \
    "${COOLIFY_SSH_HOST}:${REMOTE_DIR}/"

  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$COOLIFY_SSH_HOST" \
    "mv ${REMOTE_DIR}/$(basename "$env_local") ${REMOTE_DIR}/.env && mv ${REMOTE_DIR}/$(basename "$override_local") ${REMOTE_DIR}/traefik.override.yml"

  rm -f "$override_local" "$env_local"

  local core_tag="$NEXTJUDGE_CORE_IMAGE_TAG"
  local judge_tag="$NEXTJUDGE_JUDGE_IMAGE_TAG"

  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$COOLIFY_SSH_HOST" bash -s -- \
    "$PROJECT_NAME" "$PR_NUMBER" "$core_tag" "$judge_tag" "${DOCKERHUB_NAMESPACE:-}" <<'REMOTE'
set -euo pipefail
project="$1"
pr="$2"
core_tag="$3"
judge_tag="$4"
namespace="$5"
dir="$HOME/nextjudge-previews/pr-${pr}"
cd "$dir"

export NEXTJUDGE_CORE_IMAGE_TAG="$core_tag"
export NEXTJUDGE_JUDGE_IMAGE_TAG="$judge_tag"
if [[ -n "$namespace" ]]; then
  export DOCKERHUB_NAMESPACE="$namespace"
fi
# Compose parses .env itself. Do not execute configuration as shell code.
# Validate before pulling images or touching running services. Report key names only.
docker compose --project-name "$project" \
  -f docker-compose.coolify.yml -f docker-compose.preview.yml -f traefik.override.yml \
  config --environment | bash ./validate-preview-backend-env.sh

docker compose \
  --project-name "$project" \
  -f docker-compose.coolify.yml \
  -f docker-compose.preview.yml \
  -f traefik.override.yml \
  pull

docker compose \
  --project-name "$project" \
  -f docker-compose.coolify.yml \
  -f docker-compose.preview.yml \
  -f traefik.override.yml \
  up -d --wait db rabbitmq

docker compose \
  --project-name "$project" \
  -f docker-compose.coolify.yml \
  -f docker-compose.preview.yml \
  -f traefik.override.yml \
  run --rm --no-deps -T nextjudge-data-layer -seed-dev </dev/null

docker compose \
  --project-name "$project" \
  -f docker-compose.coolify.yml \
  -f docker-compose.preview.yml \
  -f traefik.override.yml \
  up -d --wait --remove-orphans

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

teardown_compose_project() {
  local compose_project="$1"
  mapfile -t containers < <(docker ps -aq --filter "label=com.docker.compose.project=${compose_project}" 2>/dev/null || true)
  if ((${#containers[@]} > 0)); then
    docker rm -f "${containers[@]}"
  fi

  mapfile -t volumes < <(docker volume ls -q --filter "label=com.docker.compose.project=${compose_project}" 2>/dev/null || true)
  if ((${#volumes[@]} > 0)); then
    docker volume rm -f "${volumes[@]}" 2>/dev/null || true
  fi

  mapfile -t networks < <(docker network ls -q --filter "label=com.docker.compose.project=${compose_project}" 2>/dev/null || true)
  if ((${#networks[@]} > 0)); then
    docker network rm "${networks[@]}" 2>/dev/null || true
  fi
}

if [[ -d "$dir" ]]; then
  rm -rf "$dir"
fi

teardown_compose_project "$project"

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
