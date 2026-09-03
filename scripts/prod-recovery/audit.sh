#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

usage() {
  cat <<'EOF'
Usage: audit.sh --database NAME --server-address ADDRESS --server-port PORT --output FILE

Uses libpq environment/configuration for credentials. Do not put a password in an argument.
The database, server address, and port must match the connected PostgreSQL server exactly.
EOF
}

database=""
server_address=""
server_port=""
output=""

while (($#)); do
  case "$1" in
    --database) database="${2:-}"; shift 2 ;;
    --server-address) server_address="${2:-}"; shift 2 ;;
    --server-port) server_port="${2:-}"; shift 2 ;;
    --output) output="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) recovery_die "unknown argument: $1" ;;
  esac
done

[[ -n "$database" && -n "$server_address" && -n "$server_port" && -n "$output" ]] || { usage >&2; exit 2; }
[[ "$server_port" =~ ^[0-9]+$ ]] || recovery_die "server port must be numeric"
[[ ! -e "$output" ]] || recovery_die "refusing to overwrite output: $output"
recovery_require_safe_name "$database" "database name"
recovery_require_command psql
recovery_require_command jq
recovery_require_command shasum
recovery_assert_target "$database" "$server_address" "$server_port"

umask 077
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

psql --no-psqlrc --quiet --tuples-only --no-align --dbname "$database" \
  --file "${SCRIPT_DIR}/sql/audit.sql" >"$tmp"

jq -e . "$tmp" >"$output"
chmod 600 "$output"
printf 'Audit written to %s\n' "$output"
printf 'SHA-256: %s\n' "$(recovery_sha256 "$output")"
