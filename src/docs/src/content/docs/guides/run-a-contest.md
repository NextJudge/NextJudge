---
title: Run a contest
description: End-to-end guide for organizers — create problems, schedule a contest, manage teams, clarifications and ICPC standings.
---

This guide covers the **web UI** workflow for running a contest. The API uses **events**; the UI says **contests**. See [Key terms](/start/key-terms/) and the [API reference](/reference/api/#events-contests).

## Before you start

- Deploy the stack ([Getting started](/start/getting-started/)) or use a hosted instance.
- Register with an email listed in `ADMIN_EMAILS` on the data layer to get admin access. See [Authentication](/reference/authentication/#admin-accounts).
- Seed data from `./dev-deploy.sh web` includes sample contests if you want to explore first.

## Organizer checklist

1. Create or import **problems** (practice set).
2. **Create a contest** with schedule, team mode, and attached problems.
3. Let participants **register** (and join teams if enabled).
4. **Monitor clarifications** during the window.
5. **End early** if needed.
6. Review **standings** (ICPC scoring).
7. **Clone** the contest to rerun with new dates.

---

## 1. Create problems

### Admin UI

1. Open **Admin → Problems** (`/platform/admin/problems`).
2. Use **Create problem** — title, identifier, prompt (Markdown/LaTeX), difficulty, timeouts, memory limit, test cases.
3. Mark **public** for the practice catalog, or keep private for contest-only use.

### API (optional)

`POST /v1/problems` as admin. See [API reference](/reference/api/#post-v1problems).

### Bulk import (CLI)

For ICPC-format folders:

```bash
nextjudge upload-challenge ./problems/a-plus-b
nextjudge upload-challenge-suite ./icpc-archive/
```

See [CLI](/guides/cli/#upload-challenge).

**Note:** Problem `accept_timeout`, `execution_timeout`, and `memory_limit` are stored and shown in the UI. The judge currently applies **fixed nsjail defaults** (10s run CPU, ~6 MB virtual memory) — see [Judge service — limits](/architecture/judge/#resource-limits).

---

## 2. Create a contest

### Admin UI

1. Go to **Admin → Contests** (`/platform/admin/contests`).
2. **Create contest** — title, description, start/end times, **teams** toggle.
3. Select problems from the catalog. Each problem is linked to the event with optional per-contest limits.

Validation on create:

- Title must be unique.
- `start_time` must not be more than ~5 minutes in the past.
- `start_time` < `end_time`.
- Every `problem_id` must exist.

### API

```bash
curl -s -X POST http://localhost:5000/v1/events \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spring Practice",
    "description": "Internal round",
    "start_time": "2026-04-01T18:00:00Z",
    "end_time": "2026-04-01T21:00:00Z",
    "teams": false,
    "user_id": "'"$USER_ID"'",
    "problems": [{ "problem_id": 1 }]
  }'
```

Admin only. Optional per-problem overrides in `problems[]`: `accept_timeout`, `execution_timeout`, `memory_limit`, `languages`.

### Edit and clone

- **Edit** metadata (title, schedule, teams) from the admin contest card. Problem attachments are **not** changed by edit — add problems via API or clone the contest.
- **Clone contest** copies settings and problems into a new event (useful for reruns).

---

## 3. Registration and teams

### Self-registration

Participants open **Contests** (`/platform/contests`), pick an event, and click **Register**. API: `POST /v1/public/events/{event_id}/register`.

### Admin adds participants

From the admin contest card → **Add participants**, or `POST /v1/events/{event_id}/participants` with `{ "user_id": "..." }`.

### Team contests (`teams: true`)

After registering, participants must **create or join a team** before submitting:

| Action | API |
| ------ | --- |
| List teams | `GET /v1/events/{id}/teams` |
| Create team | `POST /v1/events/{id}/teams` `{ "name": "Team Ada" }` |
| Join team | `POST /v1/events/{id}/teams/{team_id}/join` |
| My team | `GET /v1/events/{id}/teams/me` |

Rules: one team per user per event; team names unique per event. **Standings remain per-user**, not aggregated by team — teams gate registration and submission only.

### Submission gating

During the contest window, a user can submit only if:

- `start_time ≤ now ≤ end_time`
- They are registered (and on a team when `teams: true`)
- They have **not** already solved **every** problem in the event (full solve locks further submits)

Submissions include `event_id` in `POST /v1/submissions`.

---

## 4. Clarifications

Participants ask questions from the contest detail page (**Questions** section).

| Action | API |
| ------ | --- |
| Ask | `POST /v1/events/{id}/questions` `{ "question": "...", "problem_id": 1 }` (`problem_id` optional) |
| List | `GET /v1/events/{id}/questions` |
| Answer | `PUT /v1/events/{id}/questions/{question_id}/answer` `{ "answer": "..." }` |

**UI visibility:**

- **Public clarifications** — answered questions visible to everyone.
- **Pending** — visible to the author and admins.
- Admins answer via the UI; the API allows any authenticated user to answer (restrict at the proxy if needed).

**Notifications:** asking notifies other participants; answering notifies the question author. See [Notifications](/reference/api/#notifications).

---

## 5. End contest early

**End now** on the admin card or contest detail (`POST /v1/events/{id}/end`) sets `end_time` to the current time. Further submissions are rejected.

---

## 6. Standings (ICPC scoring)

The leaderboard uses `GET /v1/events/{id}/attempts`. Scoring is computed in the web app from attempt stats.

### Per-problem solve time

```
minutes_to_solve = minutes from event.start_time to first AC on that problem
```

(clamped to ≥ 0)

### Penalty per solved problem

```
wrong_before_ac = max(0, attempts - 1)
problem_penalty = minutes_to_solve + 20 × wrong_before_ac
```

- **20 minutes** per wrong submission before first AC (ICPC standard).
- The AC submission counts in `attempts` but adds no wrong penalty.

### Ranking (tie-breakers)

1. More problems solved — higher rank.
2. Lower total penalty — better.
3. Fewer total submissions — better.

### Display

- Solved cell: `{attempts}/{minutes}` (e.g. `3/45`).
- Unsolved with tries: `{count}/--`.
- Penalty column: total minutes (e.g. `125m`).

### Full solve freeze

When a user ACs **every** problem, their clock stops at the last AC timestamp. Later submissions are excluded from scoring, and they **cannot submit again**.

### Limitations

| Topic | Behavior |
| ----- | -------- |
| Team events | Rankings are **individual users** |
| Penalty constant | **20** minutes — not configurable per event |
| Frozen board | Ended contests show frozen standings; data is live from the DB |

Problem acceptance stats: `GET /v1/events/{id}/problems_stats`. Personal progress: `GET /v1/events/{id}/user_problem_status`.

---

## 7. During the contest

- **Monitor queue depth** if submissions stay `PENDING` — [Troubleshooting](/start/getting-started/#judge-stuck-on-pending).
- **Scale judges** for large events — [Deployment](/guides/deployment/#scale-judges).
- Contest submissions in standings redact `source_code` for other users; owners see full detail.

---

## What's next

- [Configuration](/guides/configuration/) — OAuth, env files, optional Elasticsearch
- [API reference](/reference/api/) — automation and integrations
- [CLI](/guides/cli/) — bulk problem import and local testing
