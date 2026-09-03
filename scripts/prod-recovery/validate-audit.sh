#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "${SCRIPT_DIR}/lib.sh"

usage() {
  cat <<'EOF'
Usage: validate-audit.sh --input AUDIT.json --output VALIDATED.json

Validates the exact NextJudge production seed incident observed on 2026-08-29.
The output is the only audit form accepted by cleanup.sh.
EOF
}

input=""
output=""

while (($#)); do
  case "$1" in
    --input) input="${2:-}"; shift 2 ;;
    --output) output="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) recovery_die "unknown argument: $1" ;;
  esac
done

[[ -n "$input" && -n "$output" ]] || { usage >&2; exit 2; }
recovery_require_file "$input"
recovery_require_command jq
recovery_require_command shasum
[[ ! -e "$output" ]] || recovery_die "refusing to overwrite output: $output"

jq -e '
  .schema_version == 1 and
  .validated == false and
  .counts.total_users == 54 and
  .counts.seed_users == 51 and
  .counts.expected_seed_identities == 51 and
  .counts.unmatched_seed_identities == 0 and
  .counts.preserved_users == 3 and
  .counts.promotion_accounts == 1 and
  .counts.promotion_accounts_admin == 0 and
  .counts.promotion_accounts_in_seed == 0 and
  .counts.total_problems == 30 and
  .counts.problems == 30 and
  .counts.seed_signature_problems == 30 and
  .counts.total_test_cases == 133 and
  .counts.test_cases == 133 and
  .counts.total_events == 46 and
  .counts.events == 46 and
  .counts.total_event_problems == 249 and
  .counts.event_problems == 249 and
  .counts.total_submissions == 10582 and
  .counts.submissions == 10582 and
  .counts.total_questions == 68 and
  .counts.questions == 68 and
  .counts.questions_answered_by_seed_only == 0
' "$input" >/dev/null || recovery_die "audit does not match the exact reviewed production incident"

umask 077
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
jq '
  .validated = true |
  .validation_note = "NextJudge 2026-08-29 production seed incident cohort"
' "$input" >"$tmp"
jq -e . "$tmp" >"$output"
chmod 600 "$output"
printf 'Validated audit written to %s\n' "$output"
printf 'SHA-256: %s\n' "$(recovery_sha256 "$output")"
