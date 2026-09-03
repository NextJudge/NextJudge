#!/usr/bin/env bash
set -euo pipefail

# Deploy an exact Git SHA through Coolify, wait for each deployment, verify the
# public platform, and restore the previous immutable release on failure.

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

require_env COOLIFY_API_URL
require_env COOLIFY_API_TOKEN
require_env TARGET_SHA
require_env ROLLBACK_SHA

if [[ ! "$TARGET_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "TARGET_SHA must be a full lowercase Git commit SHA." >&2
  exit 1
fi
if [[ ! "$ROLLBACK_SHA" =~ ^[0-9a-f]{40}$ || "$ROLLBACK_SHA" == "$TARGET_SHA" ]]; then
  echo "ROLLBACK_SHA must be a different full lowercase Git commit SHA." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PRODUCTION_COMPOSE_FILE="${REPO_ROOT}/compose/docker-compose.coolify.yml"
DEPLOY_BACKEND="${DEPLOY_BACKEND:-false}"
DEPLOY_WEB="${DEPLOY_WEB:-false}"
DEPLOY_DOCS="${DEPLOY_DOCS:-false}"
CORE_CHANGED="${CORE_CHANGED:-false}"
JUDGE_CHANGED="${JUDGE_CHANGED:-false}"
DEPLOY_TIMEOUT_SEC="${DEPLOY_TIMEOUT_SEC:-1200}"
DEPLOY_POLL_INTERVAL_SEC="${DEPLOY_POLL_INTERVAL_SEC:-15}"
HEALTH_TIMEOUT_SEC="${HEALTH_TIMEOUT_SEC:-300}"
HEALTH_POLL_INTERVAL_SEC="${HEALTH_POLL_INTERVAL_SEC:-10}"
PROD_API_HEALTH_URL="${PROD_API_HEALTH_URL:-https://api.nextjudge.net/healthy}"
PROD_WEB_HEALTH_URL="${PROD_WEB_HEALTH_URL:-https://nextjudge.net/}"
PROD_DOCS_HEALTH_URL="${PROD_DOCS_HEALTH_URL:-https://docs.nextjudge.net/}"
IMAGE_TAG="sha-${TARGET_SHA}"

for value in "$DEPLOY_BACKEND" "$DEPLOY_WEB" "$DEPLOY_DOCS" "$CORE_CHANGED" "$JUDGE_CHANGED"; do
  if [[ "$value" != "true" && "$value" != "false" ]]; then
    echo "Deployment flags must be true or false." >&2
    exit 1
  fi
done

if [[ "$DEPLOY_BACKEND" == "true" ]]; then
  require_env COOLIFY_BACKEND_SERVICE_UUID
  require_env DOCKERHUB_NAMESPACE
  [[ -f "$PRODUCTION_COMPOSE_FILE" ]] || {
    echo "Production compose file not found: ${PRODUCTION_COMPOSE_FILE}" >&2
    exit 1
  }
  DOCKERHUB_NAMESPACE="$DOCKERHUB_NAMESPACE" \
    NEXTJUDGE_CORE_IMAGE_TAG="$IMAGE_TAG" \
    NEXTJUDGE_JUDGE_IMAGE_TAG="$IMAGE_TAG" \
    docker compose -f "$PRODUCTION_COMPOSE_FILE" config --quiet
fi
if [[ "$DEPLOY_WEB" == "true" ]]; then
  require_env COOLIFY_WEB_APP_UUID
fi
if [[ "$DEPLOY_DOCS" == "true" ]]; then
  require_env COOLIFY_DOCS_APP_UUID
fi

api_get() {
  curl -fsS "$1" \
    -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    -H "Accept: application/json"
}

api_json() {
  local method="$1"
  local url="$2"
  local payload="$3"
  curl -fsS -X "$method" "$url" \
    -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -d "$payload"
}

production_env_value() {
  local service_uuid="$1"
  local key="$2"
  api_get "${COOLIFY_API_URL}/services/${service_uuid}/envs" \
    | jq -r --arg key "$key" \
      '[.[] | select(.key == $key and ((.is_preview // false) == false))][0].value // empty'
}

require_production_env() {
  local service_uuid="$1"
  local key="$2"
  if [[ -z "$(production_env_value "$service_uuid" "$key")" ]]; then
    echo "Missing production environment value for ${key}." >&2
    exit 1
  fi
}

set_production_env() {
  local resource_type="$1"
  local uuid="$2"
  local key="$3"
  local value="$4"
  COOLIFY_RESOURCE_TYPE="$resource_type" \
    COOLIFY_APP_UUID="$uuid" \
    IS_PREVIEW=false \
    KEY="$key" \
    VALUE="$value" \
    COOLIFY_API_URL="$COOLIFY_API_URL" \
    COOLIFY_API_TOKEN="$COOLIFY_API_TOKEN" \
    "${SCRIPT_DIR}/coolify-upsert-env.sh"
}

set_service_compose_text() {
  local service_uuid="$1"
  local compose_text="$2"
  local encoded
  encoded="$(printf '%s' "$compose_text" | base64 | tr -d '\n')"
  api_json PATCH "${COOLIFY_API_URL}/services/${service_uuid}" \
    "$(jq -nc --arg compose "$encoded" '{docker_compose_raw: $compose}')" >/dev/null
}

set_service_compose_file() {
  local service_uuid="$1"
  local compose_file="$2"
  local encoded
  encoded="$(base64 <"$compose_file" | tr -d '\n')"
  api_json PATCH "${COOLIFY_API_URL}/services/${service_uuid}" \
    "$(jq -nc --arg compose "$encoded" '{docker_compose_raw: $compose}')" >/dev/null
}

queue_deploy() {
  local resource_uuid="$1"
  local response deployment_uuid
  response="$(api_get "${COOLIFY_API_URL}/deploy?uuid=${resource_uuid}&force=false")"
  deployment_uuid="$(
    jq -r --arg uuid "$resource_uuid" \
      '.deployments[]? | select(.resource_uuid == $uuid) | .deployment_uuid // empty' \
      <<<"$response" | head -1
  )"
  if [[ -z "$deployment_uuid" ]]; then
    echo "Coolify did not return a deployment UUID for resource ${resource_uuid}." >&2
    return 1
  fi
  printf '%s\n' "$deployment_uuid"
}

wait_for_deployment() {
  local deployment_uuid="$1"
  local label="$2"
  local deadline status
  deadline=$((SECONDS + DEPLOY_TIMEOUT_SEC))
  echo "Waiting for ${label} deployment ${deployment_uuid}." >&2
  while (( SECONDS < deadline )); do
    status="$(api_get "${COOLIFY_API_URL}/deployments/${deployment_uuid}" | jq -r '.status // empty')"
    case "$status" in
      finished|success|succeeded)
        echo "${label} deployment ${deployment_uuid} finished." >&2
        return 0
        ;;
      failed|error|cancelled|cancelled-by-user)
        echo "${label} deployment ${deployment_uuid} ended with status '${status}'." >&2
        return 1
        ;;
    esac
    sleep "$DEPLOY_POLL_INTERVAL_SEC"
  done
  echo "Timed out waiting for ${label} deployment ${deployment_uuid}." >&2
  return 1
}

deploy_and_wait() {
  local resource_uuid="$1"
  local label="$2"
  local deployment_uuid
  deployment_uuid="$(queue_deploy "$resource_uuid")" || return 1
  wait_for_deployment "$deployment_uuid" "$label"
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local deadline http_code
  deadline=$((SECONDS + HEALTH_TIMEOUT_SEC))
  while (( SECONDS < deadline )); do
    http_code="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 10 --max-time 20 "$url" || true)"
    if [[ "$http_code" =~ ^[23][0-9][0-9]$ ]]; then
      echo "${label} health check passed (${http_code})." >&2
      return 0
    fi
    sleep "$HEALTH_POLL_INTERVAL_SEC"
  done
  echo "${label} health check failed at ${url}." >&2
  return 1
}

pin_application() {
  local uuid="$1"
  local commit="$2"
  api_json PATCH "${COOLIFY_API_URL}/applications/${uuid}" \
    "$(jq -nc --arg commit "$commit" '{git_commit_sha: $commit}')" >/dev/null
}

current_application_commit() {
  local uuid="$1"
  api_get "${COOLIFY_API_URL}/applications/${uuid}" |
    jq -r '.git_commit_sha // empty'
}

rollback_application() {
  local uuid="$1"
  local commit="$2"
  local label="$3"
  local deployment_uuid
  if [[ ! "$commit" =~ ^[0-9a-f]{40}$ ]]; then
    echo "No safe previous commit is known for ${label}; automatic rollback skipped." >&2
    return 1
  fi

  echo "Rolling ${label} back to commit ${commit}." >&2
  pin_application "$uuid" "$commit"
  deployment_uuid="$(queue_deploy "$uuid")" || return 1
  wait_for_deployment "$deployment_uuid" "${label} rollback"
}

safe_backend_rollback_tag() {
  local current="$1"
  local fallback="$2"
  if [[ "$current" =~ ^sha-[0-9a-f]{40}$ ]]; then
    printf '%s\n' "$current"
  elif [[ "$fallback" =~ ^sha-[0-9a-f]{40}$ ]]; then
    printf '%s\n' "$fallback"
  fi
}

old_core_tag=""
old_judge_tag=""
previous_backend_compose=""
rollback_core_tag=""
rollback_judge_tag=""
previous_web_commit=""
previous_docs_commit=""
backend_mutated=false
backend_compose_updated=false
web_mutated=false
docs_mutated=false

if [[ "$DEPLOY_BACKEND" == "true" ]]; then
  for key in \
    JUDGE_PASSWORD \
    JWT_SIGNING_SECRET \
    WEB_BRIDGE_SECRET \
    DB_PASSWORD \
    RABBITMQ_USER \
    RABBITMQ_PASSWORD \
    CORS_ORIGIN \
    ADMIN_EMAILS \
    AUTH_RATE_LIMIT_PER_MIN \
    AUTH_RATE_LIMIT_BURST; do
    require_production_env "$COOLIFY_BACKEND_SERVICE_UUID" "$key"
  done

  old_core_tag="$(production_env_value "$COOLIFY_BACKEND_SERVICE_UUID" NEXTJUDGE_CORE_IMAGE_TAG)"
  old_judge_tag="$(production_env_value "$COOLIFY_BACKEND_SERVICE_UUID" NEXTJUDGE_JUDGE_IMAGE_TAG)"
  previous_backend_compose="$(
    api_get "${COOLIFY_API_URL}/services/${COOLIFY_BACKEND_SERVICE_UUID}" |
      jq -er '.docker_compose_raw | select(type == "string" and length > 0)'
  )"
  rollback_core_tag="$(safe_backend_rollback_tag "$old_core_tag" "${CORE_ROLLBACK_TAG:-sha-${ROLLBACK_SHA}}")"
  rollback_judge_tag="$(safe_backend_rollback_tag "$old_judge_tag" "${JUDGE_ROLLBACK_TAG:-sha-${ROLLBACK_SHA}}")"

  # These are production invariants, not optional runtime tuning.
  set_production_env service "$COOLIFY_BACKEND_SERVICE_UUID" PASSWORD_RESET_DEBUG false
  set_production_env service "$COOLIFY_BACKEND_SERVICE_UUID" ALLOW_INSECURE_PASSWORD_RESET false
  set_production_env service "$COOLIFY_BACKEND_SERVICE_UUID" CORS_ALLOW_PREVIEW false
  set_production_env service "$COOLIFY_BACKEND_SERVICE_UUID" BASIC_REGISTRATION_ENABLED false
  set_production_env service "$COOLIFY_BACKEND_SERVICE_UUID" DOCKERHUB_NAMESPACE "$DOCKERHUB_NAMESPACE"
  if [[ "$CORE_CHANGED" == "true" ]]; then
    set_production_env service "$COOLIFY_BACKEND_SERVICE_UUID" NEXTJUDGE_CORE_IMAGE_TAG "$IMAGE_TAG"
  fi
  if [[ "$JUDGE_CHANGED" == "true" ]]; then
    set_production_env service "$COOLIFY_BACKEND_SERVICE_UUID" NEXTJUDGE_JUDGE_IMAGE_TAG "$IMAGE_TAG"
  fi
  backend_mutated=true
  if ! set_service_compose_file "$COOLIFY_BACKEND_SERVICE_UUID" "$PRODUCTION_COMPOSE_FILE"; then
    echo "Coolify rejected the production compose update; restoring image tags." >&2
    if [[ -n "$rollback_core_tag" ]]; then
      set_production_env service "$COOLIFY_BACKEND_SERVICE_UUID" NEXTJUDGE_CORE_IMAGE_TAG "$rollback_core_tag" || true
    fi
    if [[ -n "$rollback_judge_tag" ]]; then
      set_production_env service "$COOLIFY_BACKEND_SERVICE_UUID" NEXTJUDGE_JUDGE_IMAGE_TAG "$rollback_judge_tag" || true
    fi
    exit 1
  fi
  backend_compose_updated=true
fi

if [[ "$DEPLOY_WEB" == "true" ]]; then
  previous_web_commit="$(current_application_commit "$COOLIFY_WEB_APP_UUID")"
  if [[ ! "$previous_web_commit" =~ ^[0-9a-f]{40}$ ]]; then
    previous_web_commit="$ROLLBACK_SHA"
  fi
  set_production_env application "$COOLIFY_WEB_APP_UUID" BASIC_REGISTRATION_ENABLED false
  pin_application "$COOLIFY_WEB_APP_UUID" "$TARGET_SHA"
  web_mutated=true
fi
if [[ "$DEPLOY_DOCS" == "true" ]]; then
  previous_docs_commit="$(current_application_commit "$COOLIFY_DOCS_APP_UUID")"
  if [[ ! "$previous_docs_commit" =~ ^[0-9a-f]{40}$ ]]; then
    previous_docs_commit="$ROLLBACK_SHA"
  fi
  pin_application "$COOLIFY_DOCS_APP_UUID" "$TARGET_SHA"
  docs_mutated=true
fi

failed=false
if [[ "$DEPLOY_BACKEND" == "true" ]] && ! deploy_and_wait "$COOLIFY_BACKEND_SERVICE_UUID" backend; then
  failed=true
fi
if [[ "$failed" == "false" && "$DEPLOY_WEB" == "true" ]] && ! deploy_and_wait "$COOLIFY_WEB_APP_UUID" web; then
  failed=true
fi
if [[ "$failed" == "false" && "$DEPLOY_DOCS" == "true" ]] && ! deploy_and_wait "$COOLIFY_DOCS_APP_UUID" docs; then
  failed=true
fi

if [[ "$failed" == "false" ]]; then
  wait_for_url "$PROD_API_HEALTH_URL" API || failed=true
  [[ "$failed" == "true" ]] || wait_for_url "$PROD_WEB_HEALTH_URL" web || failed=true
  [[ "$failed" == "true" ]] || wait_for_url "$PROD_DOCS_HEALTH_URL" docs || failed=true
fi

if [[ "$failed" == "false" ]]; then
  echo "Production deployment for ${TARGET_SHA} completed and passed all health checks." >&2
  exit 0
fi

echo "Production verification failed; starting rollback of changed resources." >&2
rollback_failed=false
if [[ "$backend_mutated" == "true" ]]; then
  if [[ "$CORE_CHANGED" == "true" && -n "$rollback_core_tag" ]]; then
    set_production_env service "$COOLIFY_BACKEND_SERVICE_UUID" NEXTJUDGE_CORE_IMAGE_TAG "$rollback_core_tag" || rollback_failed=true
  elif [[ "$CORE_CHANGED" == "true" ]]; then
    echo "No safe immutable core rollback tag is known." >&2
    rollback_failed=true
  fi
  if [[ "$JUDGE_CHANGED" == "true" && -n "$rollback_judge_tag" ]]; then
    set_production_env service "$COOLIFY_BACKEND_SERVICE_UUID" NEXTJUDGE_JUDGE_IMAGE_TAG "$rollback_judge_tag" || rollback_failed=true
  elif [[ "$JUDGE_CHANGED" == "true" ]]; then
    echo "No safe immutable judge rollback tag is known." >&2
    rollback_failed=true
  fi
  if ! deploy_and_wait "$COOLIFY_BACKEND_SERVICE_UUID" "backend rollback"; then
    if [[ "$backend_compose_updated" == "true" && -n "$previous_backend_compose" ]]; then
      echo "Pinned-image rollback failed; restoring the previous backend compose definition." >&2
      if set_service_compose_text "$COOLIFY_BACKEND_SERVICE_UUID" "$previous_backend_compose" &&
         deploy_and_wait "$COOLIFY_BACKEND_SERVICE_UUID" "backend compose rollback"; then
        echo "Previous backend compose definition restored." >&2
      else
        rollback_failed=true
      fi
    else
      rollback_failed=true
    fi
  fi
fi
if [[ "$web_mutated" == "true" ]]; then
  rollback_application "$COOLIFY_WEB_APP_UUID" "$previous_web_commit" web || rollback_failed=true
fi
if [[ "$docs_mutated" == "true" ]]; then
  rollback_application "$COOLIFY_DOCS_APP_UUID" "$previous_docs_commit" docs || rollback_failed=true
fi

if [[ "$rollback_failed" == "true" ]]; then
  echo "Automatic rollback was incomplete; operator intervention is required." >&2
else
  echo "Changed resources were rolled back to their previous immutable releases." >&2
fi
exit 1
