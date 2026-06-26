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

port_in_use() {
  node - "$E2E_WEB_HOST" "$E2E_WEB_PORT" <<'NODE'
const net = require("node:net");

const [host, portValue] = process.argv.slice(2);
const port = Number(portValue);
const server = net.createServer();

server.once("error", (error) => {
  if (error.code === "EADDRINUSE") {
    process.exit(0);
  }

  console.error(`Unable to check ${host}:${port}: ${error.message}`);
  process.exit(2);
});

server.once("listening", () => {
  server.close(() => process.exit(1));
});

server.listen(port, host);
NODE
}

wait_for_port_to_close() {
  for _ in $(seq 1 30); do
    if ! port_in_use; then
      return 0
    fi
    sleep 1
  done

  return 1
}

port_owner_pids() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"$E2E_WEB_PORT" -sTCP:LISTEN 2>/dev/null || true
  elif command -v fuser >/dev/null 2>&1; then
    fuser "${E2E_WEB_PORT}/tcp" 2>/dev/null || true
  fi
}

kill_port_owner_in_ci() {
  if [ "${CI:-}" != "true" ]; then
    return 1
  fi

  PIDS="$(port_owner_pids | tr '\n' ' ')"
  if [ -z "$PIDS" ]; then
    return 1
  fi

  echo "CI detected an unexpected process on port ${E2E_WEB_PORT}; stopping pid(s): ${PIDS}"
  # shellcheck disable=SC2086
  kill $PIDS 2>/dev/null || true

  if wait_for_port_to_close; then
    return 0
  fi

  echo "Port ${E2E_WEB_PORT} is still in use; force-stopping pid(s): ${PIDS}"
  # shellcheck disable=SC2086
  kill -9 $PIDS 2>/dev/null || true
  wait_for_port_to_close
}

stop_tracked_web_server() {
  if [ ! -f "$PID_FILE" ]; then
    return 0
  fi

  WEB_PID="$(cat "$PID_FILE")"
  if kill -0 "$WEB_PID" 2>/dev/null; then
    echo "Stopping existing web dev server to apply E2E env (pid ${WEB_PID})..."
    kill "$WEB_PID" 2>/dev/null || true
    wait "$WEB_PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"

  if ! wait_for_port_to_close; then
    if kill_port_owner_in_ci; then
      return 0
    fi

    echo "Port ${E2E_WEB_PORT} is still in use after stopping tracked E2E web server."
    exit 1
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

stop_tracked_web_server

if port_in_use; then
  if ! kill_port_owner_in_ci; then
    echo "Port ${E2E_WEB_PORT} is already in use, but it is not tracked by ${PID_FILE}."
    echo "Stop the process using ${E2E_WEB_HOST}:${E2E_WEB_PORT}, then retry."
    exit 1
  fi
fi

echo "Starting web app against local E2E stack..."
./node_modules/.bin/next dev --hostname "$E2E_WEB_HOST" --port "$E2E_WEB_PORT" &
WEB_PID=$!
echo "$WEB_PID" > "$PID_FILE"

BASE_URL="http://${E2E_WEB_HOST}:${E2E_WEB_PORT}"
for _ in $(seq 1 90); do
  if ! kill -0 "$WEB_PID" 2>/dev/null; then
    echo "Web app process exited before becoming ready."
    rm -f "$PID_FILE"
    exit 1
  fi
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
