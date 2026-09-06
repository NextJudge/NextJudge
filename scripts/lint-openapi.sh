#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC="${ROOT}/openapi/openapi.yaml"
EMBED_SPEC="${ROOT}/src/data-layer/openapi/openapi.yaml"

if [[ ! -f "${SPEC}" ]]; then
  echo "OpenAPI spec not found: ${SPEC}" >&2
  exit 1
fi

if ! cmp -s "${SPEC}" "${EMBED_SPEC}"; then
  echo "Embedded OpenAPI spec is out of sync. Copy openapi/openapi.yaml to src/data-layer/openapi/openapi.yaml." >&2
  exit 1
fi

cd "${ROOT}"
npx --yes @redocly/cli@latest lint --config "${ROOT}/.redocly.yaml" "${SPEC}"
