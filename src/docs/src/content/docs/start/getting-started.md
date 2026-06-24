---
title: Getting Started
description: Deploy NextJudge and verify it works end to end.
---

## Requirements

- Docker + Docker Compose
- 4 GB RAM minimum (8 GB if running web + judge together)
- Ports free: **5000** (API), **5432** (Postgres), **5672** (RabbitMQ), **8080** (web)

Clone the repo. Everything below runs from the root.

## Deploy

Backend only:

```bash
./deploy.sh
```

Backend + web UI:

```bash
./deploy.sh web
```

First run builds the judge base image. Grab coffee. Subsequent starts are faster.

### Did it work?

```bash
curl -i http://localhost:5000/healthy
```

You want:

```http
HTTP/1.1 200 OK
```

Anything else (connection refused, 502, hang) means the data layer isn't up yet. `docker ps` should show Postgres, RabbitMQ, data layer, and judge containers. Names vary; healthy counts more than spelling.

Web UI: **http://localhost:8080**. The first compile in dev mode can take a minute.

---

## Your first 15 minutes

This is the walkthrough. Deploy with `./deploy.sh web`, then follow along.

### 1. Register (UI path)

Open http://localhost:8080, sign up with email/password or GitHub (if configured in `.env.dev`).

Want admin powers? Set your email in `ADMIN_EMAILS` before starting, then register with that email. Details in [Authentication](/reference/authentication/).

### 2. Register (API path)

Skip the UI. Get a token directly:

```bash
curl -s -X POST http://localhost:5000/v1/basic_register \
  -H "Content-Type: application/json" \
  -d '{"name":"ada","email":"ada@example.com","password":"example-password"}' \
  | jq .
```

Copy `token` and `id` from the response. We'll call them `$TOKEN` and `$USER_ID`.

:::tip
Install `jq` for pretty JSON. Without it, squint at the raw output. Still works.
:::

### 3. List languages

```bash
curl -s http://localhost:5000/v1/languages | jq '.[0:3]'
```

Pick a language `id` for Python (or whatever you like). Note it as `$LANG_ID`.

No auth required. If this returns `[]`, your database didn't seed. `./dev-deploy.sh` sets `SEED_DATA=true`; plain `./deploy.sh` may not. You can still register languages as admin later.

### 4. Find a problem

With `$TOKEN` set (raw JWT, no `Bearer`):

```bash
curl -s http://localhost:5000/v1/problems \
  -H "Authorization: $TOKEN" | jq '.[0] | {id, title, difficulty}'
```

No problems? Dev seed may not have run, or you're on a fresh prod deploy. Create one in the admin UI, or ask an admin to POST `/v1/problems`. Note `id` as `$PROBLEM_ID`.

### 5. Submit solution

```bash
curl -s -X POST http://localhost:5000/v1/submissions \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"problem_id\": $PROBLEM_ID,
    \"language_id\": \"$LANG_ID\",
    \"source_code\": \"print('hello')\"
  }" | jq '{id, status}'
```

Expect `"status": "PENDING"`. Save `id` as `$SUB_ID`. The judge picks it up from RabbitMQ.

### 6. Poll for verdict

```bash
curl -s http://localhost:5000/v1/submissions/$SUB_ID \
  -H "Authorization: $TOKEN" | jq '{status, time_elapsed, stderr}'
```

Run it a few times. `PENDING` for a few seconds is normal. `PENDING` for minutes is not (see [Judge stuck](#judge-stuck-on-pending) below).

Success looks like `"status": "ACCEPTED"` (if your code actually solved the problem) or `"WRONG_ANSWER"` / `"COMPILE_TIME_ERROR"` (if it didn't). All three mean the pipeline works. CE on `print('hello')` for a hard problem is expected. The point is the judge *ran*.

**Checkpoint:** you deployed, authenticated, submitted, and got a non-PENDING status. You're done. Everything else in these docs is refinement.

---

## Development mode

Hot reload, source mounted, seed data:

```bash
./dev-deploy.sh web
```

Other flags: `nojudge` (skip judge), `noelastic` (skip Elasticsearch profile). Full dev workflow: [Development guide](/guides/development/).

## Reset

Nuclear option. Wipes all data.

```bash
./fully-reset.sh && ./deploy.sh web
```

## Run one service alone

Infrastructure in Docker, one process on the host:

| Service | Command |
| ------- | ------- |
| Data layer | `cd src/data-layer && go run src/main.go -d -p 5000` |
| Web | `cd src/web && npm run dev` |
| Judge | `cd src/judge && python src/app.py` |

Postgres + RabbitMQ must already be running.

## Troubleshooting

### Port in use

NextJudge expects **5000**, **8080**, **5432**, and **5672** free. Something else bound to those ports blocks startup.

```bash
lsof -i :5000 :8080 :5432 :5672
```

Stop the conflicting process or change the mapped ports in the compose file.

### Data layer can't reach Postgres

The data layer expects Postgres on the host/port from your compose env (default **5432**). A Postgres instance already running on the host often wins that port.

```bash
docker logs $(docker ps -qf name=postgres)
```

Confirm the Postgres container is healthy and that `DB_HOST` / `DB_PASSWORD` match compose.

### Judge stuck on PENDING

Submission stays `PENDING` and the RabbitMQ queue grows when workers are down or can't authenticate back to the API.

Checklist:

1. Judge container running? `docker ps | grep judge`
2. Judge logs: `docker logs $(docker ps -qf name=judge) 2>&1 | tail -20`
3. `JUDGE_PASSWORD` identical on data layer and judge
4. RabbitMQ credentials match on both sides

A healthy judge log shows receive → compile → PATCH result. No log activity usually means nothing is consuming the queue.

### First deploy runs out of memory

The initial judge base image build is heavy. Give Docker at least **4 GB** RAM (8 GB if you run web + judge together).

## What's next

- [Authentication](/reference/authentication/) for token details and admin setup
- [CLI](/guides/cli/) for `nextjudge test` locally
- [Deployment](/guides/deployment/) for production hosting
