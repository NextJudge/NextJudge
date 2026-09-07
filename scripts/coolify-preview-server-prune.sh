#!/usr/bin/env bash
set -euo pipefail

# Reclaim disk on the Coolify VPS after preview teardown.
# Safe to run on the server directly or over SSH from CI.
#
# Optional env:
#   VACUUM_JOURNAL=1     also vacuum systemd journal to 200M
#   PRUNE_BUILD_CACHE=1  also prune all build cache (default: 1)

PRUNE_BUILD_CACHE="${PRUNE_BUILD_CACHE:-1}"

prune_unused_ci_images() {
  local repo tag id
  for repo in tnyuma/nextjudge-judge tnyuma/nextjudge-core; do
    while read -r id tag; do
      [[ "$tag" == ci-* ]] || continue
      if docker ps -a --filter "ancestor=${repo}:${tag}" -q | grep -q .; then
        continue
      fi
      docker rmi "${repo}:${tag}" 2>/dev/null || true
    done < <(docker images "$repo" --format '{{.ID}} {{.Tag}}' 2>/dev/null || true)
  done
}

prune_unused_preview_app_images() {
  local image tag
  while read -r image tag; do
    [[ "$tag" == pr-* ]] || continue
    if docker ps -a --filter "ancestor=${image}:${tag}" -q | grep -q .; then
      continue
    fi
    docker rmi "${image}:${tag}" 2>/dev/null || true
  done < <(
    docker images --format '{{.Repository}} {{.Tag}}' \
      | grep -E '^(tockgoco|ukcg0oc)[^ ]+ pr-[0-9]+$' || true
  )
}

echo "Pruning unused Docker images..." >&2
docker image prune -f >/dev/null

echo "Pruning unused Docker volumes..." >&2
docker volume prune -f >/dev/null

if [[ "$PRUNE_BUILD_CACHE" == "1" ]]; then
  echo "Pruning Docker build cache..." >&2
  docker builder prune -af >/dev/null 2>&1 || true
fi

prune_unused_ci_images
prune_unused_preview_app_images

if [[ "${VACUUM_JOURNAL:-}" == "1" ]]; then
  echo "Vacuuming systemd journal..." >&2
  if command -v journalctl >/dev/null; then
    journalctl --vacuum-size=200M >/dev/null 2>&1 \
      || sudo journalctl --vacuum-size=200M >/dev/null 2>&1 \
      || true
  fi
fi

df -h / | tail -1 >&2
docker system df >&2
echo "Preview server prune complete." >&2
