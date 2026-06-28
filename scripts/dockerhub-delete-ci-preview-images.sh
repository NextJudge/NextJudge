#!/usr/bin/env bash
set -euo pipefail

# Delete Docker Hub images tagged ci-{PR_HEAD_SHA} after a PR preview is torn down.
#
# Required env:
#   DOCKER_USERNAME
#   DOCKER_PASSWORD
#   PR_HEAD_SHA
#
# Optional env:
#   DOCKERHUB_NAMESPACE   default tnyuma
#   CI_IMAGE_REPOS        space-separated repo names (default: core judge basejudge)

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

require_env DOCKER_USERNAME
require_env DOCKER_PASSWORD
require_env PR_HEAD_SHA

DOCKERHUB_NAMESPACE="${DOCKERHUB_NAMESPACE:-tnyuma}"
CI_IMAGE_TAG="ci-${PR_HEAD_SHA}"
CI_IMAGE_REPOS="${CI_IMAGE_REPOS:-nextjudge-core nextjudge-judge nextjudge-basejudge}"

hub_token="$(
  curl -fsS -X POST "https://hub.docker.com/v2/users/login/" \
    -H "Content-Type: application/json" \
    -d "$(jq -nc --arg u "$DOCKER_USERNAME" --arg p "$DOCKER_PASSWORD" '{username: $u, password: $p}')"
)"

token="$(echo "$hub_token" | jq -r '.token // empty')"
if [[ -z "$token" ]]; then
  echo "Docker Hub login failed: ${hub_token}" >&2
  exit 1
fi

delete_tag() {
  local repo="$1"
  local url="https://hub.docker.com/v2/repositories/${DOCKERHUB_NAMESPACE}/${repo}/tags/${CI_IMAGE_TAG}/"
  local response http_code body

  response="$(
    curl -sS -w "\n%{http_code}" -X DELETE "$url" \
      -H "Authorization: JWT ${token}" \
      -H "Accept: application/json"
  )"
  http_code="${response##*$'\n'}"
  body="${response%$'\n'*}"

  case "$http_code" in
    202|204|200)
      echo "Deleted ${DOCKERHUB_NAMESPACE}/${repo}:${CI_IMAGE_TAG}" >&2
      return 0
      ;;
    404)
      echo "No tag ${CI_IMAGE_TAG} on ${DOCKERHUB_NAMESPACE}/${repo} (already removed)." >&2
      return 0
      ;;
    *)
      echo "Failed to delete ${DOCKERHUB_NAMESPACE}/${repo}:${CI_IMAGE_TAG} (${http_code}): ${body}" >&2
      return 1
      ;;
  esac
}

failed=0
for repo in $CI_IMAGE_REPOS; do
  delete_tag "$repo" || failed=1
done

if [[ "$failed" -ne 0 ]]; then
  exit 1
fi

echo "Docker Hub ci preview tags removed for ${CI_IMAGE_TAG}." >&2
