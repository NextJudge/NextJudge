#!/usr/bin/env bash
set -euo pipefail

# Tear down Coolify PR preview deployments for web and/or docs.
#
# Usage:
#   ./scripts/coolify-preview-cleanup.sh <PR_NUMBER>
#   ./scripts/coolify-preview-cleanup.sh --all
#
# Required env (API path — Coolify v4 beta.474+):
#   COOLIFY_API_URL
#   COOLIFY_API_TOKEN
#   COOLIFY_WEB_APP_UUID
#   COOLIFY_DOCS_APP_UUID
#
# Optional (SSH fallback when preview DELETE API is unavailable):
#   COOLIFY_SSH_HOST          e.g. nextjudge or user@77.42.27.51
#   COOLIFY_PREVIEW_USE_SSH=1 force docker cleanup over SSH

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

delete_preview_via_api() {
  local app_uuid="$1"
  local pr_number="$2"

  local response http_code
  response="$(
    curl -sS -w "\n%{http_code}" -X DELETE \
      "${COOLIFY_API_URL}/applications/${app_uuid}/previews/${pr_number}" \
      -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
      -H "Accept: application/json"
  )"
  http_code="${response##*$'\n'}"
  body="${response%$'\n'*}"

  case "$http_code" in
    200)
      echo "Queued Coolify preview deletion for app ${app_uuid} (PR #${pr_number})." >&2
      return 0
      ;;
    404)
      echo "Coolify preview API unavailable or no preview record for app ${app_uuid} (PR #${pr_number})." >&2
      return 1
      ;;
    *)
      echo "Coolify preview delete failed (${http_code}) for app ${app_uuid} (PR #${pr_number}): ${body}" >&2
      return 1
      ;;
  esac
}

delete_preview_via_ssh() {
  local pr_number="$1"
  local ssh_host="${COOLIFY_SSH_HOST:?set COOLIFY_SSH_HOST for SSH fallback}"

  echo "Removing preview containers over SSH for PR #${pr_number}..." >&2
  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$ssh_host" bash -s -- "$pr_number" <<'REMOTE'
set -euo pipefail
pr="$1"
mapfile -t containers < <(
  while read -r id name; do
    [[ "$name" =~ -pr-${pr}$ ]] && echo "$id"
  done < <(docker ps -a --format '{{.ID}} {{.Names}}')
)
if ((${#containers[@]} == 0)); then
  echo "No preview containers found for PR #${pr}."
  exit 0
fi
docker ps -a --format '{{.Names}}' | grep -E -- "-pr-${pr}$" || true
docker rm -f "${containers[@]}"
echo "Removed ${#containers[@]} container(s) for PR #${pr}."
REMOTE
}

cleanup_pr() {
  local pr_number="$1"

  local api_ok=0
  if [[ -n "${COOLIFY_API_URL:-}" && -n "${COOLIFY_API_TOKEN:-}" ]]; then
    if [[ -n "${COOLIFY_WEB_APP_UUID:-}" ]]; then
      delete_preview_via_api "$COOLIFY_WEB_APP_UUID" "$pr_number" || api_ok=1
    fi
    if [[ -n "${COOLIFY_DOCS_APP_UUID:-}" ]]; then
      delete_preview_via_api "$COOLIFY_DOCS_APP_UUID" "$pr_number" || api_ok=1
    fi
  else
    api_ok=1
  fi

  if [[ "$api_ok" -ne 0 || "${COOLIFY_PREVIEW_USE_SSH:-}" == "1" ]]; then
    if [[ -n "${COOLIFY_SSH_HOST:-}" ]]; then
      delete_preview_via_ssh "$pr_number"
    elif [[ "$api_ok" -ne 0 ]]; then
      echo "No working cleanup path for PR #${pr_number}. Set COOLIFY_SSH_HOST or upgrade Coolify for preview DELETE API." >&2
      return 1
    fi
  fi
}

cleanup_all_via_ssh() {
  local ssh_host="${COOLIFY_SSH_HOST:?set COOLIFY_SSH_HOST for --all}"

  echo "Removing all preview containers over SSH..." >&2
  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$ssh_host" bash <<'REMOTE'
set -euo pipefail
mapfile -t containers < <(
  while read -r id name; do
    [[ "$name" =~ -pr-[0-9]+$ ]] && echo "$id"
  done < <(docker ps -a --format '{{.ID}} {{.Names}}')
)
if ((${#containers[@]} == 0)); then
  echo "No preview containers found."
  exit 0
fi
docker ps -a --format '{{.Names}}' | grep -E -- '-pr-[0-9]+$' || true
docker rm -f "${containers[@]}"
echo "Removed ${#containers[@]} preview container(s)."
REMOTE
}

main() {
  local target="${1:?usage: coolify-preview-cleanup.sh <PR_NUMBER> | --all}"

  if [[ "$target" == "--all" ]]; then
    cleanup_all_via_ssh
    return 0
  fi

  if ! [[ "$target" =~ ^[0-9]+$ ]] || [[ "$target" == "0" ]]; then
    echo "PR number must be a positive integer, got: ${target}" >&2
    exit 1
  fi

  cleanup_pr "$target"
}

main "$@"
