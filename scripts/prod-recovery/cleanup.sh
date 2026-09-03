#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

usage() {
  cat <<'EOF'
Usage: cleanup.sh --database NAME --server-address ADDRESS --server-port PORT \
  --audit VALIDATED.json --audit-sha256 SHA256 --output RESULT.json --execute

The live database must exactly match the validated audit. Any drift, missing
record, unexpected record, lock timeout, or failed postcondition aborts the
transaction. Credentials come only from libpq environment/configuration.
EOF
}

database=""
server_address=""
server_port=""
audit=""
audit_sha256=""
output=""
execute=false

while (($#)); do
  case "$1" in
    --database) database="${2:-}"; shift 2 ;;
    --server-address) server_address="${2:-}"; shift 2 ;;
    --server-port) server_port="${2:-}"; shift 2 ;;
    --audit) audit="${2:-}"; shift 2 ;;
    --audit-sha256) audit_sha256="${2:-}"; shift 2 ;;
    --output) output="${2:-}"; shift 2 ;;
    --execute) execute=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) recovery_die "unknown argument: $1" ;;
  esac
done

[[ "$execute" == true ]] || recovery_die "--execute is required"
[[ -n "$database" && -n "$server_address" && -n "$server_port" ]] || { usage >&2; exit 2; }
[[ -n "$audit" && -n "$audit_sha256" && -n "$output" ]] || { usage >&2; exit 2; }
[[ "$server_port" =~ ^[0-9]+$ ]] || recovery_die "server port must be numeric"
[[ "$audit_sha256" =~ ^[0-9a-f]{64}$ ]] || recovery_die "audit SHA-256 must be 64 lowercase hex characters"
[[ ! -e "$output" ]] || recovery_die "refusing to overwrite output: $output"
recovery_require_safe_name "$database" "database name"
recovery_require_file "$audit"
recovery_require_command psql
recovery_require_command jq
recovery_require_command shasum
recovery_assert_target "$database" "$server_address" "$server_port"

actual_sha256="$(recovery_sha256 "$audit")"
[[ "$actual_sha256" == "$audit_sha256" ]] || recovery_die "validated audit checksum mismatch"

jq -e \
  --arg database "$database" \
  --arg address "$server_address" \
  --argjson port "$server_port" \
  '.validated == true and
   .validation_note == "NextJudge 2026-08-29 production seed incident cohort" and
   .target.database == $database and
   .target.server_address == $address and
   .target.server_port == $port' \
  "$audit" >/dev/null || recovery_die "validated audit target or validation marker is invalid"

fingerprint="$(jq -er '.seed_cohort_fingerprint | select(test("^[0-9a-f]{64}$"))' "$audit")"

umask 077
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
live_audit="${tmp_dir}/live-before.json"
cleanup_result="${tmp_dir}/cleanup.json"
post_audit="${tmp_dir}/live-after.json"

"${SCRIPT_DIR}/audit.sh" \
  --database "$database" \
  --server-address "$server_address" \
  --server-port "$server_port" \
  --output "$live_audit" >/dev/null

recovery_json_equivalent_audit "$audit" "$live_audit" ||
  recovery_die "live database no longer matches the validated audit"

psql --no-psqlrc --quiet --tuples-only --no-align --dbname "$database" \
  --set "expected_fingerprint=$fingerprint" \
  --file "${SCRIPT_DIR}/sql/cleanup.sql" >"$cleanup_result"
jq -e . "$cleanup_result" >/dev/null || recovery_die "cleanup did not return a valid result"

"${SCRIPT_DIR}/audit.sh" \
  --database "$database" \
  --server-address "$server_address" \
  --server-port "$server_port" \
  --output "$post_audit" >/dev/null

jq -e '
  .counts.total_users == 3 and
  .counts.seed_users == 0 and
  .counts.expected_seed_identities == 51 and
  .counts.unmatched_seed_identities == 51 and
  .counts.preserved_users == 3 and
  .counts.promotion_accounts == 1 and
  .counts.promotion_accounts_admin == 1 and
  .counts.total_problems == 0 and
  .counts.total_test_cases == 0 and
  .counts.total_events == 0 and
  .counts.total_event_problems == 0 and
  .counts.total_submissions == 0 and
  .counts.total_questions == 0
' "$post_audit" >/dev/null || recovery_die "post-cleanup verification failed"

jq -n \
  --arg completed_at "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  --arg audit_sha256 "$audit_sha256" \
  --slurpfile cleanup "$cleanup_result" \
  --slurpfile post_audit "$post_audit" \
  '{
    completed_at: $completed_at,
    validated_audit_sha256: $audit_sha256,
    cleanup: $cleanup[0],
    post_audit: $post_audit[0]
  }' >"$output"
chmod 600 "$output"
printf 'Cleanup completed and verified. Result: %s\n' "$output"
printf 'SHA-256: %s\n' "$(recovery_sha256 "$output")"
