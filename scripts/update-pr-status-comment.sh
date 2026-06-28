#!/usr/bin/env bash
set -euo pipefail

# Updates (or creates) the single PR status comment for CI + preview deploys.
# Usage: update-pr-status-comment.sh <ci-success|ci-failed|preview-ready|preview-failed>

PHASE="${1:?usage: update-pr-status-comment.sh <ci-success|ci-failed|preview-ready|preview-failed>}"
MARKER="<!-- nextjudge-ci-status -->"
REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
PR_NUMBER="${PR_NUMBER:?PR_NUMBER is required}"
SHA="${SHA:?SHA is required}"
WEB_CHANGED="${WEB_CHANGED:-false}"
DOCS_CHANGED="${DOCS_CHANGED:-false}"
E2E_RAN="${E2E_RAN:-false}"
E2E_RESULT="${E2E_RESULT:-skipped}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

preview_url() {
  "${SCRIPT_DIR}/preview-url.sh" "$1" "$PR_NUMBER"
}

preview_status() {
  case "$PHASE" in
    preview-ready) echo "✅" ;;
    preview-failed) echo "❌" ;;
    *) echo "🟠" ;;
  esac
}

e2e_report_status() {
  case "$E2E_RESULT" in
    success) echo "✅" ;;
    failure) echo "❌" ;;
    *) echo "—" ;;
  esac
}

has_deployment_table() {
  [ "$WEB_CHANGED" = "true" ] || [ "$DOCS_CHANGED" = "true" ] || [ "$E2E_RAN" = "true" ]
}

append_preview_row() {
  local label="$1"
  local key="$2"
  local url status row
  url="$(preview_url "$key")"
  status="$(preview_status)"
  printf -v row '| %s | %s | [Link](%s) |' "$label" "$status" "$url"
  body="${body}${row}"$'\n'
}

append_e2e_report_row() {
  if [ "$E2E_RAN" != "true" ] || [ -z "${GITHUB_RUN_ID:-}" ]; then
    return 0
  fi

  local url status row
  url="$("${SCRIPT_DIR}/playwright-report-url.sh" "$PR_NUMBER" "$GITHUB_RUN_ID")"
  status="$(e2e_report_status)"
  printf -v row '| E2E report | %s | [Link](%s) |' "$status" "$url"
  body="${body}${row}"$'\n'
}

append_deployments_table() {
  body="${body}
### Previews & reports

| Service | Status | Link |
|---------|--------|------|
"
  if [ "$WEB_CHANGED" = "true" ]; then
    append_preview_row Web web
  fi
  if [ "$DOCS_CHANGED" = "true" ]; then
    append_preview_row Docs docs
  fi
  append_e2e_report_row
}

run_url=""
if [ -n "${GITHUB_RUN_ID:-}" ]; then
  run_url="https://github.com/${REPO}/actions/runs/${GITHUB_RUN_ID}"
fi

if [ "$PHASE" = "ci-failed" ]; then
  if [ -z "$run_url" ]; then
    echo "GITHUB_RUN_ID is required for ci-failed" >&2
    exit 1
  fi
  artifacts_url="${run_url}#artifacts"
  body="${MARKER}
### CI failed

Checks failed for commit \`${SHA:0:7}\`.

[View workflow run](${run_url})"
  if has_deployment_table; then
    append_deployments_table
  fi
  body="${body}

See the **Playwright E2E** comment below if specs failed."
  if [ "$E2E_RESULT" = "failure" ]; then
    body="${body}
[Download artifact backup](${artifacts_url}) (\`playwright-e2e-*\`, kept 7 days)."
  fi
elif has_deployment_table; then
  body="${MARKER}
### CI passed

Build succeeded for commit \`${SHA:0:7}\`.
"
  append_deployments_table

  if [ "$PHASE" = "preview-ready" ]; then
    body="${body}
Preview URLs are live. Last deploy: \`${SHA:0:7}\`."
  elif [ "$PHASE" = "preview-failed" ]; then
    body="${body}
Preview deploy failed for commit \`${SHA:0:7}\`. Check the workflow logs for details."
  elif [ "$WEB_CHANGED" = "true" ] || [ "$DOCS_CHANGED" = "true" ]; then
    body="${body}
Preview deploys are in progress. Links below will become available shortly."
  fi
else
  body="${MARKER}
### CI passed

Build succeeded for commit \`${SHA:0:7}\`.
No preview deployments for this PR (web/docs unchanged)."
fi

comment_id="$(gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" \
  --jq "map(select(.body | contains(\"${MARKER}\"))) | .[0].id // empty")"

if [ -n "$comment_id" ]; then
  gh api -X PATCH "repos/${REPO}/issues/comments/${comment_id}" -f body="$body"
else
  gh pr comment "$PR_NUMBER" --repo "$REPO" --body "$body"
fi
