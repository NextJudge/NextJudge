#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
credentials=$'DB_PASSWORD=test-only\nJWT_SIGNING_SECRET=test-only\nJUDGE_PASSWORD=test-only\nWEB_BRIDGE_SECRET=test-only\nRABBITMQ_USER=test-only\nRABBITMQ_PASSWORD=test-only'

printf '%s\n' "$credentials" | bash "$SCRIPT_DIR/validate-preview-backend-env.sh"
for input in '' 'NEXTJUDGE_CORE_IMAGE_TAG=ci-example' "${credentials}"$'\nDB_PASSWORD=' "${credentials}"$'\nJWT_SIGNING_SECRET=   '; do
  if output="$(printf '%s\n' "$input" | bash "$SCRIPT_DIR/validate-preview-backend-env.sh" 2>&1)"; then
    echo 'Incomplete preview configuration was accepted' >&2
    exit 1
  fi
  [[ "$output" == *'Missing preview backend configuration:'* ]]
  [[ "$output" != *'test-only'* ]]
done

# Stub the GitHub boundary: exercise actual comment rendering without network writes.
gh() {
  case "$1 $2" in
    'api repos/'*) return 0 ;;
    'pr comment') printf '%s\n' "${@: -1}" ;;
    *) echo 'Unexpected GitHub invocation' >&2; return 1 ;;
  esac
}
export -f gh
export GITHUB_REPOSITORY=NextJudge/NextJudge PR_NUMBER=110 SHA=abcdef123456 GITHUB_RUN_ID=123
export WEB_CHANGED=true DOCS_CHANGED=true BACKEND_CHANGED=true
export E2E_RAN=true E2E_RESULT=success E2E_REPORT_PUBLISHED=true
export BACKEND_DEPLOY_RESULT=failure WEB_DEPLOY_RESULT=skipped DOCS_DEPLOY_RESULT=skipped

body="$(bash "$SCRIPT_DIR/update-pr-status-comment.sh" preview-failed)"
[[ "$body" == *'| API | ❌ Deploy failed |'* ]]
[[ "$body" == *'| Web | — Not attempted |'* ]]
[[ "$body" == *'| Docs | — Not attempted |'* ]]
[[ "$body" == *'| E2E report | ✅ |'* ]]
[[ "$body" == *'isolated CI stack'* ]]
[[ "$body" != *'### CI passed'* ]]

export BACKEND_DEPLOY_RESULT=success WEB_DEPLOY_RESULT=success DOCS_DEPLOY_RESULT=success
body="$(bash "$SCRIPT_DIR/update-pr-status-comment.sh" preview-failed)"
[[ "$body" == *'| API | 🟠 Deploy requested; health unconfirmed |'* ]]
[[ "$body" != *'✅ Healthy'* ]]

body="$(bash "$SCRIPT_DIR/update-pr-status-comment.sh" preview-ready)"
[[ "$body" == *'| Web | ✅ Healthy |'* ]]
body="$(bash "$SCRIPT_DIR/update-pr-status-comment.sh" ci-failed)"
[[ "$body" == *'| API | — Not attempted |'* ]]
echo 'Preview configuration and status comment tests passed.'
