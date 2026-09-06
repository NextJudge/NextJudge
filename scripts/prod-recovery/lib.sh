#!/usr/bin/env bash

set -euo pipefail

recovery_die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

recovery_require_command() {
  command -v "$1" >/dev/null 2>&1 || recovery_die "required command not found: $1"
}

recovery_require_file() {
  [[ -f "$1" ]] || recovery_die "file not found: $1"
}

recovery_sha256() {
  shasum -a 256 "$1" | awk '{print $1}'
}

recovery_require_safe_name() {
  local value="$1"
  local label="$2"
  [[ "$value" =~ ^[a-zA-Z_][a-zA-Z0-9_]{0,62}$ ]] || recovery_die "invalid ${label}: ${value}"
}

recovery_target_json() {
  local database="$1"
  psql --no-psqlrc --quiet --tuples-only --no-align --dbname "$database" \
    --command "SELECT json_build_object('database', current_database(), 'server_address', COALESCE(inet_server_addr()::text, 'local'), 'server_port', COALESCE(inet_server_port(), 0))::text;"
}

recovery_assert_target() {
  local database="$1"
  local expected_address="$2"
  local expected_port="$3"
  local actual

  actual="$(recovery_target_json "$database")"
  jq -e \
    --arg database "$database" \
    --arg address "$expected_address" \
    --argjson port "$expected_port" \
    '.database == $database and .server_address == $address and .server_port == $port' \
    <<<"$actual" >/dev/null || recovery_die "database target did not match the explicitly supplied database/server/port"
}

recovery_json_equivalent_audit() {
  local left="$1"
  local right="$2"
  jq -e -s \
    'map(del(.collected_at, .validated, .validation_note)) | .[0] == .[1]' \
    "$left" "$right" >/dev/null
}
