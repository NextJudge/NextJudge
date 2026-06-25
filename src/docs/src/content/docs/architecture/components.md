---
title: Core Components
description: Overview of NextJudge services, data stores, and how a submission moves from the web UI through the data layer to the judge worker.
---

Four services, two data stores, one queue. That's the whole system.

![Architecture](../../../assets/architecture.png)

## Web (`src/web`)

Next.js on port **8080**. Auth, problem list, Monaco editor, contests, leaderboards.

Calls the data layer over REST. After you submit, the UI **polls** submission status every few seconds.

### Why polling, not WebSockets?

Honest answer: simpler to ship and good enough for contest scale today. Submission grading takes seconds to minutes; polling at 500ms–1s feels live without maintaining WS infra, reconnect logic, and auth on a second channel.

| Approach | Pros | Cons |
| -------- | ---- | ---- |
| **Polling (current)** | Works everywhere; no extra infra; easy to debug | More HTTP requests while waiting; latency bounded by poll interval |
| **SSE (likely next step)** | Server push over one long-lived GET; near-instant updates when judge PATCHes | Proxy timeout tuning; reconnect handling; still one-way |
| **WebSockets** | Bidirectional; lowest latency | Heavier ops (sticky sessions, auth channel); overkill for status-only updates |

Current intervals:

- Platform **Run** (custom input): 500ms poll on `/v1/input_submissions/:id`
- Platform **Submit**: 1s poll on `/v1/submissions/:id/status`, then one full fetch when complete
- Landing demo: 500ms poll, 30-attempt cap (~15s)
- CLI: exponential backoff up to 3.5s

Tradeoff: slightly higher API load during active editing sessions. Poll GETs are cheap reads; expensive POST/enqueue paths are rate-limited separately. If you need real-time collaboration or sub-100ms status, add SSE on top of the existing REST data — RabbitMQ stays internal to the judge pipeline.

**Multi-instance note:** IP/user rate limiters are in-memory per data-layer process. Horizontal scaling needs a shared store (e.g. Redis) for consistent limits across replicas.

## Data layer (`src/data-layer`)

Go REST API on **5000**. Postgres schema, JWT auth, RabbitMQ enqueue.

| Prefix | What |
| ------ | ---- |
| `/v1/users`, `/v1/problems`, `/v1/submissions` | Core CRUD |
| `/v1/events` | Contests (yes, "events" in the API) |
| `/v1/input_submissions` | "Run" without grading |
| `/v1/languages` | Runtime registry |
| `/v1/basic_*`, `/v1/create_or_login_user` | Auth ([details](/reference/authentication/)) |
| `/healthy` | Liveness |

Optional Elasticsearch for problem search when `ELASTIC_ENABLED=true`. Most dev setups leave it off.

## Judge (`src/judge`)

Python worker. Pull from RabbitMQ, fetch tests from API, compile + run in nsjail, PATCH result.

`prefetch_count=1`: one submission per worker at a time. Contest with 200 participants submitting problem A at minute 59? Run more judge containers, not bigger CPUs on one.

Deep dive: [Judge service](/architecture/judge/).

## RabbitMQ

Buffer between "user clicked submit" and "judge finished running tests." API responds fast with `PENDING`; execution happens async.

Messages are durable. Restart a judge mid-contest and unacked work returns to the queue. Management UI on **15672** when exposed.

Watch queue depth during load tests. Flat line at zero is healthy. Monotonic climb means add judges or fix broken workers.

## PostgreSQL

Users, problems, test cases, submissions, events, languages. Single source of truth.

GORM AutoMigrate on startup. Fine for dev; back up before prod upgrades.

## CLI (`src/cli`)

Terminal workflow for people who live in `vim`. [CLI guide](/guides/cli/).

## Submission path (the whole story)

```mermaid
sequenceDiagram
    participant Browser
    participant DataLayer as Data layer
    participant RabbitMQ
    participant Judge

    Browser->>DataLayer: POST /submissions
    DataLayer->>DataLayer: store PENDING
    DataLayer-->>Browser: 201 + id

    DataLayer->>RabbitMQ: publish message
    RabbitMQ->>Judge: deliver

    Note over Judge: compile + run tests
    Judge->>DataLayer: PATCH result

    loop until status != PENDING
        Browser->>DataLayer: GET /submissions/id
        DataLayer-->>Browser: status (e.g. ACCEPTED)
    end
```

Custom input runs (`/v1/input_submissions`) skip test comparison but follow the same queue + judge path.

## Failure modes worth knowing

| Symptom | Likely cause |
| ------- | ------------ |
| Instant 201 then eternal PENDING | Judge down, wrong `JUDGE_PASSWORD`, or RabbitMQ auth |
| COMPILE_TIME_ERROR on everything | Language ID mismatch between DB and `languages.toml` |
| API 401 after working earlier | User deleted, token malformed, or `Bearer` prefix added by mistake |
| Web shows data, curl doesn't | Missing or wrong `Authorization` header |

Getting unstuck: [Getting started troubleshooting](/start/getting-started/#troubleshooting).
