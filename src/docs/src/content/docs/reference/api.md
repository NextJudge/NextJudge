---
title: API Reference
description: "REST endpoints for the NextJudge data layer: contests, problems, submissions, users and authentication flows."
---

Base URL: `http://localhost:5000` (dev). Routes under `/v1/` unless noted.

**Auth:** [Authentication](/reference/authentication/). Send the raw JWT in the `Authorization` header with no `Bearer` prefix.

Contest organizer workflows: [Run a contest](/guides/run-a-contest/).

## Quick flow

```bash
# 1. Register
RESP=$(curl -s -X POST http://localhost:5000/v1/basic_register \
  -H "Content-Type: application/json" \
  -d '{"name":"ada","email":"ada@example.com","password":"example-password"}')
TOKEN=$(echo $RESP | jq -r .token)
USER_ID=$(echo $RESP | jq -r .id)

# 2. Languages (no auth)
LANG_ID=$(curl -s http://localhost:5000/v1/languages | jq -r '.[] | select(.name=="python") | .id')

# 3. Submit
SUB_ID=$(curl -s -X POST http://localhost:5000/v1/submissions \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\",\"problem_id\":1,\"language_id\":\"$LANG_ID\",\"source_code\":\"print(1)\"}" \
  | jq -r .id)

# 4. Poll
curl -s http://localhost:5000/v1/submissions/$SUB_ID/status -H "Authorization: $TOKEN" | jq .status
```

---

## Auth endpoints

| Method | Path | Auth header | Purpose |
| ------ | ---- | ----------- | ------- |
| POST | `/v1/basic_register` | none | Create account + JWT |
| POST | `/v1/basic_login` | none | Login + JWT |
| POST | `/v1/create_or_login_user` | `WEB_BRIDGE_SECRET` | OAuth bridge (web app) |
| POST | `/v1/login_judge` | `JUDGE_PASSWORD` | Judge worker JWT |
| POST | `/v1/basic_request_password_reset` | none | Request reset (no email sent today) |
| POST | `/v1/basic_reset_password` | none | Set new password directly |

See [Authentication](/reference/authentication/) for bodies and responses.

---

## Users

### GET /v1/users

List users. Query: `?username=` (filter by name).

**Auth:** admin

```json
[{ "id": "uuid", "name": "ada", "email": "ada@example.com", "is_admin": false, "join_date": "..." }]
```

### GET /v1/users/{user_id}

**Auth:** any authenticated user

### POST /v1/users

**Auth:** admin

```json
{ "name": "ada", "email": "ada@example.com", "image": "", "is_admin": false }
```

`201` with user object. Duplicate name/email → `400`.

### PUT /v1/users/{user_id}

**Auth:** admin. Update name, admin flag. `204` on success.

### DELETE /v1/users/{user_id}

Soft-delete. Self or admin (not last admin). `204`. Historical leaderboard rows show **Deleted user**.

---

## Problems

### GET /v1/problems

**Auth:** required. Public problems for everyone; admins see all.

Query: `?query=` (Elasticsearch when `ELASTIC_ENABLED=true`).

### GET /v1/problems/{problem_id}

**Auth:** required

Hidden test cases are **always redacted** for non-judge callers (empty input/output, `hidden: true`). There is no `?type=private` query parameter. Judges and admins fetch full tests via `GET /v1/problem_description/{id}/tests`.

```json
{
  "id": 1,
  "title": "Reverse String",
  "identifier": "reverse-string",
  "prompt": "...",
  "difficulty": "EASY",
  "public": true,
  "accept_timeout": 10.0,
  "execution_timeout": 5.0,
  "memory_limit": 256,
  "test_cases": [{ "id": "uuid", "input": "hi", "expected_output": "ih", "hidden": false }],
  "categories": [{ "id": "uuid", "name": "Strings" }]
}
```

### POST /v1/problems

**Auth:** admin

```json
{
  "title": "Reverse String",
  "identifier": "reverse-string",
  "prompt": "Reverse the input string.",
  "source": "NextJudge",
  "difficulty": "EASY",
  "timeout": 5.0,
  "accept_timeout": 5.0,
  "execution_timeout": 5.0,
  "memory_limit": 256,
  "user_id": "admin-uuid",
  "test_cases": [{ "input": "hello", "expected_output": "olleh", "hidden": false }],
  "category_ids": ["uuid"],
  "public": true
}
```

`timeout` is a legacy default when the specific timeout fields are omitted.

Validation (`400`):

- `title`, `identifier`, `prompt` non-empty (after trim)
- `difficulty` — one of `VERY EASY`, `EASY`, `MEDIUM`, `HARD`, `VERY HARD` (space in `VERY EASY` / `VERY HARD`)
- At least one test case with non-empty `input` and `expected_output`

`201`: `{ "id": 1, "event_problem_id": 0 }`

### PUT /v1/problems/{problem_id}

**Auth:** admin. Partial updates. Same validation when fields included. `200` same shape as POST response.

### DELETE /v1/problems/{problem_description_id}

**Auth:** admin. `204`.

### PUT /v1/admin/problems/{problem_id}/toggle-visibility

**Auth:** admin. No body. Flips `public` boolean. `200` with updated problem summary.

### GET /v1/problem_description/{id}/tests

All test cases for judging. **Auth:** judge or admin.

### GET /v1/categories

**Auth:** required

```json
[{ "id": "uuid", "name": "DP" }]
```

### GET /v1/categories/{problem_id}

**Auth:** required. Categories for a problem description ID.

---

## Submissions

### POST /v1/submissions

Enqueue for grading. **Auth:** required

```json
{
  "user_id": "uuid",
  "problem_id": 1,
  "language_id": "uuid",
  "source_code": "...",
  "event_id": 1
}
```

`event_id` optional — required for contest submissions during the active window.

`201`:

```json
{ "id": "uuid", "status": "PENDING", "submit_time": "...", "source_code": "..." }
```

### GET /v1/submissions/{submission_id}

**Auth:** owner, judge, or admin. Full record including `test_case_results` after grading.

### GET /v1/submissions/{submission_id}/status

**Auth:** owner, judge, or admin. Lightweight poll:

```json
{ "id": "uuid", "status": "PENDING" }
```

### PATCH /v1/submissions/{submission_id}

**Auth:** judge or admin

```json
{
  "status": "ACCEPTED",
  "stdout": "",
  "stderr": "",
  "time_elapsed": 0.042,
  "failed_test_case_id": null,
  "test_case_results": [{ "test_case_id": "uuid", "stdout": "...", "stderr": "", "passed": true }]
}
```

### GET /v1/user_submissions/{user_id}

**Auth:** self or admin

### GET /v1/user_problem_submissions/{user_id}/{problem_id}

**Auth:** self or admin

---

## Custom input ("Run")

### POST /v1/input_submissions

**Auth:** required.

```json
{ "user_id": "uuid", "language_id": "uuid", "source_code": "print(input())", "stdin": "test" }
```

`201` body is a **plain UUID string** (not JSON-wrapped).

Unauthenticated demo routes (IP rate-limited 5/min, burst 2):

- `POST /v1/public/input_submissions`
- `POST /v1/bench/input_submissions`

Authenticated rate limits (in-memory per data-layer instance):

| Route | Limit |
| ----- | ----- |
| `POST /v1/input_submissions` | 30/min, burst 10 |
| `POST /v1/submissions` | 20/min, burst 5 |
| Auth / password reset | 10/min per IP, burst 5 |

429: `Retry-After: 60`, `{"code":"RATE_LIMIT_EXCEEDED",...}`

### GET /v1/input_submissions/{id}

**Auth:** required. While running:

```json
{ "status": "PENDING" }
```

When finished:

```json
{ "status": "ACCEPTED", "stdout": "...", "stderr": "", "finished": true, "runtime": 0.042 }
```

### GET /v1/public/input_submissions/{id} / GET /v1/bench/input_submissions/{id}

**Auth:** none. Same poll shapes as authenticated GET.

### PATCH /v1/input_submissions/{submission_id}

**Auth:** judge or admin. Judge worker callback for custom runs.

```json
{ "status": "ACCEPTED", "stdout": "", "stderr": "", "runtime": 0.042 }
```

`204` on success.

---

## Languages

### GET /v1/languages

No auth.

```json
[{ "id": "uuid", "name": "python", "extension": "py", "version": "3.12" }]
```

### POST /v1/languages

**Auth:** admin. Language must exist in judge `languages.toml`.

### DELETE /v1/languages/{language_id}

**Auth:** admin. `204`.

---

## Events (contests)

The API says **events**. The UI says **contests**.

Scoring rules: [Run a contest — standings](/guides/run-a-contest/#6-standings-icpc-scoring).

### GET /v1/public/events

**Auth:** required. Contests visible to logged-in users.

### GET /v1/public/events/{event_id}

**Auth:** required. Event detail with participant list and problem id refs.

### POST /v1/public/events/{event_id}/register

**Auth:** required. Self-register. `409` if already registered.

### GET /v1/public/events/{event_id}/participants

**Auth:** required. Array of `User` objects.

### GET /v1/events

**Auth:** admin. All events.

### GET /v1/events/{event_id}

**Auth:** admin

### GET /v1/event_details?title={title}

**Auth:** admin. Lookup by title with full problem payloads and languages.

### POST /v1/events

**Auth:** admin

```json
{
  "title": "Spring 2026",
  "description": "Internal practice",
  "start_time": "2026-04-01T18:00:00Z",
  "end_time": "2026-04-01T21:00:00Z",
  "teams": false,
  "user_id": "admin-uuid",
  "problems": [{
    "problem_id": 1,
    "accept_timeout": 5.0,
    "execution_timeout": 5.0,
    "memory_limit": 256
  }],
  "languages": [1]
}
```

### PUT /v1/events/{event_id}

**Auth:** admin. Updates title, description, times, teams — **not** problem attachments.

### DELETE /v1/events/{event_id}

**Auth:** admin

### Event sub-resources

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/v1/events/{id}/problems` | user | Problems in contest |
| GET | `/v1/events/{id}/problems/{event_problem_id}` | user | Single contest problem + public tests |
| POST | `/v1/events/{id}/problems` | user | Attach problem `{ "problem_id": 1 }` → `201` |
| GET | `/v1/events/{id}/submissions` | user | Filtered submissions (see below) |
| GET | `/v1/events/{id}/attempts` | user | ICPC attempt stats per user/problem |
| GET | `/v1/events/{id}/user_problem_status` | user | Current user's per-problem status |
| GET | `/v1/events/{id}/problems_stats` | user | Acceptance counts per problem |
| GET | `/v1/events/{id}/participants` | admin | Participant list |
| POST | `/v1/events/{id}/participants` | admin | Add `{ "user_id": "..." }` |
| GET | `/v1/events/{id}/questions` | user | List clarifications |
| POST | `/v1/events/{id}/questions` | user | Ask `{ "question": "...", "problem_id": 1 }` |
| PUT | `/v1/events/{id}/questions/{question_id}/answer` | user | Answer `{ "answer": "..." }` |
| POST | `/v1/events/{id}/end` | admin | End early (`end_time = now`) |

### GET /v1/events/{id}/attempts

ICPC-style stats per `(user_id, problem_id)`:

```json
[{
  "user_id": "uuid",
  "problem_id": 1,
  "attempts": 3,
  "total_attempts": 5,
  "first_accepted_time": "2026-04-01T19:30:00Z",
  "minutes_to_solve": 45
}]
```

`attempts` counts submissions that affect scoring; see [Run a contest](/guides/run-a-contest/#6-standings-icpc-scoring).

### Clarifications

**GET** returns `EventQuestionExt` array with nested `user`, optional `problem`, `answerer`.

**POST** `201` with created question. Notifies other participants (`notification_type: "question"`).

**PUT answer** `200` `{"message":"question answered successfully"}`. Notifies question author (`notification_type: "answer"`). Any authenticated user can call this endpoint — restrict at the proxy if needed.

### Team contests

Create with `"teams": true`.

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/v1/events/{id}/teams` | user | List teams |
| POST | `/v1/events/{id}/teams` | user | Create `{ "name": "Team Ada" }` |
| GET | `/v1/events/{id}/teams/me` | user | Current user's team + members |
| GET | `/v1/events/{id}/teams/{team_id}` | user | Team detail |
| POST | `/v1/events/{id}/teams/{team_id}/join` | user | Join (optional `{ "user_id" }`) |

One team per user per event. Standings remain **per user**.

### GET /v1/events/{id}/submissions

Query filters:

| Query | Behavior |
| ----- | -------- |
| (none) | All submissions — judge, admin, or event owner only |
| `?user={uuid}` | That user's submissions — self or admin |
| `?team={uuid}` | Team submissions — team members or judge/admin |

Redaction: strips `source_code`, `stdout`, `stderr` for submissions you don't own.

---

## Notifications

Triggered by contest clarifications. All require auth.

### GET /v1/user/notifications/count

```json
{ "count": 3 }
```

### GET /v1/user/notifications

Returns recent notifications (unread + read from last 24h):

```json
[{
  "id": "uuid",
  "user_id": "uuid",
  "event_id": 1,
  "question_id": "uuid",
  "notification_type": "question",
  "is_read": false,
  "created_at": "...",
  "question": { }
}]
```

`notification_type`: `"question"` | `"answer"`.

### PUT /v1/user/notifications/mark-read

Empty body. `200` `{"message":"notifications marked as read"}`.

---

## Health

| Method | Path | Response |
| ------ | ---- | -------- |
| GET | `/` | `{"status":"ok","service":"nextjudge-data-layer","health":"/health","api":"/v1"}` |
| GET | `/health` | `{"status":"ok"}` |
| GET | `/healthy` | `{"status":"ok"}` |

No auth.

---

## Errors

```json
{ "error": "Human-readable message", "code": "OPTIONAL_CODE" }
```

Some validation errors use `{ "code": "400", "message": "..." }`.

| HTTP | Meaning |
| ---- | ------- |
| 400 | Bad input |
| 401 | Missing/invalid auth |
| 403 | Wrong role |
| 404 | Not found |
| 409 | Conflict |
| 429 | Rate limited |
| 500 | Internal server error |

`Malformed JWT token` almost always means you prefixed `Bearer`.
