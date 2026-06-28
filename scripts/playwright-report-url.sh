#!/usr/bin/env bash
set -euo pipefail

# Prints the GitHub Pages URL for a Playwright HTML report.
# Usage: playwright-report-url.sh [PR_NUMBER] [RUN_ID]

REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
PR_NUMBER="${1:-${PR_NUMBER:?PR_NUMBER is required}}"
RUN_ID="${2:-${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}}"

owner="${REPO%%/*}"
repo="${REPO##*/}"
owner_lower="$(printf '%s' "$owner" | tr '[:upper:]' '[:lower:]')"

printf 'https://%s.github.io/%s/playwright/pr-%s/%s/playwright-report/index.html\n' \
  "$owner_lower" \
  "$repo" \
  "$PR_NUMBER" \
  "$RUN_ID"
