#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Fast path for local iteration — stack must already be up (see start-e2e-stack.sh).
if [ "${E2E_PLAYWRIGHT_ONLY:-}" = "1" ]; then
  exec "$ROOT/scripts/run-e2e-playwright.sh" "$@"
fi

E2E_WITH_JUDGE="${E2E_WITH_JUDGE:-0}"

cleanup() {
  "$ROOT/scripts/stop-e2e-stack.sh"
}
trap cleanup EXIT

PLAYWRIGHT_ARGS=("$@")
if [ ${#PLAYWRIGHT_ARGS[@]} -eq 0 ]; then
  if [ "$E2E_WITH_JUDGE" = "1" ]; then
    PLAYWRIGHT_ARGS=(--grep "@judge")
  else
    PLAYWRIGHT_ARGS=(--grep-invert "@judge")
  fi
fi

"$ROOT/scripts/start-e2e-stack.sh"
"$ROOT/scripts/run-e2e-playwright.sh" "${PLAYWRIGHT_ARGS[@]}"

echo "E2E tests passed."
