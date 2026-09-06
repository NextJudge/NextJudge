# NextJudge production seed recovery

These scripts are intentionally specific to the audited 2026-08-29 NextJudge incident. They are not a general database reset tool.

Safety properties:

- Seed users are selected by all four immutable seed identity fields, never by a negative or nullable password comparison.
- The audit must match the exact reviewed counts and cohort fingerprint.
- Cleanup reruns the audit immediately before taking an exclusive write lock.
- Any drift, lock timeout, count mismatch, missing promotion account, or failed postcondition rolls the transaction back.
- Credentials come from libpq configuration; passwords are never accepted as command arguments.

Required operator sequence:

1. Take a PostgreSQL custom-format dump, write and verify its SHA-256 checksum, and restore-test it in a disposable database.
2. Run `audit.sh`, review the JSON, then run `validate-audit.sh` to create the checksummed validated audit.
3. Run `cleanup.sh` with the validated audit, its exact SHA-256, the exact database target, and `--execute`.
4. Preserve the cleanup result JSON beside the backup and checksum.

For a local PostgreSQL socket, use `--server-address local --server-port 0`. For TCP, supply the exact address reported by `inet_server_addr()` and the exact port.

The cleanup preserves the three audited genuine users, removes the exact 51-user seed-owned graph, and promotes `github-70242273` as the initial administrator.
