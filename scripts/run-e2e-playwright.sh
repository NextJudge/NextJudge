#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT/src/web"
E2E_DIR="$ROOT/src/web/e2e"

# shellcheck disable=SC1091
source "$E2E_DIR/test-stack.config.sh"

BASE_URL="http://${E2E_WEB_HOST}:${E2E_WEB_PORT}"

if ! curl -sf "$BASE_URL" >/dev/null 2>&1; then
  echo "E2E web app is not running at ${BASE_URL}."
  echo "Start it first: ./scripts/start-e2e-stack.sh"
  exit 1
fi

cd "$WEB_DIR"
echo "Running Playwright against ${BASE_URL}..."
AUTH_URL="http://${E2E_WEB_HOST}:${E2E_WEB_PORT}" \
NEXTAUTH_URL="http://${E2E_WEB_HOST}:${E2E_WEB_PORT}" \
PLAYWRIGHT_BASE_URL="$BASE_URL" \
npx playwright test "$@"
