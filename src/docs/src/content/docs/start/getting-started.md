---
title: Getting Started
description: Deploy NextJudge locally, register a user, submit a solution and confirm the judge returns a verdict.
---

## Requirements

- Docker + Docker Compose
- 4 GB RAM minimum (8 GB with web and judge together)
- Ports free: **5000** (API), **5432** (Postgres), **5672** (RabbitMQ), **8080** (web)

Clone the repo. Commands below assume the repository root as the working directory.

### Environment secrets

`./deploy.sh` and `./dev-deploy.sh` read secrets from `.env` in the repo root. Generate them once:

```bash
./.createenv.sh > .env
```

Required keys: `JWT_SIGNING_SECRET`, `JUDGE_PASSWORD`, `WEB_BRIDGE_SECRET`, `DB_PASSWORD`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD`. Copy `WEB_BRIDGE_SECRET` into `src/web/.env.local` when running the web app outside Docker (see `src/web/.env.example`).

## Deploy

Backend only:

```bash
./deploy.sh
```

Backend + web UI:

```bash
./deploy.sh web
```

The first run builds the judge base image and can take several minutes. Later starts are faster.

### Verify the data layer

```bash
curl -i http://localhost:5000/healthy
```

Expected response:

```http
HTTP/1.1 200 OK
```

Connection refused, 502 or a hang usually means the data layer is not ready. Run `docker ps` and confirm Postgres, RabbitMQ, data layer and judge containers are running. Container names vary by compose file; health matters more than exact labels.

Web UI: **http://localhost:8080**. The first compile in dev mode can take a minute.

---

## Your first 15 minutes

Deploy with `./deploy.sh web`, then follow these steps.

### 1. Register (UI path)

Open http://localhost:8080 and sign up with email/password or GitHub (if configured in `.env.dev`).

To grant admin access, add your email to `ADMIN_EMAILS` before starting the stack, then register with that address. See [Authentication](/reference/authentication/) for details.

### 2. Register (API path)

Create an account and receive a token directly:

```bash
curl -s -X POST http://localhost:5000/v1/basic_register \
  -H "Content-Type: application/json" \
  -d '{"name":"ada","email":"ada@example.com","password":"example-password"}' \
  | jq .
```

Copy `token` and `id` from the response. The walkthrough refers to them as `$TOKEN` and `$USER_ID`.

:::tip
`jq` formats JSON output. The same commands work without it if you read the raw response.
:::

### 3. List languages

```bash
curl -s http://localhost:5000/v1/languages | jq '.[0:3]'
```

Note a language `id` (for example Python). The walkthrough calls it `$LANG_ID`.

No auth required. An empty array `[]` usually means the database did not seed. `./dev-deploy.sh` sets `SEED_DATA=true`; plain `./deploy.sh` may not. Admins can register languages later.

### 4. Find a problem

With `$TOKEN` set (raw JWT, no `Bearer` prefix):

```bash
curl -s http://localhost:5000/v1/problems \
  -H "Authorization: $TOKEN" | jq '.[0] | {id, title, difficulty}'
```

If no problems appear, dev seed may not have run or you may be on a fresh production deploy. Create a problem in the admin UI or have an admin POST to `/v1/problems`. Note `id` as `$PROBLEM_ID`.

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

Expect `"status": "PENDING"`. Save `id` as `$SUB_ID`. The judge consumes the job from RabbitMQ.

### 6. Poll for verdict

Status poll (same path the web app uses while waiting):

```bash
curl -s http://localhost:5000/v1/submissions/$SUB_ID/status \
  -H "Authorization: $TOKEN" | jq .
```

When `status` is no longer `PENDING`, fetch the full record:

```bash
curl -s http://localhost:5000/v1/submissions/$SUB_ID \
  -H "Authorization: $TOKEN" | jq '{status, time_elapsed, stderr}'
```

Poll a few times. A few seconds in `PENDING` is normal. Minutes in `PENDING` indicate a pipeline problem (see [Judge stuck on PENDING](#judge-stuck-on-pending)).

A non-`PENDING` status confirms the pipeline ran. `ACCEPTED`, `WRONG_ANSWER` and `COMPILE_TIME_ERROR` all prove the judge reached your submission. Compile errors on trivial code against a hard problem are expected.

---

## Development mode

Hot reload, mounted source and seed data:

```bash
./dev-deploy.sh web
```

Other flags: `nojudge` (skip judge), `noelastic` (skip Elasticsearch profile). See the [Development guide](/guides/development/) for the full workflow.

## Reset

Removes all local data:

```bash
./fully-reset.sh && ./deploy.sh web
```

## Run one service alone

Keep infrastructure in Docker and run a single process on the host:

| Service | Command |
| ------- | ------- |
| Data layer | `cd src/data-layer && go run src/main.go -d -p 5000` |
| Web | `cd src/web && npm run dev` |
| Judge | `cd src/judge && python src/app.py` |

Postgres and RabbitMQ must already be running.

## Troubleshooting

### Port in use

NextJudge expects **5000**, **8080**, **5432** and **5672** to be free. Another process on those ports blocks startup.

```bash
lsof -i :5000 :8080 :5432 :5672
```

Stop the conflicting process or change mapped ports in the compose file.

### Data layer can't reach Postgres

The data layer connects to Postgres using host and port from compose env (default **5432**). A Postgres instance already bound on the host often conflicts.

```bash
docker logs $(docker ps -qf name=postgres)
```

Confirm the Postgres container is healthy and that `DB_HOST` / `DB_PASSWORD` match compose.

### Judge stuck on PENDING

Submissions stay `PENDING` and the RabbitMQ queue grows when workers are down or cannot authenticate to the API.

Checklist:

1. Judge container running? `docker ps | grep judge`
2. Judge logs: `docker logs $(docker ps -qf name=judge) 2>&1 | tail -20`
3. `JUDGE_PASSWORD` identical on data layer and judge
4. RabbitMQ credentials match on both sides

Healthy logs show receive → compile → PATCH result. No log activity usually means nothing is consuming the queue.

### First deploy runs out of memory

The initial judge base image build is memory-intensive. Allocate at least **4 GB** RAM to Docker (8 GB with web and judge together).

## What's next

- [Authentication](/reference/authentication/) for token details and required secrets
- [Development guide](/guides/development/) for Playwright E2E and Tavern API tests
- [CLI](/guides/cli/) for `nextjudge test` locally
- [Deployment](/guides/deployment/) for production hosting
