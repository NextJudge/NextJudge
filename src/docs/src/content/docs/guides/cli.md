---
title: CLI
description: Install and use the NextJudge CLI — download problems, test locally, submit, upload ICPC packs and manage events.
---

The CLI lives in `src/cli/`. It is a Python package invoked as `nextjudge`. Use it for file-based practice, bulk problem import, CI smoke tests and scripting.

## Install

Add the bin directory to your PATH:

```bash
export PATH="/path/to/NextJudge/src/cli/bin:$PATH"
```

Optional dependencies (uploads, YAML, JSON Schema validation):

```bash
pip install -r src/cli/requirements.txt
```

Also requires **Python 3**, **requests**, and **Docker** for `test` / `run-with-input`.

Tab completion: install `argcomplete` (optional).

---

## Global options

Every command accepts:

| Flag | Env fallback | Default | Description |
| ---- | ------------ | ------- | ----------- |
| `--host` | `HOST` | `localhost` | API host |
| `--port` | `PORT` | `5000` | API port |

```bash
nextjudge --host api.example.com --port 5000 get 42
```

**Port quirk:** `get`, `upload-challenge`, `upload-challenge-suite`, and `test-icpc-solutions*` hardcode port `5000` internally regardless of `--port`.

---

## Authentication

There is no working `nextjudge auth` command (stub). Most commands auto-authenticate as a **fixed local dev user**:

| Field | Value |
| ----- | ----- |
| Email | `nextjudge-cli@local.dev` |
| Password | `nextjudge-cli-local-password` |

Flow: `POST /v1/basic_login`, then register on failure. Token is sent as raw `Authorization` (no `Bearer`). See [Authentication](/reference/authentication/).

For production instances, ensure this account exists or use the API directly with your own credentials.

`~/.nextjudge.config` is defined in code but **not loaded** (commented out).

---

## Local files

### `.nextjudge.env` (working directory)

Written by `get`, read by `submit` when `--id` is omitted:

```ini
[config]
problem_id=42
```

### Output of `get`

| Path | Content |
| ---- | ------- |
| `prompt` | Problem statement |
| `.nextjudge.env` | Problem ID |
| `testcases/{n}.in` | Public test input |
| `testcases/{n}.ans` | Expected output |

### ICPC problem directory

For `upload-challenge`, `test-icpc-solutions`, and `event create`:

```
problem-dir/
├── problem.yaml
├── problem_statement/problem.en.tex
├── data/sample/*.in, *.ans
├── data/secret/*.in, *.ans
└── submissions/accepted/   # for test-icpc-solutions
```

---

## Commands

### `get <id>`

Download a problem. **No auth.**

```bash
nextjudge get 1
```

API: `GET /v1/problems/{id}`.

---

### `submit <file> [--id ID]`

Submit to the remote judge and poll for verdict.

```bash
nextjudge get 3
nextjudge submit solution.py
nextjudge submit solution.cpp --id 42
```

1. Resolve problem ID from `--id` or `.nextjudge.env`
2. Match file extension to `GET /v1/languages`
3. `POST /v1/submissions`, poll `GET /v1/submissions/{id}/status` (up to ~32 attempts, backoff 0.3s → 3.5s)

---

### `test <file> [--tests DIR] [--local-image]`

Run against local `.in`/`.ans` pairs in Docker (same judge image as production).

```bash
nextjudge test solution.py
nextjudge test solution.rs --tests ./my-tests --local-image
```

Default image: `ghcr.io/nextjudge/judge:latest`. `--local-image` uses `nextjudge/judge`.

---

### `run-with-input <file> <stdin>`

Single local run with custom stdin (no test suite). Always uses `nextjudge/judge` image. `--local-image` is ignored.

```bash
nextjudge run-with-input solution.py "1 2 3"
```

---

### `custom-run <file> <stdin>`

Remote custom-input run via `POST /v1/input_submissions`. **Currently broken** in source — calls undefined `get_test_user_id()`. Use the web **Run** button or the API directly until fixed.

---

### `upload-challenge <directory>`

Upload one ICPC-format folder as a **public** problem.

```bash
nextjudge upload-challenge ./problems/a-plus-b
```

API: `POST /v1/problems` with `public: true`. On 409 conflict, treats as success.

---

### `upload-challenge-suite <directory>`

Upload each immediate subdirectory as a separate public problem.

```bash
nextjudge upload-challenge-suite ./icpc-archive/2024/
```

---

### `test-icpc-solutions <directory> [--choose SUBSTRING]`

Upload one ICPC problem, submit all files in `submissions/accepted/` (skips `.java`), expect `ACCEPTED`.

```bash
nextjudge test-icpc-solutions ./problems/sum --choose solution.py
```

Submissions always target `localhost:5000`.

---

### `test-icpc-solutions-suite <directory> [--skip "dir1 dir2"]`

Batch version across many directories. **Java only** (inverse of single-problem test).

---

### `event create`

Create an event from `event.yaml` in the current directory.

```yaml
title: Practice Round
description: Local practice
start_time: "2025-06-01T12:00:00Z"
end_time: "2025-06-01T18:00:00Z"
teams: false
problems:
  - path: ./problems/sum
    type: icpc
```

**Known limitations:**

- YAML `start_time` / `end_time` are **ignored** — hardcoded dates in CLI today.
- Only `path` + `type: icpc` problems work; `name` / `id` references error out.
- Validation expects `.vscode/test.json` (may be missing); schema reference: `src/cli/schema/event.json`.

```bash
nextjudge event create
```

---

### `event get [id]` / `event pull [id]`

Fetch event JSON from the API. `pull` does not download problem files locally (same as `get` today).

```bash
nextjudge event get
nextjudge event get 7
```

---

## Typical workflows

### Practice loop

```bash
nextjudge get 3
# edit solution using prompt + testcases/
nextjudge test solution.py
nextjudge submit solution.py
```

### Bulk import

```bash
nextjudge upload-challenge-suite ./kattis-export/
```

---

## When to use the web editor

The web editor supports live **Run** (custom input), language switching and contest context. The CLI targets file-based workflows and automation.

---

## API endpoints used

| Endpoint | Commands |
| -------- | -------- |
| `/v1/basic_login`, `/v1/basic_register` | Auth helper |
| `/v1/languages` | Extension → language ID |
| `/v1/problems` | `get`, uploads |
| `/v1/submissions` | `submit` |
| `/v1/input_submissions` | `custom-run` (broken) |
| `/v1/events` | `event create`, `event get` |

Full reference: [API](/reference/api/).
