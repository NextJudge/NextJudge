#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
E2E_DIR="$ROOT/src/web/e2e"
PID_FILE="$E2E_DIR/.web-dev.pid"

if [ -f "$PID_FILE" ]; then
  WEB_PID="$(cat "$PID_FILE")"
  if kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
    wait "$WEB_PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
fi

docker compose -f "$E2E_DIR/docker-compose.yml" down -v --remove-orphans 2>/dev/null || true
echo "E2E stack stopped."
