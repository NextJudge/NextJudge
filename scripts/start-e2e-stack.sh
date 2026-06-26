#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
E2E_DIR="$ROOT/src/web/e2e"
WEB_DIR="$ROOT/src/web"
PID_FILE="$E2E_DIR/.web-dev.pid"
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

npx playwright install chromium

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Stopping existing web dev server to apply E2E env (pid $(cat "$PID_FILE"))..."
  kill "$(cat "$PID_FILE")" 2>/dev/null || true
  wait "$(cat "$PID_FILE")" 2>/dev/null || true
  rm -f "$PID_FILE"
fi

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
    if [ "$E2E_WITH_JUDGE" = "1" ]; then
      echo "Run judge spec: ./scripts/run-e2e-playwright.sh --grep @judge"
    else
      echo "Run smoke specs: ./scripts/run-e2e-playwright.sh --grep-invert @judge"
      echo "Full stack + judge: E2E_WITH_JUDGE=1 ./scripts/start-e2e-stack.sh"
    fi
    echo "Stop stack:        ./scripts/stop-e2e-stack.sh"
    exit 0
  fi
  sleep 2
done

echo "Web app failed to start"
exit 1
