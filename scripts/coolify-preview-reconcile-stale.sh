#!/usr/bin/env bash
set -euo pipefail

# Remove preview resources for closed/merged PRs still running on the VPS.
#
# Usage:
#   COOLIFY_SSH_HOST=nextjudge ./scripts/coolify-preview-reconcile-stale.sh
#   COOLIFY_SSH_HOST=nextjudge ./scripts/coolify-preview-reconcile-stale.sh 108 110
#
# Required env:
#   COOLIFY_SSH_HOST
#   GITHUB_TOKEN or gh auth (for listing open PRs)
#
# Optional env (passed through to coolify-preview-cleanup.sh):
#   COOLIFY_API_URL, COOLIFY_API_TOKEN, COOLIFY_*_APP_UUID, etc.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

require_env COOLIFY_SSH_HOST

collect_preview_pr_numbers() {
  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$COOLIFY_SSH_HOST" bash <<'REMOTE'
set -euo pipefail
declare -A seen=()
while read -r name; do
  if [[ "$name" =~ -pr-([0-9]+)$ ]]; then
    seen["${BASH_REMATCH[1]}"]=1
  elif [[ "$name" =~ ^nextjudge-pr-([0-9]+)- ]]; then
    seen["${BASH_REMATCH[1]}"]=1
  fi
done < <(docker ps -a --format '{{.Names}}')
printf '%s\n' "${!seen[@]}" | sort -n
REMOTE
}

list_open_pr_numbers() {
  if ! command -v gh >/dev/null; then
    echo "gh CLI is required to list open pull requests." >&2
    exit 1
  fi
  gh pr list --repo NextJudge/NextJudge --state open --json number --jq '.[].number'
}

main() {
  local -a explicit=("$@")
  local -a discovered=()
  local -a open_prs=()
  local -a stale=()
  local pr

  mapfile -t discovered < <(collect_preview_pr_numbers)
  mapfile -t open_prs < <(list_open_pr_numbers)

  if ((${#explicit[@]} > 0)); then
    stale=("${explicit[@]}")
  else
    for pr in "${discovered[@]}"; do
      [[ " ${open_prs[*]} " == *" ${pr} "* ]] && continue
      stale+=("$pr")
    done
  fi

  if ((${#stale[@]} == 0)); then
    echo "No stale preview PR stacks to reconcile." >&2
    return 0
  fi

  echo "Reconciling stale previews for PR(s): ${stale[*]}" >&2
  for pr in "${stale[@]}"; do
    PR_NUMBER="$pr" "${SCRIPT_DIR}/coolify-preview-cleanup.sh" "$pr"
  done

  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$COOLIFY_SSH_HOST" \
    "VACUUM_JOURNAL=1 bash -s" < "${SCRIPT_DIR}/coolify-preview-server-prune.sh"
}

main "$@"
