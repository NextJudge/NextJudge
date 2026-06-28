---
title: Key terms
description: Vocabulary for contests, problems, submissions and judges as used in the docs, API and web UI.
---

| Term | Meaning |
| ---- | ------- |
| **Problem** | Prompt + resource limits + test cases. Has numeric `id` and string `identifier`. Public problems appear in the practice catalog; private ones are contest-only or admin-only. |
| **Test case** | Input/output pair. Hidden cases exist for formal grading. Judge stops at first failure (ICPC-style). |
| **Submission** | Code + language for a problem. Lifecycle: `PENDING` → verdict. May include `event_id` when submitted during a contest. |
| **Event** | API name for a **contest**: timed problems + registration + standings. UI says contest. |
| **Event problem** | A problem attached to a contest. Has its own numeric id within the event (distinct from global problem `id`). |
| **Custom input run** | Execute against stdin without grading. The editor **Run** button. API: `input_submissions`. |
| **User** | Account. **Admin** manages problems/contests. Everyone else submits. |
| **Language** | Runtime in judge image + DB row. Matched by **name** between `languages.toml` and Postgres. |
| **Clarification** | Question asked during a contest; answered questions become public clarifications. |
| **Notification** | In-app alert for new questions or answers on contests you participate in. |

## Time and memory limits

Problems and contest attachments store three limit fields:

| Field | Meaning |
| ----- | ------- |
| `accept_timeout` | Wall-clock budget for judging (stored on problem/event) |
| `execution_timeout` | CPU/run budget (stored on problem/event) |
| `memory_limit` | Memory cap in MB (stored on problem/event) |

These appear in admin forms and the API. The judge **currently applies fixed nsjail defaults** (10s run CPU, ~6 MB virtual memory) — limits on problems are not yet passed into the sandbox. See [Judge service — resource limits](/architecture/judge/#resource-limits).

## Verdicts

| Status | Meaning |
| ------ | ------- |
| `PENDING` | In queue or running. Normal for a few seconds. |
| `ACCEPTED` | All tests passed. |
| `WRONG_ANSWER` | Output mismatch. |
| `TIME_LIMIT_EXCEEDED` | Too slow. |
| `MEMORY_LIMIT_EXCEEDED` | Too much RAM. |
| `RUNTIME_ERROR` | Crash / nonzero exit. |
| `COMPILE_TIME_ERROR` | Didn't build. Check stderr. |

## Contest scoring (ICPC)

Standings rank participants by:

1. Problems solved (more is better)
2. Total penalty time (lower is better) — solve minutes + **20 minutes** per wrong attempt before AC
3. Total submission count (fewer is better)

Team contests require team registration to submit; **rankings are still per user**. Full guide: [Run a contest](/guides/run-a-contest/#6-standings-icpc-scoring).

How judging works: [Judge service](/architecture/judge/).
