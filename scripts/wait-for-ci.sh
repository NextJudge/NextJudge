#!/usr/bin/env bash
set -euo pipefail

# Wait for the push-triggered CI workflow for one exact commit. This prevents a
# concurrently-triggered production workflow from publishing or deploying before
# the branch-protection aggregate has completed successfully.

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

require_env GITHUB_REPOSITORY
require_env GITHUB_SHA
require_env GITHUB_TOKEN

if [[ ! "$GITHUB_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "GITHUB_SHA must be a full lowercase Git commit SHA." >&2
  exit 1
fi

WAIT_TIMEOUT_SEC="${CI_WAIT_TIMEOUT_SEC:-3600}"
POLL_INTERVAL_SEC="${CI_POLL_INTERVAL_SEC:-15}"
deadline=$((SECONDS + WAIT_TIMEOUT_SEC))
api_url="https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/workflows/ci.yml/runs"

echo "Waiting for CI to complete for ${GITHUB_SHA}." >&2
while (( SECONDS < deadline )); do
  response="$(
    curl -fsS --get "$api_url" \
      -H "Authorization: Bearer ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      --data-urlencode "head_sha=${GITHUB_SHA}" \
      --data-urlencode "event=push" \
      --data-urlencode "per_page=20"
  )"

  run="$(jq -c '.workflow_runs | sort_by(.run_number) | last // empty' <<<"$response")"
  if [[ -n "$run" ]]; then
    status="$(jq -r '.status // empty' <<<"$run")"
    conclusion="$(jq -r '.conclusion // empty' <<<"$run")"
    run_id="$(jq -r '.id // empty' <<<"$run")"
    if [[ "$status" == "completed" ]]; then
      if [[ "$conclusion" == "success" ]]; then
        echo "CI run ${run_id} completed successfully." >&2
        exit 0
      fi
      echo "CI run ${run_id} completed with conclusion '${conclusion:-unknown}'; refusing production deployment." >&2
      exit 1
    fi
  fi

  sleep "$POLL_INTERVAL_SEC"
done

echo "Timed out waiting for CI for ${GITHUB_SHA}." >&2
exit 1
