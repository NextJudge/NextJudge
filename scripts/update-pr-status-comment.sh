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

append_preview_row() {
  local label="$1"
  local key="$2"
  local url status
  url="$(preview_url "$key")"
  status="$(preview_status)"
  printf '| %s | %s | [Link](%s) |\n' "$label" "$status" "$url"
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

[View workflow run](${run_url})

#### Playwright E2E

- See the **Playwright E2E** comment below for which specs failed.
- [Download report, traces, and screenshots](${artifacts_url}) from the \`playwright-e2e-*\` artifact (kept 7 days).
- To replay what the browser did: unzip the artifact, then drag \`test-results/**/trace.zip\` onto [trace.playwright.dev](https://trace.playwright.dev)."
elif [ "$WEB_CHANGED" = "true" ] || [ "$DOCS_CHANGED" = "true" ]; then
  body="${MARKER}
### CI passed

Build succeeded for commit \`${SHA:0:7}\`.
"
  body="${body}
### Preview deployments

| Service | Status | Preview |
|---------|--------|---------|
"
  if [ "$WEB_CHANGED" = "true" ]; then
    body="${body}$(append_preview_row Web web)"
  fi
  if [ "$DOCS_CHANGED" = "true" ]; then
    body="${body}$(append_preview_row Docs docs)"
  fi

  if [ "$PHASE" = "preview-ready" ]; then
    body="${body}
Preview URLs are live. Last deploy: \`${SHA:0:7}\`."
  elif [ "$PHASE" = "preview-failed" ]; then
    body="${body}
Preview deploy failed for commit \`${SHA:0:7}\`. Check the workflow logs for details."
  else
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
