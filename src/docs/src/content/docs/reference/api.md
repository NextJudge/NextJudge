---
title: API Reference
description: "REST endpoints for the NextJudge data layer: contests, problems, submissions, users and authentication flows."
---

Base URL: `http://localhost:5000` (dev). Routes under `/v1/` unless noted.

**Auth:** [Authentication](/reference/authentication/). Send the raw JWT in the `Authorization` header with no `Bearer` prefix.

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
curl -s http://localhost:5000/v1/submissions/$SUB_ID -H "Authorization: $TOKEN" | jq .status
```

---

## Auth endpoints

| Method | Path | Auth header | Purpose |
| ------ | ---- | ----------- | ------- |
| POST | `/v1/basic_register` | none | Create account + JWT |
| POST | `/v1/basic_login` | none | Login + JWT |
| POST | `/v1/create_or_login_user` | `WEB_BRIDGE_SECRET` | OAuth bridge (web app) |
| POST | `/v1/login_judge` | `JUDGE_PASSWORD` | Judge worker JWT |
| POST | `/v1/basic_request_password_reset` | none | Request reset |
| POST | `/v1/basic_reset_password` | none | Set new password |

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

```json
{ "id": "uuid", "name": "ada", "email": "ada@example.com", "is_admin": false, "join_date": "..." }
```

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

Query: `?query=` (Elasticsearch when enabled).

### GET /v1/problems/{problem_id}

**Auth:** required

Query: `?type=private` includes hidden tests (admin only).

```json
{
  "id": 1,
  "title": "Reverse String",
  "identifier": "reverse-string",
  "prompt": "...",
  "difficulty": "EASY",
  "public": true,
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

Validation (`400` with `{"code":"400","message":"..."}`):

- `title`, `identifier` and `prompt` must be non-empty (after trim)
- `difficulty` required — one of `VERY_EASY`, `EASY`, `MEDIUM`, `HARD`, `VERY_HARD`
- At least one test case; each test case needs non-empty `input` and `expected_output`

### PUT /v1/problems/{problem_id}

**Auth:** admin. Partial updates to problem metadata and tests. Same validation rules as POST when problem fields or test cases are included.

### DELETE /v1/problems/{problem_description_id}

**Auth:** admin. `204`.

### GET /v1/problem_description/{id}/tests

All test cases for judging. **Auth:** judge or admin.

### GET /v1/categories

**Auth:** required

```json
[{ "id": "uuid", "name": "DP" }]
```

---

## Submissions

### POST /v1/submissions

Enqueue for grading. **Auth:** required

```json
{
  "user_id": "uuid",
  "problem_id": 1,
  "language_id": "uuid",
  "source_code": "..."
}
```

`201`:

```json
{ "id": "uuid", "status": "PENDING", "submit_time": "...", "source_code": "..." }
```

Judge PATCHes status later. You poll GET until `status != PENDING`.

### GET /v1/submissions/{submission_id}

**Auth:** submission owner, judge, or admin

Full submission including `source_code` and `test_case_results` after grading. Other authenticated users get `401 Unauthorized`.

### GET /v1/submissions/{submission_id}/status

**Auth:** submission owner, judge, or admin. Lightweight status-only poll (preferred by the web app while waiting).

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

**Auth:** self or admin. All attempts on one problem.

---

## Custom input ("Run")

### POST /v1/input_submissions

**Auth:** required. No test cases, arbitrary stdin.

```json
{ "user_id": "uuid", "language_id": "uuid", "source_code": "print(input())", "stdin": "test" }
```

Also available unauthenticated on public/bench routes for demos (`/v1/public/input_submissions`, `/v1/bench/input_submissions`). Both POST routes are IP rate-limited (5/min, burst 2).

Authenticated POST limits (per user, in-memory per data-layer instance):

| Route | Limit |
| ----- | ----- |
| `POST /v1/input_submissions` | 30/min, burst 10 |
| `POST /v1/submissions` | 20/min, burst 5 |
| `POST /v1/basic_login`, `/v1/basic_register`, password reset | 10/min per IP, burst 5 |

429 responses include `Retry-After: 60` and `{"code":"RATE_LIMIT_EXCEEDED",...}`.

### GET /v1/input_submissions/{id}

Poll until `finished: true`. Returns `stdout`, `stderr`, `runtime`.

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

The API says **events**. The UI says **contests**. Same thing.

### GET /v1/public/events

**Auth:** required. Contests visible to logged-in users.

### GET /v1/public/events/{event_id}

**Auth:** required. Event + problems.

### POST /v1/public/events/{event_id}/register

**Auth:** required. Register current user for public contest.

### GET /v1/events

**Auth:** admin. All events.

### GET /v1/events/{event_id}

**Auth:** admin

### POST /v1/events

**Auth:** admin

```json
{
  "title": "Spring 2026",
  "description": "Internal practice",
  "start_time": "2026-04-01T18:00:00Z",
  "end_time": "2026-04-01T21:00:00Z",
  "teams": false,
  "user_id": "admin-uuid"
}
```

### PUT /v1/events/{event_id}

**Auth:** admin

### DELETE /v1/events/{event_id}

**Auth:** admin

### Event sub-resources

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/v1/events/{id}/problems` | user | Problems in contest |
| POST | `/v1/events/{id}/problems` | user | Attach problem |
| GET | `/v1/events/{id}/submissions` | user | Filtered submissions (see below) |
| GET | `/v1/events/{id}/attempts` | user | ICPC-style solve times |
| GET | `/v1/events/{id}/participants` | user/admin | Who registered |
| POST | `/v1/events/{id}/participants` | admin | Add participant |
| GET/POST | `/v1/events/{id}/questions` | user | Clarification questions |
| POST | `/v1/events/{id}/end` | admin | End contest early (sets `end_time` to now) |

### Team contests

Create an event with `"teams": true`. Team endpoints only work when teams are enabled on that event.

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/v1/events/{id}/teams` | user | List teams (`[{ "id", "event_id", "name" }]`) |
| POST | `/v1/events/{id}/teams` | user | Create a team (creator joins automatically) |
| GET | `/v1/events/{id}/teams/me` | user | Current user's team + `members` |
| GET | `/v1/events/{id}/teams/{team_id}` | user | Team detail + `members` |
| POST | `/v1/events/{id}/teams/{team_id}/join` | user | Join a team |

**POST** `/v1/events/{id}/teams` body:

```json
{ "name": "Team Ada" }
```

`201`: `{"message":"Success","team_id":"uuid"}`. Conflicts: `409` duplicate name or already on a team for this event.

**POST** join body (optional — defaults to the authenticated user):

```json
{ "user_id": "uuid" }
```

`201` on success. One team per user per event.

### GET /v1/events/{id}/submissions

**Auth:** required. Query filters:

| Query | Behavior |
| ----- | -------- |
| (none) | All contest submissions — event owner, judge, or admin only |
| `?user={uuid}` | That user's contest submissions — self or admin |
| `?team={uuid}` | Team submissions — team members (or judge/admin) on team events |

**Redaction:** responses strip `source_code`, `stdout` and `stderr` for submissions you do not own. Status, timing and verdict fields remain visible. Owners, judges and admins see full payloads on their own submissions.

---

## Notifications

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/v1/user/notifications/count` | Unread count |
| GET | `/v1/user/notifications` | List |
| PUT | `/v1/user/notifications/mark-read` | Mark read |

All require auth.

---

## Health

### GET /healthy

No auth. `200` = up.

---

## Errors

```json
{ "error": "Human-readable message", "code": "OPTIONAL_CODE" }
```

| HTTP | Meaning |
| ---- | ------- |
| 400 | Bad input |
| 401 | Missing/invalid auth |
| 403 | Wrong role |
| 404 | Not found |
| 409 | Conflict (e.g. user exists) |
| 500 | Internal server error |

Auth errors are worth memorizing: `Malformed JWT token` almost always means you prefixed `Bearer`.
