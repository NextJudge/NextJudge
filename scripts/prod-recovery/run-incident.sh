#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

usage() {
  cat <<'EOF'
Usage: run-incident.sh --database NAME --server-address ADDRESS --server-port PORT \
  --backup-dir DIR --audit-dir DIR

Orchestrates the audited production recovery sequence:
  1. backup.sh
  2. audit.sh + validate-audit.sh
  3. cleanup.sh --execute (requires confirmation)

Does not rotate secrets or deploy. Set PGPASSWORD via libpq before running.
EOF
}

database=""
server_address=""
server_port=""
backup_dir=""
audit_dir=""

while (($#)); do
  case "$1" in
    --database) database="${2:-}"; shift 2 ;;
    --server-address) server_address="${2:-}"; shift 2 ;;
    --server-port) server_port="${2:-}"; shift 2 ;;
    --backup-dir) backup_dir="${2:-}"; shift 2 ;;
    --audit-dir) audit_dir="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$database" && -n "$server_address" && -n "$server_port" && -n "$backup_dir" && -n "$audit_dir" ]] || {
  usage >&2
  exit 2
}

mkdir -p "$backup_dir" "$audit_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
dump_file="${backup_dir}/nextjudge-${timestamp}.dump"
audit_file="${audit_dir}/audit-${timestamp}.json"
validated_file="${audit_dir}/validated-${timestamp}.json"
result_file="${audit_dir}/cleanup-${timestamp}.json"

"${SCRIPT_DIR}/backup.sh" \
  --database "$database" \
  --server-address "$server_address" \
  --server-port "$server_port" \
  --output "$dump_file"

"${SCRIPT_DIR}/audit.sh" \
  --database "$database" \
  --server-address "$server_address" \
  --server-port "$server_port" \
  --output "$audit_file"

"${SCRIPT_DIR}/validate-audit.sh" \
  --audit "$audit_file" \
  --output "$validated_file"

audit_sha="$(shasum -a 256 "$validated_file" | awk '{print $1}')"

printf 'Review %s before cleanup. Type EXECUTE to continue: ' "$validated_file"
read -r confirm
[[ "$confirm" == "EXECUTE" ]] || { echo "Aborted."; exit 1; }

"${SCRIPT_DIR}/cleanup.sh" \
  --database "$database" \
  --server-address "$server_address" \
  --server-port "$server_port" \
  --audit "$validated_file" \
  --audit-sha256 "$audit_sha" \
  --output "$result_file" \
  --execute

printf 'Incident sequence complete.\n'
printf 'Backup: %s\n' "$dump_file"
printf 'Cleanup result: %s\n' "$result_file"
printf 'Next: gh workflow run deploy-production.yml (see scripts/coolify-production-deploy.sh)\n'
