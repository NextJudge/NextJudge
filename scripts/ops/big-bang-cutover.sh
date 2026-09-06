#!/usr/bin/env bash
set -euo pipefail

# Big-bang production cutover orchestrator (operator-run).
# Requires: gh, ssh nextjudge, prod recovery already complete, M8 epic on dev/platform-v1.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

TARGET_SHA="${TARGET_SHA:-}"
ROLLBACK_SHA="${ROLLBACK_SHA:-}"

usage() {
  cat <<'EOF'
Usage: big-bang-cutover.sh --target-sha SHA --rollback-sha SHA

Steps:
  1. Enable API maintenance (DEPLOY_BACKEND with MAINTENANCE_MODE=true)
  2. Final pg_dump via prod-recovery/backup.sh
  3. Deploy epic SHA via gh workflow deploy-production.yml
  4. Run content-import.py --execute against prod API (operator)
  5. Disable maintenance and smoke test

Set TARGET_SHA and ROLLBACK_SHA to full git SHAs before running.
EOF
}

while (($#)); do
  case "$1" in
    --target-sha) TARGET_SHA="${2:-}"; shift 2 ;;
    --rollback-sha) ROLLBACK_SHA="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$TARGET_SHA" && -n "$ROLLBACK_SHA" ]] || { usage >&2; exit 2; }

printf '=== Big-bang cutover ===\n'
printf 'Target: %s\nRollback: %s\n' "$TARGET_SHA" "$ROLLBACK_SHA"

printf '\n[1/5] Dispatch production deploy (maintenance backend)...\n'
gh workflow run deploy-production.yml \
  -f target_sha="$TARGET_SHA" \
  -f rollback_sha="$ROLLBACK_SHA" \
  -f deploy_backend=true \
  -f deploy_web=false \
  -f deploy_docs=false

printf '\n[2/5] Operator: run backup.sh against production database\n'
printf '  %s/prod-recovery/backup.sh --database nextjudge ...\n' "${REPO_ROOT}/scripts"

printf '\n[3/5] Dispatch full stack deploy...\n'
gh workflow run deploy-production.yml \
  -f target_sha="$TARGET_SHA" \
  -f rollback_sha="$ROLLBACK_SHA" \
  -f deploy_backend=true \
  -f deploy_web=true \
  -f deploy_docs=true

printf '\n[4/5] Operator: import launch catalog\n'
printf '  python3 scripts/content-import.py --execute --api https://api.nextjudge.net\n'

printf '\n[5/5] Smoke checklist:\n'
printf '  - curl https://api.nextjudge.net/healthy\n'
printf '  - curl https://docs.nextjudge.net/reference/api/\n'
printf '  - GitHub login + solve beacon-checksum\n'
printf '  - gh pr checks (if tracking PR open)\n'

printf '\nCutover script finished. Monitor for 48h; rollback SHA: %s\n' "$ROLLBACK_SHA"
