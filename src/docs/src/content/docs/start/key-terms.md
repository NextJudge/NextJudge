---
title: Key terms
description: Vocabulary for the API and UI.
---

| Term | Meaning |
| ---- | ------- |
| **Problem** | Prompt + resource limits + test cases. Public or contest-only. |
| **Test case** | Input/output pair. Hidden cases exist. Judge stops at first fail. |
| **Submission** | Code + language for a problem. Lifecycle: `PENDING` → verdict. |
| **Event** | API name for a **contest**: timed problems + leaderboard. UI says contest. |
| **Custom input run** | Execute against stdin without grading. The editor "Run" button. |
| **User** | Account. **Admin** manages problems/contests. Everyone else submits. |
| **Language** | Runtime config in judge image + DB row. ID goes in submission JSON. |

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

How judging works: [Judge service](/architecture/judge/).
