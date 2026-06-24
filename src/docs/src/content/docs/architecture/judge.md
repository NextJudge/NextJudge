---
title: Judge Service
description: Compile, sandbox, grade. Where user code actually runs.
---

Python process. RabbitMQ in, HTTP out, nsjail in the middle. User code never runs on the host OS.

Architecture context: [Core components](/architecture/components/).

## One submission, step by step

```
Queue msg → GET submission + tests → compile in nsjail → run cases → PATCH verdict → delete temp dirs
```

### Queue message

```json
{ "type": "submission", "id": "uuid" }
```

Custom input: `"type": "input_submission"`.

### Fetch

From the data layer (judge JWT):

- Submission body: source, `language_id`, `problem_id`
- Tests: `GET /v1/problem_description/{problem_id}/tests`

### Compile

```
/program_files/{uuid}/
  build/       ← source + build.sh from languages.toml
  executable/  ← must end up with a runnable main
```

Failure here → `COMPILE_TIME_ERROR`, stderr saved, no tests run. Fix your `#include`, not your algorithm.

### Run tests

stdin = test input. Compare stdout to expected (line-by-line, trimmed whitespace). **Stop at first failure.** That's ICPC-style, not "show me all wrong cases."

Timeouts → `TIME_LIMIT_EXCEEDED`. OOM → `MEMORY_LIMIT_EXCEEDED`. Segfault → `RUNTIME_ERROR`.

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

Also: chroot, UID 99999, no network, seccomp, read-only FS except build/output dirs.

**Reality check:** this stops casual mischief and runaway loops. A motivated attacker with a sandbox escape is why you isolate the judge network.

## Scaling

More containers = more parallel submissions. RabbitMQ distributes. One worker = one active submission.

Contest rule of thumb: if queue depth climbs through the first hour, add workers before bumping time limits. Users hate TLE inflation more than they hate waiting 30s in queue.

## Config

| Env | Purpose |
| --- | ------- |
| `RABBITMQ_*` | Queue |
| `NEXTJUDGE_HOST`, `NEXTJUDGE_PORT` | API |
| `JUDGE_PASSWORD` | Judge login ([auth](/reference/authentication/)) |

Startup: fetch languages from API, match names to `languages.toml`, build ID map. Name mismatch = silent failure at submit time. Keep them in sync.

## When things go wrong

- **Redelivered poison message:** rejected after one retry (no infinite loop)
- **API down during PATCH:** submission may stay PENDING until retry logic runs; check logs
- **Compile works locally, fails on judge:** different compiler version or missing `{IN_FILE}` in build script

Logs → stdout → `docker logs`. Grep for `submission_id` when debugging a specific stuck submit.

## Add a language

1. Toolchain in `Dockerfile.newbase`
2. `[[language]]` in `languages.toml` → `/executable/main`
3. Rebuild image
4. `POST /v1/languages`
5. Submit reference AC solution

Quirks per language: [Supported languages](/reference/languages/).
