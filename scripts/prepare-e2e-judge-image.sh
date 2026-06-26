#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
E2E_DIR="$ROOT/src/web/e2e"

# shellcheck disable=SC1091
source "$E2E_DIR/test-stack.config.sh"

E2E_JUDGE_PULL_IMAGE="${E2E_JUDGE_PULL_IMAGE:-tnyuma/nextjudge-judge:latest}"

if docker image inspect "${E2E_JUDGE_IMAGE}" >/dev/null 2>&1 && [ "${E2E_JUDGE_FORCE_REBUILD:-}" != "1" ]; then
  echo "Judge image ${E2E_JUDGE_IMAGE} already present."
  exit 0
fi

if [ "${E2E_JUDGE_USE_PULL:-}" = "1" ]; then
  echo "Pulling judge image ${E2E_JUDGE_PULL_IMAGE}..."
  docker pull "${E2E_JUDGE_PULL_IMAGE}"
  docker tag "${E2E_JUDGE_PULL_IMAGE}" "${E2E_JUDGE_IMAGE}"
  exit 0
fi

echo "Building judge image for E2E..."
docker build -f "$ROOT/src/judge/Dockerfile.newbase" --target prod -t basejudge:prod "$ROOT/src/judge"
docker build -f "$ROOT/src/judge/Dockerfile.monolith" --target release \
  --build-arg BASEJUDGE=basejudge:prod -t "${E2E_JUDGE_IMAGE}" "$ROOT/src/judge"
