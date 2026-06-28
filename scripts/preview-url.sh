#!/usr/bin/env bash
set -euo pipefail

# Prints the Coolify preview URL for a PR-scoped web, docs, or API deployment.
# Usage: preview-url.sh <web|docs|api> [PR_NUMBER]

SERVICE="${1:?usage: preview-url.sh <web|docs|api> [PR_NUMBER]}"
PR_NUMBER="${2:-${PR_NUMBER:?PR_NUMBER is required}}"

case "$SERVICE" in
  web) echo "https://${PR_NUMBER}-web.preview.nextjudge.net" ;;
  docs) echo "https://${PR_NUMBER}-docs.preview.nextjudge.net" ;;
  api) echo "https://${PR_NUMBER}-api.preview.nextjudge.net" ;;
  *)
    echo "unknown preview service: ${SERVICE}" >&2
    exit 1
    ;;
esac
