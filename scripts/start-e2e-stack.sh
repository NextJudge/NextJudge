#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
E2E_DIR="$ROOT/src/web/e2e"
WEB_DIR="$ROOT/src/web"
PID_FILE="$E2E_DIR/.web-dev.pid"

# shellcheck disable=SC1091
source "$E2E_DIR/test-stack.config.sh"

cd "$ROOT"

if ! docker image inspect "${E2E_JUDGE_IMAGE}" >/dev/null 2>&1; then
  echo "Building judge image for E2E..."
  docker build -f src/judge/Dockerfile.newbase --target prod -t basejudge:prod src/judge
  docker build -f src/judge/Dockerfile.monolith --target release --build-arg BASEJUDGE=basejudge:prod -t "${E2E_JUDGE_IMAGE}" src/judge
fi

echo "Starting isolated E2E stack (local docker only)..."
E2E_DATA_LAYER_PORT="$E2E_DATA_LAYER_PORT" E2E_JUDGE_IMAGE="$E2E_JUDGE_IMAGE" \
  docker compose -f "$E2E_DIR/docker-compose.yml" up -d --build --wait

cat > "$WEB_DIR/.env.local" <<EOF
AUTH_SECRET=${E2E_AUTH_SECRET}
NEXTAUTH_URL=http://${E2E_WEB_HOST}:${E2E_WEB_PORT}
NEXT_PUBLIC_API_URL=http://${E2E_WEB_HOST}:${E2E_DATA_LAYER_PORT}
EOF

cd "$WEB_DIR"

if [ ! -d node_modules ]; then
  npm ci
fi

npx playwright install chromium

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Web dev server already running (pid $(cat "$PID_FILE"))."
else
  echo "Starting web app against local E2E stack..."
  npm run dev -- --hostname "$E2E_WEB_HOST" --port "$E2E_WEB_PORT" &
  echo $! > "$PID_FILE"
fi

BASE_URL="http://${E2E_WEB_HOST}:${E2E_WEB_PORT}"
for _ in $(seq 1 90); do
  if curl -sf "$BASE_URL" >/dev/null 2>&1; then
    echo "E2E stack ready at ${BASE_URL}"
    echo "Run a single spec: ./scripts/run-e2e-playwright.sh e2e/auth.spec.ts"
    echo "Stop stack:        ./scripts/stop-e2e-stack.sh"
    exit 0
  fi
  sleep 2
done

echo "Web app failed to start"
exit 1
