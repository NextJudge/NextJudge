#!/usr/bin/env bash
set -euo pipefail

# Read resolved `docker compose config --environment` from stdin. Never print values.
awk '
  BEGIN {
    count = split("DB_PASSWORD JWT_SIGNING_SECRET JUDGE_PASSWORD WEB_BRIDGE_SECRET RABBITMQ_USER RABBITMQ_PASSWORD", required, " ")
  }
  {
    separator = index($0, "=")
    if (separator > 0) {
      key = substr($0, 1, separator - 1)
      present[key] = substr($0, separator + 1) ~ /[^[:space:]]/
    }
  }
  END {
    for (i = 1; i <= count; i++) {
      if (!present[required[i]]) {
        missing = missing " " required[i]
      }
    }
    if (missing != "") {
      print "Missing preview backend configuration:" missing > "/dev/stderr"
      print "Provision preview-scoped credentials before deploying; production credentials are not a fallback." > "/dev/stderr"
      exit 1
    }
  }
'
