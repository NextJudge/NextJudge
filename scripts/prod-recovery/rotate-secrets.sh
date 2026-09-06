#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

usage() {
  cat <<'EOF'
Usage: rotate-secrets.sh --output-dir DIR

Generates fresh production secrets and writes a rotation manifest (no secret values).
Apply with coolify-upsert-env.sh using the generated .env files.

Requires: openssl, COOLIFY_API_URL, COOLIFY_API_TOKEN for apply mode.
EOF
}

output_dir=""
apply=false

while (($#)); do
  case "$1" in
    --output-dir) output_dir="${2:-}"; shift 2 ;;
    --apply) apply=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$output_dir" ]] || { usage >&2; exit 2; }
mkdir -p "$output_dir"
umask 077

gen_secret() {
  openssl rand -hex 32
}

db_password="$(gen_secret)"
jwt_secret="$(gen_secret)"
web_bridge="$(gen_secret)"
judge_password="$(gen_secret)"
rabbit_user="nextjudge"
rabbit_password="$(gen_secret)"

cat >"${output_dir}/backend.env" <<EOF
DB_PASSWORD=${db_password}
JWT_SIGNING_SECRET=${jwt_secret}
WEB_BRIDGE_SECRET=${web_bridge}
JUDGE_PASSWORD=${judge_password}
RABBITMQ_USER=${rabbit_user}
RABBITMQ_PASSWORD=${rabbit_password}
EOF
chmod 600 "${output_dir}/backend.env"

generated_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat >"${output_dir}/rotation-manifest.json" <<EOF
{
  "generated_at": "${generated_at}",
  "files": ["backend.env"],
  "keys_rotated": [
    "DB_PASSWORD",
    "JWT_SIGNING_SECRET",
    "WEB_BRIDGE_SECRET",
    "JUDGE_PASSWORD",
    "RABBITMQ_USER",
    "RABBITMQ_PASSWORD"
  ],
  "next_steps": [
    "Upsert backend.env to Coolify backend service",
    "Run sync-db-password.sh with new DB_PASSWORD",
    "Redeploy backend and judge",
    "Archive manifest off-repo; do not commit backend.env"
  ]
}
EOF
chmod 600 "${output_dir}/rotation-manifest.json"

printf 'Wrote %s/backend.env (secrets) and rotation-manifest.json\n' "$output_dir"
printf 'Do not commit backend.env. Archive manifest off-repo.\n'

if [[ "$apply" == "true" ]]; then
  upsert="${REPO_ROOT}/scripts/coolify-upsert-env.sh"
  [[ -x "$upsert" ]] || { echo "missing coolify-upsert-env.sh" >&2; exit 1; }
  # Operator must set COOLIFY_BACKEND_SERVICE_UUID before --apply
  : "${COOLIFY_BACKEND_SERVICE_UUID:?set COOLIFY_BACKEND_SERVICE_UUID for --apply}"
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    "$upsert" --service-uuid "$COOLIFY_BACKEND_SERVICE_UUID" --key "$key" --value "$val"
  done <"${output_dir}/backend.env"
  printf 'Applied backend secrets via coolify-upsert-env.sh\n'
fi
