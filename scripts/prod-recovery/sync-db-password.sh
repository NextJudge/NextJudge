#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

usage() {
  cat <<'EOF'
Usage: sync-db-password.sh --database NAME --server-address ADDRESS --server-port PORT --role ROLE

Aligns a PostgreSQL role password with PGPASSWORD from the libpq environment.
Does not print the password. Run after rotating DB_PASSWORD in Coolify.
EOF
}

database=""
server_address=""
server_port=""
role="postgres"

while (($#)); do
  case "$1" in
    --database) database="${2:-}"; shift 2 ;;
    --server-address) server_address="${2:-}"; shift 2 ;;
    --server-port) server_port="${2:-}"; shift 2 ;;
    --role) role="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) recovery_die "unknown argument: $1" ;;
  esac
done

[[ -n "$database" && -n "$server_address" && -n "$server_port" ]] || { usage >&2; exit 2; }
[[ -n "${PGPASSWORD:-}" ]] || recovery_die "PGPASSWORD must be set in the environment"
recovery_require_command psql
recovery_assert_target "$database" "$server_address" "$server_port"
recovery_require_safe_name "$role" "role name"

psql --no-psqlrc --quiet --dbname="$database" \
  --command "ALTER ROLE \"${role}\" WITH PASSWORD '${PGPASSWORD//\'/\'\'}';"

printf 'Updated password for role %s on %s\n' "$role" "$database"
