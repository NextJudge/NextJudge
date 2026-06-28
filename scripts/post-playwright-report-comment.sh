#!/usr/bin/env bash
set -euo pipefail

# Posts (or updates) the PR comment with the live Playwright report URL.
MARKER="<!-- nextjudge-playwright-report -->"
REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
PR_NUMBER="${PR_NUMBER:?PR_NUMBER is required}"
GITHUB_RUN_ID="${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

report_url="$("$SCRIPT_DIR/playwright-report-url.sh" "$PR_NUMBER" "$GITHUB_RUN_ID")"
run_url="https://github.com/${REPO}/actions/runs/${GITHUB_RUN_ID}"

body="${MARKER}
### Playwright report

[Open interactive report](${report_url}) — traces, screenshots, and videos for this run.

[Workflow run](${run_url}) · artifact backup kept 7 days"

comment_id="$(gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" \
  --jq "map(select(.body | contains(\"${MARKER}\"))) | .[0].id // empty")"

if [ -n "$comment_id" ]; then
  gh api -X PATCH "repos/${REPO}/issues/comments/${comment_id}" -f body="$body"
else
  gh pr comment "$PR_NUMBER" --repo "$REPO" --body "$body"
fi
