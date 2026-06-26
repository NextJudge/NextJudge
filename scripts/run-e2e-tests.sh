#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Fast path for local iteration — stack must already be up (see start-e2e-stack.sh).
if [ "${E2E_PLAYWRIGHT_ONLY:-}" = "1" ]; then
  exec "$ROOT/scripts/run-e2e-playwright.sh" "$@"
fi

E2E_DIR="$ROOT/src/web/e2e"
WEB_DIR="$ROOT/src/web"
WEB_PID=""
E2E_WITH_JUDGE="${E2E_WITH_JUDGE:-0}"

# shellcheck disable=SC1091
source "$E2E_DIR/test-stack.config.sh"

compose() {
  if [ "$E2E_WITH_JUDGE" = "1" ]; then
    docker compose --profile with-judge -f "$E2E_DIR/docker-compose.yml" "$@"
  else
    docker compose -f "$E2E_DIR/docker-compose.yml" "$@"
  fi
}

cleanup() {
  if [ -n "$WEB_PID" ]; then
    kill "$WEB_PID" 2>/dev/null || true
    wait "$WEB_PID" 2>/dev/null || true
  fi
  compose down -v --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

cd "$ROOT"

if [ "$E2E_WITH_JUDGE" = "1" ]; then
  "$ROOT/scripts/prepare-e2e-judge-image.sh"
fi

echo "Starting isolated E2E stack (local docker only, with_judge=${E2E_WITH_JUDGE})..."
E2E_DATA_LAYER_PORT="$E2E_DATA_LAYER_PORT" E2E_JUDGE_IMAGE="$E2E_JUDGE_IMAGE" \
  compose up -d --build --wait

if [ "$E2E_WITH_JUDGE" = "1" ]; then
  echo "Waiting for judge to finish connecting to the data layer..."
  for _ in $(seq 1 90); do
    if compose logs nextjudge-judge 2>&1 | grep -q "Can contact the core service"; then
      echo "Judge is ready."
      break
    fi
    sleep 2
  done
  if ! compose logs nextjudge-judge 2>&1 | grep -q "Can contact the core service"; then
    echo "Judge failed to become ready:"
    compose logs nextjudge-judge
    exit 1
  fi
fi

cat > "$WEB_DIR/.env.local" <<EOF
AUTH_SECRET=${E2E_AUTH_SECRET}
AUTH_URL=http://${E2E_WEB_HOST}:${E2E_WEB_PORT}
WEB_BRIDGE_SECRET=${E2E_WEB_BRIDGE_SECRET}
NEXTAUTH_URL=http://${E2E_WEB_HOST}:${E2E_WEB_PORT}
NEXT_PUBLIC_API_URL=http://${E2E_WEB_HOST}:${E2E_DATA_LAYER_PORT}
EOF

cd "$WEB_DIR"

if [ ! -d node_modules ]; then
  npm ci
fi

echo "Ensuring Playwright Chromium is installed..."
npx playwright install chromium

echo "Starting web app against local E2E stack..."
npm run dev -- --hostname "$E2E_WEB_HOST" --port "$E2E_WEB_PORT" &
WEB_PID=$!

BASE_URL="http://${E2E_WEB_HOST}:${E2E_WEB_PORT}"
for _ in $(seq 1 90); do
  if curl -sf "$BASE_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! curl -sf "$BASE_URL" >/dev/null 2>&1; then
  echo "Web app failed to start"
  exit 1
fi

PLAYWRIGHT_ARGS=("$@")
if [ ${#PLAYWRIGHT_ARGS[@]} -eq 0 ]; then
  if [ "$E2E_WITH_JUDGE" = "1" ]; then
    PLAYWRIGHT_ARGS=(--grep "@judge")
  else
    PLAYWRIGHT_ARGS=(--grep-invert "@judge")
  fi
fi

echo "Running Playwright E2E tests against ${BASE_URL}..."
AUTH_URL="http://${E2E_WEB_HOST}:${E2E_WEB_PORT}" \
NEXTAUTH_URL="http://${E2E_WEB_HOST}:${E2E_WEB_PORT}" \
PLAYWRIGHT_BASE_URL="$BASE_URL" \
npx playwright test "${PLAYWRIGHT_ARGS[@]}"

echo "E2E tests passed."
