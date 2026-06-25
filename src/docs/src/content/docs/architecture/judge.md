---
title: Judge Service
description: How the judge compiles, sandboxes and grades submissions with nsjail, including limits, verdicts and queue flow.
---

The judge is a Python process: RabbitMQ in, HTTP to the data layer, nsjail for execution. User code does not run on the host OS.

Architecture context: [Core components](/architecture/components/).

## One submission, step by step

```
Queue msg → GET submission + tests → compile in nsjail → run cases → PATCH verdict → delete temp dirs
```

### Queue message

```json
{ "type": "submission", "id": "uuid" }
```

Custom input uses `"type": "input_submission"`.

### Fetch

Using a judge JWT from the data layer:

- Submission body: source, `language_id`, `problem_id`
- Tests: `GET /v1/problem_description/{problem_id}/tests`

### Compile

```
/program_files/{uuid}/
  build/       ← source + build.sh from languages.toml
  executable/  ← must end up with a runnable main
```

Compile failure yields `COMPILE_TIME_ERROR`, stderr is saved and no tests run.

### Run tests

stdin receives test input. stdout is compared to expected output line by line with trimmed whitespace. The judge stops at the first failure (ICPC-style grading).

Timeouts map to `TIME_LIMIT_EXCEEDED`. OOM maps to `MEMORY_LIMIT_EXCEEDED`. Segfaults map to `RUNTIME_ERROR`.

### Report

```json
{
  "status": "ACCEPTED",
  "time_elapsed": 0.123,
  "failed_test_case_id": null,
  "test_case_results": [{ "test_case_id": "...", "passed": true, "stdout": "...", "stderr": "" }]
}
```

## nsjail defaults

Per-problem limits from the API can override run-time bounds.

| Limit | Compile | Run |
| ----- | ------- | --- |
| CPU time | 30s | 10s default |
| Virtual memory | 16 MB | 6 MB default |
| CPU cores | 2 | 1 |
| File descriptors | 512 | 3 |

Also applied: chroot, UID 99999, no network, seccomp, read-only filesystem except build and output directories.

This configuration targets untrusted contest submissions in an isolated worker network. Treat the judge as a dedicated security zone and keep images updated.

## Scaling

More containers increase parallel throughput. RabbitMQ distributes work. Each worker handles one active submission.

If queue depth rises during a contest, add workers before raising time limits on problems.

## Config

| Env | Purpose |
| --- | ------- |
| `RABBITMQ_*` | Queue |
| `NEXTJUDGE_HOST`, `NEXTJUDGE_PORT` | API |
| `JUDGE_PASSWORD` | Judge login ([auth](/reference/authentication/)) |

At startup the judge fetches languages from the API, matches names to `languages.toml` and builds an ID map. A name mismatch between the database and config file causes compile failures at submit time. Keep both in sync.

## When things go wrong

- **Redelivered poison message:** rejected after one retry (no infinite loop)
- **API down during PATCH:** submission may stay PENDING until retry logic runs; check logs
- **Compile works locally, fails on judge:** different compiler version or missing `{IN_FILE}` in build script

Logs go to stdout. Use `docker logs` and grep for `submission_id` when debugging a specific submission.

## Add a language

1. Toolchain in `Dockerfile.newbase`
2. `[[language]]` in `languages.toml` → `/executable/main`
3. Rebuild image
4. `POST /v1/languages`
5. Submit reference AC solution

Per-language notes: [Supported languages](/reference/languages/).
