#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/../prod-recovery/backup.sh"

usage() {
  cat <<'EOF'
Usage: backup-schedule.sh --database NAME --server-address ADDRESS --server-port PORT --output-dir DIR [--retention-days N]

Runs a timestamped pg_dump via prod-recovery/backup.sh, prunes backups older than
the retention window, and writes a schedule log entry.
EOF
}

database=""
server_address=""
server_port=""
output_dir=""
retention_days=30

while (($#)); do
  case "$1" in
    --database) database="${2:-}"; shift 2 ;;
    --server-address) server_address="${2:-}"; shift 2 ;;
    --server-port) server_port="${2:-}"; shift 2 ;;
    --output-dir) output_dir="${2:-}"; shift 2 ;;
    --retention-days) retention_days="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) printf 'error: unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

[[ -n "$database" && -n "$server_address" && -n "$server_port" && -n "$output_dir" ]] || {
  usage >&2
  exit 2
}

[[ -x "$BACKUP_SCRIPT" ]] || {
  printf 'error: backup script not found: %s\n' "$BACKUP_SCRIPT" >&2
  exit 1
}

mkdir -p "$output_dir"
timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
output_file="${output_dir}/${database}-${timestamp}.dump"

"$BACKUP_SCRIPT" \
  --database "$database" \
  --server-address "$server_address" \
  --server-port "$server_port" \
  --output "$output_file"

log_file="${output_dir}/backup-schedule.log"
printf '%s created %s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$output_file" >>"$log_file"

find "$output_dir" -type f -name "${database}-*.dump" -mtime +"$retention_days" -print -delete || true
find "$output_dir" -type f -name "${database}-*.dump.sha256" -mtime +"$retention_days" -print -delete || true

printf 'Scheduled backup complete: %s\n' "$output_file"
