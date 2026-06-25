#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/src/data-layer"

DATA_LAYER_TEST_PORT="${DATA_LAYER_TEST_PORT:-5050}"
export DATA_LAYER_TEST_PORT
export TAVERN_HOST="http://127.0.0.1:${DATA_LAYER_TEST_PORT}"

cleanup() {
  docker compose -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

echo "Running Go unit tests..."
DB_PASSWORD=test \
AUTH_PROVIDER_PASSWORD=test \
JUDGE_PASSWORD=test \
JWT_SIGNING_SECRET=test-jwt-signing-secret-minimum-32-chars \
RABBITMQ_USER=test \
RABBITMQ_PASSWORD=test \
go test ./src/...

echo "Starting isolated data layer test stack on port ${DATA_LAYER_TEST_PORT}..."
docker compose -f docker-compose.test.yml up -d --build --wait

echo "Running Tavern API tests against ${TAVERN_HOST}..."
VENV_DIR="$(mktemp -d)"
python3 -m venv "$VENV_DIR"
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"
python -m pip install -q -r tests/requirements.txt
TAVERN_HOST="${TAVERN_HOST}" python -m pytest tests/test_data_layer.tavern.yaml -p no:warnings -q
deactivate
rm -rf "$VENV_DIR"

echo "Data layer tests passed."
