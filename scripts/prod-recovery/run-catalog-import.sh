#!/usr/bin/env bash
set -euo pipefail

# Import content/catalog into production via SSH on the nextjudge host.
# Not wired into deploy CI — run manually after review.
#
# Usage (from repo root on the server, or via ssh nextjudge 'bash -s' < ...):
#   ADMIN_USER_ID=0c14d6e4-ecee-41f2-bca2-187b7a1c00fb \
#     scripts/prod-recovery/run-catalog-import.sh
#
# When copying the repo to the server, exclude macOS AppleDouble files:
#   COPYFILE_DISABLE=1 tar czf catalog.tgz content/catalog scripts/...
#
# Optional:
#   API_BASE=https://api.nextjudge.net
#   DATA_LAYER_CONTAINER=nextjudge-data-layer-sooskw8c44g848ss804okos8
#   SKIP_EXISTING=true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

API_BASE="${API_BASE:-https://api.nextjudge.net}"
DATA_LAYER_CONTAINER="${DATA_LAYER_CONTAINER:-nextjudge-data-layer-sooskw8c44g848ss804okos8}"
SKIP_EXISTING="${SKIP_EXISTING:-true}"

: "${ADMIN_USER_ID:?set ADMIN_USER_ID to the production admin user UUID}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required" >&2
  exit 1
fi

if ! docker inspect "$DATA_LAYER_CONTAINER" >/dev/null 2>&1; then
  echo "data-layer container not found: ${DATA_LAYER_CONTAINER}" >&2
  exit 1
fi

JWT_SIGNING_SECRET="$(
  docker inspect "$DATA_LAYER_CONTAINER" \
    --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | sed -n 's/^JWT_SIGNING_SECRET=//p' \
    | head -1
)"
if [[ -z "$JWT_SIGNING_SECRET" ]]; then
  echo "JWT_SIGNING_SECRET not found on ${DATA_LAYER_CONTAINER}" >&2
  exit 1
fi

pip3 install --user -q -r "${REPO_ROOT}/scripts/requirements.txt" 2>/dev/null || true

IMPORT_TOKEN="$(
  JWT_SIGNING_SECRET="$JWT_SIGNING_SECRET" ADMIN_USER_ID="$ADMIN_USER_ID" python3 - <<'PY'
import base64
import hashlib
import hmac
import json
import os
import time


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


secret = os.environ["JWT_SIGNING_SECRET"]
user_id = os.environ["ADMIN_USER_ID"]
now = int(time.time())
header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
payload = b64url(
    json.dumps(
        {"id": user_id, "role": 2, "iat": now, "exp": now + 3600},
        separators=(",", ":"),
    ).encode()
)
signing_input = f"{header}.{payload}".encode("ascii")
signature = b64url(hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest())
print(f"{header}.{payload}.{signature}")
PY
)"

IMPORT_ARGS=(
  python3 "${REPO_ROOT}/scripts/content-import.py"
  --execute
  --api "$API_BASE"
  --token "$IMPORT_TOKEN"
  --user-id "$ADMIN_USER_ID"
)
if [[ "$SKIP_EXISTING" == "true" ]]; then
  IMPORT_ARGS+=(--skip-existing)
fi

echo "Running catalog import against ${API_BASE}" >&2
"${IMPORT_ARGS[@]}"

DB_CONTAINER="${DB_CONTAINER:-$(docker ps --format '{{.Names}}' | grep -E '^db-' | head -1 || true)}"
if [[ -n "$DB_CONTAINER" ]]; then
  public_count="$(docker exec "$DB_CONTAINER" psql -U postgres -d nextjudge -tAc \
    "select count(*) from problem_descriptions where public = true;" | tr -d '[:space:]')"
  total_count="$(docker exec "$DB_CONTAINER" psql -U postgres -d nextjudge -tAc \
    "select count(*) from problem_descriptions;" | tr -d '[:space:]')"
  echo "problem_descriptions: total=${total_count} public=${public_count}" >&2
fi
