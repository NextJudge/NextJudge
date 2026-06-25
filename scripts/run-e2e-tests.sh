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

# shellcheck disable=SC1091
source "$E2E_DIR/test-stack.config.sh"

cleanup() {
  if [ -n "$WEB_PID" ]; then
    kill "$WEB_PID" 2>/dev/null || true
    wait "$WEB_PID" 2>/dev/null || true
  fi
  docker compose -f "$E2E_DIR/docker-compose.yml" down -v --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

cd "$ROOT"

if ! docker image inspect "${E2E_JUDGE_IMAGE}" >/dev/null 2>&1; then
  echo "Building judge image for E2E..."
  docker build -f src/judge/Dockerfile.newbase --target prod -t basejudge:prod src/judge
  docker build -f src/judge/Dockerfile.monolith --target release --build-arg BASEJUDGE=basejudge:prod -t "${E2E_JUDGE_IMAGE}" src/judge
fi

echo "Starting isolated E2E stack (local docker only)..."
E2E_DATA_LAYER_PORT="$E2E_DATA_LAYER_PORT" E2E_JUDGE_IMAGE="$E2E_JUDGE_IMAGE" \
  docker compose -f "$E2E_DIR/docker-compose.yml" up -d --build --wait

echo "Waiting for judge to finish connecting to the data layer..."
for _ in $(seq 1 90); do
  if docker compose -f "$E2E_DIR/docker-compose.yml" logs nextjudge-judge 2>&1 | grep -q "Can contact the core service"; then
    echo "Judge is ready."
    break
  fi
  sleep 2
done
if ! docker compose -f "$E2E_DIR/docker-compose.yml" logs nextjudge-judge 2>&1 | grep -q "Can contact the core service"; then
  echo "Judge failed to become ready:"
  docker compose -f "$E2E_DIR/docker-compose.yml" logs nextjudge-judge
  exit 1
fi

cat > "$WEB_DIR/.env.local" <<EOF
AUTH_SECRET=${E2E_AUTH_SECRET}
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

echo "Running Playwright E2E tests against ${BASE_URL}..."
PLAYWRIGHT_BASE_URL="$BASE_URL" npx playwright test "$@"

echo "E2E tests passed."
