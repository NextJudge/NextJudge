#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

usage() {
  cat <<'EOF'
Usage: backup.sh --database NAME --server-address ADDRESS --server-port PORT --output DUMP_FILE

Creates a custom-format pg_dump, writes SHA-256 checksum sidecar, and verifies
the archive with pg_restore --list. Credentials come from libpq configuration.
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
recovery_require_command pg_dump
recovery_require_command pg_restore
recovery_require_command shasum
recovery_assert_target "$database" "$server_address" "$server_port"

umask 077
pg_dump --format=custom --no-owner --no-acl --dbname="$database" --file="$output"
pg_restore --list "$output" >/dev/null

checksum_file="${output}.sha256"
sha="$(recovery_sha256 "$output")"
printf '%s  %s\n' "$sha" "$(basename "$output")" >"$checksum_file"
chmod 600 "$output" "$checksum_file"

printf 'Backup written to %s\n' "$output"
printf 'SHA-256: %s\n' "$sha"
printf 'Checksum file: %s\n' "$checksum_file"
